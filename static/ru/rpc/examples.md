**Источник:** [https://docs.fastnear.com/ru/rpc/examples](https://docs.fastnear.com/ru/rpc/examples)

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

Если вы хотите, чтобы узел ждал за вас, используйте [`send_tx`](https://docs.fastnear.com/ru/rpc/transaction/send-tx). Но базовый паттерн на этой странице остаётся таким: отправка через `broadcast_tx_async`, затем отслеживание хеша через `tx`.

## Механика аккаунтов и ключей

Начинайте отсюда, когда вопрос касается точных прав, точного состояния ключей или одного сценария записи на уровне контракта.

### Может ли этот access key прямо сейчас вызвать этот контракт?

Используйте этот сценарий, когда у вас уже есть аккаунт, один public key и целевой контракт, а вам нужен простой ответ да или нет до того, как вы начнёте что-то подписывать.

    Стратегия
    Сначала отфильтруйте ключи аккаунта, затем прочитайте точный ключ и только потом классифицируйте его права.

    01RPC view_access_key_list сужает список до ключей, которые вообще могут относиться к целевому контракту.
    02RPC view_access_key даёт точный permission-object для того public key, которым вы реально можете подписывать.
    03jq превращает этот permission-object в full_access, function_call_match, receiver_mismatch или method_not_allowed.

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

    Стратегия
    Сначала прочитайте storage-состояние получателя и остановитесь, как только станет понятно, может ли `ft_transfer` уже пройти.

    01RPC call_function storage_balance_of показывает, зарегистрирован ли получатель уже сейчас.
    02RPC call_function storage_balance_bounds нужен только тогда, когда перед записью надо узнать точный минимальный депозит.
    03jq превращает эти два чтения в один ответ: «перевод уже может идти» или «сначала нужен `storage_deposit`».

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

Используйте `view_state`, когда вы уже знаете точное семейство storage-ключей и хотите raw bytes. Используйте `call_function`, когда вам нужен публичный метод чтения самого контракта. Если следующий вопрос становится историческим, а не «что там лежит прямо сейчас?», тогда уже стоит расширяться в [KV FastData API](https://docs.fastnear.com/ru/fastdata/kv).

## Точные чтения SocialDB

Оставайтесь на точных чтениях через `call_function get`, когда вы уже знаете нужный ключ SocialDB. На обычном RPC raw `view_state` для `social.near` не подходит как обучающий путь, потому что состояние контракта слишком велико для прямого чтения.

### Прочитать один пост SocialDB ровно в том виде, как он хранится сейчас

Используйте этот сценарий, когда продукту, support-инструменту или агенту уже известен аккаунт и нужен живой payload поста из SocialDB без перехода в историю транзакций.

    Стратегия
    Сначала прочитайте текущий ключ поста, затем получите точный payload этого поста из social.near.

    01RPC call_function get по mike.near/index/post показывает, какой ключ поста сейчас активен.
    02RPC call_function get по mike.near/post/main возвращает точный сохранённый payload поста.
    03Если следующий вопрос становится «какая транзакция это записала?», переключайтесь на [Transactions Examples](https://docs.fastnear.com/ru/tx/examples).

**Официальные ссылки**

- [API SocialDB и поверхность контракта](https://github.com/NearSocial/social-db#api)

**Что вы делаете**

- Читаете текущий указатель поста под `mike.near/index/post`.
- Используете этот ключ, чтобы получить точный payload по `mike.near/post/<key>`.
- Останавливаетесь на точном JSON и расширяетесь в историю только тогда, когда действительно нужна provenance.

```bash
export NETWORK_ID=mainnet
export RPC_URL=https://rpc.mainnet.fastnear.com
export SOCIAL_CONTRACT_ID=social.near
export ACCOUNT_ID=mike.near
```

1. Сначала прочитайте текущий указатель поста.

```bash
INDEX_POST_ARGS_BASE64="$(
  jq -nc --arg account_id "$ACCOUNT_ID" '{
    keys: [($account_id + "/index/post")]
  }' | base64 | tr -d '\n'
)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$SOCIAL_CONTRACT_ID" \
    --arg args_base64 "$INDEX_POST_ARGS_BASE64" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "call_function",
        account_id: $account_id,
        method_name: "get",
        args_base64: $args_base64,
        finality: "final"
      }
    }')" \
  | tee /tmp/social-index-post.json >/dev/null

jq --arg account_id "$ACCOUNT_ID" '
  .result.result
  | implode
  | fromjson
  | {
      account_id: $account_id,
      index_entry: (.[$account_id].index.post | fromjson),
      current_post_key: (.[$account_id].index.post | fromjson | .key)
    }
' /tmp/social-index-post.json
```

На момент написания текущим ключом поста для `mike.near` был `main`.

2. Прочитайте точный payload этого поста.

```bash
POST_KEY="$(
  jq -r --arg account_id "$ACCOUNT_ID" '
    .result.result
    | implode
    | fromjson
    | .[$account_id].index.post
    | fromjson
    | .key
  ' /tmp/social-index-post.json
)"

POST_ARGS_BASE64="$(
  jq -nc \
    --arg account_id "$ACCOUNT_ID" \
    --arg post_key "$POST_KEY" '{
      keys: [($account_id + "/post/" + $post_key)]
    }' | base64 | tr -d '\n'
)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$SOCIAL_CONTRACT_ID" \
    --arg args_base64 "$POST_ARGS_BASE64" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "call_function",
        account_id: $account_id,
        method_name: "get",
        args_base64: $args_base64,
        finality: "final"
      }
    }')" \
  | tee /tmp/social-post-main.json >/dev/null

jq --arg account_id "$ACCOUNT_ID" --arg post_key "$POST_KEY" '
  .result.result
  | implode
  | fromjson
  | {
      account_id: $account_id,
      post_key: $post_key,
      post: (.[$account_id].post[$post_key] | fromjson)
    }
' /tmp/social-post-main.json
```

Так вы получаете точный JSON, который хранится для текущего поста, включая поля вроде `type`, `text` и `image`.

**Зачем нужен следующий шаг?**

Это чистый RPC-паттерн для SocialDB: спросите у контракта один точный ключ, декодируйте возвращённый JSON и остановитесь. Если вопрос превращается в «кто и когда это записал?», переходите к примерам по транзакциям, а не пытайтесь brute-force читать raw state `social.near`.

## Частые ошибки

- Начинать с RPC, когда пользователю на самом деле нужна сводка по активам или индексированная история.
- Забывать переключаться с обычного RPC на архивный RPC для старого состояния.
- Воспринимать браузерную аутентификацию в интерфейсе документации как продовый паттерн для бэкенда.
- Продолжать пользоваться низкоуровневыми статусами транзакций, когда вопрос уже превратился в расследование или исторический разбор.

## Полезные связанные страницы

- [RPC Reference](https://docs.fastnear.com/ru/rpc)
- [Auth & Access](https://docs.fastnear.com/ru/auth)
- [FastNear API](https://docs.fastnear.com/ru/api)
- [Transactions API](https://docs.fastnear.com/ru/tx)
- [Choosing the Right Surface](https://docs.fastnear.com/ru/agents/choosing-surfaces)
- [Agent Playbooks](https://docs.fastnear.com/ru/agents/playbooks)
