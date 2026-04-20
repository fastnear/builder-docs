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

### Когда транзакция выглядит успешной — что на самом деле произошло?

Внешний `execution_outcome.outcome.status` рапортует `SuccessReceiptId`, как только сработал handoff первого receipt, — и ничего не говорит о том, успешны ли дочерние receipts и отработал ли callback на исходном контракте. Один pipeline над `/v0/transactions` отвечает сразу на все три вопроса.

```bash
TX_BASE_URL=https://tx.main.fastnear.com
TX_HASH=2KhhB1uDScGCFQfVchep7DiZTGTxMcgfUYHNzwf5e6uL
ORIGIN_CONTRACT_ID=wrap.near
CALLBACK_METHOD=ft_resolve_transfer

curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | jq --arg origin "$ORIGIN_CONTRACT_ID" --arg callback "$CALLBACK_METHOD" '{
      outer: {
        method: .transactions[0].transaction.actions[0].FunctionCall.method_name,
        tx_handoff: (.transactions[0].execution_outcome.outcome.status | keys[0])
      },
      callback: {
        expected_on: $origin,
        method: $callback,
        ran: any(
          .transactions[0].receipts[];
          .receipt.receiver_id == $origin
          and (.receipt.receipt.Action.actions[0].FunctionCall.method_name // "") == $callback
        )
      },
      descendant_failures: [
        .transactions[0].receipts[]
        | select(.execution_outcome.outcome.status.Failure != null)
        | {
            receiver_id: .receipt.receiver_id,
            method: (.receipt.receipt.Action.actions[0].FunctionCall.method_name // "system"),
            cause: .execution_outcome.outcome.status.Failure
          }
      ]
    }'
```

Для зафиксированной транзакции `outer.method` — `ft_transfer_call`, а `outer.tx_handoff` — `SuccessReceiptId`: транзакция чисто запустила свой первый receipt, и если смотреть только сюда, можно назвать это победой. `descendant_failures` рассказывают вторую историю: `ft_on_transfer` на `v2.ref-finance.near` упал с `E51: contract paused` — DEX был на паузе во время этого свопа и не мог принять wrapped NEAR. `callback.ran: true` — третью: callback `ft_resolve_transfer` на `wrap.near` всё равно отработал. Сбой ниже по цепочке никогда не мешает callback исходного контракта — именно так NEP-141 возвращает отправителю средства, когда получатель их отклонил.

Успех receipt не транзитивен. Протокол может чисто отдать handoff и при этом увидеть, как отцеплённая работа провалится позже; callback исходного контракта отработает в любом случае. Прочитайте эти три поля вместе — и async-история становится читаемой без ручного обхода цепочки receipts. Чтобы вытянуть сам лог `Refund`, переходите к [Какой receipt испустил этот лог или событие?](#какой-receipt-испустил-этот-лог-или-событие).

### Сопоставить запрос OutLayer с его TEE-разрешением

[OutLayer](https://outlayer.fastnear.com) разделяет один логический вызов на две транзакции: пользователь подписывает `request_execution` на `outlayer.near`, worker в Intel TDX запускает нужный WASM off-chain, затем `worker.outlayer.near` присылает результат через `submit_execution_output_and_resolve`. Обе половины несут один и тот же `request_id` — передайте оба tx-хеша в один запрос `/v0/transactions` и извлеките это поле с каждой стороны, чтобы подтвердить пару.

```bash
TX_BASE_URL=https://tx.main.fastnear.com
REQUEST_TX=BZDQAxEdpQ9wUGXmXTa2APwFLDTTqTy5ucrBPsfgZeyz
WORKER_TX=3NYD4Mkn5cwkuVkGP9PPoiJ9PB5Vr7v6r8CwSswtHVA3

curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg a "$REQUEST_TX" --arg b "$WORKER_TX" '{tx_hashes: [$a, $b]}')" \
  | jq '[
      .transactions[]
      | {
          role: (if .transaction.actions[0].FunctionCall.method_name == "request_execution"
                 then "request" else "worker" end),
          hash: .transaction.hash,
          signer: .transaction.signer_id,
          method: .transaction.actions[0].FunctionCall.method_name,
          block: .execution_outcome.block_height,
          request_id: (
            if .transaction.actions[0].FunctionCall.method_name == "request_execution"
            then (.receipts[0].execution_outcome.outcome.logs[] | select(startswith("EVENT_JSON"))
                  | sub("EVENT_JSON:"; "") | fromjson | .data[0].request_data | fromjson | .request_id)
            else (.receipts[0].receipt.receipt.Action.actions[0].FunctionCall.args
                  | @base64d | fromjson | .request_id)
            end
          )
        }
    ]'
```

Обе строки несут `request_id: 1868`, подтверждая пару. Половина-запрос, подписанная `retrorn.near` в блоке `194832281`, лежит в логе `EVENT_JSON:` её receipt (это yield/resume-паттерн NEAR — on-chain-обещание приостанавливается, пока TDX-worker выполняется). Половина-worker приходит через 11 блоков с `submit_execution_output_and_resolve`, подписанной `worker.outlayer.near`, и её `request_id` достаётся прямо из base64-обёрнутых `FunctionCall.args`. Те же два payload несут и более богатый отпечаток — `sender_id`, `project_id`, `code_hash`, `resources_used.instructions`, `resources_used.time_ms`, размер зашифрованного результата в байтах — если нужно проверить, что именно исполнилось; этот минимальный pipeline лишь подтверждает, что половины принадлежат друг другу. `/v0/transactions` отдаёт исторические пары бессрочно, поэтому archival RPC для самой трассировки не нужен даже через недели.

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
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- FastNear предлагает щедрые кредиты и бесплатный пробный период.
- Быстро получите пробный аккаунт на [dashboard.fastnear.com](https://dashboard.fastnear.com).
