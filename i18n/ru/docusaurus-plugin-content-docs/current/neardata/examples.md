---
sidebar_label: Examples
slug: /neardata/examples
title: "Примеры NEAR Data"
description: "Пошаговые сценарии для проверки, был ли контракт затронут в последнем финализированном блоке, и извлечения точных идентификаторов для дальнейшего разбора."
displayed_sidebar: nearDataApiSidebar
page_actions:
  - markdown
---

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

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Стратегия</span>
    <p className="fastnear-example-strategy__title">Сначала ответьте на вопрос о контрактном touch, а затем оставьте только один tx hash или receipt id для следующего шага.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">last-block-final</span> даёт одну стабильную высоту блока без угадывания.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">block</span> — это главный read: он уже содержит транзакции, receipts, результаты исполнения receipts и изменения состояния, которых достаточно для ответа на вопрос «был ли контракт затронут?»</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span>Только если ответ «да», расширяйтесь дальше: сохраните один точный tx hash или receipt id из того же сохранённого блока, а затем передайте этот идентификатор в [Transactions API](/tx) или [RPC Reference](/rpc).</span></p>
  </div>
</div>

**Цель**

- Определить, был ли один целевой контракт затронут в последнем финализированном блоке, и оставить только компактные счётчики плюс один точный идентификатор для следующего шага.

**Что должен включать полезный ответ**

- финализированную высоту и хеш
- ответ “затронут / не затронут”
- счётчики прямых транзакций, входящих receipts, outcome-hit и state changes
- один sample tx hash или receipt id, когда он есть

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

printf 'Final redirect target: %s\n' "$FINAL_LOCATION"

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

Если позже понадобятся более богатые списки, продолжайте использовать `/tmp/neardata-block.json`. Смысл первого прохода в том, чтобы сначала ответить на вопрос «затронут или нет?», а уже потом расширяться до длинных массивов или более глубокого trace.

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

Если идентификатор — это `tx_hash`, передайте его в [Transactions API](/tx) или RPC `tx` status. Если это `receipt_id`, передайте его в [Transactions API: Receipt by ID](/tx/receipt). И только после этого решайте, нужен ли вам вообще shard-level follow-up.

**Зачем нужен следующий шаг?**

Так вопрос остаётся максимально маленьким: сначала вы отвечаете «был ли затронут мой контракт?», а затем расширяетесь только тогда, когда один точный tx hash или receipt id уже оправдывает более глубокий trace. Здесь NEAR Data выступает как discovery-layer, а не просто как block monitor.


## Частые ошибки

- Воспринимать NEAR Data как push-стрим, а не как polling- или point-read API.
- Начинать с RPC, не проверив, не отвечает ли уже один финализированный блок на вопрос о контракте.
- Смотреть только на прямые транзакции и забывать, что контракты часто затрагиваются через receipts или state changes.
- Предполагать, что сначала нужно проверить какой-то заранее выбранный shard id, а не само семейство блока.
- Переходить к Transactions API или RPC до того, как вы извлекли из NEAR Data один точный tx hash или receipt id.

## Полезные связанные страницы

- [NEAR Data API](/neardata)
- [Transactions API](/tx)
- [RPC Reference](/rpc)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
