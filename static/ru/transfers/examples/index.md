**Источник:** [https://docs.fastnear.com/ru/transfers/examples](https://docs.fastnear.com/ru/transfers/examples)

## Быстрый старт

Начните с узкого окна исходящих переводов и сначала выведите строки, а уже потом переходите к receipts.

```bash
TRANSFERS_BASE_URL=https://transfers.main.fastnear.com
ACCOUNT_ID=YOUR_ACCOUNT_ID
FROM_TIMESTAMP_MS=1711929600000
TO_TIMESTAMP_MS=1712016000000

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
  | jq '{
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
    }'
```

Это самый короткий путь к вопросу «были ли здесь движения средств и какой receipt брать следующим?»

## Готовый сценарий

### Найти один исходящий перевод и при необходимости перейти к деталям исполнения

Используйте этот сценарий, когда история звучит так: «я знаю, что этот аккаунт отправлял средства в этом окне, и мне может понадобиться точная опорная точка исполнения для одной строки, но я не хочу сразу тянуть всю историю аккаунта».

    Стратегия
    Сначала оставайтесь на узкой истории движения, а затем переходите в историю исполнения только если строки перевода уже недостаточно.

    01POST /v0/transfers даёт узкое исходящее окно и конкретное движение, которое стоит догонять.
    02Сначала выведите строки, а затем явно выберите один transfer_index перед тем, как поднимать его receipt_id.
    03POST /v0/receipt — это необязательное расширение, когда уже нужны детали исполнения именно за этим переводом.

**Что вы делаете**

- Запрашиваете ограниченное окно исходящих переводов одного аккаунта в mainnet.
- Выделяете одну строку перевода, которая действительно похожа на нужное вам движение.
- Переиспользуете его `receipt_id` в Transactions API только если нужно перейти от движения актива к истории исполнения.

```bash
TRANSFERS_BASE_URL=https://transfers.main.fastnear.com
TX_BASE_URL=https://tx.main.fastnear.com
ACCOUNT_ID=YOUR_ACCOUNT_ID
FROM_TIMESTAMP_MS=1711929600000
TO_TIMESTAMP_MS=1712016000000
TRANSFER_INDEX=0

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
  | tee /tmp/transfers-window.json >/dev/null

jq '{
  resume_token,
  transfers: [
    .transfers
    | to_entries[]
    | {
        transfer_index: .key,
        transaction_id: .value.transaction_id,
        receipt_id: .value.receipt_id,
        asset_id: .value.asset_id,
        amount: .value.amount,
        other_account_id: .value.other_account_id,
        block_height: .value.block_height
      }
  ]
}' /tmp/transfers-window.json

RECEIPT_ID="$(
  jq -r --argjson transfer_index "$TRANSFER_INDEX" \
    '.transfers[$transfer_index].receipt_id // empty' \
    /tmp/transfers-window.json
)"

printf 'Chosen transfer index: %s\n' "$TRANSFER_INDEX"
printf 'Chosen receipt id: %s\n' "$RECEIPT_ID"

if [ -n "$RECEIPT_ID" ]; then
  curl -s "$TX_BASE_URL/v0/receipt" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --arg receipt_id "$RECEIPT_ID" '{receipt_id: $receipt_id}')" \
    | jq '{
        receipt_id: .receipt.receipt_id,
        transaction_hash: .receipt.transaction_hash,
        receiver_id: .receipt.receiver_id,
        tx_block_height: .receipt.tx_block_height
      }'
fi
```

**Зачем нужен следующий шаг?**

Запрос переводов быстро отвечает на первый вопрос: отправлял ли этот аккаунт средства в этом окне и кому именно? Переход по `receipt_id` — это необязательный следующий шаг, когда самой строки перевода уже недостаточно и нужна опорная точка в истории исполнения. Если после этого всё ещё нужно больше строк, продолжайте пагинацию тем же `resume_token` и теми же фильтрами.

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
