**Источник:** [https://docs.fastnear.com/ru/transfers/examples](https://docs.fastnear.com/ru/transfers/examples)

# Примеры Transfers API

Используйте эту страницу, когда вопрос касается именно движения активов и нужен самый короткий путь по документации истории переводов. Эта поверхность специально узкая: начинайте с самого точного фильтра перевода, который отвечает на вопрос, держите фокус на отправках и получениях и расширяйтесь только тогда, когда вопрос перестаёт быть «только про переводы».

## Когда начинать здесь

- Пользователя интересуют входящие или исходящие переводы NEAR или FT.
- Нужна лента кошелька, представление для аудита или ответ для поддержки, сфокусированный на движении активов.
- Аккаунт уже известен, и пока не требуется полная история исполнения.
- Для задачи достаточно mainnet-истории переводов.

## Минимальные входы

- `account_id`
- выбора сети здесь нет: сегодня эта поверхность доступна только для mainnet
- опциональные фильтры по направлению, активу, сумме или времени
- нужен ли только короткий набор событий или длинный обзор истории
- может ли позже понадобиться более широкий контекст транзакций

## Частые задачи

### Найти исходящие переводы одного аккаунта в узком окне времени

**Начните здесь**

- [Запрос переводов](https://docs.fastnear.com/ru/transfers/query) с аккаунтом, исходящим направлением и самым узким полезным фильтром по времени.

**Следующая страница при необходимости**

- Сузьте запрос ещё сильнее по активу или сумме, если ответ всё ещё содержит лишние переводы.

**Остановитесь, когда**

- Уже можно ответить, кто что отправил, когда и в каком активе.

**Расширяйте, когда**

- Пользователь спрашивает, почему перевод произошёл или какие ещё действия были вокруг него. Переходите к [Transactions API](https://docs.fastnear.com/ru/tx).

### Построить ленту переводов с пагинацией через `resume_token`

**Начните здесь**

- [Запрос переводов](https://docs.fastnear.com/ru/transfers/query) для первой страницы недавних событий.

**Следующая страница при необходимости**

- Переиспользуйте ровно тот `resume_token`, который вернул сервис, чтобы получить следующую страницу с теми же фильтрами.

**Остановитесь, когда**

- У вас уже достаточно страниц, чтобы ответить на запрос ленты, поддержки или комплаенса.

**Расширяйте, когда**

- Пользователь просит метаданные транзакции сверх самих переводов.
- Нужны балансы или активы, а не только движение. Переходите к [FastNear API](https://docs.fastnear.com/ru/api).

### Перейти от истории переводов к полному расследованию транзакции

**Начните здесь**

- [Запрос переводов](https://docs.fastnear.com/ru/transfers/query), чтобы выделить конкретные интересующие переводы.

**Следующая страница при необходимости**

- [История аккаунта в Transactions API](https://docs.fastnear.com/ru/tx/account), если нужна окружающая история исполнения для того же аккаунта.
- [Transactions by Hash](https://docs.fastnear.com/ru/tx/transactions), когда уже понятно, какую транзакцию смотреть дальше.

**Остановитесь, когда**

- Уже определено правильное событие перевода и следующий подходящий раздел для расследования.

**Расширяйте, когда**

- Пользователю прямо нужны квитанции или каноническое подтверждение через RPC. Сначала переходите к [Transactions API](https://docs.fastnear.com/ru/tx), затем к [RPC Reference](https://docs.fastnear.com/ru/rpc), если потребуется.

## Готовый сценарий

### Запросить узкое окно переводов, а затем перейти по receipt

Используйте этот сценарий, когда первый вопрос всё ещё касается только переводов, но вы уже понимаете, что потом может понадобиться одна точная точка перехода в контекст исполнения.

**Что вы делаете**

- Запрашиваете ограниченное окно исходящих переводов одного аккаунта в mainnet.
- Извлекаете первый `receipt_id` через `jq`.
- Переиспользуете этот receipt ID в Transactions API, чтобы перейти от движения актива к контексту исполнения.

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

Запрос переводов позволяет держать первый проход узким и удобным для пагинации. Переход по `receipt_id` даёт одну точную опорную точку в исполнении, не заставляя сразу расширяться до полной истории аккаунта. Если после этого всё ещё нужно больше строк, продолжайте пагинацию тем же `resume_token` и теми же фильтрами.

## Частые ошибки

- Использовать Transfers API, когда пользователю на самом деле нужны балансы, активы или сводки аккаунта.
- Считать историю переводов полной историей исполнения.
- Переиспользовать `resume_token` с другими фильтрами.
- Начинать здесь с вопросов про testnet, хотя эта поверхность сегодня работает только в mainnet.

## Полезные связанные страницы

- [Transfers API](https://docs.fastnear.com/ru/transfers)
- [Transactions API](https://docs.fastnear.com/ru/tx)
- [FastNear API](https://docs.fastnear.com/ru/api)
- [Choosing the Right Surface](https://docs.fastnear.com/ru/agents/choosing-surfaces)
- [Agent Playbooks](https://docs.fastnear.com/ru/agents/playbooks)
