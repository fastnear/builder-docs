**Источник:** [https://docs.fastnear.com/ru/tx/examples](https://docs.fastnear.com/ru/tx/examples)

## Начните здесь

### У меня один хеш транзакции. Что произошло?

Вставьте хеш в `POST /v0/transactions` — один ответ обычно содержит всю историю.

```bash
TX_BASE_URL=https://tx.main.fastnear.com
TX_HASH=AdgNifPYpoDNS5ckfBZm36Ai6LuL5bTstuKsVdGjKwGp

curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | jq '{
      hash: .transactions[0].transaction.hash,
      signer_id: .transactions[0].transaction.signer_id,
      receiver_id: .transactions[0].transaction.receiver_id,
      included_block_height: .transactions[0].execution_outcome.block_height,
      actions: (.transactions[0].transaction.actions | map(if type == "string" then . else keys[0] end)),
      first_receipt_id: .transactions[0].execution_outcome.outcome.status.SuccessReceiptId,
      receipt_count: (.transactions[0].receipts | length)
    }'
```

Для зафиксированного хеша `mike.near` отправил один `Transfer` на `global-counter.mike.near` в блоке `194263342`, с передачей в receipt `5GhZcpfKWhrpaZo5Am74QfEUFQnZBz48G7hfoLPVDXcq`. Если `receipt_count > 1` или следующий вопрос касается поведения на уровне receipt, переходите к [Какой receipt испустил этот лог или событие?](#какой-receipt-испустил-этот-лог-или-событие) или [`POST /v0/receipt`](https://docs.fastnear.com/ru/tx/receipt).

### Какой receipt испустил этот лог или событие?

Выведите список всех receipt транзакции с логами и флагом, содержат ли их логи ваш фрагмент. Совпадение доказывается, а не угадывается: у зафиксированной транзакции один receipt логирует `Transfer`, другой — `Refund`, и только сторона `Refund` переключается в `true`.

```bash
TX_BASE_URL=https://tx.main.fastnear.com
TX_HASH=2KhhB1uDScGCFQfVchep7DiZTGTxMcgfUYHNzwf5e6uL
LOG_FRAGMENT=Refund

curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | jq --arg fragment "$LOG_FRAGMENT" '
      [
        .transactions[0].receipts[]
        | select((.execution_outcome.outcome.logs | length) > 0)
        | {
            receipt_id: .receipt.receipt_id,
            receiver_id: .receipt.receiver_id,
            method_name: (.receipt.receipt.Action.actions[0]
              | if type == "string" then . else (.FunctionCall.method_name // keys[0]) end),
            matches_fragment: any(.execution_outcome.outcome.logs[]?; contains($fragment)),
            logs: .execution_outcome.outcome.logs
          }
      ]'
```

Фрагмент `Refund` атрибутируется receipt `9sLHQpaGz3NnMNMn8zGrDUSyktR1q6ts2otr9mHkfD1w` на `wrap.near`, метод `ft_resolve_transfer`. Логи receipt живут на receipts, а не на транзакции, поэтому одного прохода достаточно — более глубокая async-трассировка не нужна.

### Превратить один неказистый receipt ID из логов в человекочитаемую историю

`POST /v0/receipt` возвращает запись receipt **и** его полную родительскую транзакцию в одном ответе, поэтому единственного запроса хватает на всю историю — дополнительный `/v0/transactions` не нужен.

```bash
TX_BASE_URL=https://tx.main.fastnear.com
RECEIPT_ID=5GhZcpfKWhrpaZo5Am74QfEUFQnZBz48G7hfoLPVDXcq

curl -s "$TX_BASE_URL/v0/receipt" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg receipt_id "$RECEIPT_ID" '{receipt_id: $receipt_id}')" \
  | jq '{
      receipt: {
        receipt_id: .receipt.receipt_id,
        type: .receipt.receipt_type,
        is_success: .receipt.is_success,
        receipt_block: .receipt.block_height,
        tx_block: .receipt.tx_block_height,
        predecessor_id: .receipt.predecessor_id,
        receiver_id: .receipt.receiver_id,
        transaction_hash: .receipt.transaction_hash
      },
      parent_transaction: {
        signer_id: .transaction.transaction.signer_id,
        receiver_id: .transaction.transaction.receiver_id,
        action_types: (.transaction.transaction.actions | map(if type == "string" then . else keys[0] end))
      }
    }'
```

Для зафиксированного receipt это возвращает `Action`-receipt от `mike.near` к `global-counter.mike.near`, который успешно выполнился в блоке `194263343`, через один блок после попадания родительской транзакции `AdgNifPY…`, — один `Transfer` (5 NEAR, в сыром `.transaction.transaction.actions` видимо как `5000000000000000000000000` yocto). Если интересным якорем становится родительская транзакция, хеш у вас уже есть — переиспользуйте его в [У меня один хеш транзакции. Что произошло?](#у-меня-один-хеш-транзакции-что-произошло).

## Сбои и async

### Доказать, что один провалившийся action откатил весь batch

Один batch отправил `CreateAccount → Transfer → AddKey → FunctionCall`, и финальный вызов попал в отсутствующий метод. Индексированная запись транзакции уже несёт упорядоченный batch *и* точный сбой на уровне receipt, поэтому одного запроса хватает, чтобы ответить «что пытались и что сломалось»; проверка через `view_account` затем доказывает, что предыдущие actions откатились.

```bash
TX_BASE_URL=https://tx.test.fastnear.com
RPC_URL=https://rpc.testnet.fastnear.com
TX_HASH=CrhH3xLzbNwNMGgZkgptXorwh8YmqxRGuA6Mc11MkU6M
NEW_ACCOUNT_ID=rollback-mo4vmkig.temp.mike.testnet

curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | jq '{
      action_types: (.transactions[0].transaction.actions | map(if type == "string" then . else keys[0] end)),
      final_method: .transactions[0].transaction.actions[3].FunctionCall.method_name,
      tx_handoff: .transactions[0].execution_outcome.outcome.status,
      receipt_failure: (
        first(
          .transactions[0].receipts[]
          | select(.execution_outcome.outcome.status.Failure != null)
          | .execution_outcome.outcome.status.Failure.ActionError
        )
      )
    }'
```

Статус на уровне транзакции — `SuccessReceiptId`: транзакция успешно передала свои batched actions в receipt. Сбой лежит слоем ниже на этом receipt: `index: 3` (именно `FunctionCall`), вид `CodeDoesNotExist` на `rollback-mo4vmkig.temp.mike.testnet`. `SuccessReceiptId` в tx-outcome означает «handoff прошёл», а не «всё завершилось» — реальная ловушка, если смотреть только на статус уровня транзакции.

Теперь докажите откат предыдущих actions: спросите аккаунт, который batch *пытался* создать:

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$NEW_ACCOUNT_ID" '{
    jsonrpc: "2.0", id: "fastnear", method: "query",
    params: {request_type: "view_account", account_id: $account_id, finality: "final"}
  }')" \
  | jq '{error: .error.cause.name, requested_account_id: .error.cause.info.requested_account_id}'
```

`UNKNOWN_ACCOUNT` — это и есть доказательство. Если бы `CreateAccount` закрепился, `view_account` вернул бы результат; раз нет — предыдущие `Transfer` и `AddKey` из того же batched-receipt тоже не закрепились.

### Почему этот вызов контракта выглядел успешным, но потом receipt упал?

Одна транзакция может закончиться тем, что внешний handoff рапортует `SuccessReceiptId`, а дочерний receipt при этом тихо падает — это и есть async-модель NEAR, и `/v0/transactions` выдаёт весь timeline за один запрос.

```bash
TX_BASE_URL=https://tx.main.fastnear.com
TX_HASH=2KhhB1uDScGCFQfVchep7DiZTGTxMcgfUYHNzwf5e6uL

curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | jq '{
      tx_handoff: .transactions[0].execution_outcome.outcome.status,
      outer_method: .transactions[0].transaction.actions[0].FunctionCall.method_name,
      descendant_failures: [
        .transactions[0].receipts[]
        | select(.execution_outcome.outcome.status.Failure != null)
        | {
            receiver_id: .receipt.receiver_id,
            method_name: (.receipt.receipt.Action.actions[0].FunctionCall.method_name // "system"),
            block_height: .execution_outcome.block_height,
            failure: .execution_outcome.outcome.status.Failure
          }
      ],
      receipt_timeline: [
        .transactions[0].receipts[]
        | {
            receiver_id: .receipt.receiver_id,
            method_name: (.receipt.receipt.Action.actions[0].FunctionCall.method_name // "system"),
            status_class: (.execution_outcome.outcome.status | keys[0])
          }
      ]
    }'
```

Для зафиксированной транзакции mainnet `tx_handoff` — `SuccessReceiptId`: транзакция чисто запустила свой первый receipt. Если смотреть только сюда, можно назвать это победой. `descendant_failures` рассказывают вторую историю: `ft_on_transfer` на `v2.ref-finance.near` упал с `E51: contract paused` — DEX был на паузе во время этого свопа и не мог принять wrapped NEAR. А `receipt_timeline` показывает, как история разрешилась: callback `ft_resolve_transfer` на `wrap.near` всё равно отработал и вывел лог `Refund`, вернув wrapped NEAR отправителю.

Успех receipt не транзитивен. Протокол может чисто отдать handoff и при этом увидеть, как отцеплённая работа провалится позже. Если ваше приложение «выглядело успешным», но деньги всё равно вернулись, пройдите этот же timeline — разделение видно на индексированном ответе без отдельного RPC status-запроса. Чтобы отдельно проверить, что ваш callback отработал, см. [Отработал ли мой callback?](#отработал-ли-мой-callback).

### Отработал ли мой callback?

Кросс-контрактные вызовы NEAR возвращаются через callback-receipt на исходном контракте. Отработал ли этот callback — это одна строка с `any(...)` против индексированного списка receipts; а полная история refund выпадает из того же ответа.

```bash
TX_BASE_URL=https://tx.main.fastnear.com
TX_HASH=2KhhB1uDScGCFQfVchep7DiZTGTxMcgfUYHNzwf5e6uL
ORIGIN_CONTRACT_ID=wrap.near
CALLBACK_METHOD=ft_resolve_transfer

curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | jq --arg origin "$ORIGIN_CONTRACT_ID" --arg callback "$CALLBACK_METHOD" '{
      top_method: .transactions[0].transaction.actions[0].FunctionCall.method_name,
      callback_ran: any(
        .transactions[0].receipts[];
        .receipt.receiver_id == $origin
        and (.receipt.receipt.Action.actions[0].FunctionCall.method_name // "") == $callback
      ),
      receipt_chain: [
        .transactions[0].receipts[]
        | {
            receiver_id: .receipt.receiver_id,
            method: (.receipt.receipt.Action.actions[0].FunctionCall.method_name // "system"),
            block: .execution_outcome.block_height,
            status: (.execution_outcome.outcome.status | keys[0]),
            logs: .execution_outcome.outcome.logs
          }
      ]
    }'
```

Для зафиксированной транзакции `ft_transfer_call` на `wrap.near` передаёт управление в `ft_on_transfer` на `v2.ref-finance.near`, который **падает**. Callback `ft_resolve_transfer` всё равно выполняется на `wrap.near` и логирует `Refund 7278020378457059679767103 from v2.ref-finance.near to …` обратно отправителю — поэтому `callback_ran: true`, несмотря на сбой дочернего receipt. Сбой ниже по цепочке не мешает исходному контракту увидеть свой callback; так async-обработка ошибок NEAR остаётся восстанавливаемой. Строки с `method: "system"` — это рантайм-возвраты газа, а не логика контракта. Чтобы привязать один из этих логов к породившему его receipt, см. [Какой receipt испустил этот лог или событие?](#какой-receipt-испустил-этот-лог-или-событие).

## Частые ошибки

- Пытаться отправить транзакцию через history-API вместо raw RPC.
- Использовать Transactions API, когда пользователю нужны только текущие балансы или активы.
- Спускаться в raw RPC до того, как индексированная история ответила на читаемый вопрос «что произошло?».

## Связанные страницы

- [Transactions API](https://docs.fastnear.com/ru/tx)
- [RPC Reference](https://docs.fastnear.com/ru/rpc)
- [FastNear API](https://docs.fastnear.com/ru/api)
- [NEAR Data API](https://docs.fastnear.com/ru/neardata)
- [Berry Club: живая доска и один путь исторической реконструкции](https://docs.fastnear.com/ru/tx/examples/berry-club)
- [Расширенный поиск записи SocialDB](https://docs.fastnear.com/ru/tx/socialdb-proofs)
- [Choosing the Right Surface](https://docs.fastnear.com/ru/agents/choosing-surfaces)
- [Agent Playbooks](https://docs.fastnear.com/ru/agents/playbooks)
