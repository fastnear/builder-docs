**Источник:** [https://docs.fastnear.com/ru/transfers/examples](https://docs.fastnear.com/ru/transfers/examples)

## Готовый сценарий

### Найти один подозрительный перевод, а затем пройти по его receipt

Используйте этот сценарий, когда история звучит так: «я вижу, что средства двигались, но хочу получить точную опорную точку исполнения для этого движения, не затягивая сразу всю историю аккаунта».

    Стратегия
    Сначала оставайтесь на узкой истории движения, а затем один раз переключайтесь в историю исполнения.

    01POST /v0/transfers даёт узкое исходящее окно и конкретное движение, которое стоит догонять.
    02jq поднимает один receipt_id, не затягивая остальную историю аккаунта.
    03POST /v0/receipt превращает это движение в опорную точку исполнения, которую уже можно продолжать в /tx.

**Что вы делаете**

- Запрашиваете ограниченное окно исходящих переводов одного аккаунта в mainnet.
- Выделяете один перевод, который действительно похож на нужное вам движение.
- Переиспользуете его `receipt_id` в Transactions API, чтобы перейти от движения актива к истории исполнения.

```bash
TRANSFERS_BASE_URL=https://transfers.main.fastnear.com
TX_BASE_URL=https://tx.main.fastnear.com
ACCOUNT_ID=YOUR_ACCOUNT_ID
FROM_TIMESTAMP_MS=1711929600000
TO_TIMESTAMP_MS=1712016000000

RECEIPT_ID="$(
  curl -s "$TRANSFERS_BASE_URL/v0/transfers" \
    -H 'content-type: application/json' \
    --data "$(jq -nc \
      --arg account_id "$ACCOUNT_ID" \
      --argjson from_timestamp_ms "$FROM_TIMESTAMP_MS" \
      --argjson to_timestamp_ms "$TO_TIMESTAMP_MS" '{
        account_id: $account_id,
        direction: "sender",
        from_timestamp_ms: $from_timestamp_ms,
        to_timestamp_ms: $to_timestamp_ms,
        desc: true,
        limit: 10
      }')" \
    | tee /tmp/transfers-window.json \
    | jq -r '.transfers[0].receipt_id'
)"

jq '{
  resume_token,
  transfers: [
    .transfers[]
    | {
        transaction_id,
        receipt_id,
        asset_id,
        amount,
        other_account_id,
        block_height
      }
  ]
}' /tmp/transfers-window.json

curl -s "$TX_BASE_URL/v0/receipt" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg receipt_id "$RECEIPT_ID" '{receipt_id: $receipt_id}')" \
  | jq '{
      receipt_id: .receipt.receipt_id,
      transaction_hash: .receipt.transaction_hash,
      receiver_id: .receipt.receiver_id,
      tx_block_height: .receipt.tx_block_height
    }'
```

**Зачем нужен следующий шаг?**

Запрос переводов быстро отвечает на первый вопрос: отправлял ли этот аккаунт средства в этом окне и кому именно? Переход по `receipt_id` даёт точную опорную точку в исполнении, не затягивая вас сразу в полную историю аккаунта. Если после этого всё ещё нужно больше строк, продолжайте пагинацию тем же `resume_token` и теми же фильтрами.

## Частые задачи

### Найти исходящие переводы одного аккаунта в узком окне времени

**Начните здесь**

- [Запрос переводов](https://docs.fastnear.com/ru/transfers/query) с аккаунтом, исходящим направлением и самым узким полезным фильтром по времени.

**Следующая страница при необходимости**

- Сузьте запрос ещё сильнее по активу или сумме, если ответ всё ещё содержит лишние переводы.

**Остановитесь, когда**

- Уже можно ответить, кто что отправил, когда и в каком активе.

**Переходите дальше, когда**

- Пользователь спрашивает, почему перевод произошёл или какие ещё действия были вокруг него. Переходите к [Transactions API](https://docs.fastnear.com/ru/tx).

### Листать ленту переводов дальше и не потерять своё место

**Начните здесь**

- [Запрос переводов](https://docs.fastnear.com/ru/transfers/query) для первой страницы недавних событий, используя как можно более узкие и стабильные фильтры.

**Следующая страница при необходимости**

- Переиспользуйте ровно тот `resume_token`, который вернул сервис, чтобы получить следующую страницу с теми же фильтрами.
- Не меняйте фильтры во время пагинации, иначе это уже будет не та же самая лента.

**Остановитесь, когда**

- У вас уже достаточно страниц, чтобы ответить на запрос ленты, поддержки или комплаенса.

**Переходите дальше, когда**

- Пользователь просит метаданные транзакции сверх самих переводов.
- Нужны балансы или активы, а не только движение. Переходите к [FastNear API](https://docs.fastnear.com/ru/api).

### Перейти от истории переводов к полному расследованию транзакции

**Начните здесь**

- [Запрос переводов](https://docs.fastnear.com/ru/transfers/query), чтобы выделить конкретные интересующие переводы.

**Следующая страница при необходимости**

- [История аккаунта в Transactions API](https://docs.fastnear.com/ru/tx/account), если нужна окружающая история исполнения для того же аккаунта.
- [Transactions by Hash](https://docs.fastnear.com/ru/tx/transactions), когда уже понятно, какую транзакцию смотреть дальше.

**Остановитесь, когда**

- Уже определено правильное событие перевода и понятно, какой API открывать следующим.

**Переходите дальше, когда**

- Пользователю прямо нужны receipt-детали или точное подтверждение через RPC. Сначала переходите к [Transactions API](https://docs.fastnear.com/ru/tx), затем к [RPC Reference](https://docs.fastnear.com/ru/rpc), если потребуется.

## Частые ошибки

- Использовать Transfers API, когда пользователю на самом деле нужны балансы, активы или сводки аккаунта.
- Считать историю переводов полной историей исполнения.
- Переиспользовать `resume_token` с другими фильтрами.
- Начинать здесь с вопросов про testnet, хотя этот API сегодня работает только в mainnet.

## Полезные связанные страницы

- [Transfers API](https://docs.fastnear.com/ru/transfers)
- [Transactions API](https://docs.fastnear.com/ru/tx)
- [FastNear API](https://docs.fastnear.com/ru/api)
- [Choosing the Right Surface](https://docs.fastnear.com/ru/agents/choosing-surfaces)
- [Agent Playbooks](https://docs.fastnear.com/ru/agents/playbooks)
