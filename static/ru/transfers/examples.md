**Источник:** [https://docs.fastnear.com/ru/transfers/examples](https://docs.fastnear.com/ru/transfers/examples)

## Быстрый старт

Начните с одного отфильтрованного входящего запроса и сразу выведите поля, ради которых вообще стоит использовать Transfers API.

```bash
TRANSFERS_BASE_URL=https://transfers.main.fastnear.com
ACCOUNT_ID=intents.near
ASSET_ID=native:near
MIN_AMOUNT_YOCTO=1000000000000000000000000

curl -s "$TRANSFERS_BASE_URL/v0/transfers" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$ACCOUNT_ID" \
    --arg asset_id "$ASSET_ID" \
    --arg min_amount "$MIN_AMOUNT_YOCTO" '{
      account_id: $account_id,
      direction: "receiver",
      asset_id: $asset_id,
      ignore_system: true,
      min_amount: $min_amount,
      desc: true,
      limit: 5
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
            human_amount: (
              if .human_amount == null then null
              else (.human_amount * 1000 | round / 1000)
              end
            ),
            usd_amount: (
              if .usd_amount == null then null
              else (.usd_amount * 100 | round / 100)
              end
            ),
            block_timestamp,
            method_name,
            transfer_type,
            start_of_block_balance,
            end_of_block_balance,
            other_account_id,
            block_height
          }
      ]
    }'
```

Это самый короткий путь к вопросу «какие переводы от 1+ NEAR пришли на этот аккаунт, чего они стоили и какую строку стоит разбирать дальше?» `usd_amount` может быть `null`, если для этой строки нет ценового покрытия.

## Готовый сценарий

### Какие входящие переводы от 1+ NEAR попали на этот аккаунт и какую строку стоит разобрать?

Используйте этот сценарий, когда история звучит так: «сначала мне нужен один узкий поиск переводов, я хочу поля, которые уже похожи на wallet- или analytics-данные, и только после этого решу, нужна ли одной строке более глубокая расшифровка».

    Стратегия
    Сначала используйте Transfers API ради отфильтрованного ответа о движении средств, а расширяйтесь только если одной строке всё ещё нужен chain-контекст.

    01POST /v0/transfers сначала делает всю фильтрацию: входящая сторона, один asset, скрытие system-переводов и порог по минимальной сумме.
    02Сначала выведите отличительные поля строки: human_amount, usd_amount, method_name, transfer_type и running balances.
    03Если нужны ещё строки, переиспользуйте непрозрачный resume_token с точно теми же фильтрами.
    04И только потом выбирайте одну строку и решайте, нужен ли вам её receipt_id как execution-anchor или её transaction_id как якорь для читаемой истории.

**Что вы делаете**

- Запрашиваете отфильтрованное окно входящих переводов для одного активного mainnet-аккаунта.
- Сначала печатаете поля строки, которые Transfers API уже нормализует за вас.
- Переиспользуете тот же `resume_token`, если вам нужна следующая страница.
- Поднимаете либо `receipt_id`, либо `transaction_id` только тогда, когда одной строке всё ещё нужна более глубокая история.

```bash
TRANSFERS_BASE_URL=https://transfers.main.fastnear.com
TX_BASE_URL=https://tx.main.fastnear.com
ACCOUNT_ID=intents.near
ASSET_ID=native:near
MIN_AMOUNT_YOCTO=1000000000000000000000000
TRANSFER_INDEX=0

curl -s "$TRANSFERS_BASE_URL/v0/transfers" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$ACCOUNT_ID" \
    --arg asset_id "$ASSET_ID" \
    --arg min_amount "$MIN_AMOUNT_YOCTO" '{
      account_id: $account_id,
      direction: "receiver",
      asset_id: $asset_id,
      ignore_system: true,
      min_amount: $min_amount,
      desc: true,
      limit: 5
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
        human_amount: (
          if .value.human_amount == null then null
          else (.value.human_amount * 1000 | round / 1000)
          end
        ),
        usd_amount: (
          if .value.usd_amount == null then null
          else (.value.usd_amount * 100 | round / 100)
          end
        ),
        block_timestamp: .value.block_timestamp,
        method_name: .value.method_name,
        transfer_type: .value.transfer_type,
        start_of_block_balance: .value.start_of_block_balance,
        end_of_block_balance: .value.end_of_block_balance,
        other_account_id: .value.other_account_id,
        block_height: .value.block_height
      }
  ]
}' /tmp/transfers-window.json

RESUME_TOKEN="$(
  jq -r '.resume_token // empty' /tmp/transfers-window.json
)"

if [ -n "$RESUME_TOKEN" ]; then
  curl -s "$TRANSFERS_BASE_URL/v0/transfers" \
    -H 'content-type: application/json' \
    --data "$(jq -nc \
      --arg account_id "$ACCOUNT_ID" \
      --arg asset_id "$ASSET_ID" \
      --arg min_amount "$MIN_AMOUNT_YOCTO" \
      --arg resume_token "$RESUME_TOKEN" '{
        account_id: $account_id,
        direction: "receiver",
        asset_id: $asset_id,
        ignore_system: true,
        min_amount: $min_amount,
        desc: true,
        limit: 5,
        resume_token: $resume_token
      }')" \
    | jq '{
        next_page_resume_token: .resume_token,
        next_transfers: [
          .transfers[]
          | {
              transaction_id,
              receipt_id,
              human_amount: (
                if .human_amount == null then null
                else (.human_amount * 1000 | round / 1000)
                end
              ),
              transfer_type,
              other_account_id,
              block_height
            }
        ]
      }'
fi

TRANSACTION_ID="$(
  jq -r --argjson transfer_index "$TRANSFER_INDEX" \
    '.transfers[$transfer_index].transaction_id // empty' \
    /tmp/transfers-window.json
)"

RECEIPT_ID="$(
  jq -r --argjson transfer_index "$TRANSFER_INDEX" \
    '.transfers[$transfer_index].receipt_id // empty' \
    /tmp/transfers-window.json
)"

printf 'Chosen transfer index: %s\n' "$TRANSFER_INDEX"
printf 'Chosen transaction id: %s\n' "$TRANSACTION_ID"
printf 'Chosen receipt id: %s\n' "$RECEIPT_ID"
```

Этим вы отвечаете на первый вопрос: какие отфильтрованные строки совпали, чего они стоили и какую строку перевода стоит разбирать дальше?

#### Необязательное продолжение: execution-anchor или transaction-story?

Используйте `receipt_id`, когда нужен execution-anchor именно для этой строки. Используйте `transaction_id`, когда нужна читаемая история того, что именно подписал signer.

```bash
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

if [ -n "$TRANSACTION_ID" ]; then
  curl -s "$TX_BASE_URL/v0/transactions" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --arg tx_hash "$TRANSACTION_ID" '{tx_hashes: [$tx_hash]}')" \
    | jq '{
        transaction: {
          hash: .transactions[0].transaction.hash,
          signer_id: .transactions[0].transaction.signer_id,
          receiver_id: .transactions[0].transaction.receiver_id,
          included_block_height: .transactions[0].execution_outcome.block_height
        },
        actions: (
          .transactions[0].transaction.actions
          | map(if type == "string" then . else keys[0] end)
        )
      }'
fi
```

**Зачем нужен следующий шаг?**

Именно здесь Transfers API показывает свою ценность. Первый запрос уже отвечает на вопрос о движении средств в терминах, удобных для wallet- и analytics-сценариев: отфильтрованные строки, humanized amount, тип перевода, method-clue и running balances. Если всё ещё нужна следующая страница, переиспользуйте тот же `resume_token` с теми же фильтрами. Если нужен chain-контекст, следуйте по `receipt_id` ради execution-anchor или по `transaction_id` ради читаемой истории транзакции.

## Частые ошибки

- Использовать Transfers API, когда пользователю на самом деле нужны балансы, активы или сводки аккаунта.
- Считать историю переводов полной историей исполнения вместо отфильтрованного movement-view.
- Переиспользовать `resume_token` с другими фильтрами.
- Игнорировать `method_name`, `transfer_type` или running balances, хотя именно из-за них этот API часто удобнее сырой transaction-history.
- Начинать здесь с вопросов про testnet, хотя этот API сегодня работает только в mainnet.

## Полезные связанные страницы

- [Transfers API](https://docs.fastnear.com/ru/transfers)
- [Transactions API](https://docs.fastnear.com/ru/tx)
- [FastNear API](https://docs.fastnear.com/ru/api)
- [Choosing the Right Surface](https://docs.fastnear.com/ru/agents/choosing-surfaces)
- [Agent Playbooks](https://docs.fastnear.com/ru/agents/playbooks)
