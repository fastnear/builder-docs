**Источник:** [https://docs.fastnear.com/ru/tx/examples/outlayer](https://docs.fastnear.com/ru/tx/examples/outlayer)

{/* FASTNEAR_AI_DISCOVERY: Этот пример остаётся в пределах наблюдаемых транзакций и receipts. Он показывает, как связать один caller-side запрос OutLayer с более поздним worker-side разрешением и разобрать finish-receipts. Он не пытается доказывать внутреннюю TEE-, yield/resume- или CKD/MPC-архитектуру OutLayer только по публичным chain-данным. */}

# OutLayer: трассировка запроса и разрешения воркером

Используйте этот сценарий, когда вопрос звучит так: «какая транзакция открыла запрос OutLayer, какая более поздняя транзакция пришла от воркера и где в завершающих receipts видны callback, списание или возврат средств?»

Сначала смотрите на это как на задачу по истории транзакций:

- один caller-side `request_execution`
- одна более поздняя worker-side транзакция `submit_execution_output_and_resolve` или `resolve_execution`
- переход к receipts только тогда, когда уже важен путь завершения

    Стратегия
    Сначала найдите два хеша, затем раскройте их, а к worker-receipts переходите только тогда, когда нужен finish-путь.

    01POST /v0/account по outlayer.* — самый быстрый surface для поиска хешей.
    02POST /v0/transactions превращает caller-хеш и worker-хеш в читаемые signer, method и log-доказательства.
    03Разбирайте receipts worker-транзакции только тогда, когда реальный вопрос уже касается callback, списания или возврата средств.

**Цель**

- Восстановить одну caller-side транзакцию, одну worker-side транзакцию и завершающие receipts, которые относятся к одному и тому же запросу OutLayer.

| Поверхность | Эндпоинт | Как используем | Зачем используем |
| --- | --- | --- | --- |
| Поиск хешей | Transactions API [`POST /v0/account`](https://docs.fastnear.com/ru/tx/account) | Забираем недавние хеши транзакций для `outlayer.near` | Даёт самый быстрый локальный по контракту surface, когда пара хешей ещё не известна |
| Раскрытие транзакций | Transactions API [`POST /v0/transactions`](https://docs.fastnear.com/ru/tx/transactions) | Раскрываем caller-side и worker-side хеши вместе | Превращает сырые хеши в signer-, receiver-, action- и log-доказательства |
| Разбор finish-пути | Transactions API [`POST /v0/transactions`](https://docs.fastnear.com/ru/tx/transactions) | Переиспользуем worker-хеш и читаем список его receipts | Показывает, где материализовались callback, списание и возврат средств |
| Необязательная проверка идентичности | RPC [`view_account`](https://docs.fastnear.com/ru/rpc/account/view-account) | Идём в RPC только если следующий вопрос уже про идентичность контракта, а не про историю транзакций | Держит проверку текущего состояния отдельно от трассировки истории |

## Проверенный shell-сценарий

Эта пара работала 18 апреля 2026 года:

- caller-side запрос: `AJgn2DB7BaD3487wXii8rGM648eqvkFDqJ1zXCxfuRk4`
- worker-side разрешение: `AVbxfPyN5P1ryFh7HPstWbjiSantPYWfMpiwKcJ7hXTs`

### 1. Сразу раскройте caller-транзакцию и worker-транзакцию вместе

```bash
TX_BASE_URL=https://tx.main.fastnear.com
REQUEST_TX_HASH=AJgn2DB7BaD3487wXii8rGM648eqvkFDqJ1zXCxfuRk4
WORKER_TX_HASH=AVbxfPyN5P1ryFh7HPstWbjiSantPYWfMpiwKcJ7hXTs

curl -sS "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg request_tx_hash "$REQUEST_TX_HASH" --arg worker_tx_hash "$WORKER_TX_HASH" '{
    tx_hashes: [$request_tx_hash, $worker_tx_hash]
  }')" \
  | tee /tmp/outlayer-pair.json >/dev/null

jq '{
  transactions: [
    .transactions[]
    | {
        hash: .transaction.hash,
        signer_id: .transaction.signer_id,
        receiver_id: .transaction.receiver_id,
        actions: [.transaction.actions[] | keys[0]],
        first_logs: (.receipts[0].execution_outcome.outcome.logs[:2])
      }
  ]
}' /tmp/outlayer-pair.json
```

Что это доказывает:

- запросная транзакция шла от `solarflux.near` к `outlayer.near`
- в логах запроса фигурировал проект `zavodil.near/near-email`
- worker-транзакция позже пришла от `worker.outlayer.near` к `outlayer.near`
- в логах воркера были `Stored pending output` и `Resolving execution ...`

Это и есть главный наблюдаемый цикл в терминах NEAR: сначала caller-side запрос, затем более позднее worker-side разрешение.

### 2. Читайте worker-receipts только тогда, когда уже важен finish-путь

```bash
jq --arg worker_tx_hash "$WORKER_TX_HASH" '
  .transactions[]
  | select(.transaction.hash == $worker_tx_hash)
  | {
      worker_tx_hash: .transaction.hash,
      receipts: [
        .receipts[]
        | {
            receipt_id: .receipt.receipt_id,
            predecessor_id: .receipt.predecessor_id,
            receiver_id: .receipt.receiver_id,
            actions: [.receipt.receipt.Action.actions[] | keys[0]],
            logs: .execution_outcome.outcome.logs
          }
      ]
    }
' /tmp/outlayer-pair.json
```

На что смотреть:

- `FunctionCall`-receipts, которые продолжают finish-путь
- логи списания вроде `[[yNEAR charged: "..."]]`
- последующие `Transfer`-receipts, которые похожи на refund или settlement-движение

Именно здесь receipts становятся правильной абстракцией. Не начинайте с них, если вопрос пока ещё звучит как «какие две транзакции относятся к одному запросу OutLayer?»

### 3. Если двух хешей у вас ещё нет, сначала найдите их

```bash
curl -sS "$TX_BASE_URL/v0/account" \
  -H 'content-type: application/json' \
  --data '{"account_id":"outlayer.near","desc":true,"limit":10}' \
  | jq '{
      txs_count,
      recent_hashes: [.account_txs[:10][] | .transaction_hash]
    }'
```

Используйте это только как surface для поиска хешей. В этом примере `/v0/account` даёт кандидатов, а `/v0/transactions` — это уже surface, который превращает их в читаемое доказательство.

## Граница сценария

Этот сценарий намеренно остаётся в рамках публичных chain-данных, которые FastNear и RPC умеют показывать напрямую:

- caller-side транзакция запроса
- более поздняя worker-side транзакция разрешения
- finish-receipts и логи

Он **не** пытается доказывать внутреннюю TEE-модель OutLayer, использование same-account `yield/resume` или путь доверия через CKD/MPC только по публичной трассе транзакций. Это отдельные архитектурные вопросы, и читать их нужно в документации OutLayer, а не считать доказанными этим trace-сценарием.

## Полезные связанные страницы

- [Transactions API: история аккаунта](https://docs.fastnear.com/ru/tx/account)
- [Transactions API: транзакции по хешу](https://docs.fastnear.com/ru/tx/transactions)
- [Transactions API: receipt по ID](https://docs.fastnear.com/ru/tx/receipt)
- [RPC: view_account](https://docs.fastnear.com/ru/rpc/account/view-account)
- [NEAR Integration в OutLayer](https://outlayer.fastnear.com/docs/near-integration)
- [Secrets / CKD в OutLayer](https://outlayer.fastnear.com/docs/secrets)
