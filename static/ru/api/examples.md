**Источник:** [https://docs.fastnear.com/ru/api/examples](https://docs.fastnear.com/ru/api/examples)

# Примеры FastNear API

Используйте эту страницу, когда нужен читаемый ответ в форме сводки по аккаунту или активу и хочется пройти по документации FastNear API самым коротким путём. Начинайте с самого узкого эндпоинта, который уже может решить задачу, и расширяйтесь только тогда, когда понадобятся канонические детали RPC или история исполнения.

## Когда начинать здесь

- Пользователю нужны балансы, активы, стейкинг или общая сводка по аккаунту в формате кошелька.
- Нужно определить один или несколько аккаунтов по публичному ключу.
- Ответ должен выглядеть как прикладные данные, а не как сырой JSON-RPC.
- Нужен быстрый первый ответ до того, как станет понятно, требуется ли каноническое подтверждение через RPC.

## Минимальные входные данные

- сеть: mainnet или testnet
- основной идентификатор: `account_id` или публичный ключ
- нужен ли широкий обзор или одна конкретная категория активов
- понадобится ли затем точное каноническое подтверждение или история активности

## Частые задачи

### Получить сводку по аккаунту в формате кошелька

**Начните здесь**

- [V1 Full Account View](https://docs.fastnear.com/ru/api/v1/account-full) для самого широкого снимка аккаунта.

**Следующая страница при необходимости**

- [V1 Account FT](https://docs.fastnear.com/ru/api/v1/account-ft), [V1 Account NFT](https://docs.fastnear.com/ru/api/v1/account-nft) или [V1 Account Staking](https://docs.fastnear.com/ru/api/v1/account-staking) для более узкого продолжения.
- [Transactions API account history](https://docs.fastnear.com/ru/tx/account), если следующий вопрос звучит как «как аккаунт пришёл к такому состоянию?»

**Остановитесь, когда**

- Сводка уже отвечает на вопрос о портфеле или активах в нужной пользователю форме.

**Расширяйте, когда**

- Пользователь спрашивает о точной канонической семантике аккаунта или ключей доступа. Переходите к [RPC Reference](https://docs.fastnear.com/ru/rpc).
- Пользователя интересует история активности или исполнения, а не текущий набор активов. Переходите к [Transactions API](https://docs.fastnear.com/ru/tx).

### Определить аккаунты по публичному ключу

**Начните здесь**

- [V1 Public Key Lookup](https://docs.fastnear.com/ru/api/v1/public-key), когда нужен основной аккаунт для ключа.
- [V1 Public Key Lookup All](https://docs.fastnear.com/ru/api/v1/public-key-all), когда нужен более полный список связанных аккаунтов.

**Следующая страница при необходимости**

- [V1 Full Account View](https://docs.fastnear.com/ru/api/v1/account-full) после поиска, если сразу нужна сводка по балансам или активам найденных аккаунтов.

**Остановитесь, когда**

- Уже определён аккаунт или набор аккаунтов, которым принадлежит ключ.

**Расширяйте, когда**

- Пользователь спрашивает о точных правах ключа, nonce или каноническом состоянии access key. Переходите к [View Access Key](https://docs.fastnear.com/ru/rpc/account/view-access-key) или [View Access Key List](https://docs.fastnear.com/ru/rpc/account/view-access-key-list).
- Пользователя интересует недавняя активность найденных аккаунтов, а не только их идентификация. Переходите к [Transactions API](https://docs.fastnear.com/ru/tx).

### Продолжить по одной категории активов, а не по всему аккаунту

**Начните здесь**

- [V1 Account FT](https://docs.fastnear.com/ru/api/v1/account-ft) для балансов FT-токенов.
- [V1 Account NFT](https://docs.fastnear.com/ru/api/v1/account-nft) для владения NFT.
- [V1 Account Staking](https://docs.fastnear.com/ru/api/v1/account-staking) для позиций стейкинга.

**Следующая страница при необходимости**

- [V1 Full Account View](https://docs.fastnear.com/ru/api/v1/account-full), если позже понадобится более широкий снимок аккаунта.
- [Transactions API account history](https://docs.fastnear.com/ru/tx/account), если вопрос смещается к тому, как активы менялись со временем.

**Остановитесь, когда**

- Эндпоинт по конкретной категории активов уже даёт готовый продуктовый ответ без дополнительной реконструкции.

**Расширяйте, когда**

- Индексированного представления недостаточно и нужна точная семантика состояния в цепочке. Переходите к [RPC Reference](https://docs.fastnear.com/ru/rpc).
- Вопрос становится историческим или связанным с исполнением вместо «чем этот аккаунт владеет сейчас?». Переходите к [Transactions API](https://docs.fastnear.com/ru/tx).

## Частые ошибки

- Сразу идти в широкий снимок аккаунта, когда пользователя интересует только одна категория активов.
- Использовать FastNear API, хотя пользователю прямо нужны канонические поля RPC или права доступа.
- Оставаться на страницах сводок по аккаунту, когда вопрос уже стал вопросом об истории транзакций.
- Забывать, что `?network=testnet` поддерживается только на совместимых страницах.

## Полезные связанные страницы

- [FastNear API](https://docs.fastnear.com/ru/api)
- [API Reference](https://docs.fastnear.com/ru/api/reference)
- [RPC Reference](https://docs.fastnear.com/ru/rpc)
- [Transactions API](https://docs.fastnear.com/ru/tx)
- [Choosing the Right Surface](https://docs.fastnear.com/ru/agents/choosing-surfaces)
- [Agent Playbooks](https://docs.fastnear.com/ru/agents/playbooks)
