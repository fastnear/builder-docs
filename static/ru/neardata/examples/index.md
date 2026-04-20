**Источник:** [https://docs.fastnear.com/ru/neardata/examples](https://docs.fastnear.com/ru/neardata/examples)

## Примеры

Каждый гидратированный документ блока NEAR Data несёт транзакции, receipts, результаты исполнения и state changes с разбивкой по shard. Три сценария ниже используют один `bash`-помощник, который сворачивает эти четыре сигнала в одну сводку с полями для перехода дальше. Определите его один раз и прогоняйте блоки через него:

```bash
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
```

### Был ли мой контракт затронут в последнем финализированном блоке?

`/v0/last_block/final` отдаёт 302-редирект на текущий финализированный блок; пройдите по нему и направьте результат сразу в помощник.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz
TARGET_CONTRACT=intents.near

curl -sL "$NEARDATA_BASE_URL/v0/last_block/final" \
  | contract_touch_summary "$TARGET_CONTRACT"
```

Читайте `touched: false` как полный и однозначный ответ для тихого блока. При `true` поля перехода (`sample_tx_hash`, `sample_receipt_id`) сразу ведут вас в [/tx/examples](https://docs.fastnear.com/ru/tx/examples) за человекочитаемой историей. Один запрос заменяет ручной просмотр chunks — и учтите: `touched: true` с `state_changes: 0` — это реальная форма: receipt может попасть в chunk, не вызвав в том же блоке мутации состояния.

### Увидел ли я активность в optimistic-режиме, и пережила ли она finality?

Optimistic-блоки живут по адресу `/v0/block_opt/{height}`; как только finality догоняет (обычно в пределах одного блока, ~1 с на mainnet), та же высота становится доступна и по `/v0/block/{height}`. Прогоните помощник на обеих и сравните.

```bash
OPT_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/optimistic" \
    | awk 'tolower($1) == "location:" {print $2}' | tr -d '\r'
)"
OPT_HEIGHT="${OPT_LOCATION##*/}"

echo "Optimistic view at $OPT_HEIGHT:"
curl -s "$NEARDATA_BASE_URL$OPT_LOCATION" | contract_touch_summary "$TARGET_CONTRACT"

echo "Finalized view at $OPT_HEIGHT:"
FINAL="$(curl -s "$NEARDATA_BASE_URL/v0/block/$OPT_HEIGHT")"
if [ "$(echo "$FINAL" | jq 'type')" = '"null"' ]; then
  echo "finality has not caught up to $OPT_HEIGHT yet"
else
  echo "$FINAL" | contract_touch_summary "$TARGET_CONTRACT"
fi
```

На здоровой сети обе сводки совпадают сразу; ценность — в самом шаблоне, а не в драматичной разнице. Цикл мониторинга, который реагирует на optimistic-сигнал, знает: тот же ответ — на один блок от надёжного. Ветку `finality has not caught up` используйте, когда действительно нужно отличить «увидено optimistically» от «подтверждено» — во время стресса сети этот разрыв расширяется.

### Какой shard действительно изменил мой контракт в этом блоке?

Блоки тонкие — в большинстве финализированных блоков нет мутаций состояния ни для одного конкретного контракта. Идите назад от финализированной головы, пока помощник не покажет `state_changes > 0`, затем откройте «победивший» shard через `/v0/block/{height}/shard/{shard_id}` ради самого payload мутации.

```bash
HEAD="$(curl -sL "$NEARDATA_BASE_URL/v0/last_block/final" | jq '.block.header.height')"
TARGET_HEIGHT=""
WINNING_SHARD=""

for OFFSET in 0 1 2 3 4 5 6 7 8 9; do
  H=$((HEAD - OFFSET))
  SUMMARY="$(curl -s "$NEARDATA_BASE_URL/v0/block/$H" | contract_touch_summary "$TARGET_CONTRACT")"
  if [ "$(echo "$SUMMARY" | jq '.evidence.state_changes')" -gt 0 ]; then
    TARGET_HEIGHT=$H
    WINNING_SHARD="$(echo "$SUMMARY" | jq -r '.shards[0]')"
    echo "$SUMMARY"
    break
  fi
done

curl -s "$NEARDATA_BASE_URL/v0/block/$TARGET_HEIGHT/shard/$WINNING_SHARD" \
  | jq --arg contract "$TARGET_CONTRACT" '{
      shard_id,
      chunk_hash: .chunk.header.chunk_hash,
      matching_state_changes: [.state_changes[] | select(.change.account_id? == $contract) | {type, cause_type: (.cause | keys[0]), account_id: .change.account_id}][0:3],
      matching_execution_outcomes: [.receipt_execution_outcomes[] | select(.execution_outcome.outcome.executor_id == $contract) | {receipt_id: .execution_outcome.id, status: (.execution_outcome.outcome.status | keys[0]), predecessor_id: .receipt.predecessor_id}][0:3]
    }'
```

На mainnet `intents.near` стабильно выполняется на shard 7, поэтому обход назад обычно попадает в цель за несколько блоков. Payload shard затем называет конкретные типы state-change (`account_update`, `data_update` и т. п.) и результаты исполнения receipt, которые их породили, — shard-локальное доказательство без догадок. Для менее активных контрактов расширьте диапазон `OFFSET`.

## Когда расширить поверхность

- Используйте [Transactions API](https://docs.fastnear.com/ru/tx), когда у вас уже есть `tx_hash` и нужен человекочитаемый рассказ о транзакции.
- Используйте [RPC Reference](https://docs.fastnear.com/ru/rpc), когда следующий вопрос касается точной протокольной семантики receipt или блока.
- Используйте [Block Headers](https://docs.fastnear.com/ru/neardata/block-headers), когда нужна только динамика head/finality, а не проверка contract-touch.
