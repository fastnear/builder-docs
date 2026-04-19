**Источник:** [https://docs.fastnear.com/ru/neardata/examples](https://docs.fastnear.com/ru/neardata/examples)

## Быстрый старт

Начните с одного недавнего финализированного блока и сначала запросите самую маленькую возможную touch-сводку.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz
TARGET_ACCOUNT_ID=intents.near

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
        | select(.transaction.receiver_id == $target)] | length),
      incoming_receipt_count: ([.shards[].chunk.receipts[]?
        | select(.receiver_id == $target)] | length),
      outcome_hit_count: ([.shards[].receipt_execution_outcomes[]?
        | select(
            (.receipt.receiver_id // "") == $target
            or (.execution_outcome.outcome.executor_id // "") == $target
          )] | length),
      state_change_count: ([.shards[].state_changes[]?
        | select((.change.account_id // "") == $target)] | length),
      state_change_types: ([.shards[].state_changes[]?
        | select((.change.account_id // "") == $target)
        | .type] | unique | sort)
    } | . + {
      touched: (
        (.direct_tx_count > 0)
        or (.incoming_receipt_count > 0)
        or (.outcome_hit_count > 0)
        or (.state_change_count > 0)
      )
    }'
```

Это самая маленькая полезная сводка NEAR Data для команды приложения: один финализированный блок, один ответ “да / нет” и несколько счётчиков до того, как вы начнёте расширяться дальше. Здесь закреплён `intents.near`, чтобы первый запуск с высокой вероятностью сразу вернул реальный touched-блок, а уже потом вы сможете подставить свой контракт.

Блоки NEAR шардингованы, поэтому фильтр проходит по `.shards[]`, прежде чем смотреть транзакции, receipts, outcomes или изменения состояния. `chunk.receipts` означает работу, которая приземлилась в этом блоке; `receipt_execution_outcomes` означает работу, которая исполнилась в этом блоке, даже если была запланирована раньше.

## Готовое расследование

### Был ли мой контракт затронут в последнем финализированном блоке?

Используйте это расследование, когда вам нужен конкретный ответ “да / нет” ещё до перехода к Transactions API или RPC.

    Стратегия
    Сначала ответьте на вопрос о contract touch, а затем оставьте только один tx hash или receipt id для следующего шага.

    01last-block-final даёт одну стабильную высоту блока без угадывания.
    02block — это главный read: он уже содержит транзакции, входящие receipts, результаты исполнения receipts и изменения состояния, которых достаточно для ответа на вопрос «был ли контракт затронут?»
    03Только если ответ «да», расширяйтесь дальше: сохраните один точный tx hash или receipt id из того же сохранённого блока, а затем передайте этот идентификатор в [Transactions API](https://docs.fastnear.com/ru/tx) или [RPC Reference](https://docs.fastnear.com/ru/rpc).

**Цель**

- Определить, был ли один целевой контракт затронут в последнем финализированном блоке, и оставить только компактные счётчики плюс один точный идентификатор для следующего шага.

**Что должен включать полезный ответ**

- финализированную высоту и хеш
- ответ “затронут / не затронут”
- счётчики прямых транзакций, входящих receipts, outcome-hit и state changes
- компактный список `state_change_types`
- один sample tx hash или receipt id, когда он есть

### Shell-сценарий от финализированного блока к ответу по contract touch

Используйте этот сценарий, когда целевой аккаунт уже известен и нужен один свежий финализированный ответ, а не длинный polling-цикл.

**Что вы делаете**

- Получаете redirect target для последнего финализированного блока.
- Один раз загружаете полный документ блока.
- Собираете один компактный ответ по одному `TARGET_ACCOUNT_ID`.
- Получаете ответ “да / нет” плюс минимально полезные счётчики, типы изменений состояния и sample-идентификаторы.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz
TARGET_ACCOUNT_ID=intents.near

FINAL_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/final" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

printf 'Final redirect target: %s\n' "$FINAL_LOCATION"

curl -s "$NEARDATA_BASE_URL$FINAL_LOCATION" \
  | tee /tmp/neardata-block.json >/dev/null

jq --arg target "$TARGET_ACCOUNT_ID" '
  (
    [
      .shards[]
      | .chunk.transactions[]?
      | select(.transaction.receiver_id == $target)
      | .transaction.hash
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
  | (
    $state_changes
    | unique
    | sort
  ) as $state_change_types
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
      state_change_types: $state_change_types,
      sample_direct_tx: ($txs[0] // null),
      sample_incoming_receipt: ($receipts[0] // null),
      sample_outcome_tx_hash: ($outcomes[0] // null)
    }
' /tmp/neardata-block.json | tee /tmp/neardata-touch-summary.json
```

Если позже понадобятся более богатые списки, продолжайте использовать `/tmp/neardata-block.json`. Смысл первого прохода в том, чтобы сначала ответить на вопрос «затронут или нет?», а уже потом расширяться до длинных массивов или более глубокого trace.

Типичные `state_change_types` — это `account_update`, `access_key_update`, `data_update` и соответствующие варианты `*_deletion`. Этого часто достаточно, чтобы ещё внутри NEAR Data понять, смотрите ли вы на запись в storage, churn ключей или более широкое изменение аккаунта.

#### Необязательное продолжение: Какой tx hash или receipt id разбирать дальше?

Используйте ту же сохранённую сводку и поднимите один точный идентификатор для следующей поверхности.

```bash
FOLLOW_UP_KIND="$(
  jq -r '
    if .sample_direct_tx != null then "tx_hash"
    elif .sample_incoming_receipt != null then "receipt_id"
    elif .sample_outcome_tx_hash != null then "tx_hash"
    else "none"
    end
  ' /tmp/neardata-touch-summary.json
)"

FOLLOW_UP_VALUE="$(
  jq -r '
    .sample_direct_tx
    // .sample_incoming_receipt
    // .sample_outcome_tx_hash
    // empty
  ' /tmp/neardata-touch-summary.json
)"

printf 'Next identifier kind: %s\n' "$FOLLOW_UP_KIND"
printf 'Next identifier value: %s\n' "$FOLLOW_UP_VALUE"
```

Если идентификатор — это `tx_hash`, передайте его в [Transactions API](https://docs.fastnear.com/ru/tx) или RPC `tx` status. Если это `receipt_id`, передайте его в [Transactions API: Receipt by ID](https://docs.fastnear.com/ru/tx/receipt). И только после этого решайте, нужен ли вам вообще shard-level follow-up.

**Зачем нужен следующий шаг?**

Так вопрос остаётся максимально маленьким: сначала вы отвечаете «был ли затронут мой контракт?», а затем расширяетесь только тогда, когда один точный tx hash или receipt id уже оправдывает более глубокий trace. Здесь NEAR Data выступает как discovery-layer, а не просто как block monitor.

### Насколько optimistic head опережает final прямо сейчас?

Используйте это, когда нужно выбрать между low-latency read и settled read ещё до запуска polling.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz

FINAL_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/final" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

OPTIMISTIC_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/optimistic" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

jq -n \
  --arg final_location "$FINAL_LOCATION" \
  --arg optimistic_location "$OPTIMISTIC_LOCATION" '{
    final_location: $final_location,
    optimistic_location: $optimistic_location,
    final_height: ($final_location | split("/") | last | tonumber),
    optimistic_height: ($optimistic_location | split("/") | last | tonumber)
  } | . + {
    optimistic_minus_final: (.optimistic_height - .final_height)
  }'
```

Используйте `last_block/optimistic`, когда приложению важнее скорость, чем settled finality, например для реактивных status-view или ранних алертов. Используйте `last_block/final`, когда ответ пойдёт в accounting, reconciliation или любой workflow, который не должен откатываться назад.

### Как идти вперёд блок за блоком?

Используйте этот шаблон, когда задача звучит как «начать с высоты N, получить блок, обработать его, увеличить высоту и повторить». Для детерминированной стартовой точки один раз прочитайте [`first-block`](https://docs.fastnear.com/ru/neardata/first-block), а затем идите вперёд.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz

FINAL_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/final" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

FINAL_HEIGHT="$(printf '%s' "$FINAL_LOCATION" | awk -F/ '{print $4}')"
NEXT_HEIGHT=$((FINAL_HEIGHT + 1))

while true; do
  HTTP_CODE="$(
    curl -s -o /tmp/neardata-next-block.json -w '%{http_code}' \
      "$NEARDATA_BASE_URL/v0/block/$NEXT_HEIGHT"
  )"

  if [ "$HTTP_CODE" = "200" ]; then
    jq '{height: .block.header.height, hash: .block.header.hash}' \
      /tmp/neardata-next-block.json
    NEXT_HEIGHT=$((NEXT_HEIGHT + 1))
  elif [ "$HTTP_CODE" = "404" ]; then
    sleep 2
  else
    printf 'Unexpected status: %s\n' "$HTTP_CODE" >&2
    break
  fi
done
```

Это каноническая форма polling для финализированных данных: получить блок по высоте, обработать один блок, перейти к следующему и трактовать `404` как «ещё не финализирован, подождите и повторите». Если нужен тот же цикл на optimistic-скорости, переключитесь на `/v0/block_opt/<height>` и примите optimistic semantics вместо final.

## Частые ошибки

- Воспринимать NEAR Data как push-стрим, а не как polling- или point-read API.
- Начинать с RPC, не проверив, не отвечает ли уже один финализированный блок на вопрос о контракте.
- Смотреть только на прямые транзакции и забывать, что контракты часто затрагиваются через receipts или state changes.
- Использовать optimistic-данные для settled accounting или reconciliation.
- Предполагать, что сначала нужно проверить какой-то заранее выбранный shard id, а не само семейство блока.
- Переходить к Transactions API или RPC до того, как вы извлекли из NEAR Data один точный tx hash или receipt id.

## Полезные связанные страницы

- [NEAR Data API](https://docs.fastnear.com/ru/neardata)
- [Transactions API](https://docs.fastnear.com/ru/tx)
- [RPC Reference](https://docs.fastnear.com/ru/rpc)
- [Choosing the Right Surface](https://docs.fastnear.com/ru/agents/choosing-surfaces)
- [Agent Playbooks](https://docs.fastnear.com/ru/agents/playbooks)
