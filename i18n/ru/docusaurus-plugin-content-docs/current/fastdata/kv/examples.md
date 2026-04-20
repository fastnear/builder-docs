---
sidebar_label: Examples
slug: /fastdata/kv/examples
title: "Примеры KV FastData"
description: "Практические примеры KV FastData: scoped-записи, история ключа и переход к точному состоянию."
displayed_sidebar: kvFastDataSidebar
page_actions:
  - markdown
---

## Пример

### Посмотреть индексированные записи одного `predecessor_id` и сузиться до изменившегося ключа

`all-by-predecessor` возвращает последние индексированные записи одного аккаунта по каждому контракту, которого он касался. Выберите интересный ключ и прогоните его через `history`, чтобы увидеть, как эта строка менялась со временем.

```bash
PREDECESSOR_ID=jemartel.near
FASTNEAR_API_KEY=${FASTNEAR_API_KEY:-your_api_key_here}

FIRST="$(curl -s "https://kv.main.fastnear.com/v0/all/$PREDECESSOR_ID" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
  -H 'content-type: application/json' \
  --data '{"include_metadata":true,"limit":10}')"

echo "$FIRST" | jq '{
  page_token,
  entries: [.entries[] | {current_account_id, predecessor_id, block_height, key, value, tx_hash}]
}'
```

Для `jemartel.near` в выдаче смешиваются подтверждение идентичности `account_id` на `contextual.near` и серия добавлений `graph/follow/*` в тот же контракт. `tx_hash` в каждой строке — это прямой переход в [/tx/examples](/tx/examples#у-меня-один-хеш-транзакции-что-произошло), если нужна полная история транзакции за любой записью.

Поднимите самую свежую строку и прогоните её через `history`:

```bash
CURRENT_ACCOUNT_ID="$(echo "$FIRST" | jq -r '.entries[0].current_account_id')"
EXACT_KEY="$(echo "$FIRST" | jq -r '.entries[0].key')"
ENCODED_KEY="$(jq -rn --arg key "$EXACT_KEY" '$key | @uri')"

curl -s "https://kv.main.fastnear.com/v0/history/$CURRENT_ACCOUNT_ID/$PREDECESSOR_ID/$ENCODED_KEY" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
  | jq '{entries: [.entries[] | {block_height, value}]}'
```

Для строки `account_id` `history` возвращает одну запись на блоке `185965311` со значением `"jemartel.near:mainnet"` — подтверждение идентичности держится, стабильно с того блока. KV сохраняет каждую запись одинаково: у тихого ключа — одна строка, у активного — много, форма та же, без агрегации.

## Частые ошибки

- Начинать с широких выборок по аккаунту или предшественнику, когда точный ключ уже известен.
- Использовать KV FastData, когда пользователю на самом деле нужны балансы или активы.
- Путать индексированную историю с точным текущим состоянием в цепочке.
- Переиспользовать токен пагинации или менять фильтры прямо во время просмотра.

## Связанные страницы

- [KV FastData API](/fastdata/kv)
- [RPC Reference](/rpc)
- [FastNear API](/api)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
