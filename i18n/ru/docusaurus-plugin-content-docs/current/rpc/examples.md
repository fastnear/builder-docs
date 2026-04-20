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

## Состояние аккаунта

### Показать баланс и storage аккаунта на finality

`view_account` — канонический RPC-запрос для текущего состояния аккаунта. Один вызов возвращает свободный баланс, сумму, заблокированную в валидаторском стейке или lockup-контракте, использованное storage и блок, на котором было сделано чтение. `finality: "final"` гарантирует, что вы читаете стабильное состояние, а не optimistic-представление.

```bash
ACCOUNT_ID=root.near
FASTNEAR_API_KEY=your_api_key

curl -s "https://rpc.mainnet.fastnear.com" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"view_account",account_id:$account_id,finality:"final"}
  }')" \
  | jq '.result | {amount, locked, storage_usage, block_height, block_hash}'
```

Для `root.near` это возвращает `amount` (yoctoNEAR в свободной части), `locked: "0"` (ничего в валидаторском стейке или lockup-контракте) и `storage_usage: 28677` — примерно 28.7 КБ on-chain-состояния. Пара `block_height`/`block_hash` фиксирует точку чтения; чтобы прочитать несколько аккаунтов *на одном и том же* блоке, переиспользуйте возвращённый `block_hash` как `block_id` в последующих запросах.

## Включение транзакции и финальность

### Отследить транзакцию от хеша до финальности

Есть tx hash? Опрашивайте `tx` с минимальным порогом `wait_until`, который отвечает на ваш вопрос.

```bash
TX_HASH=CVyG2xLJ6fuKCtULAxMnWTh2GL5ey2UUiTcgYT3M6Pow
SIGNER_ACCOUNT_ID=mike.testnet
FASTNEAR_API_KEY=your_api_key

curl -s "https://archival-rpc.testnet.fastnear.com" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
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

Блок NEAR — это header поверх N shard chunks, а не плоский список транзакций. `block` возвращает headers chunks; сами транзакции лежат уровнем ниже, внутри `chunk`. Шортката `block → tx` нет — блок не несёт хешей транзакций, поэтому `tx` (которому нужен hash) в этой цепочке не участвует. Канонический проход — `status` → `block` → `chunk`, пропуская пустые chunks по дороге. Большинство chunks в tip-блоке пустые — их `tx_root` равен сентинелу `11111111111111111111111111111111`, поэтому селектору нужен фильтр.

```bash
EMPTY_TX_ROOT=11111111111111111111111111111111
FASTNEAR_API_KEY=your_api_key

BLOCK_HASH="$(curl -s "https://rpc.mainnet.fastnear.com" -H "Authorization: Bearer $FASTNEAR_API_KEY" -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":"fastnear","method":"status","params":[]}' \
  | jq -r '.result.sync_info.latest_block_hash')"

CHUNK_HASH="$(curl -s "https://rpc.mainnet.fastnear.com" -H "Authorization: Bearer $FASTNEAR_API_KEY" -H 'content-type: application/json' \
  --data "$(jq -nc --arg block_hash "$BLOCK_HASH" '{
    jsonrpc:"2.0",id:"fastnear",method:"block",params:{block_id:$block_hash}
  }')" \
  | jq -r --arg empty "$EMPTY_TX_ROOT" '
      first(.result.chunks[] | select(.tx_root != $empty) | .chunk_hash) // empty')"

if [ -z "$CHUNK_HASH" ]; then
  echo "tip block had no transactions in any chunk — rerun on the next head"
else
  curl -s "https://rpc.mainnet.fastnear.com" -H "Authorization: Bearer $FASTNEAR_API_KEY" -H 'content-type: application/json' \
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

### Определить function-call-ключи, которые стоит удалить

Каждый кошелёк, шлюз и dapp-сессия, в которую вы заходите, обычно оставляет за собой function-call-ключ. Большинством из них вы больше никогда не воспользуетесь. `view_access_key_list` возвращает все ключи аккаунта; структура nonce показывает, какие из них устарели.

Новые ключи стартуют с `block_height * 10^6`, и значение инкрементируется на единицу за каждую транзакцию, которую ключ подписывает, поэтому:

- `nonce / 10^6` → блок, в котором ключ был добавлен
- `nonce % 10^6` → сколько раз ключ был использован

Любой ключ с `tx_count: 0` был создан и ни разу не использовался — самый очевидный кандидат на очистку. Следующий по порядку — ключи, заскоупленные на контракт, с которым вы больше не работаете. Фильтр ниже сужает до `social.near`, но чтобы аудитировать другой контракт, меняется только строка `RECEIVER_ID`.

```bash
ACCOUNT_ID=root.near
RECEIVER_ID=social.near
FASTNEAR_API_KEY=your_api_key

curl -s "https://rpc.mainnet.fastnear.com" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"view_access_key_list",account_id:$account_id,finality:"final"}
  }')" \
  | jq --arg receiver "$RECEIVER_ID" '
      {
        total_keys: (.result.keys | length),
        fcks_for_receiver: [
          .result.keys[]
          | select((.access_key.permission | type) == "object")
          | select(.access_key.permission.FunctionCall.receiver_id == $receiver)
          | {
              public_key,
              added_at_block: (.access_key.nonce / 1000000 | floor),
              tx_count: (.access_key.nonce % 1000000),
              method_names: (.access_key.permission.FunctionCall.method_names | if . == [] then "ANY" else . end),
              allowance: (.access_key.permission.FunctionCall.allowance // "unlimited")
            }
        ] | sort_by(.tx_count)
      }'
```

Для `root.near` это возвращает 235 ключей всего, включая 34 function-call-ключа на `social.near`; 21 из них были созданы и ни разу не использовались (`tx_count: 0`) и потому являются прямыми кандидатами на удаление. `method_names: "ANY"` означает, что ключ может вызвать любой метод на `social.near`; сужение до списка вида `["find_grants", "insert_grant", "delete_grant"]` означает, что ключ был заскоуплен на write-поверхность одного dapp.

Чтобы удалить такой ключ, подпишите action `DeleteKey` **full-access**-ключом (function-call-ключ не может авторизовать `DeleteKey`) и отправьте через [`send_tx`](/rpc/transaction/send-tx). Повторный запуск того же запроса подтвердит, что ключа больше нет.

## Чтение контрактов и сырой state

### Прочитать storage контракта, не запуская его

View-метод вроде `get_num` всё равно заставляет узел загрузить wasm-контракта и выполнить его. Если ключ storage уже известен, `view_state` возвращает сырые сериализованные байты напрямую — без исполнения и без зависимости от того, выставил ли контракт getter для этого поля вообще.

Контракты на `near-sdk-rs` хранят верхнеуровневую `#[near_bindgen]`-структуру под ключом `STATE`. Передайте `STATE` как `prefix_base64` (`U1RBVEU=` — это base64 тех же четырёх ASCII-байт), и узел вернёт сериализованное значение.

```bash
CONTRACT_ID=counter.near-examples.testnet
FASTNEAR_API_KEY=your_api_key

RAW_B64="$(curl -s "https://rpc.testnet.fastnear.com" -H "Authorization: Bearer $FASTNEAR_API_KEY" -H 'content-type: application/json' \
  --data "$(jq -nc --arg contract "$CONTRACT_ID" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"view_state",account_id:$contract,prefix_base64:"U1RBVEU=",finality:"final"}
  }')" \
  | jq -r '.result.values[0].value')"

DECODED_I8="$(python3 -c "import base64; print(int.from_bytes(base64.b64decode('$RAW_B64'),'little',signed=True))")"

jq -n --arg raw "$RAW_B64" --argjson val "$DECODED_I8" '{raw_bytes_base64: $raw, decoded_i8: $val}'
```

Для живого counter это возвращает `"CQ=="` — один байт `0x09`, декодируется как signed i8 в `9`. Это то же число, которое вернул бы `get_num`, только прочитанное прямо из trie без запуска кода контракта. `signed=True` важен: отрицательный counter сериализовался бы как `"/w=="` (байт `0xff` → i8 `-1`, а не u8 `255`).

Тянитесь к `view_state`, когда контракт не выставляет view-метод для нужных данных или когда нужна семья ключей, которую контракт не публикует. Для большинства чтений `call_function` всё равно требует меньше церемоний. Если вопрос становится историческим, а не текущим, расширяйте поверхность до [KV FastData API](/fastdata/kv).

## NEAR Social и точные чтения BOS

Оставайтесь на точных чтениях SocialDB и on-chain-проверках готовности — пока вопрос не станет историческим.

### Может ли этот аккаунт прямо сейчас публиковать в NEAR Social?

`social.near` знает две вещи, о которых UI кошелька может только догадываться: сколько storage осталось у каждого аккаунта и разрешена ли делегированному signer запись под этим аккаунтом. Два view-вызова сворачивают вопрос готовности к одному boolean.

```bash
ACCOUNT_ID=root.near         # account you're writing under
SIGNER_ACCOUNT_ID=root.near  # account signing the transaction
FASTNEAR_API_KEY=your_api_key

STORAGE_ARGS_B64="$(jq -nc --arg account_id "$ACCOUNT_ID" '{account_id:$account_id}' | base64 | tr -d '\n')"

STORAGE="$(curl -s "https://rpc.mainnet.fastnear.com" -H "Authorization: Bearer $FASTNEAR_API_KEY" -H 'content-type: application/json' \
  --data "$(jq -nc --arg args "$STORAGE_ARGS_B64" '{
    jsonrpc:"2.0",id:"fastnear",method:"query",
    params:{request_type:"call_function",account_id:"social.near",method_name:"get_account_storage",args_base64:$args,finality:"final"}
  }')" \
  | jq '.result.result | implode | fromjson')"

if [ "$SIGNER_ACCOUNT_ID" = "$ACCOUNT_ID" ]; then
  PERMISSION=true
else
  PERM_ARGS_B64="$(jq -nc --arg pred "$SIGNER_ACCOUNT_ID" --arg key "$ACCOUNT_ID" '{predecessor_id:$pred,key:$key}' | base64 | tr -d '\n')"
  PERMISSION="$(curl -s "https://rpc.mainnet.fastnear.com" -H "Authorization: Bearer $FASTNEAR_API_KEY" -H 'content-type: application/json' \
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

Для `root.near`, подписывающего под собой, это возвращает `storage: {used_bytes: 136245, available_bytes: 42484}`, `permission_granted: true` (владельческая запись) и `ready_to_publish: true`. Если `storage` приходит как `null` или `available_bytes: 0`, аккаунту нужен `storage_deposit` на `social.near`, прежде чем новая запись сможет закрепиться. Если signer отличается от цели, ветка permission спрашивает `is_write_permission_granted({predecessor_id, key})` — тот же on-chain-ответ, который dapp видит, прежде чем писать от имени пользователя. Полную поверхность контракта см. в [SocialDB API](https://github.com/NearSocial/social-db#api).

### Что `mob.near/widget/Profile` содержит прямо сейчас?

SocialDB хранит BOS-виджеты как ключи `<account>/widget/<name>` на `social.near`. Один `keys` с типом возврата `BlockHeight` возвращает каталог плюс якоря последней записи по каждому виджету; один `get` возвращает точный исходник.

```bash
ACCOUNT_ID=mob.near
WIDGET_NAME=Profile
FASTNEAR_API_KEY=your_api_key

KEYS_ARGS="$(jq -nc --arg account_id "$ACCOUNT_ID" '{
  keys: [($account_id + "/widget/*")],
  options: {return_type: "BlockHeight"}
}' | base64 | tr -d '\n')"

curl -s "https://rpc.mainnet.fastnear.com" -H "Authorization: Bearer $FASTNEAR_API_KEY" -H 'content-type: application/json' \
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

curl -s "https://rpc.mainnet.fastnear.com" -H "Authorization: Bearer $FASTNEAR_API_KEY" -H 'content-type: application/json' \
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
