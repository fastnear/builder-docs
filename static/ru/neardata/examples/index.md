**Источник:** [https://docs.fastnear.com/ru/neardata/examples](https://docs.fastnear.com/ru/neardata/examples)

NEAR Data особенно хороша там, где вопрос касается недавней активности сети: появился ли контракт в самом новом семействе блоков, пережил ли optimistic-сигнал finality и какой shard действительно понёс изменение.

## Готовые расследования

### Был ли мой контракт затронут в последнем финализированном блоке?

Используйте это, когда приложению, боту или инструменту поддержки нужен один быстрый ответ о живом контракте. Мы будем проверять `intents.near`, но та же сводка работает для любого аккаунта контракта.

    Стратегия
    Сначала дайте NEAR Data ответить на задачу мониторинга, а уже потом сохраняйте tx hash или receipt ID для следующей поверхности, если это вообще понадобится.

    01last-block-final находит самую новую финализированную высоту.
    02block даёт один недавний гидратированный документ блока с уже присоединёнными данными по shard.
    03Суммируйте прямые транзакции, входящие receipts, результаты выполнения и state_changes для нужного контракта. Считайте state_changes самым сильным сигналом того, что контракт действительно изменился.

Такой сценарий вполне честно может вернуть `touched: false`, если блок тихий. Это тоже полезный ответ: в самом новом финализированном блоке сейчас нет ничего, что требовало бы более глубокого разбора.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz
TARGET_CONTRACT=intents.near

contract_touch_summary() {
  jq -r --arg contract "$1" '
    [ .shards[] | {
        shard_id,
        direct_txs: ([.chunk.transactions[]? | select(.transaction.receiver_id == $contract)] | length),
        incoming_receipts: ([.chunk.receipts[]? | select(.receiver_id == $contract)] | length),
        execution_outcomes: ([.receipt_execution_outcomes[]? | select(.execution_outcome.outcome.executor_id == $contract)] | length),
        state_changes: ([.state_changes[]? | select(.change.account_id? == $contract)] | length),
        sample_tx_hash: ([.chunk.transactions[]? | select(.transaction.receiver_id == $contract) | .transaction.hash] | .[0]),
        sample_receipt_id: (
          [ .chunk.receipts[]? | select(.receiver_id == $contract) | .receipt_id ] +
          [ .receipt_execution_outcomes[]? | select(.execution_outcome.outcome.executor_id == $contract) | .execution_outcome.id ] +
          [ .state_changes[]? | select(.change.account_id? == $contract) | (.cause.receipt_hash? // empty) ]
          | .[0]
        )
      }
      | select(.direct_txs + .incoming_receipts + .execution_outcomes + .state_changes > 0)
    ] as $rows
    | {
        height: .block.header.height,
        hash: .block.header.hash,
        contract: $contract,
        touched: (($rows | length) > 0),
        shards: ($rows | map(.shard_id)),
        evidence: {
          direct_txs: (($rows | map(.direct_txs) | add) // 0),
          incoming_receipts: (($rows | map(.incoming_receipts) | add) // 0),
          execution_outcomes: (($rows | map(.execution_outcomes) | add) // 0),
          state_changes: (($rows | map(.state_changes) | add) // 0)
        },
        sample_tx_hash: ([ $rows[] | .sample_tx_hash | select(.) ] | .[0]),
        sample_receipt_id: ([ $rows[] | .sample_receipt_id | select(.) ] | .[0])
      }'
}

FINAL_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/final" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

printf 'Latest finalized block: %s\n' "$FINAL_LOCATION"

curl -s "$NEARDATA_BASE_URL$FINAL_LOCATION" \
  | tee /tmp/neardata-final-block.json \
  | contract_touch_summary "$TARGET_CONTRACT"
```

Читать ответ стоит так:

- `touched: false` означает, что самый новый финализированный блок не упомянул и не изменил контракт ни одним из отслеживаемых способов.
- `sample_tx_hash` означает, что у вас уже есть хороший якорь для следующего шага на `/tx`.
- `sample_receipt_id` без tx hash обычно означает, что контракт появился в цепочке через receipts, и NEAR Data уже сэкономила вам более дешёвый этап мониторинга.

### Увидел ли я активность в optimistic-режиме, и пережила ли она finality?

Используйте это, когда нужен ранний сигнал по живому контракту, но стабильный ответ всё равно должен пройти через финализированное подтверждение.

    Стратегия
    Используйте один и тот же словарь contract-touch на обеих поверхностях, чтобы сравнение было честным.

    01last-block-optimistic находит самую новую optimistic-высоту.
    02block-optimistic показывает ранний сигнал для того же контракта.
    03block на той же высоте либо подтверждает то же наблюдение, либо показывает, что finality ещё не догнала.

Если finality уже догнала, optimistic- и finalized-сводки могут совпасть сразу. Это тоже полезно: ранний сигнал уже попал в стабильную историю.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz
TARGET_CONTRACT=intents.near

contract_touch_summary() {
  jq -r --arg contract "$1" '
    [ .shards[] | {
        shard_id,
        direct_txs: ([.chunk.transactions[]? | select(.transaction.receiver_id == $contract)] | length),
        incoming_receipts: ([.chunk.receipts[]? | select(.receiver_id == $contract)] | length),
        execution_outcomes: ([.receipt_execution_outcomes[]? | select(.execution_outcome.outcome.executor_id == $contract)] | length),
        state_changes: ([.state_changes[]? | select(.change.account_id? == $contract)] | length)
      }
      | select(.direct_txs + .incoming_receipts + .execution_outcomes + .state_changes > 0)
    ] as $rows
    | {
        height: .block.header.height,
        hash: .block.header.hash,
        contract: $contract,
        touched: (($rows | length) > 0),
        shards: ($rows | map(.shard_id)),
        evidence: {
          direct_txs: (($rows | map(.direct_txs) | add) // 0),
          incoming_receipts: (($rows | map(.incoming_receipts) | add) // 0),
          execution_outcomes: (($rows | map(.execution_outcomes) | add) // 0),
          state_changes: (($rows | map(.state_changes) | add) // 0)
        }
      }'
}

OPT_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/optimistic" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

OPT_HEIGHT="${OPT_LOCATION##*/}"

printf 'Latest optimistic block: %s\n' "$OPT_LOCATION"

curl -s "$NEARDATA_BASE_URL$OPT_LOCATION" \
  | tee /tmp/neardata-optimistic-block.json \
  | contract_touch_summary "$TARGET_CONTRACT"

curl -s "$NEARDATA_BASE_URL/v0/block/$OPT_HEIGHT" \
  | tee /tmp/neardata-final-same-height.json >/dev/null

if jq -e 'type == "null"' /tmp/neardata-final-same-height.json >/dev/null; then
  printf 'Finalized block %s is not available yet; finality has not caught up.\n' "$OPT_HEIGHT"
else
  printf 'Finalized block %s is already available; compare the stable answer below.\n' "$OPT_HEIGHT"
  contract_touch_summary "$TARGET_CONTRACT" < /tmp/neardata-final-same-height.json
fi
```

Практический вывод такой:

- optimistic — это ранний сигнал, на который цикл мониторинга может быстро отреагировать;
- finalized — это стабильный ответ, который уже можно показывать пользователям или использовать в устойчивой автоматизации.

### Какой shard действительно изменил мой контракт в этом блоке?

Используйте это, когда недавний блок уже показал активность контракта, и теперь нужно доказательство на уровне shard того, где именно изменение реально приземлилось.

    Стратегия
    Сначала используйте весь блок, чтобы найти нужный shard, а затем дайте block-shard доказать само изменение.

    01Просканируйте список shard внутри финализированного блока и найдите state_changes по вашему контракту.
    02Откройте только тот shard, который действительно изменил контракт.
    03Сохраните совпадающие state_changes и нужные результаты исполнения как доказательство на уровне shard.

На момент написания недавний финализированный блок `194727131` дал чистый живой пример для `intents.near`: контракт сначала появился как входящий receipt на shard `8`, а затем действительно выполнился и изменил состояние на shard `7`.

Если для вашей задачи нужен более свежий блок, переиспользуйте ту же сводку из первого примера на нескольких соседних финализированных высотах, а затем подставьте найденную высоту в тот же вызов `block-shard`.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz
TARGET_CONTRACT=intents.near
EXAMPLE_HEIGHT=194727131

curl -s "$NEARDATA_BASE_URL/v0/block/$EXAMPLE_HEIGHT" \
  | tee /tmp/neardata-block-194727131.json \
  | jq --arg contract "$TARGET_CONTRACT" '[
      .shards[] | {
        shard_id,
        incoming_receipts: ([.chunk.receipts[]? | select(.receiver_id == $contract)] | length),
        execution_outcomes: ([.receipt_execution_outcomes[]? | select(.execution_outcome.outcome.executor_id == $contract)] | length),
        state_changes: ([.state_changes[]? | select(.change.account_id? == $contract)] | length)
      }
      | select(.incoming_receipts + .execution_outcomes + .state_changes > 0)
    ]'

curl -s "$NEARDATA_BASE_URL/v0/block/$EXAMPLE_HEIGHT/shard/7" \
  | jq --arg contract "$TARGET_CONTRACT" '{
      shard_id,
      chunk_hash: .chunk.header.chunk_hash,
      matching_state_changes: [
        .state_changes[]
        | select(.change.account_id? == $contract)
        | {type, cause, account_id: .change.account_id}
      ][0:2],
      matching_execution_outcomes: [
        .receipt_execution_outcomes[]
        | select(.execution_outcome.outcome.executor_id == $contract)
        | {
            receipt_id: .execution_outcome.id,
            executor_id: .execution_outcome.outcome.executor_id,
            status: .execution_outcome.outcome.status,
            predecessor_id: .receipt.predecessor_id
          }
      ][0:2]
    }'
```

Практическое правило здесь простое:

- используйте `block`, когда первый вопрос звучит как «какой shard вообще важен?»;
- используйте `block-shard`, когда настоящий вопрос уже стал таким: «покажи мне сам payload shard, который изменил состояние».

## Когда пора расширять поверхность

- Используйте [Transactions API](https://docs.fastnear.com/ru/tx), когда у вас уже есть `tx_hash` и нужен человекочитаемый рассказ о транзакции.
- Используйте [Справочник RPC](https://docs.fastnear.com/ru/rpc), когда следующий вопрос касается точной протокольной семантики receipt или блока.
- Используйте [Block Headers](https://docs.fastnear.com/ru/neardata/block-headers), когда нужна только динамика head/finality, а не проверка contract-touch.
