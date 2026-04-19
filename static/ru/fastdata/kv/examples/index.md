**Источник:** [https://docs.fastnear.com/ru/fastdata/kv/examples](https://docs.fastnear.com/ru/fastdata/kv/examples)

## Готовое расследование

### Сделать одну testnet-запись FastData и проверить точные индексированные ключи

Используйте это расследование, когда нужно доказать, какие именно строки FastData породила одна запись, подтвердить точную историю одного из этих ключей, а затем привязать индексированную строку к исходной транзакции.

    Стратегия
    Сделайте одну управляемую запись FastData, проверьте точные строки ключей, которые она эмитировала, а затем гидратируйте транзакцию, которая их породила.

    01near call __fastdata_kv создаёт одну управляемую запись на testnet от вашего собственного аккаунта-предшественника.
    02get-latest-key и get-history-key проверяют точные строки FastData, которые породил этот вызов.
    03latest-by-predecessor с метаданными плюс POST /v0/transactions привязывают эти индексированные строки к исходному вызову.

**Цель**

- Доказать, какие именно строки FastData породила запись, и показать, как проследить эти строки обратно до создавшей их транзакции.

| Поверхность | Эндпоинт | Как используем | Зачем используем |
| --- | --- | --- | --- |
| Управляемая запись | CLI `near` | Отправляем один testnet-вызов `__fastdata_kv` с уникальным значением | Даёт запись, которую можно сразу проверить, не полагаясь на чужие старые данные |
| Точная индексированная строка | KV FastData [`get-latest-key`](https://docs.fastnear.com/ru/fastdata/kv/get-latest-key) | Читаем точную строку `value`, а затем точную строку `key`, внутри одного предшественника и контракта | Доказывает точные строки FastData, которые сейчас индексированы для этой записи |
| История точного ключа | KV FastData [`get-history-key`](https://docs.fastnear.com/ru/fastdata/kv/get-history-key) | Забираем историю того же точного ключа `value` | Показывает, менялась ли эта точная строка снова после записи |
| Более широкий паттерн + метаданные | KV FastData [`latest-by-predecessor`](https://docs.fastnear.com/ru/fastdata/kv/latest-by-predecessor) | Список последних строк для того же предшественника с `include_metadata: true` | Возвращает обе эмитированные строки вместе с `tx_hash` и `receipt_id`, которые их породили |
| Гидратация транзакции | Transactions API [`POST /v0/transactions`](https://docs.fastnear.com/ru/tx/transactions) | Гидратируем найденный `tx_hash` и декодируем payload из `FunctionCall.args` | Доказывает, какой именно вызов создал индексированные строки FastData |

**Что должен включать полезный ответ**

- какие именно `current_account_id`, `predecessor_id` и `key` были исследованы
- как выглядит последняя индексированная строка и история этого же точного ключа
- какой `tx_hash` или `receipt_id` породил строку, если важна provenance-цепочка
- остаётся ли вопрос про строки FastData или уже перешёл к контрактно-специфичному состоянию в цепочке

### Проверенный testnet shell-сценарий

Используйте этот сценарий, когда у вас уже настроен testnet-аккаунт в `near` CLI и нужен один воспроизводимый сценарий записи, который можно проверить от начала до конца.

**Что вы делаете**

- Пишете одну свежую запись FastData в `kv.gork-agent.testnet`.
- Ждёте, пока KV FastData проиндексирует эту транзакцию.
- Читаете точную строку `value` и точную строку `key`, которые эмитировал контракт.
- Забираете историю точного ключа `value`.
- Расширяетесь до области предшественника с метаданными, чтобы получить индексированный `tx_hash`.
- Гидратируете эту транзакцию и декодируете исходные аргументы вызова `__fastdata_kv`.

```bash
KV_BASE_URL=https://kv.test.fastnear.com
TX_BASE_URL=https://tx.test.fastnear.com
CURRENT_ACCOUNT_ID=kv.gork-agent.testnet
SIGNER_ID=YOUR_TESTNET_ACCOUNT
PREDECESSOR_ID="$SIGNER_ID"
FASTDATA_FIELD=verification
FASTDATA_VALUE="verify-$(date -u +%Y%m%dT%H%M%SZ)"

near call "$CURRENT_ACCOUNT_ID" __fastdata_kv \
  "$(jq -nc --arg key "$FASTDATA_FIELD" --arg value "$FASTDATA_VALUE" '{key: $key, value: $value}')" \
  --accountId "$SIGNER_ID" \
  --networkId testnet \
  --gas 30000000000000 \
  | tee /tmp/kv-fastdata-call.txt

CLI_TX_HASH="$(
  awk '/Transaction Id/{print $3}' /tmp/kv-fastdata-call.txt
)"

ATTEMPTS=0
until curl -s "$KV_BASE_URL/v0/latest/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID" \
  -H 'content-type: application/json' \
  --data '{"include_metadata": true, "limit": 20}' \
  | tee /tmp/kv-predecessor-latest.json \
  | jq -e --arg tx_hash "$CLI_TX_HASH" '
      .entries
      | map(select(.tx_hash == $tx_hash))
      | length > 0
    ' >/dev/null
do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge 30 ]; then
    echo "Timed out waiting for KV FastData to index $CLI_TX_HASH" >&2
    exit 1
  fi
  sleep 2
done

INDEXED_TX_HASH="$(
  jq -r --arg tx_hash "$CLI_TX_HASH" '
    first(.entries[] | select(.tx_hash == $tx_hash) | .tx_hash)
  ' /tmp/kv-predecessor-latest.json
)"

test "$CLI_TX_HASH" = "$INDEXED_TX_HASH" \
  && echo "CLI tx hash matches indexed metadata"

jq --arg tx_hash "$CLI_TX_HASH" '{
      tx_hashes: ([.entries[] | select(.tx_hash == $tx_hash) | .tx_hash] | unique),
      receipt_ids: ([.entries[] | select(.tx_hash == $tx_hash) | .receipt_id] | unique),
      entries: [
        .entries[]
        | select(.tx_hash == $tx_hash)
        | {
            block_height,
            key,
            value,
            tx_hash,
            receipt_id
          }
      ]
    }' /tmp/kv-predecessor-latest.json

jq '{
  latest_value_row: (
    .entries[0]
    | {
        current_account_id,
        predecessor_id,
        block_height,
        key,
        value
      }
  )
}' <(
  curl -s "$KV_BASE_URL/v0/latest/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/value"
)

curl -s "$KV_BASE_URL/v0/latest/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/key" \
  | jq '{
      latest_key_row: (
        .entries[0]
        | {
            current_account_id,
            predecessor_id,
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
      first_receipt_id: .transactions[0].execution_outcome.outcome.receipt_ids[0]
    }'
```

**Зачем нужен следующий шаг?**

Этот контракт эмитирует две строки FastData из одного вызова: строку `key`, в которой лежит логическое имя поля, и строку `value`, в которой лежит само значение. Маршруты точного ключа напрямую доказывают наличие этих строк. Lookup по предшественнику — это мост к provenance, потому что именно он возвращает `tx_hash` и `receipt_id`, породившие эти строки. Гидратация транзакции доказывает, что индексированные строки возникли из одного вызова `__fastdata_kv` с теми же декодированными аргументами.

Именно здесь проходит важная граница этой поверхности: строки FastData — это индексированный вывод FastData, а не обещание, что сырое RPC `view_state` покажет те же ключи. Поскольку это индексированная поверхность, свежая запись может появиться не мгновенно; дождитесь, пока в индексе появится ваш `tx_hash`, прежде чем считать latest-строки окончательными. Если вопрос пользователя меняется с «какие строки FastData были эмитированы?» на «как выглядит каноническое on-chain-состояние контракта?», переходите к собственному read-методу контракта или к [View State](https://docs.fastnear.com/ru/rpc/contract/view-state) только тогда, когда вы независимо знаете нужную вам layout-структуру хранилища.

## Частые задачи

### Посмотреть один точный ключ FastData прямо сейчас

**Начните здесь**

- [Последнее по точному ключу](https://docs.fastnear.com/ru/fastdata/kv/get-latest-key), когда точный ключ уже известен.

**Следующая страница при необходимости**

- [История по точному ключу](https://docs.fastnear.com/ru/fastdata/kv/get-history-key), если вопрос превращается в «как менялся этот ключ?»

**Остановитесь, когда**

- Последняя индексированная запись уже отвечает на вопрос по FastData.

**Переходите дальше, когда**

- Пользователя больше не интересуют индексированные строки FastData. Переходите к собственному read-методу контракта или к [View State](https://docs.fastnear.com/ru/rpc/contract/view-state) только если знаете, какой raw-state layout нужен.

### Превратить один точный ключ FastData в историю изменений

**Начните здесь**

- [История по точному ключу](https://docs.fastnear.com/ru/fastdata/kv/get-history-key) для path-based истории внутри одного контракта и одного предшественника.
- [History by Key](https://docs.fastnear.com/ru/fastdata/kv/history-by-key) только тогда, когда вы специально хотите искать один и тот же текст ключа по всем контрактам и предшественникам.

**Следующая страница при необходимости**

- Возвращайтесь к [Последнему по точному ключу](https://docs.fastnear.com/ru/fastdata/kv/get-latest-key), если нужно увидеть текущее индексированное значение рядом с историей.

**Остановитесь, когда**

- Уже можно объяснить, как ключ менялся со временем.

**Переходите дальше, когда**

- Теперь нужно каноническое состояние контракта, а не только индексированная история FastData. Используйте собственный read-метод контракта или [View State](https://docs.fastnear.com/ru/rpc/contract/view-state) только если форма raw-state уже известна.

### Проследить записи от одного `predecessor_id`

**Начните здесь**

- [Всё по `predecessor_id`](https://docs.fastnear.com/ru/fastdata/kv/all-by-predecessor) для последних записей по контрактам, затронутым одним предшественником.
- [Последнее по `predecessor_id`](https://docs.fastnear.com/ru/fastdata/kv/latest-by-predecessor), когда нужны строки для одного контракта и одного предшественника, при необходимости вместе с метаданными.
- [История по `predecessor_id`](https://docs.fastnear.com/ru/fastdata/kv/history-by-predecessor), когда нужна история записей во времени.

**Следующая страница при необходимости**

- Сузьте область до точного ключа, если одна строка становится настоящим фокусом расследования, или переходите к [Transactions by Hash](https://docs.fastnear.com/ru/tx/transactions), если главным становится provenance-вопрос.

**Остановитесь, когда**

- Уже можно ответить, что именно этот предшественник изменил и где.

**Переходите дальше, когда**

- Пользователя перестают интересовать индексированные записи и начинает интересовать текущее состояние в цепочке.

### Привязать одну строку FastData обратно к транзакции

**Начните здесь**

- [Последнее по `predecessor_id`](https://docs.fastnear.com/ru/fastdata/kv/latest-by-predecessor) с `include_metadata: true`, чтобы получить `tx_hash` и `receipt_id`.
- [Transactions by Hash](https://docs.fastnear.com/ru/tx/transactions), чтобы гидратировать исходный вызов и декодировать его аргументы.

**Следующая страница при необходимости**

- Переходите к [Receipt by Id](https://docs.fastnear.com/ru/tx/receipt), если следующий вопрос уже не про исходный вызов, а про конкретный downstream receipt.

**Остановитесь, когда**

- Уже можно объяснить, какой вызов породил индексированную строку FastData.

**Переходите дальше, когда**

- Пользователю нужна каноническая семантика исполнения или точный статус на уровне executor. Тогда переходите к RPC transaction status.

### Пакетно проверить несколько известных ключей

**Начните здесь**

- [Пакетный поиск по ключам](https://docs.fastnear.com/ru/fastdata/kv/multi), когда уже известен фиксированный набор точных ключей.

**Следующая страница при необходимости**

- Переведите один интересный ключ в [Историю по точному ключу](https://docs.fastnear.com/ru/fastdata/kv/get-history-key), если batch-ответ вызывает исторический вопрос.

**Остановитесь, когда**

- Пакетный ответ уже показывает, какие ключи действительно важны.

**Переходите дальше, когда**

- У вас больше нет фиксированного списка ключей и нужно смотреть на контракт или предшественника шире.

## Частые ошибки

- Начинать с широких выборок по аккаунту или предшественнику, когда точный ключ уже известен.
- Путать [Историю по точному ключу](https://docs.fastnear.com/ru/fastdata/kv/get-history-key) с [History by Key](https://docs.fastnear.com/ru/fastdata/kv/history-by-key). Первый маршрут остаётся внутри одного контракта и предшественника, второй ищет одинаковый текст ключа глобально.
- Использовать KV FastData, хотя пользователю на самом деле нужны балансы или активы.
- Путать индексированные строки FastData с точным каноническим состоянием контракта.
- Предполагать, что ключ FastData можно напрямую запросить через raw RPC `view_state`.
- Предполагать, что свежая запись будет проиндексирована синхронно с включением в блокчейн.
- Переиспользовать токен пагинации или менять фильтры прямо во время просмотра.

## Полезные связанные страницы

- [KV FastData API](https://docs.fastnear.com/ru/fastdata/kv)
- [RPC Reference](https://docs.fastnear.com/ru/rpc)
- [FastNear API](https://docs.fastnear.com/ru/api)
- [Choosing the Right Surface](https://docs.fastnear.com/ru/agents/choosing-surfaces)
- [Agent Playbooks](https://docs.fastnear.com/ru/agents/playbooks)
