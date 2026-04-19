---
sidebar_label: Examples
slug: /rpc/examples
title: "Примеры RPC"
description: "Пошаговые сценарии использования FastNear RPC для отправки транзакций, проверки прав ключа доступа, предварительной проверки FT, чтения сырого состояния и поиска Rainbow Bridge."
displayed_sidebar: rpcSidebar
page_actions:
  - markdown
---

# Примеры RPC

Используйте эту страницу, когда нужен быстрый точный ответ через RPC. Начните с одного чтения, а к транзакциям и сырому состоянию переходите только если простого запроса уже недостаточно.

## Быстрый старт

Если вы только открыли эту страницу, начните с одного точного чтения аккаунта.

```bash
RPC_URL=https://rpc.mainnet.fastnear.com
ACCOUNT_ID=near

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "query",
    params: {
      request_type: "view_account",
      finality: "final",
      account_id: $account_id
    }
  }')" \
  | jq '.result | {
      amount,
      locked,
      code_hash,
      storage_usage
    }'
```

Это самый маленький надёжный RPC-пример на странице: один запрос, один точный ответ, без дерева receipts.

## Отправка и отслеживание транзакции

### Двухчастный паттерн: отправить транзакцию или отследить уже известный tx hash до финального исполнения

Базовый паттерн:

- `broadcast_tx_async` для отправки
- `tx` с `wait_until: "FINAL"` для отслеживания
- `EXPERIMENTAL_tx_status` только если следующий вопрос уже про receipts

Этот walkthrough намеренно разбит на две части:

- отправить новую подписанную транзакцию и сохранить возвращённый хеш
- отследить один известный исторический tx hash с воспроизводимым выводом

Для части про отслеживание используется одна зафиксированная историческая транзакция, поэтому status-lookup идёт через архивный хост:

- хеш транзакции: `FLLmTvFx9vCof79scy2uUviF5WwYmevkz9TZ8azPGVQb`
- signer: `mike.near`
- receiver: `social.near`
- `https://archival-rpc.mainnet.fastnear.com`

1. Отправьте новую подписанную транзакцию и сохраните возвращённый хеш.

```bash
RPC_URL=https://rpc.mainnet.fastnear.com

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data '{
    "jsonrpc": "2.0",
    "id": "fastnear",
    "method": "broadcast_tx_async",
    "params": ["BASE64_SIGNED_TX"]
  }' \
  | jq .
```

Этот первый шаг нужен только для формы отправки. Именно возвращённый хеш вы потом будете отслеживать для своей живой транзакции.

2. Отслеживайте один известный tx hash, пока не получите самый простой финальный ответ.

```bash
RPC_URL=https://archival-rpc.mainnet.fastnear.com
TX_HASH=FLLmTvFx9vCof79scy2uUviF5WwYmevkz9TZ8azPGVQb
SIGNER_ACCOUNT_ID=mike.near
```

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg tx_hash "$TX_HASH" \
    --arg signer_account_id "$SIGNER_ACCOUNT_ID" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "tx",
      params: {
        tx_hash: $tx_hash,
        sender_account_id: $signer_account_id,
        wait_until: "FINAL"
      }
    }')" \
  | jq '{
      final_execution_status: .result.final_execution_status,
      transaction_status: .result.status,
      receipts_outcome_count: (.result.receipts_outcome | length)
    }'
```

3. Переходите к `EXPERIMENTAL_tx_status` только тогда, когда для этого известного tx уже нужен уровень receipts.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg tx_hash "$TX_HASH" \
    --arg signer_account_id "$SIGNER_ACCOUNT_ID" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "EXPERIMENTAL_tx_status",
      params: {
        tx_hash: $tx_hash,
        sender_account_id: $signer_account_id,
        wait_until: "FINAL"
      }
    }')" \
  | jq '{
      final_execution_status: .result.final_execution_status,
      transaction_handoff: .result.transaction_outcome.outcome.status,
      receipts_outcome_count: (.result.receipts_outcome | length)
    }'
```

Если вы хотите, чтобы узел ждал за вас, используйте [`send_tx`](/rpc/transaction/send-tx). Но базовый паттерн на этой странице остаётся таким: отправка через `broadcast_tx_async`, затем отслеживание хеша через `tx`.

## Механика аккаунтов и ключей

Начинайте отсюда, когда вопрос касается точных прав, точного состояния ключей или одного сценария записи на уровне контракта.

### Может ли этот access key прямо сейчас вызвать этот контракт?

Используйте этот сценарий, когда у вас уже есть аккаунт, один public key и целевой контракт, а вам нужен простой ответ да или нет до того, как вы начнёте что-то подписывать.

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Стратегия</span>
    <p className="fastnear-example-strategy__title">Сначала отфильтруйте ключи аккаунта, затем прочитайте точный ключ и только потом классифицируйте его права.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">RPC view_access_key_list</span> сужает список до ключей, которые вообще могут относиться к целевому контракту.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">RPC view_access_key</span> даёт точный permission-object для того public key, которым вы реально можете подписывать.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">jq</span> превращает этот permission-object в <span className="fastnear-example-strategy__code">full_access</span>, <span className="fastnear-example-strategy__code">function_call_match</span>, <span className="fastnear-example-strategy__code">receiver_mismatch</span> или <span className="fastnear-example-strategy__code">method_not_allowed</span>.</span></p>
  </div>
</div>

**Что вы делаете**

- Получаете access key аккаунта и сужаете список до нужного контракта.
- Точно проверяете тот ключ, которым собираетесь подписывать.
- Решаете, может ли он вызвать этот receiver и method, не выходя за пределы RPC.

```bash
RPC_URL=https://rpc.mainnet.fastnear.com
ACCOUNT_ID=YOUR_ACCOUNT_ID
TARGET_CONTRACT_ID=crossword.puzzle.near
TARGET_METHOD_NAME=new_puzzle
TARGET_PUBLIC_KEY='ed25519:PASTE_THE_KEY_YOU_WANT_TO_CHECK'

# Пример живых значений, проверенных 19 апреля 2026 года:
# ACCOUNT_ID=mike.near
# TARGET_CONTRACT_ID=crossword.puzzle.near
# TARGET_METHOD_NAME=new_puzzle
# TARGET_PUBLIC_KEY='ed25519:otwaB1X88ocpmUdC1B5XaifucfDLmLKaonb26KqTj96'
```

1. Получите ключи аккаунта и сузьте их до целевого контракта.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "query",
    params: {
      request_type: "view_access_key_list",
      account_id: $account_id,
      finality: "final"
    }
  }')" \
  | tee /tmp/access-key-list.json >/dev/null

jq --arg target_contract_id "$TARGET_CONTRACT_ID" '{
  candidate_keys: [
    .result.keys[]
    | select(
        .access_key.permission == "FullAccess"
        or (
          (.access_key.permission | type) == "object"
          and .access_key.permission.FunctionCall.receiver_id == $target_contract_id
        )
      )
    | {
        public_key,
        nonce: .access_key.nonce,
        permission: .access_key.permission
      }
  ]
}' /tmp/access-key-list.json
```

2. Прочитайте точное состояние того ключа, который хотите оценить.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$ACCOUNT_ID" \
    --arg public_key "$TARGET_PUBLIC_KEY" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "view_access_key",
        account_id: $account_id,
        public_key: $public_key,
        finality: "final"
      }
    }')" \
  | tee /tmp/exact-access-key.json >/dev/null

jq '{nonce: .result.nonce, permission: .result.permission}' /tmp/exact-access-key.json
```

3. Превратите этот permission-object в ответ да или нет для этого контракта и метода.

```bash
jq -n \
  --slurpfile key /tmp/exact-access-key.json \
  --arg target_contract_id "$TARGET_CONTRACT_ID" \
  --arg target_method_name "$TARGET_METHOD_NAME" '
  ($key[0].result.permission) as $permission
  | if $permission == "FullAccess" then
      {
        can_call_now: true,
        reason: "full_access"
      }
    elif $permission.FunctionCall.receiver_id != $target_contract_id then
      {
        can_call_now: false,
        reason: "receiver_mismatch",
        receiver_id: $permission.FunctionCall.receiver_id
      }
    elif (
      ($permission.FunctionCall.method_names | length) == 0
      or ($permission.FunctionCall.method_names | index($target_method_name))
    ) then
      {
        can_call_now: true,
        reason: (
          if ($permission.FunctionCall.method_names | length) == 0
          then "function_call_any_method"
          else "function_call_method_match"
          end
        ),
        allowance: ($permission.FunctionCall.allowance // "unlimited")
      }
    else
      {
        can_call_now: false,
        reason: "method_not_allowed",
        allowed_methods: $permission.FunctionCall.method_names
      }
    end'
```

Для примерного ключа `mike.near` выше на 19 апреля 2026 года ответ получается `can_call_now: true`: это function-call-key для `crossword.puzzle.near`, а `method_names: ["new_puzzle"]` явно разрешает тот метод, который мы проверяем.

**Зачем нужен следующий шаг?**

`view_access_key_list` — самый быстрый фильтр на уровне контракта. `view_access_key` — точная проверка полномочий для того public key, которым вы действительно хотите пользоваться. Если ответ `false`, вам нужен другой ключ или другая схема permissions, а не более глубокая историческая трассировка.

### Нужно ли этому получателю сначала зарегистрировать FT storage?

Используйте этот сценарий, когда история звучит так: «я собираюсь отправить FT-токен и хочу получить простой ответ “нужен ли сначала `storage_deposit`?”».

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Стратегия</span>
    <p className="fastnear-example-strategy__title">Сначала прочитайте storage-состояние получателя и остановитесь, как только станет понятно, может ли `ft_transfer` уже пройти.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">RPC call_function storage_balance_of</span> показывает, зарегистрирован ли получатель уже сейчас.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">RPC call_function storage_balance_bounds</span> нужен только тогда, когда перед записью надо узнать точный минимальный депозит.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">jq</span> превращает эти два чтения в один ответ: «перевод уже может идти» или «сначала нужен `storage_deposit`».</span></p>
  </div>
</div>

**Сеть**

- testnet

**Официальные ссылки**

- [FT storage и перевод токенов](https://docs.near.org/integrations/fungible-tokens)
- [Предразвёрнутый FT-контракт](https://docs.near.org/tutorials/fts/predeployed-contract)

В этом сценарии используется безопасный публичный контракт `ft.predeployed.examples.testnet`. Здесь важен именно read-only-ответ: нужен ли сначала `storage_deposit`, или путь перевода уже может продолжаться.

**Что вы делаете**

- Через точные RPC view-вызовы проверяете, есть ли у получателя FT storage на контракте.
- Получаете точный минимальный размер storage deposit на этом же контракте.
- Останавливаетесь, как только понимаете: `ft_transfer` уже может идти или сначала нужен `storage_deposit`.

```bash
export NETWORK_ID=testnet
export RPC_URL=https://rpc.testnet.fastnear.com
export TOKEN_CONTRACT_ID=ft.predeployed.examples.testnet
export RECEIVER_ACCOUNT_ID=YOUR_RECEIVER_ID.testnet
```

1. Проверьте, зарегистрирован ли получатель на FT-контракте.

```bash
STORAGE_BALANCE_ARGS_BASE64="$(
  jq -nc --arg account_id "$RECEIVER_ACCOUNT_ID" '{
    account_id: $account_id
  }' | base64 | tr -d '\n'
)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$TOKEN_CONTRACT_ID" \
    --arg args_base64 "$STORAGE_BALANCE_ARGS_BASE64" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "call_function",
        account_id: $account_id,
        method_name: "storage_balance_of",
        args_base64: $args_base64,
        finality: "final"
      }
    }')" \
  | tee /tmp/ft-storage-balance.json >/dev/null

jq '{
  registered: ((.result.result | implode | fromjson) != null),
  storage_balance: (.result.result | implode | fromjson)
}' /tmp/ft-storage-balance.json
```

2. Получите минимальный storage deposit на этом же контракте.

```bash
MIN_STORAGE_YOCTO="$(
  curl -s "$RPC_URL" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --arg account_id "$TOKEN_CONTRACT_ID" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "call_function",
        account_id: $account_id,
        method_name: "storage_balance_bounds",
        args_base64: "e30=",
        finality: "final"
      }
    }')" \
    | tee /tmp/ft-storage-bounds.json \
    | jq -r '.result.result | implode | fromjson | .min'
)"

printf 'Minimum storage deposit: %s yoctoNEAR\n' "$MIN_STORAGE_YOCTO"
```

3. Превратите эти два чтения в один ответ о готовности перевода.

```bash
jq -n \
  --slurpfile balance /tmp/ft-storage-balance.json \
  --slurpfile bounds /tmp/ft-storage-bounds.json \
  --arg receiver_account_id "$RECEIVER_ACCOUNT_ID" '
  (
    $balance[0].result.result
    | if length == 0 then null else (implode | fromjson) end
  ) as $storage
  | (
    $bounds[0].result.result
    | implode
    | fromjson
  ) as $bounds
  | {
      receiver_account_id: $receiver_account_id,
      receiver_registered: ($storage != null),
      current_storage: $storage,
      minimum_storage_deposit_yocto: $bounds.min,
      next_step: (
        if $storage != null
        then "получатель уже зарегистрирован; ft_transfer может продолжаться"
        else "сначала отправьте storage_deposit, потом делайте ft_transfer"
        end
      )
    }'
```

**Зачем нужен следующий шаг?**

Это чистый RPC-вопрос в этом workflow: «зарегистрирован ли уже получатель и какой минимальный депозит потребует контракт, если нет?» Подписанный write-path зависит уже от вашего wallet, CLI или backend-интеграции, поэтому в самый маленький core RPC-пример он не входит.

## Чтения контракта и сырое состояние

Начинайте отсюда, когда вопрос звучит как «достаточно ли мне вызова метода?» против «можно ли прочитать storage напрямую?»

### Прочитать счётчик прямо из состояния контракта, а потом подтвердить его через view-метод

Используйте этот сценарий, когда вы уже знаете точное семейство storage-ключей и хотите увидеть самый короткий контраст между raw state и публичным методом чтения контракта.

Здесь используется живой публичный testnet-контракт `counter.near-examples.testnet`:

- `view_state` читает сырой ключ `STATE` напрямую
- `call_function get_num` спрашивает у контракта то же текущее число

```bash
export NETWORK_ID=testnet
export RPC_URL=https://rpc.testnet.fastnear.com
export CONTRACT_ID=counter.near-examples.testnet
export STATE_PREFIX_BASE64=U1RBVEU=
```

1. Сначала прочитайте сырой ключ `STATE`.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$CONTRACT_ID" \
    --arg prefix_base64 "$STATE_PREFIX_BASE64" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "view_state",
        account_id: $account_id,
        prefix_base64: $prefix_base64,
        finality: "final"
      }
    }')" \
  | tee /tmp/counter-view-state.json >/dev/null

jq '{
  key: (.result.values[0].key | @base64d),
  value_base64: .result.values[0].value
}' /tmp/counter-view-state.json
```

Здесь должен появиться `key: "STATE"`. Это и есть тот случай, когда `view_state` уместен: семейство ключей вам уже известно заранее.

2. Декодируйте сырые байты.

```bash
RAW_VALUE_BASE64="$(jq -r '.result.values[0].value' /tmp/counter-view-state.json)"

python3 - "$RAW_VALUE_BASE64" <<'PY'
import base64
import sys

raw = base64.b64decode(sys.argv[1])
print(int.from_bytes(raw, "little", signed=True))
PY
```

Для этого контракта `STATE` — это однобайтовый знаковый счётчик, поэтому декодирование совсем простое. На других контрактах layout может быть сложнее, но правило то же: сначала байты, потом схема.

3. Теперь спросите контракт привычным способом и сравните.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$CONTRACT_ID" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "query",
    params: {
      request_type: "call_function",
      account_id: $account_id,
      method_name: "get_num",
      args_base64: "e30=",
      finality: "final"
    }
  }')" \
  | tee /tmp/counter-call-function.json >/dev/null

jq '{
  block_height: .result.block_height,
  view_method_value: (.result.result | implode | fromjson)
}' /tmp/counter-call-function.json
```

4. Сравните оба ответа.

```bash
RAW_STATE_NUMBER="$(
  python3 - "$RAW_VALUE_BASE64" <<'PY'
import base64
import sys

raw = base64.b64decode(sys.argv[1])
print(int.from_bytes(raw, "little", signed=True))
PY
)"

VIEW_METHOD_NUMBER="$(
  jq -r '.result.result | implode | fromjson' /tmp/counter-call-function.json
)"

jq -n \
  --argjson raw_state "$RAW_STATE_NUMBER" \
  --argjson view_method "$VIEW_METHOD_NUMBER" '{
    raw_state: $raw_state,
    view_method: $view_method,
    agrees_now: ($raw_state == $view_method)
  }'
```

**Зачем нужен следующий шаг?**

Используйте `view_state`, когда вы уже знаете точное семейство storage-ключей и хотите raw bytes. Используйте `call_function`, когда вам нужен публичный метод чтения самого контракта. Если следующий вопрос становится историческим, а не «что там лежит прямо сейчас?», тогда уже стоит расширяться в [KV FastData API](/fastdata/kv).

### Какие ERC-20 токены из Rainbow Bridge существуют на NEAR и сколько одного такого токена сейчас в обращении?

Используйте этот сценарий, когда хотите найти Rainbow Bridge ERC-20 контракты и посмотреть живой объём одного токена на NEAR. Rainbow Bridge развёртывает по одному NEAR-контракту на каждый bridged ERC-20 токен, а `factory.bridge.near` их перечисляет.

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Стратегия</span>
    <p className="fastnear-example-strategy__title">Одно чтение factory перечисляет token-контракты. Ещё два небольших view-вызова по одному токену показывают, что это за токен и сколько его сейчас на NEAR.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">RPC call_function get_tokens_accounts</span> по <span className="fastnear-example-strategy__code">factory.bridge.near</span> возвращает развёрнутые bridged token-контракты.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span>Следующий <span className="fastnear-example-strategy__code">RPC call_function</span> по одному bridged token-контракту возвращает метаданные токена: имя, тикер и число десятичных знаков.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span>Ещё один <span className="fastnear-example-strategy__code">RPC call_function</span> по тому же контракту возвращает текущее сырое значение объёма в обращении на NEAR.</span></p>
  </div>
</div>

**Что вы делаете**

- Спрашиваете у bridge factory обо всех bridged token-контрактах, которые она создала.
- Выбираете один bridged token-контракт и читаете его метаданные.
- Читаете total supply того же контракта и переводите его в человеческие единицы через `decimals`.

```bash
export NETWORK_ID=mainnet
export RPC_URL=https://rpc.mainnet.fastnear.com
export FACTORY_ID=factory.bridge.near
export TOKENS_FILE=/tmp/rainbow-bridge-tokens.json
```

1. Получите список bridged token-контрактов.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$FACTORY_ID" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "query",
    params: {
      request_type: "call_function",
      account_id: $account_id,
      method_name: "get_tokens_accounts",
      args_base64: "e30=",
      finality: "final"
    }
  }')" \
  | tee "$TOKENS_FILE" >/dev/null

jq -r '.result.result | implode | fromjson | .[]' "$TOKENS_FILE"
```

Каждая строка — это один bridged FT-контракт на NEAR в форме `<hex_eth_address>.factory.bridge.near`. Например, bridged ERC-20 USDT с Ethereum-адреса `0xdAC17F958D2ee523a2206206994597C13D831ec7` появляется как `dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near`.

2. Прочитайте метаданные одного токен-контракта.

```bash
export TOKEN_ID=dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$TOKEN_ID" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "query",
    params: {
      request_type: "call_function",
      account_id: $account_id,
      method_name: "ft_metadata",
      args_base64: "e30=",
      finality: "final"
    }
  }')" \
  | tee /tmp/rainbow-bridge-token-metadata.json >/dev/null

jq '.result.result | implode | fromjson | {name, symbol, decimals}' /tmp/rainbow-bridge-token-metadata.json
```

3. Прочитайте текущий total supply на NEAR и переведите его в человеческие единицы.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$TOKEN_ID" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "query",
    params: {
      request_type: "call_function",
      account_id: $account_id,
      method_name: "ft_total_supply",
      args_base64: "e30=",
      finality: "final"
    }
  }')" \
  | tee /tmp/rainbow-bridge-token-supply.json >/dev/null

RAW_SUPPLY="$(
  jq -r '.result.result | implode | fromjson' /tmp/rainbow-bridge-token-supply.json
)"

DECIMALS="$(
  jq -r '.result.result | implode | fromjson | .decimals' /tmp/rainbow-bridge-token-metadata.json
)"

HUMAN_SUPPLY="$(
  python3 - "$RAW_SUPPLY" "$DECIMALS" <<'PY'
from decimal import Decimal
import sys

raw = Decimal(sys.argv[1])
decimals = int(sys.argv[2])
human = raw / (Decimal(10) ** decimals)
print(human)
PY
)"

jq -n \
  --arg token_id "$TOKEN_ID" \
  --arg raw_supply "$RAW_SUPPLY" \
  --argjson decimals "$DECIMALS" \
  --arg human_supply "$HUMAN_SUPPLY" '{
    token_id: $token_id,
    raw_supply: $raw_supply,
    decimals: $decimals,
    human_supply: $human_supply
  }'
```

Результат `ft_total_supply` приходит в минимальных единицах токена. Используйте `decimals` из ответа предыдущего шага, чтобы перевести его в человекочитаемый объём в обращении.

#### Необязательное расширение: показать первые несколько bridged token-ов с метаданными и объёмом в обращении

Используйте это расширение, когда нужен быстрый sample-инвентарь и вы всё ещё хотите оставаться в RPC.

```bash
export TOKEN_SAMPLE_COUNT=5

python3 <<'PY'
import json
import os
from decimal import Decimal

TOKENS_FILE = os.environ["TOKENS_FILE"]
LIMIT = int(os.environ.get("TOKEN_SAMPLE_COUNT", "5"))
RPC_URL = os.environ["RPC_URL"]

def decode_result(result):
    return json.loads("".join(chr(b) for b in result))

with open(TOKENS_FILE) as fh:
    token_ids = decode_result(json.load(fh)["result"]["result"])[:LIMIT]

def rpc_call(account_id, method_name):
    payload = {
        "jsonrpc": "2.0",
        "id": "fastnear",
        "method": "query",
        "params": {
            "request_type": "call_function",
            "account_id": account_id,
            "method_name": method_name,
            "args_base64": "e30=",
            "finality": "final",
        },
    }
    import subprocess
    raw = subprocess.check_output([
        "curl", "-s", RPC_URL,
        "-H", "content-type: application/json",
        "--data", json.dumps(payload),
    ], text=True)
    return decode_result(json.loads(raw)["result"]["result"])

print(f"{'token_id':<56} {'symbol':<12} {'decimals':>8} {'raw_supply':>24} {'human_supply':>24}  name")
for token_id in token_ids:
    metadata = rpc_call(token_id, "ft_metadata")
    raw_supply = rpc_call(token_id, "ft_total_supply")
    human_supply = Decimal(raw_supply) / (Decimal(10) ** metadata["decimals"])
    print(
        f"{token_id:<56} "
        f"{metadata['symbol']:<12} "
        f"{metadata['decimals']:>8} "
        f"{raw_supply:>24} "
        f"{str(human_supply):>24}  "
        f"{metadata['name']}"
    )
PY
```

**Зачем нужен следующий шаг?**

Оставайтесь в RPC, пока вопрос звучит как «какие bridged token-контракты существуют и сколько одного такого токена сейчас в обращении?» Factory — это источник истины для множества bridged token-ов, а каждый token-контракт сам отвечает за свои метаданные и объём в обращении через стандартные NEP-141 view-методы. Если следующий вопрос становится «кто держит этот токен?», переключайтесь на [V1 FT Top Holders](/api/v1/ft-top), а не пытайтесь обходить holders через RPC.

## Частые ошибки

- Начинать с RPC, когда пользователю на самом деле нужна сводка по активам или индексированная история.
- Забывать переключаться с обычного RPC на архивный RPC для старого состояния.
- Воспринимать браузерную аутентификацию в интерфейсе документации как продовый паттерн для бэкенда.
- Продолжать пользоваться низкоуровневыми статусами транзакций, когда вопрос уже превратился в расследование или исторический разбор.

## Полезные связанные страницы

- [RPC Reference](/rpc)
- [Auth & Access](/auth)
- [FastNear API](/api)
- [Transactions API](/tx)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
