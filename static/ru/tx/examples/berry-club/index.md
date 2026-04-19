**Источник:** [https://docs.fastnear.com/ru/tx/examples/berry-club](https://docs.fastnear.com/ru/tx/examples/berry-club)

{/* FASTNEAR_AI_DISCOVERY: Этот walkthrough показывает краткий и полезный путь для Berry Club: сначала прочитайте живую доску через RPC get_lines, а Transactions API используйте только тогда, когда нужно восстановить одну более раннюю эпоху по draw-вызовам. */}

# Berry Club: как читать живую доску и разбирать одну эпоху

Используйте этот walkthrough, когда живую доску читать легко, но нужен один понятный путь к исторической реконструкции.

Начните с живой доски. Если этого уже достаточно для ответа, на этом можно остановиться.

Переходите к Transactions API только тогда, когда вопрос становится историческим: «как Berry Club выглядел в одной более ранней эпохе и какие `draw`-вызовы сделали доску именно такой?»

Карточка живой доски: запрашивает `berryclub.ek.near` `get_lines` через mainnet RPC и рендерит текущую сетку 50x50 в интерфейсе документации.

## 1. Прочитайте живую доску

Это самый короткий полезный запрос:

```bash
ARGS_BASE64="$(jq -nc '{lines: [range(0;50)]}' | base64 | tr -d '\n')"

curl -sS https://rpc.mainnet.fastnear.com \
  -H 'content-type: application/json' \
  --data "{
    \"jsonrpc\": \"2.0\",
    \"id\": \"berry-live-board\",
    \"method\": \"query\",
    \"params\": {
      \"request_type\": \"call_function\",
      \"finality\": \"final\",
      \"account_id\": \"berryclub.ek.near\",
      \"method_name\": \"get_lines\",
      \"args_base64\": \"$ARGS_BASE64\"
    }
  }" | jq '.result | {block_height, line_count: (.result | implode | fromjson | length)}'
```

Этот запрос отдаёт текущую доску 50x50 прямо из контракта. Дальше нужно только декодировать каждую base64-строку в 50 цветов пикселей.

## 2. Восстановите одну более раннюю эпоху

Когда нужна история, держите путь коротким:

1. ограничьте одну эпоху
2. получите кандидатные `draw`-транзакции для `berryclub.ek.near`
3. раскройте эти хеши
4. проиграйте массивы `pixels` от старых к новым

В этом примере используется узкое окно вокруг блока `97601515`:

```bash
curl -sS https://tx.main.fastnear.com/v0/account \
  -H 'content-type: application/json' \
  --data '{
    "account_id": "berryclub.ek.near",
    "is_function_call": true,
    "is_receiver": true,
    "is_real_receiver": true,
    "from_tx_block_height": 97576515,
    "to_tx_block_height": 97601516,
    "desc": false,
    "limit": 200
  }' | jq '.account_txs | map({transaction_hash, tx_block_height}) | .[-5:]'
```

Если окно ещё нужно подобрать, сначала можно использовать [`/v0/blocks`](https://docs.fastnear.com/ru/tx/blocks). Это не часть основного Berry Club-сценария.

Раскройте кандидатные хеши и оставьте только верхнеуровневые вызовы `draw`:

```bash
curl -sS https://tx.main.fastnear.com/v0/transactions \
  -H 'content-type: application/json' \
  --data '{
    "tx_hashes": [
      "Hq5qwsuiM2emJrqczWM9awCa7o6sTBYqYpcifUX2SUhQ",
      "8tBip5M2TrozhSyepAA3tYXpyKooi5t7b9c64wXjFvfL"
    ]
  }' | jq '.transactions[]
    | select(.transaction.receiver_id == "berryclub.ek.near")
    | .transaction.actions[]?.FunctionCall
    | select(.method_name == "draw")
    | {method_name, args: (.args | @base64d | fromjson)}'
```

Затем проиграйте массивы `pixels` от старых к новым:

```javascript
const board = Array.from({ length: 50 }, () => Array(50).fill(0));

for (const drawTx of drawTransactionsOldestFirst) {
  for (const pixel of drawTx.args.pixels) {
    if (pixel.x < 0 || pixel.x >= 50 || pixel.y < 0 || pixel.y >= 50) {
      continue;
    }

    board[pixel.y][pixel.x] = pixel.color;
  }
}
```

В этом и состоит исторический паттерн. У Berry Club нет готового эндпоинта «доска на блоке N», поэтому старые эпохи восстанавливаются проигрыванием `draw`-записей.

## Связанные руководства

- [RPC: call_function](https://docs.fastnear.com/ru/rpc/contract/call-function)
- [Transactions API: история аккаунта](https://docs.fastnear.com/ru/tx/account)
- [Transactions API: транзакции по хешу](https://docs.fastnear.com/ru/tx/transactions)
