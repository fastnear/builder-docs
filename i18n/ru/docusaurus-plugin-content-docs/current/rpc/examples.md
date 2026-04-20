---
sidebar_label: Examples
slug: /rpc/examples
title: "Примеры RPC"
description: "Практические примеры RPC: проверки состояния, инспекция блоков, чтение контрактов и отправка транзакций."
displayed_sidebar: rpcSidebar
page_actions:
  - markdown
---

# Примеры RPC

Начинайте с RPC-метода, который отвечает на вопрос. Используйте `tx`, чтобы отследить включение и финальность по хешу транзакции, и расширяйте поверхность только когда нужны дерево receipts, сырой state или трассировка на уровне shard.

## Включение транзакции и финальность

### Отследить транзакцию от хеша до финальности

Есть tx hash? Опрашивайте `tx` с минимальным порогом `wait_until`, который отвечает на ваш вопрос.

```bash
RPC_URL=https://rpc.testnet.fastnear.com
TX_HASH=CVyG2xLJ6fuKCtULAxMnWTh2GL5ey2UUiTcgYT3M6Pow
SIGNER_ACCOUNT_ID=mike.testnet

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$TX_HASH" --arg signer_id "$SIGNER_ACCOUNT_ID" '{
    jsonrpc: "2.0", id: "fastnear", method: "tx",
    params: {tx_hash: $tx_hash, sender_account_id: $signer_id, wait_until: "INCLUDED"}
  }')" \
  | jq '{
      asked: "INCLUDED",
      final_execution_status: .result.final_execution_status,
      status_class: (.result.status | keys[0]),
      receipts_outcome_count: (.result.receipts_outcome | length)
    }'
```

Для зафиксированной исторической транзакции (1-yocto self-transfer от `mike.testnet`) ответ возвращается как `FINAL`, хотя мы спрашивали `INCLUDED`. Правило такое: **`wait_until` — это минимальный порог, а не целевой**. Узел возвращает тот этап, которого транзакция действительно достигла: для исторической всегда `FINAL`; для полётной выбирайте `INCLUDED`, когда достаточно включения и нужен самый ранний возврат, или `FINAL`, когда реальный вопрос звучит «завершилась ли?».

Два перехода отсюда:

- **Отправляете в реальном времени?** [`broadcast_tx_async`](/rpc/transaction/broadcast-tx-async) возвращает хеш сразу после того, как узел принял payload — отслеживайте отдельно через `tx`. [`send_tx`](/rpc/transaction/send-tx) одновременно отправляет и блокируется на выбранном `wait_until` в одном запросе.
- **Нужно дерево receipts, а не только outcome?** `tx` уже включает `receipts_outcome`; расширяйте поверхность до [`EXPERIMENTAL_tx_status`](/rpc/transaction/experimental-tx-status) только тогда, когда дополнительно нужны сырые записи receipts.

## Инспекция блока на tip

### Описать первый action первой транзакции на текущем tip

Пройдите `status` → `block` → `chunk`, пропуская пустые chunks по дороге. Большинство chunks в tip-блоке пустые — их `tx_root` равен сентинелу `11111111111111111111111111111111`, поэтому селектору нужен фильтр.

```bash
RPC_URL=https://rpc.mainnet.fastnear.com
EMPTY_TX_ROOT=11111111111111111111111111111111

BLOCK_HASH="$(curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":"fastnear","method":"status","params":[]}' \
  | jq -r '.result.sync_info.latest_block_hash')"

CHUNK_HASH="$(curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data "$(jq -nc --arg block_hash "$BLOCK_HASH" '{
    jsonrpc:"2.0",id:"fastnear",method:"block",params:{block_id:$block_hash}
  }')" \
  | jq -r --arg empty "$EMPTY_TX_ROOT" '
      first(.result.chunks[] | select(.tx_root != $empty) | .chunk_hash) // empty')"

if [ -z "$CHUNK_HASH" ]; then
  echo "tip block had no transactions in any chunk — rerun on the next head"
else
  curl -s "$RPC_URL" -H 'content-type: application/json' \
    --data "$(jq -nc --arg chunk_hash "$CHUNK_HASH" '{
      jsonrpc:"2.0",id:"fastnear",method:"chunk",params:{chunk_id:$chunk_hash}
    }')" \
    | jq '{
        chunk_shard: .result.header.shard_id,
        chunk_height: .result.header.height_included,
        first_tx: {
          hash: .result.transactions[0].hash,
          signer_id: .result.transactions[0].signer_id,
          receiver_id: .result.transactions[0].receiver_id
        },
        first_action: (
          .result.transactions[0].actions[0] as $a
          | if ($a | type) == "string" then {kind: $a}
            elif $a.FunctionCall then {kind: "FunctionCall", method_name: $a.FunctionCall.method_name}
            else {kind: ($a | keys[0])} end
        )
      }'
fi
```

Живой запуск возвращает первый chunk текущего tip, первую транзакцию и первый action — часто это `FunctionCall` на контракте моста или tg-бота (mainnet активен). Tip-блок может быть валидным и при этом не содержать транзакций ни в одном chunk — поэтому ветка с пустым результатом остаётся; это честный ответ для тихого момента сети.

## Механика аккаунтов и ключей

### Аудит старых function-call-ключей Near Social

У создателей накапливаются Social function-call-ключи от каждого кошелька и каждого BOS-шлюза, которым они пользовались. `view_access_key_list` возвращает их все; один фильтр сужает до `social.near`, а **младшие шесть цифр nonce** заодно служат счётчиком использования — новые ключи стартуют с `block_height * 10^6` и инкрементируются на единицу за каждую транзакцию.

```bash
RPC_URL=https://rpc.mainnet.fastnear.com
ACCOUNT_ID=mike.near
RECEIVER_ID=social.near

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"view_access_key_list",account_id:$account_id,finality:"final"}
  }')" \
  | jq --arg receiver "$RECEIVER_ID" '
      {
        total_keys: (.result.keys | length),
        social_fcks: [
          .result.keys[]
          | select((.access_key.permission | type) == "object")
          | select(.access_key.permission.FunctionCall.receiver_id == $receiver)
          | {
              public_key,
              created_near_block: (.access_key.nonce / 1000000 | floor),
              tx_count: (.access_key.nonce % 1000000),
              method_names: (.access_key.permission.FunctionCall.method_names | if . == [] then "ANY" else . end),
              allowance: (.access_key.permission.FunctionCall.allowance // "unlimited")
            }
        ] | sort_by(.tx_count)
      }'
```

Для `mike.near` это возвращает десятки function-call-ключей на `social.near`. Записи с `tx_count: 0` были созданы и ни разу не использовались — прямые кандидаты на очистку. `method_names: "ANY"` означает, что ключ может вызвать любой метод на `social.near`; сужение до списка вида `["find_grants", "insert_grant", "delete_grant"]` означает, что ключ был заскоуплен на write-поверхность конкретного dapp.

Чтобы удалить такой ключ, подпишите action `DeleteKey` **full-access**-ключом — function-call-ключ не может авторизовать `DeleteKey` — и отправьте через [`send_tx`](/rpc/transaction/send-tx). Повторный запуск того же списка подтверждает удаление. Само подписание — стандартная near-api-js-история и не самая интересная часть аудита.

### Какая транзакция добавила этот `social.near` function-call-ключ и кто её авторизовал?

Тот же nonce, что считает использование, заодно якорит `AddKey` во времени блоков: новые ключи стартуют примерно с `block_height * 10^6`, так что деление текущего nonce на миллион даёт плотное окно поиска. Один раз гидратируйте кандидатов — и ответ уже несёт достаточно, чтобы отличить прямой `AddKey` от делегированной (meta-tx) авторизации, то есть показать, *какой ключ подписал решение*, а не только какой аккаунт оплатил gas.

```bash
RPC_URL=https://rpc.mainnet.fastnear.com
TX_BASE_URL=https://tx.main.fastnear.com
ACCOUNT_ID=mike.near
TARGET_PUBLIC_KEY=ed25519:7GZgXkMPEyGXqRhxaLvHxWn6fVfeyuQGMqnLVQAh7bs

CURRENT_NONCE="$(curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" --arg public_key "$TARGET_PUBLIC_KEY" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"view_access_key",account_id:$account_id,public_key:$public_key,finality:"final"}
  }')" \
  | jq -r '.result.nonce')"

ADD_KEY_BLOCK=$((CURRENT_NONCE / 1000000))

TX_HASHES="$(curl -s "$TX_BASE_URL/v0/account" -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" \
    --argjson from $((ADD_KEY_BLOCK - 20)) --argjson to $((ADD_KEY_BLOCK + 5)) '{
      account_id: $account_id, is_real_signer: true,
      from_tx_block_height: $from, to_tx_block_height: $to, desc: false, limit: 50
    }')" \
  | jq -c '[.account_txs[].transaction_hash]')"

curl -s "$TX_BASE_URL/v0/transactions" -H 'content-type: application/json' \
  --data "$(jq -nc --argjson tx_hashes "$TX_HASHES" '{tx_hashes: $tx_hashes}')" \
  | jq --arg target "$TARGET_PUBLIC_KEY" '
      [ .transactions[]
        | . as $tx
        | (
            ($tx.transaction.actions[]? | .AddKey? | select(.public_key == $target)
              | {mode: "direct", authorizing_public_key: $tx.transaction.public_key, permission: .access_key.permission}),
            ($tx.transaction.actions[]? | .Delegate? | .delegate_action as $d
              | $d.actions[]? | .AddKey? | select(.public_key == $target)
              | {mode: "delegated", authorizing_public_key: $d.public_key, permission: .access_key.permission})
          )
        | {
            transaction_hash: $tx.transaction.hash,
            tx_block_height: $tx.execution_outcome.block_height,
            signer_id: $tx.transaction.signer_id,
            receiver_id: $tx.transaction.receiver_id,
            add_key_receipt: ([$tx.receipts[]
              | select(any((.receipt.receipt.Action.actions // [])[]?; .AddKey.public_key? == $target))
              | {receipt_id: .receipt.receipt_id, receipt_block: .execution_outcome.block_height}][0])
          } + .
      ]'
```

Для ключа `ed25519:7GZg…` аккаунта `mike.near` (первый `social.near` FCK из аудита выше) это разрешается в транзакцию `6ZT8UGPRC6L3NGs2qHnECPVexKWNQ5LWLK9w95tgj3tV` на внешнем блоке tx `112057390`. Внешний signer — `app.herewallet.near`, это relayer HERE Wallet, и `mode: "delegated"` рассказывает остальную историю: relayer оплатил gas, но *авторизующий* ключ внутри Delegate — `ed25519:GaYgzN1eZUgwA7t8a5pYxFGqtF4kon9dQaDMjPDejsiu`, full-access-ключ `mike.near`, который подписал сам `AddKey`. Это та разница meta-tx, которую верхнеуровневый `signer_id` в одиночку скрыл бы.

`add_key_receipt` замыкает картину: `AddKey` выполнился в блоке `112057392`, через два блока после внешней tx, потому что Delegate прыгает из shard relayer в shard целевого аккаунта. Расширьте окно `-20/+5`, если ключом с момента создания пользовались активно.

### Зарегистрировать FT-хранилище при необходимости и затем перевести токены

Токены NEP-141 требуют, чтобы каждый получатель предварительно зарегистрировал storage на контракте, прежде чем сможет держать баланс. Два view-вызова авторитетно отвечают на вопрос регистрации *до* отправки — пропуск этой проверки и есть причина, по которой `ft_transfer` в итоге тихо возвращается отправителю.

```bash
RPC_URL=https://rpc.testnet.fastnear.com
TOKEN_CONTRACT_ID=ft.predeployed.examples.testnet
RECEIVER_ACCOUNT_ID=mike.testnet

ACCOUNT_ARGS_B64="$(jq -nc --arg account_id "$RECEIVER_ACCOUNT_ID" '{account_id:$account_id}' | base64 | tr -d '\n')"

REGISTERED="$(curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data "$(jq -nc --arg contract "$TOKEN_CONTRACT_ID" --arg args "$ACCOUNT_ARGS_B64" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"call_function",account_id:$contract,method_name:"storage_balance_of",args_base64:$args,finality:"final"}
  }')" \
  | jq '(.result.result | implode | fromjson) != null')"

MIN_DEPOSIT="$(curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data "$(jq -nc --arg contract "$TOKEN_CONTRACT_ID" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"call_function",account_id:$contract,method_name:"storage_balance_bounds",args_base64:"e30=",finality:"final"}
  }')" \
  | jq -r '.result.result | implode | fromjson | .min')"

jq -n --argjson registered "$REGISTERED" --arg min "$MIN_DEPOSIT" '{
  registered: $registered,
  min_storage_deposit_yocto: $min
}'
```

Для зафиксированного testnet-контракта `storage_balance_of({account_id: "mike.testnet"})` возвращает `null` (не зарегистрирован), а `storage_balance_bounds` возвращает `{min: "1250000000000000000000", max: "1250000000000000000000"}` — плоскую комиссию регистрации 0.00125 NEAR. Это собственный ответ контракта, и большего на read-стороне до записи не нужно.

Write-сторона — это две подписанных function call (near-api-js `transactions.functionCall` или любая NEAR-библиотека подписи работает одинаково):

- `storage_deposit({account_id: "<receiver>", registration_only: true})` с депозитом `<min>` yocto и 100 Tgas — пропустите, если `registered: true`.
- `ft_transfer({receiver_id: "<receiver>", amount: "<yocto>", memo: "..."})` с депозитом 1 yocto (требует NEP-141) и 100 Tgas.

Отправьте каждую подписанную транзакцию через [`send_tx`](/rpc/transaction/send-tx) с `wait_until: "FINAL"`. После этого подтвердите через собственный view-метод контракта — индексированная история не нужна, чтобы доказать, что перевод закрепился:

```bash
curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data "$(jq -nc --arg contract "$TOKEN_CONTRACT_ID" --arg args "$ACCOUNT_ARGS_B64" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"call_function",account_id:$contract,method_name:"ft_balance_of",args_base64:$args,finality:"final"}
  }')" \
  | jq '{receiver_balance: (.result.result | implode | fromjson)}'
```

## Чтение контрактов и сырой state

### Как прочитать сырое storage контракта напрямую?

Два RPC-метода отвечают на один и тот же вопрос о counter с разных слоёв: `view_state` достаёт сырые байты trie без запуска кода, а `call_function` запускает собственный view-метод контракта. Когда они совпадают, вы доказали, что view-метод контракта соответствует его сохранённому состоянию.

```bash
RPC_URL=https://rpc.testnet.fastnear.com
CONTRACT_ID=counter.near-examples.testnet

RAW_B64="$(curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data "$(jq -nc --arg contract "$CONTRACT_ID" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"view_state",account_id:$contract,prefix_base64:"U1RBVEU=",finality:"final"}
  }')" \
  | jq -r '.result.values[0].value')"

RAW_I8="$(python3 -c "import base64,sys;print(int.from_bytes(base64.b64decode('$RAW_B64'),'little',signed=True))")"

METHOD_VALUE="$(curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data "$(jq -nc --arg contract "$CONTRACT_ID" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"call_function",account_id:$contract,method_name:"get_num",args_base64:"e30=",finality:"final"}
  }')" \
  | jq -r '.result.result | implode | fromjson')"

jq -n --arg raw_b64 "$RAW_B64" --argjson raw_i8 "$RAW_I8" --argjson method "$METHOD_VALUE" '{
  raw_state_b64: $raw_b64,
  raw_state_decoded: $raw_i8,
  view_method_value: $method,
  agree: ($raw_i8 == $method)
}'
```

Для живого counter `view_state` по ключу `STATE` (base64 `U1RBVEU=`) возвращает `"CQ=="` — один байт `0x09`, декодируется как signed i8 в `9`; `get_num` тоже возвращает `9`. Они совпадают, потому что контракт хранит `val: i8` по этому ключу. `signed=True` важен: отрицательный counter выглядел бы как `"/w=="` (байт `0xff` → i8 `-1`, а не u8 `255`).

`view_state` — правильный инструмент, когда у контракта нет view-метода для нужных данных, когда нужно сверить view-метод с реальным storage или когда нужна семья ключей, которую контракт не раскрывает публично. Для всего остального `call_function` требует меньше церемоний. Если следующий вопрос становится историческим, а не текущим, расширяйте поверхность до [KV FastData API](/fastdata/kv).

## NEAR Social и точные чтения BOS

Оставайтесь на точных чтениях SocialDB и on-chain-проверках готовности — пока вопрос не станет историческим.

### Может ли этот аккаунт прямо сейчас публиковать в NEAR Social?

`social.near` знает две вещи, о которых UI кошелька может только догадываться: сколько storage осталось у каждого аккаунта и разрешена ли делегированному signer запись под этим аккаунтом. Два view-вызова сворачивают вопрос готовности к одному boolean.

```bash
RPC_URL=https://rpc.mainnet.fastnear.com
ACCOUNT_ID=mike.near         # account you're writing under
SIGNER_ACCOUNT_ID=mike.near  # account signing the transaction

STORAGE_ARGS_B64="$(jq -nc --arg account_id "$ACCOUNT_ID" '{account_id:$account_id}' | base64 | tr -d '\n')"

STORAGE="$(curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data "$(jq -nc --arg args "$STORAGE_ARGS_B64" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"call_function",account_id:"social.near",method_name:"get_account_storage",args_base64:$args,finality:"final"}
  }')" \
  | jq '.result.result | implode | fromjson')"

if [ "$SIGNER_ACCOUNT_ID" = "$ACCOUNT_ID" ]; then
  PERMISSION=true
else
  PERM_ARGS_B64="$(jq -nc --arg pred "$SIGNER_ACCOUNT_ID" --arg key "$ACCOUNT_ID" '{predecessor_id:$pred,key:$key}' | base64 | tr -d '\n')"
  PERMISSION="$(curl -s "$RPC_URL" -H 'content-type: application/json' \
    --data "$(jq -nc --arg args "$PERM_ARGS_B64" '{
      jsonrpc:"2.0",id:"fastnear",method:"query",
      params:{request_type:"call_function",account_id:"social.near",method_name:"is_write_permission_granted",args_base64:$args,finality:"final"}
    }')" \
    | jq '.result.result | implode | fromjson')"
fi

jq -n --argjson storage "$STORAGE" --argjson permission "$PERMISSION" \
  --arg account_id "$ACCOUNT_ID" --arg signer "$SIGNER_ACCOUNT_ID" '{
    account_id: $account_id,
    signer_account_id: $signer,
    storage: $storage,
    permission_granted: $permission,
    ready_to_publish: (($storage.available_bytes // 0) > 0 and $permission)
  }'
```

Для `mike.near`, подписывающего под собой, это возвращает `storage: {used_bytes: 139803, available_bytes: 83891}`, `permission_granted: true` (владельческая запись) и `ready_to_publish: true`. Если `storage` приходит как `null` или `available_bytes: 0`, аккаунту нужен `storage_deposit` на `social.near`, прежде чем новая запись сможет закрепиться. Если signer отличается от цели, ветка permission спрашивает `is_write_permission_granted({predecessor_id, key})` — тот же on-chain-ответ, который dapp видит, прежде чем писать от имени пользователя. Полную поверхность контракта см. в [SocialDB API](https://github.com/NearSocial/social-db#api).

### Что `mob.near/widget/Profile` содержит прямо сейчас?

SocialDB хранит BOS-виджеты как ключи `<account>/widget/<name>` на `social.near`. Один `keys` с типом возврата `BlockHeight` возвращает каталог плюс якоря последней записи по каждому виджету; один `get` возвращает точный исходник.

```bash
RPC_URL=https://rpc.mainnet.fastnear.com
ACCOUNT_ID=mob.near
WIDGET_NAME=Profile

KEYS_ARGS="$(jq -nc --arg account_id "$ACCOUNT_ID" '{
  keys: [($account_id + "/widget/*")],
  options: {return_type: "BlockHeight"}
}' | base64 | tr -d '\n')"

curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data "$(jq -nc --arg args "$KEYS_ARGS" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"call_function",account_id:"social.near",method_name:"keys",args_base64:$args,finality:"final"}
  }')" \
  | jq --arg account_id "$ACCOUNT_ID" --arg widget "$WIDGET_NAME" '
      .result.result | implode | fromjson | .[$account_id].widget as $map
      | {
          total_widgets: ($map | length),
          most_recently_written: ($map | to_entries | sort_by(-.value) | .[0:5] | map({widget: .key, last_write_block: .value})),
          target_last_write_block: $map[$widget]
        }'

GET_ARGS="$(jq -nc --arg account_id "$ACCOUNT_ID" --arg widget "$WIDGET_NAME" '{
  keys: [($account_id + "/widget/" + $widget)]
}' | base64 | tr -d '\n')"

curl -s "$RPC_URL" -H 'content-type: application/json' \
  --data "$(jq -nc --arg args "$GET_ARGS" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"call_function",account_id:"social.near",method_name:"get",args_base64:$args,finality:"final"}
  }')" \
  | jq -r --arg account_id "$ACCOUNT_ID" --arg widget "$WIDGET_NAME" '
      .result.result | implode | fromjson | .[$account_id].widget[$widget] | split("\n")[0:20] | join("\n")'
```

Для `mob.near` каталог показывает 264 виджета; `Profile` последний раз записывался в блоке `86494825` — годами ранее, стабильно с тех пор — и исходник начинается с `const accountId = props.accountId ?? context.accountId;`. Тип возврата `BlockHeight` ничего не стоит дополнительно и превращает листинг ключей в дешёвую проверку актуальности. Сохраните блок последней записи, если позже захотите доказать, *какая транзакция* записала именно эту версию — передайте его в [Расширенный поиск записи SocialDB](/tx/socialdb-proofs).

## Частые ошибки

- Начинать в RPC, когда пользователю нужна сводка по активам или индексированная история.
- Забывать переключаться с обычного RPC на archival RPC для более старого state.
- Считать browser auth в UI документации продовым backend-паттерном.
- Оставаться в низкоуровневых вызовах статуса транзакции, когда вопрос уже стал forensic или историческим.

## Связанные страницы

- [RPC Reference](/rpc)
- [Auth & Access](/auth)
- [FastNear API](/api)
- [Transactions API](/tx)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
