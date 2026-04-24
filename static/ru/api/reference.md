**Источник:** [https://docs.fastnear.com/ru/api/reference](https://docs.fastnear.com/ru/api/reference)

# Справочник API

Этот раздел объясняет, что относится к REST-слою FastNear и как выбрать между REST-семействами до перехода к сырому JSON-RPC.

Сайдбар `/api` намеренно посвящён именно **FastNear API**, а не универсальному REST-разделу. Другие REST-семейства — [Транзакции API](https://docs.fastnear.com/ru/tx), [API переводов](https://docs.fastnear.com/ru/transfers), [NEAR Data API](https://docs.fastnear.com/ru/neardata) и [KV FastData API](https://docs.fastnear.com/ru/fastdata/kv) — живут в собственных верхнеуровневых разделах.

## REST-семейства с одного взгляда

| Семейство | Начните здесь, когда... | Переключайтесь, когда... |
| --- | --- | --- |
| [FastNear API](https://docs.fastnear.com/ru/api) | нужны индексированные представления аккаунтов, токенов, NFT, стейкинга или публичных ключей | требуется каноническая семантика RPC на уровне протокола |
| [Транзакции API](https://docs.fastnear.com/ru/tx) | нужна история транзакций, квитанций, аккаунта или блока | нужны только события переводов или точное поведение на уровне RPC |
| [API переводов](https://docs.fastnear.com/ru/transfers) | вопрос именно о движении NEAR или FT-токенов | вопрос расширяется до общей истории исполнения |
| [NEAR Data API](https://docs.fastnear.com/ru/neardata) | нужны свежие оптимистичные или финализированные чтения семейства блоков | нужно точное каноническое продолжение по блоку или состоянию |
| [KV FastData API](https://docs.fastnear.com/ru/fastdata/kv) | нужна индексированная история «ключ–значение» или последнее индексированное состояние ключа | нужно точное текущее состояние контракта в цепочке |

## Для чего нужен сам `/api`

Используйте раздел [FastNear API](https://docs.fastnear.com/ru/api), когда пользователю нужен ответ в продуктовой форме без сшивания сырых ответов узла:

- сводки по аккаунту
- балансы FT-токенов
- активы NFT
- позиции стейкинга
- разрешение публичного ключа в аккаунт

Хорошие стартовые страницы в этом сайдбаре:

- [V1 Full Account View](https://docs.fastnear.com/ru/api/v1/account-full)
- [V1 Account FT](https://docs.fastnear.com/ru/api/v1/account-ft)
- [V1 Account NFT](https://docs.fastnear.com/ru/api/v1/account-nft)
- [V1 Account Staking](https://docs.fastnear.com/ru/api/v1/account-staking)
- [V1 Public Key](https://docs.fastnear.com/ru/api/v1/public-key)

## Когда не стоит стартовать с `/api`

Не начинайте с этого сайдбара, когда:

- основная задача — история; используйте [Транзакции API](https://docs.fastnear.com/ru/tx) или [API переводов](https://docs.fastnear.com/ru/transfers)
- основная задача — опрос свежих блоков; используйте [NEAR Data API](https://docs.fastnear.com/ru/neardata)
- ответ должен оставаться близким к каноническим формам запроса и ответа узла; используйте [Справочник RPC](https://docs.fastnear.com/ru/rpc)

## Для агентов

Если вызывающая сторона — ИИ-агент и выбор всё ещё не ясен:

- [Агенты на FastNear](https://docs.fastnear.com/ru/agents)
- [Как выбрать подходящую поверхность](https://docs.fastnear.com/ru/agents/choosing-surfaces)
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- Один API-ключ FastNear работает и для RPC, и для индексированных API.
- Получите API-ключ на [dashboard.fastnear.com](https://dashboard.fastnear.com).
