---
sidebar_label: Examples
slug: /neardata/examples
title: "Примеры NEAR Data"
description: "Пошаговые сценарии для polling по оптимистичным и финализированным блокам и перехода к RPC, когда это нужно."
displayed_sidebar: nearDataApiSidebar
page_actions:
  - markdown
---

## Быстрый старт

Начните с двух helper-маршрутов, которые показывают, что изменилось прямо сейчас.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz

curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/optimistic" \
  | awk 'tolower($1) == "location:" {print "optimistic:", $2}' \
  | tr -d '\r'

curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/final" \
  | awk 'tolower($1) == "location:" {print "final:", $2}' \
  | tr -d '\r'
```

Это даёт текущие optimistic и final redirect target до того, как вы запрашиваете полные документы блоков.

## Готовое расследование

### Поймать новый блок как можно раньше, а затем подтвердить его после finality

Используйте это расследование, когда нужно заметить новый блок как можно раньше, но финальный ответ всё равно должен опираться на финализированный блок и иногда на точное чтение через RPC.

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Стратегия</span>
    <p className="fastnear-example-strategy__title">Пусть NEAR Data сначала скажет, что что-то изменилось, а затем переиспользуйте то же семейство блоков для стабильного подтверждения.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">block-optimistic</span> или <span className="fastnear-example-strategy__code">last-block-optimistic</span> дают самый ранний полезный сигнал.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">block</span> или <span className="fastnear-example-strategy__code">last-block-final</span> подтверждают, что то же наблюдение дошло до финализированной истории.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">RPC block</span> нужен только в самом конце, когда уже известна точная высота или хеш.</span></p>
  </div>
</div>

**Цель**

- Как можно раньше заметить одно свежее изменение в семействе блоков, а затем подтвердить, какой финализированный блок его догнал.

| Поверхность | Эндпоинт | Как используем | Зачем используем |
| --- | --- | --- | --- |
| Самое быстрое обнаружение | NEAR Data [`block-optimistic`](/neardata/block-optimistic) | Опрашиваем оптимистичные блоки, чтобы как можно раньше заметить новое изменение в семействе блоков | Даёт самый ранний полезный сигнал ещё до финализированного подтверждения |
| Маршрут для последнего оптимистичного блока | NEAR Data [`last-block-optimistic`](/neardata/last-block-optimistic) | Используем маршрут перенаправления, когда клиент должен всегда следовать за самым новым оптимистичным блоком | Упрощает клиент опроса, когда важнее получать последний блок, а не работать с явными высотами |
| Стабильное подтверждение | NEAR Data [`block`](/neardata/block) или [`last-block-final`](/neardata/last-block-final) | Повторно проверяем то же семейство блоков, когда финальность догоняет ранее замеченное изменение | Подтверждает, что замеченное в оптимистичном режиме изменение действительно попало в финализированную историю |
| Лёгкая сводка по блоку | NEAR Data [`block-headers`](/neardata/block-headers) | Читаем данные заголовков, если для ответа достаточно времени и общего хода событий | Позволяет не запрашивать более широкий блок, когда хватает заголовков |
| Точный разбор через RPC | RPC [Блок по ID](/rpc/block/block-by-id) или [Блок по высоте](/rpc/block/block-by-height) | Получаем точный блок, как только понятно, какой именно блок важен | Здесь уже имеет смысл RPC, если нужен тот самый блок-объект, который вернул бы сам протокол |

**Что должен включать полезный ответ**

- какой redirect target и какой разрешённый оптимистичный блок впервые запустили расследование
- когда helper для finality догнал его и в какой блок он разрешился
- изменил ли точный разбор через RPC интерпретацию

### Shell-сценарий от оптимистичного сигнала к финализированному подтверждению

Используйте этот сценарий, когда нужно сразу заметить свежее изменение в семействе блоков, а затем доказать, какой финализированный блок его догнал, и подтвердить именно эту высоту через RPC.

**Что вы делаете**

- Смотрите redirect, который возвращает `GET /v0/last_block/optimistic`.
- Загружаете разрешённый оптимистичный блок и сохраняете его высоту и хеш.
- Смотрите redirect, который возвращает `GET /v0/last_block/final`, и сохраняете финализированный counterpart.
- Сравниваете оптимистичное и финализированное наблюдения, а затем переиспользуете финализированную высоту в RPC `block` по высоте.

```bash
NEARDATA_BASE_URL=https://mainnet.neardata.xyz
RPC_URL=https://rpc.mainnet.fastnear.com

OPTIMISTIC_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/optimistic" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

printf 'Optimistic redirect target: %s\n' "$OPTIMISTIC_LOCATION"

curl -s "$NEARDATA_BASE_URL$OPTIMISTIC_LOCATION" \
  | tee /tmp/neardata-optimistic-block.json \
  | jq '{height: .block.header.height, hash: .block.header.hash}'

FINAL_LOCATION="$(
  curl -s -D - -o /dev/null "$NEARDATA_BASE_URL/v0/last_block/final" \
    | awk 'tolower($1) == "location:" {print $2}' \
    | tr -d '\r'
)"

printf 'Final redirect target: %s\n' "$FINAL_LOCATION"

curl -s "$NEARDATA_BASE_URL$FINAL_LOCATION" \
  | tee /tmp/neardata-final-block.json \
  | jq '{height: .block.header.height, hash: .block.header.hash}'

jq -n \
  --slurpfile optimistic /tmp/neardata-optimistic-block.json \
  --slurpfile final /tmp/neardata-final-block.json '{
    optimistic: {
      height: $optimistic[0].block.header.height,
      hash: $optimistic[0].block.header.hash
    },
    final: {
      height: $final[0].block.header.height,
      hash: $final[0].block.header.hash
    },
    same_height: (
      $optimistic[0].block.header.height
      == $final[0].block.header.height
    )
  }'

BLOCK_HEIGHT="$(jq -r '.block.header.height' /tmp/neardata-final-block.json)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg block_height "$BLOCK_HEIGHT" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "block",
    params: {
      block_id: ($block_height | tonumber)
    }
  }')" \
  | jq '{height: .result.header.height, hash: .result.header.hash, chunks: (.result.chunks | length)}'
```

**Зачем нужен следующий шаг?**

Так вы получаете обе стороны истории: самый ранний оптимистичный якорь и более поздний финализированный якорь. Как только helper для finality сообщил точную высоту блока, RPC становится естественным следующим шагом, если нужен точный блок-объект без догадок о том, что именно проверять.

## Частые задачи

### Отслеживать последний оптимистичный блок

**Начните здесь**

- [Оптимистичный блок](/neardata/block-optimistic) для самого свежего чтения по семейству блоков.

**Следующая страница при необходимости**

- [Перенаправление на последний оптимистичный блок](/neardata/last-block-optimistic), если нужен маршрут перенаправления, который всегда ведёт к самому новому оптимистичному блоку.

**Остановитесь, когда**

- Уже можно сообщить о последнем оптимистичном блоке или зафиксировать отставание по свежести.

**Переходите дальше, когда**

- Нужна finalized-стабильность вместо максимальной свежести. Переходите к [Финализированному блоку по высоте](/neardata/block) или [Перенаправлению на последний финализированный блок](/neardata/last-block-final).

### Безопасно отслеживать ход финализации блоков

**Начните здесь**

- [Финализированный блок по высоте](/neardata/block), когда уже известна нужная высота.
- [Заголовки блока](/neardata/block-headers), когда достаточно чтения заголовков.

**Следующая страница при необходимости**

- [Перенаправление на последний финализированный блок](/neardata/last-block-final), когда клиент должен следовать за самым новым финализированным блоком без предварительного вычисления высоты.

**Остановитесь, когда**

- Уже можно показывать движение финализированных блоков без перехода к более глубоким протокольным деталям.

**Переходите дальше, когда**

- Пользователю нужны точные поля блока или семантика транзакций. Переходите к [RPC Reference](/rpc).

### Использовать маршруты перенаправления в клиенте опроса

**Начните здесь**

- [Перенаправление на последний финализированный блок](/neardata/last-block-final) или [Перенаправление на последний оптимистичный блок](/neardata/last-block-optimistic) в зависимости от требуемой свежести.

**Следующая страница при необходимости**

- Следуйте по URL блока, который вернул маршрут перенаправления, и уже там читайте нужные данные.

**Остановитесь, когда**

- Клиент надёжно проходит по маршруту перенаправления и получает нужный ресурс блока.

**Переходите дальше, когда**

- Само перенаправление мешает клиенту. Тогда переходите на прямые маршруты блоков.

### Перейти от опроса свежих блоков к точному RPC-разбору

**Начните здесь**

- Используйте подходящий маршрут NEAR Data, чтобы найти недавний блок или событие в семействе блоков, которое нужно исследовать.

**Следующая страница при необходимости**

- [Block by Height](/rpc/block/block-by-height), [Block by ID](/rpc/block/block-by-id) или другой RPC-метод, как только станет понятно, какой именно блок или следующий объект для проверки нужен.

**Остановитесь, когда**

- Уже можно чётко назвать недавний блок, который заслуживает проверки через RPC.

**Переходите дальше, когда**

- Пользователь просит точную структуру данных в терминах протокола, а не просто свежее чтение.

## Частые ошибки

- Воспринимать NEAR Data как push-стрим, а не как API для опроса.
- Начинать с RPC, когда настоящая задача — мониторинг свежих блоков.
- Забывать, что невалидный ключ может вернуть `401` ещё до перенаправления, а сами перенаправления подходят не каждому HTTP-клиенту.
- Оставаться на NEAR Data после того, как пользователь уже попросил точные протокольные детали блока.

## Полезные связанные страницы

- [NEAR Data API](/neardata)
- [RPC Reference](/rpc)
- [Transactions API](/tx)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
