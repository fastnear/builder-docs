**Источник:** [https://docs.fastnear.com/ru/neardata/examples](https://docs.fastnear.com/ru/neardata/examples)

## Быстрый старт

Начните с одного недавнего финализированного блока и сначала запросите самую маленькую возможную touch-сводку.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz
TARGET_ACCOUNT_ID=YOUR_CONTRACT_ID

FINAL_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/final" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

curl -s "$NEARDATA_BASE_URL$FINAL_LOCATION" \
  | jq --arg target "$TARGET_ACCOUNT_ID" '{
      height: .block.header.height,
      hash: .block.header.hash,
      direct_tx_count: ([.shards[].chunk.transactions[]?
        | select((.transaction.receiver_id // .receiver_id) == $target)] | length),
      incoming_receipt_count: ([.shards[].chunk.receipts[]?
        | select(.receiver_id == $target)] | length),
      outcome_hit_count: ([.shards[].receipt_execution_outcomes[]?
        | select(
            (.receipt.receiver_id // "") == $target
            or (.execution_outcome.outcome.executor_id // "") == $target
          )] | length),
      state_change_count: ([.shards[].state_changes[]?
        | select((.change.account_id // "") == $target)] | length)
    } | . + {
      touched: (
        (.direct_tx_count > 0)
        or (.incoming_receipt_count > 0)
        or (.outcome_hit_count > 0)
        or (.state_change_count > 0)
      )
    }'
```

Это самая маленькая полезная сводка NEAR Data для команды приложения: один финализированный блок, один ответ “да / нет” и несколько счётчиков до того, как вы начнёте расширяться дальше.

## Готовое расследование

### Был ли мой контракт затронут в последнем финализированном блоке?

Используйте это расследование, когда вам нужен конкретный ответ “да / нет” ещё до перехода к Transactions API или RPC.

    Стратегия
    Зафиксируйтесь на одном финализированном блоке, просканируйте всё семейство блока по целевому аккаунту, а затем оставьте только компактную сводку и идентификаторы, которые действительно стоит разбирать дальше.

    01last-block-final даёт одну стабильную высоту блока без угадывания.
    02block — это главный read: он уже содержит транзакции, receipts, результаты исполнения receipts и изменения состояния, которых достаточно для ответа на вопрос «был ли контракт затронут?»
    03Только если ответ «да», расширяйтесь дальше: сохраняйте найденные shard id, tx hash и receipt id, а затем передавайте именно эти идентификаторы в [Transactions API](https://docs.fastnear.com/ru/tx) или [RPC Reference](https://docs.fastnear.com/ru/rpc).

**Цель**

- Определить, был ли один целевой контракт затронут в последнем финализированном блоке, и оставить только shard id, счётчики и sample-идентификаторы для следующего шага.

| Поверхность | Эндпоинт | Как используем | Зачем используем |
| --- | --- | --- | --- |
| Последняя стабильная точка | NEAR Data [`last-block-final`](https://docs.fastnear.com/ru/neardata/last-block-final) | Получаем высоту одного финализированного блока без угадывания | Даёт стабильную отправную точку для всего вопроса |
| Всё семейство блока | NEAR Data [`block`](https://docs.fastnear.com/ru/neardata/block) | Сканируем транзакции, receipts, результаты исполнения receipts и изменения состояния по целевому аккаунту | Это главная поверхность ответа на вопрос «был ли затронут мой контракт?» |
| Лёгкая сводка по блоку | NEAR Data [`block-headers`](https://docs.fastnear.com/ru/neardata/block-headers) | Используем, когда нужны только высота, хеш, время или заголовки чанков | Позволяет не тянуть более широкий payload блока, когда фильтрация по контракту не нужна |
| Необязательный follow-up по шарду | NEAR Data [`block-chunk`](https://docs.fastnear.com/ru/neardata/block-chunk) или [`block-shard`](https://docs.fastnear.com/ru/neardata/block-shard) | Повторно открываем только затронутый шард, если нужен более глубокий payload | Полезно, когда вы уже знаете, какой шард mattered |
| Точные поверхности для продолжения | [Transactions API](https://docs.fastnear.com/ru/tx) или [RPC Reference](https://docs.fastnear.com/ru/rpc) | Переиспользуем найденные tx hash или receipt id только если нужна полная история исполнения | NEAR Data позволяет сначала понять, нужен ли вообще переход дальше |

**Что должен включать полезный ответ**

- финализированную высоту и хеш
- ответ “затронут / не затронут”
- счётчики прямых транзакций, входящих receipts, outcome-hit и state changes
- по одному sample tx hash или receipt id на категорию, когда он есть

### Shell-сценарий от финализированного блока к ответу по контракту

Используйте этот сценарий, когда целевой аккаунт уже известен и нужен один свежий финализированный ответ, а не длинный polling-цикл.

**Что вы делаете**

- Получаете redirect target для последнего финализированного блока.
- Один раз загружаете полный документ блока.
- Собираете один компактный ответ по одному `TARGET_ACCOUNT_ID`.
- Получаете ответ “да / нет” плюс минимально полезные счётчики и sample-идентификаторы.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz
TARGET_ACCOUNT_ID=YOUR_CONTRACT_ID

FINAL_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/final" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

BLOCK_HEIGHT="$(printf '%s' "$FINAL_LOCATION" | sed -E 's#.*/([0-9]+)$#\1#')"

printf 'Final redirect target: %s\n' "$FINAL_LOCATION"
printf 'Final block height: %s\n' "$BLOCK_HEIGHT"

curl -s "$NEARDATA_BASE_URL$FINAL_LOCATION" \
  | tee /tmp/neardata-block.json >/dev/null

jq --arg target "$TARGET_ACCOUNT_ID" '
  (
    [
      .shards[]
      | .chunk.transactions[]?
      | select((.transaction.receiver_id // .receiver_id) == $target)
      | (.transaction.hash // .hash)
    ]
  ) as $txs
  | (
    [
      .shards[]
      | .chunk.receipts[]?
      | select(.receiver_id == $target)
      | .receipt_id
    ]
  ) as $receipts
  | (
    [
      .shards[]
      | .receipt_execution_outcomes[]?
      | select(
          (.receipt.receiver_id // "") == $target
          or (.execution_outcome.outcome.executor_id // "") == $target
        )
      | .tx_hash
      | select(. != null)
    ]
    | unique
  ) as $outcomes
  | (
    [
      .shards[]
      | .state_changes[]?
      | select((.change.account_id // "") == $target)
      | .type
    ]
  ) as $state_changes
  | {
      height: .block.header.height,
      hash: .block.header.hash,
      touched: (
        ($txs | length) > 0
        or ($receipts | length) > 0
        or ($outcomes | length) > 0
        or ($state_changes | length) > 0
      ),
      direct_tx_count: ($txs | length),
      incoming_receipt_count: ($receipts | length),
      outcome_hit_count: ($outcomes | length),
      state_change_count: ($state_changes | length),
      sample_direct_tx: ($txs[0] // null),
      sample_incoming_receipt: ($receipts[0] // null),
      sample_outcome_tx_hash: ($outcomes[0] // null)
    }
' /tmp/neardata-block.json | tee /tmp/neardata-touch-summary.json
```

Если позже понадобятся более богатые списки или разбор по шардам, продолжайте использовать `/tmp/neardata-block.json`. Смысл первого прохода в том, чтобы сначала ответить на вопрос «затронут или нет?», а уже потом расширяться до длинных массивов или более глубокого trace.

Необязательное расширение: если всё же нужны `touched_shards`, их можно вычислить из того же сохранённого блока, не утяжеляя основной ответ:

```bash
jq --arg target "$TARGET_ACCOUNT_ID" '
  [
    .shards[]
    | .shard_id as $shard_id
    | select(
        ([.chunk.transactions[]? | (.transaction.receiver_id // .receiver_id)] | index($target))
        or ([.chunk.receipts[]? | .receiver_id] | index($target))
        or ([.receipt_execution_outcomes[]? | .receipt.receiver_id, .execution_outcome.outcome.executor_id] | index($target))
        or ([.state_changes[]? | .change.account_id] | index($target))
      )
    | $shard_id
  ] | unique
' /tmp/neardata-block.json
```

Если в этом ответе `touched: true` и нужен один follow-up на уровне шарда, откройте только первый затронутый шард:

```bash
TOUCHED_SHARD_ID="$(
  jq -r --arg target "$TARGET_ACCOUNT_ID" '
    first(
      .shards[]
      | .shard_id as $shard_id
      | select(
          ([.chunk.transactions[]? | (.transaction.receiver_id // .receiver_id)] | index($target))
          or ([.chunk.receipts[]? | .receiver_id] | index($target))
          or ([.receipt_execution_outcomes[]? | .receipt.receiver_id, .execution_outcome.outcome.executor_id] | index($target))
          or ([.state_changes[]? | .change.account_id] | index($target))
        )
      | $shard_id
    ) // empty
  ' /tmp/neardata-block.json
)"

if [ -n "$TOUCHED_SHARD_ID" ]; then
  curl -s "$NEARDATA_BASE_URL/v0/block/$BLOCK_HEIGHT/chunk/$TOUCHED_SHARD_ID" \
    | jq '{
        shard_id: .header.shard_id,
        chunk_hash: .header.chunk_hash,
        tx_hashes: ([.transactions[]? | (.transaction.hash // .hash)] | .[:5]),
        receipt_ids: ([.receipts[]? | .receipt_id] | .[:5]),
        receipt_receivers: ([.receipts[]? | .receiver_id] | .[:5])
      }'
fi
```

**Зачем нужен следующий шаг?**

Так вопрос остаётся максимально маленьким: сначала вы отвечаете «был ли затронут мой контракт?», а затем расширяетесь только тогда, когда один из sample-идентификаторов уже оправдывает более глубокий trace. Здесь NEAR Data выступает как discovery-layer, а не просто как block monitor.

## Частые ошибки

- Воспринимать NEAR Data как push-стрим, а не как polling- или point-read API.
- Начинать с RPC, не проверив, не отвечает ли уже один финализированный блок на вопрос о контракте.
- Смотреть только на прямые транзакции и забывать, что контракты часто затрагиваются через receipts или state changes.
- Предполагать, что сначала нужно проверить какой-то заранее выбранный shard id, а не само семейство блока.
- Переходить к Transactions API или RPC до того, как вы извлекли из NEAR Data точные shard id, tx hash и receipt id.

## Полезные связанные страницы

- [NEAR Data API](https://docs.fastnear.com/ru/neardata)
- [Transactions API](https://docs.fastnear.com/ru/tx)
- [RPC Reference](https://docs.fastnear.com/ru/rpc)
- [Choosing the Right Surface](https://docs.fastnear.com/ru/agents/choosing-surfaces)
- [Agent Playbooks](https://docs.fastnear.com/ru/agents/playbooks)
