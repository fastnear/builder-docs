**Источник:** [https://docs.fastnear.com/ru/fastdata/kv/examples](https://docs.fastnear.com/ru/fastdata/kv/examples)

## Быстрый старт

Если точные FastData-ключи уже известны, читайте их напрямую.

```bash
KV_BASE_URL=https://kv.test.fastnear.com
CURRENT_ACCOUNT_ID=kv.gork-agent.testnet
PREDECESSOR_ID=kv.gork-agent.testnet

curl -s "$KV_BASE_URL/v0/multi" \
  -H 'content-type: application/json' \
  --data '{
    "keys": [
      "kv.gork-agent.testnet/kv.gork-agent.testnet/key",
      "kv.gork-agent.testnet/kv.gork-agent.testnet/value"
    ]
  }' \
  | jq '{
      entries: [
        .entries[]
        | {
            current_account_id,
            predecessor_id,
            block_height,
            key,
            value
          }
      ]
    }'
```

Это самое короткое полезное чтение FastData на странице: один запрос и сразу две точные строки.

## Готовое расследование

### Прочитать одну индексированную настройку и посмотреть её историю

Используйте это расследование, когда контракт и предшественник уже известны, а вопрос звучит так: «какое текущее значение у этой индексированной настройки и менялось ли оно раньше?»

    Стратегия
    Сначала читайте точные строки настройки, расширяйтесь до метаданных предшественника только если нужна provenance-цепочка, и переходите к Transactions API только для финального доказательства.

    01multi или get-latest-key читают точные индексированные строки настройки.
    02get-history-key показывает, менялось ли это индексированное значение позже.
    03Только если важна provenance-цепочка, latest-by-predecessor с метаданными плюс POST /v0/transactions доказывают, какая запись создала эти индексированные строки.

**Цель**

- Прочитать одну стабильную индексированную настройку из минимального публичного testnet-контракта и подтвердить историю точного ключа для одной строки.

| Поверхность | Эндпоинт | Как используем | Зачем используем |
| --- | --- | --- | --- |
| Чтение точной настройки | KV FastData [`multi`](https://docs.fastnear.com/ru/fastdata/kv/multi) | Читаем известные строки `key` и `value` одним запросом | Это самое узкое полезное чтение, когда точные индексированные строки настройки уже известны |
| Чтение точной строки | KV FastData [`get-latest-key`](https://docs.fastnear.com/ru/fastdata/kv/get-latest-key) | Повторно читаем одну точную строку по path-маршруту | Полезно, когда вопрос только про одну строку, а не про всю пару настройки |
| История точного ключа | KV FastData [`get-history-key`](https://docs.fastnear.com/ru/fastdata/kv/get-history-key) | Проверяем историю точной строки `value` | Показывает, менялось ли именно это индексированное значение в нескольких записях |
| Необязательный мост к provenance | KV FastData [`latest-by-predecessor`](https://docs.fastnear.com/ru/fastdata/kv/latest-by-predecessor) | Восстанавливаем `tx_hash` и `receipt_id` для индексированных строк только если provenance действительно важна | Это необязательный мост от индексированных строк обратно к одной записи |
| Необязательная гидратация транзакции | Transactions API [`POST /v0/transactions`](https://docs.fastnear.com/ru/tx/transactions) | Гидратируем найденный `tx_hash` и декодируем исходные args только когда нужно это доказательство | Финальное необязательное доказательство того, что обе строки создал один вызов |

**Что должен включать полезный ответ**

- какие именно `current_account_id`, `predecessor_id` и индексированные строки настройки исследовались
- как выглядят последние индексированные строки и история точного ключа для одной из них
- какой `tx_hash` или `receipt_id` создал эти строки, только если важна provenance-цепочка
- остаётся ли вопрос про индексированные строки FastData или уже перешёл к каноническому состоянию контракта

### Проверенный read-only testnet shell-сценарий

Используйте этот сценарий, когда нужен полностью read-only пример на стабильных sample-данных в `kv.gork-agent.testnet`.

Этот минимальный контракт ведёт себя как крошечное хранилище настроек: одна запись эмитирует две индексированные строки, `key` и `value`. Сейчас sample-настройка выглядит как `test=hello`, и этого достаточно, чтобы показать shape FastData без притворства, будто перед нами более богатый прикладной объект.
Этот sample-контракт индексирует собственные записи, поэтому в этом walkthrough `CURRENT_ACCOUNT_ID` и `PREDECESSOR_ID` намеренно совпадают.

**Что вы делаете**

- Читаете точные индексированные строки настройки вместе.
- Повторно читаете те же строки по отдельности, чтобы был понятен shape exact-key маршрута.
- Забираете историю точного ключа для строки `value` этой настройки.
- Останавливаетесь на этом, если provenance дальше не нужна.

```bash
KV_BASE_URL=https://kv.test.fastnear.com
TX_BASE_URL=https://tx.test.fastnear.com
CURRENT_ACCOUNT_ID=kv.gork-agent.testnet
PREDECESSOR_ID=kv.gork-agent.testnet

curl -s "$KV_BASE_URL/v0/multi" \
  -H 'content-type: application/json' \
  --data '{
    "keys": [
      "kv.gork-agent.testnet/kv.gork-agent.testnet/key",
      "kv.gork-agent.testnet/kv.gork-agent.testnet/value"
    ]
  }' \
  | jq '{
      entries: [
        .entries[]
        | {
            current_account_id,
            predecessor_id,
            block_height,
            key,
            value
          }
      ]
    }'

curl -s "$KV_BASE_URL/v0/latest/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/key" \
  | jq '{
      latest_key_row: (
        .entries[0]
        | {
            block_height,
            key,
            value
          }
      )
    }'

curl -s "$KV_BASE_URL/v0/latest/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/value" \
  | jq '{
      latest_value_row: (
        .entries[0]
        | {
            block_height,
            key,
            value
          }
      )
    }'

curl -s "$KV_BASE_URL/v0/history/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/value" \
  | jq '{
      page_token,
      entries: [
        .entries[]
        | {
            block_height,
            key,
            value
          }
      ]
    }'
```

На этом основной read-path заканчивается: точные строки, их exact latest-чтение и история точного ключа для той же индексированной настройки.

### Необязательное расширение до provenance

Переходите сюда только тогда, когда следующий вопрос уже звучит как «какая запись создала эти строки?»

```bash

curl -s "$KV_BASE_URL/v0/latest/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID" \
  -H 'content-type: application/json' \
  --data '{"include_metadata": true, "limit": 10}' \
  | tee /tmp/kv-predecessor-latest.json >/dev/null

jq '{
  entries: [
    .entries[]
    | {
        block_height,
        key,
        value,
        tx_hash,
        receipt_id
      }
  ]
}' /tmp/kv-predecessor-latest.json

INDEXED_TX_HASH="$(
  jq -r '
    first(.entries[] | select(.key == "value") | .tx_hash)
  ' /tmp/kv-predecessor-latest.json
)"

curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$INDEXED_TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | jq '{
      transaction_hash: .transactions[0].transaction.hash,
      signer_id: .transactions[0].transaction.signer_id,
      receiver_id: .transactions[0].transaction.receiver_id,
      method_name: .transactions[0].transaction.actions[0].FunctionCall.method_name,
      args: (
        .transactions[0].transaction.actions[0].FunctionCall.args
        | @base64d
        | fromjson
      ),
      receipt_ids: .transactions[0].execution_outcome.outcome.receipt_ids
    }'
```

**Зачем нужен следующий шаг?**

Этот sample-контракт эмитирует две индексированные строки из одной записи: `key=test` и `value=hello`. Рассматривайте их как одну индексированную настройку. Exact-key маршруты напрямую доказывают эти строки. Lookup по предшественнику с метаданными — это необязательный мост к provenance, потому что именно он возвращает `tx_hash` и `receipt_id`, которые создали эти строки. Гидратация транзакции доказывает, что эти индексированные строки произошли из одного вызова `__fastdata_kv` с декодированными args `{ "key": "test", "value": "hello" }`.

Именно здесь проходит важная граница этой поверхности: KV FastData отвечает на вопросы про индексированные строки FastData. Если вопрос меняется на каноническое состояние контракта, переходите к собственному read-методу контракта или к [View State](https://docs.fastnear.com/ru/rpc/contract/view-state) только тогда, когда вы независимо знаете нужную layout-структуру хранилища.

## Частые ошибки

- Начинать с широких выборок по предшественнику, когда точные строки FastData уже известны.
- Считать [History by Key](https://docs.fastnear.com/ru/fastdata/kv/history-by-key) тем же самым, что и [GET History by Exact Key](https://docs.fastnear.com/ru/fastdata/kv/get-history-key). Первый маршрут глобальный по строке ключа, второй остаётся внутри одного контракта и predecessor.
- Использовать KV FastData, когда настоящий вопрос про балансы, holdings или account summaries.
- Путать индексированные строки FastData с каноническим on-chain-состоянием контракта.
- Предполагать, что для каждого FastData-расследования сначала обязательно нужна новая запись.

## Полезные связанные страницы

- [KV FastData API](https://docs.fastnear.com/ru/fastdata/kv)
- [Transactions API](https://docs.fastnear.com/ru/tx)
- [RPC Reference](https://docs.fastnear.com/ru/rpc)
- [Choosing the Right Surface](https://docs.fastnear.com/ru/agents/choosing-surfaces)
- [Agent Playbooks](https://docs.fastnear.com/ru/agents/playbooks)
