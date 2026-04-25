**Источник:** [https://docs.fastnear.com/ru/fastdata/kv/examples](https://docs.fastnear.com/ru/fastdata/kv/examples)

## Примеры

Все shell-примеры ниже работают на публичных KV FastData-хостах как есть. Если в shell задан `FASTNEAR_API_KEY`, они автоматически передают его как query-параметр `apiKey`; если переменная не задана, они переходят на публичный неаутентифицированный путь. Также поддерживается bearer-аутентификация через `Authorization: Bearer ${FASTNEAR_API_KEY}`, если вашему клиенту удобнее передавать ключ в заголовке.

### Проверить один точный ключ и сразу посмотреть его историю

Если контракт, `predecessor_id` и точный ключ уже известны, начинайте с узкого запроса. `latest` отвечает на вопрос о текущем состоянии, а `history` показывает, менялась ли именно эта строка со временем.

```bash
CURRENT_ACCOUNT_ID=social.near
PREDECESSOR_ID=james.near
KEY='graph/follow/sleet.near'

ENCODED_KEY="$(jq -rn --arg key "$KEY" '$key | @uri')"

LATEST="$(curl -s "https://kv.main.fastnear.com/v0/latest/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/$ENCODED_KEY?apiKey=${FASTNEAR_API_KEY:-}")"

echo "$LATEST" | jq '{
  latest: (
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

curl -s "https://kv.main.fastnear.com/v0/history/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/$ENCODED_KEY?apiKey=${FASTNEAR_API_KEY:-}" \
  | jq '{writes: [.entries[] | {block_height, value}]}'
```

Для точного ключа вроде этого follow-edge `latest` даёт текущее индексированное значение одной строкой, а `history` показывает, была ли запись однократной или переключалась со временем. Начинайте отсюда, когда путь в storage уже известен; расширяйтесь до выборок по `predecessor_id` только тогда, когда нужно не доказательство, а поиск.

### Посмотреть индексированные записи одного `predecessor_id` и сузиться до изменившегося ключа

`all-by-predecessor` возвращает последние индексированные записи одного аккаунта по каждому контракту, которого он касался. Выберите интересный ключ и прогоните его через `history`, чтобы увидеть, как эта строка менялась со временем.

```bash
PREDECESSOR_ID=jemartel.near

FIRST="$(curl -s "https://kv.main.fastnear.com/v0/all/$PREDECESSOR_ID?apiKey=${FASTNEAR_API_KEY:-}" \
  -H 'content-type: application/json' \
  --data '{"include_metadata":true,"limit":10}')"

echo "$FIRST" | jq '{
  page_token,
  entries: [.entries[] | {current_account_id, predecessor_id, block_height, key, value, tx_hash}]
}'
```

Для `jemartel.near` в выдаче смешиваются подтверждение идентичности `account_id` на `contextual.near` и серия добавлений `graph/follow/*` в тот же контракт. `tx_hash` в каждой строке — это прямой переход в [/tx/examples](https://docs.fastnear.com/ru/tx/examples#%D1%83-%D0%BC%D0%B5%D0%BD%D1%8F-%D0%BE%D0%B4%D0%B8%D0%BD-%D1%85%D0%B5%D1%88-%D1%82%D1%80%D0%B0%D0%BD%D0%B7%D0%B0%D0%BA%D1%86%D0%B8%D0%B8-%D1%87%D1%82%D0%BE-%D0%BF%D1%80%D0%BE%D0%B8%D0%B7%D0%BE%D1%88%D0%BB%D0%BE), если нужна полная история транзакции за любой записью.

Поднимите самую свежую строку и прогоните её через `history`:

```bash
PREDECESSOR_ID=jemartel.near
FIRST="$(curl -s "https://kv.main.fastnear.com/v0/all/$PREDECESSOR_ID?apiKey=${FASTNEAR_API_KEY:-}" \
  -H 'content-type: application/json' \
  --data '{"include_metadata":true,"limit":10}')"

CURRENT_ACCOUNT_ID="$(echo "$FIRST" | jq -r '.entries[0].current_account_id')"
EXACT_KEY="$(echo "$FIRST" | jq -r '.entries[0].key')"
ENCODED_KEY="$(jq -rn --arg key "$EXACT_KEY" '$key | @uri')"

curl -s "https://kv.main.fastnear.com/v0/history/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/$ENCODED_KEY?apiKey=${FASTNEAR_API_KEY:-}" \
  | jq '{entries: [.entries[] | {block_height, value}]}'
```

Для строки `account_id` `history` возвращает одну запись на блоке `185965311` со значением `"jemartel.near:mainnet"` — подтверждение идентичности держится, стабильно с того блока. KV сохраняет каждую запись одинаково: у тихого ключа — одна строка, у активного — много, форма та же, без агрегации.

## Частые ошибки

- Начинать с широких выборок по аккаунту или предшественнику, когда точный ключ уже известен.
- Использовать KV FastData, когда пользователю на самом деле нужны балансы или активы.
- Путать индексированную историю с точным текущим состоянием в цепочке.
- Переиспользовать токен пагинации или менять фильтры прямо во время просмотра.

## Связанные страницы

- [KV FastData API](https://docs.fastnear.com/ru/fastdata/kv)
- [RPC Reference](https://docs.fastnear.com/ru/rpc)
- [FastNear API](https://docs.fastnear.com/ru/api)
- [Choosing the Right Surface](https://docs.fastnear.com/ru/agents/choosing-surfaces)
- [Agent Playbooks](https://docs.fastnear.com/ru/agents/playbooks)
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- Один API-ключ FastNear работает и для RPC, и для индексированных API.
- Получите API-ключ на [dashboard.fastnear.com](https://dashboard.fastnear.com).
