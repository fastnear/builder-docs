**Источник:** [https://docs.fastnear.com/ru](https://docs.fastnear.com/ru)

# Выберите подходящую поверхность FastNear

<!-- FASTNEAR_AI_DISCOVERY: Разработчикам агентов стоит начинать с /agents/choosing-surfaces, затем использовать /agents/auth для безопасной работы с учётными данными и /agents/playbooks для типовых сценариев. -->

FastNear предлагает несколько документированных поверхностей, потому что разным задачам нужны разные компромиссы. Начните с нужного сценария, а затем переходите к подробному справочнику.

### [RPC](https://docs.fastnear.com/ru/rpc)

*Канонический JSON-RPC*

Используйте канонические методы JSON-RPC для чтения данных напрямую из протокола, отправки транзакций и проверки состояния сети.

Лучше всего подходит для:

- [состояния аккаунта](https://docs.fastnear.com/ru/rpc/account/view-account)
- [поиска блоков](https://docs.fastnear.com/ru/rpc/block/block-by-id)
- [вызовов view-методов контракта](https://docs.fastnear.com/ru/rpc/contract/call-function)
- [данных валидаторов](https://docs.fastnear.com/ru/rpc/validators/validators-current)

### [FastNear API](https://docs.fastnear.com/ru/api)

*Индексированные балансы*

Начните здесь, если нужны удобные для кошельков балансы, NFT, стейкинг и поиск по публичному ключу без сырых JSON-RPC-обёрток.

Лучше всего подходит для:

- [полного снимка аккаунта](https://docs.fastnear.com/ru/api/v1/account-full)
- [балансов FT-токенов](https://docs.fastnear.com/ru/api/v1/account-ft)
- [активов NFT](https://docs.fastnear.com/ru/api/v1/account-nft)
- [поиска по публичному ключу](https://docs.fastnear.com/ru/api/v1/public-key)

### [Транзакции API](https://docs.fastnear.com/ru/tx)

*История транзакций*

Запрашивайте историю транзакций по аккаунту, квитанции, блоку или хешу, когда нужен индексированный API истории вместо опроса узлов.

Лучше всего подходит для:

- [активности аккаунта](https://docs.fastnear.com/ru/tx/account)
- [поиска транзакций](https://docs.fastnear.com/ru/tx/transactions)
- [трассировки квитанций](https://docs.fastnear.com/ru/tx/receipt)
- [истории транзакций по блоку](https://docs.fastnear.com/ru/tx/blocks)

### [Снапшоты](https://docs.fastnear.com/ru/snapshots)

*Снапшоты*

Используйте готовые сценарии работы со снапшотами, когда нужно поднять RPC- или архивную инфраструктуру без полного повторного воспроизведения цепочки.

Лучше всего подходит для:

- [снапшотов mainnet](https://docs.fastnear.com/ru/snapshots/mainnet)
- [снапшотов testnet](https://docs.fastnear.com/ru/snapshots/testnet)
- [обзора сценариев работы со снапшотами](https://docs.fastnear.com/ru/snapshots)

### [Аутентификация и доступ](https://docs.fastnear.com/ru/auth)

*Повышенные лимиты*

Один API-ключ FastNear работает и для RPC, и для REST API; передавайте его через заголовок Authorization Bearer или как URL-параметр apiKey.

Лучше всего подходит для:

- [обзора аутентификации](https://docs.fastnear.com/ru/auth)

### [NEAR Data API](https://docs.fastnear.com/ru/neardata)

*Почти в реальном времени*

Используйте NEAR Data API, когда нужны оптимистичные или недавно финализированные чтения блоков без позиционирования продукта как потокового сервиса.

Лучше всего подходит для:

- [оптимистичных чтений блоков](https://docs.fastnear.com/ru/neardata/block-optimistic)
- [последнего финализированного блока](https://docs.fastnear.com/ru/neardata/last-block-final)
- [опроса заголовков блоков](https://docs.fastnear.com/ru/neardata/block-headers)

## Перед интеграцией

Вот детали, которые технические команды обычно хотят понять заранее:

- [Аутентификация и доступ](https://docs.fastnear.com/ru/auth): отправляйте API-ключ FastNear через заголовок `Authorization: Bearer` или URL-параметр `?apiKey=`.
- [FastNear Dashboard](https://dashboard.fastnear.com): управляйте API-ключами и переходите на сценарии с более высокими лимитами.
- [Статус FastNear](https://status.fastnear.com): проверяйте инциденты и деградацию сервиса до отладки поведения приложения.
- [Справочник RPC](https://docs.fastnear.com/ru/rpc): выбирайте между обычным и архивным RPC в зависимости от нужного объёма истории цепочки.
- [Снапшоты](https://docs.fastnear.com/ru/snapshots): поднимайте инфраструктуру быстрее, если разворачиваете RPC- или архивные узлы.

## Практические рекомендации по выбору поверхности

- Начинайте со [Справочника RPC](https://docs.fastnear.com/ru/rpc), когда нужны канонические запросы JSON-RPC, отправка транзакций или ответы напрямую из протокола.
- Начинайте с [FastNear API](https://docs.fastnear.com/ru/api), когда строите кошелёк, обозреватель или портфельный продукт и хотите получить индексированные представления аккаунта.
- Начинайте с [Транзакции API](https://docs.fastnear.com/ru/tx), когда важны активность по аккаунту, квитанции и история исполнения.
- Начинайте с [NEAR Data API](https://docs.fastnear.com/ru/neardata), когда опрашиваете свежие данные по блокам и не собираетесь подавать сервис как потоковую инфраструктуру.

## Другие семейства API

Эти дополнительные API остаются полезными и после знакомства с основными поверхностями выше:

- [FastNear API](https://docs.fastnear.com/ru/api): Индексированные представления аккаунтов для балансов, NFT, стейкинга и поиска по публичным ключам.
- [Транзакции API](https://docs.fastnear.com/ru/tx): История аккаунтов, блоков, квитанций и транзакций из индексированных данных исполнения.
- [API переводов](https://docs.fastnear.com/ru/transfers): Специализированная история переводов для активности аккаунтов и интерфейсов с тяжёлой пагинацией.
- [KV FastData API](https://docs.fastnear.com/ru/fastdata/kv): Индексированная история данных «ключ-значение» и выборки последнего состояния для анализа хранилища контрактов.
- [NEAR Data API](https://docs.fastnear.com/ru/neardata): Недавние финализированные и оптимистичные чтения семейств блоков для низколатентного опроса.

## Если вы создаёте решение для AI или агентов

- Начните с [Хаба для агентов](https://docs.fastnear.com/ru/agents), где собраны выбор поверхности, работа с ключами и типовые сценарии.
- Используйте [Как выбрать подходящую поверхность](https://docs.fastnear.com/ru/agents/choosing-surfaces), чтобы сопоставить задачу агента с одной поверхностью FastNear.
- Используйте [Аутентификацию для агентов](https://docs.fastnear.com/ru/agents/auth), когда вызывающая сторона — это сервис автоматизации, воркер или среда выполнения агента.
- Берите за основу [Сценарии для агентов](https://docs.fastnear.com/ru/agents/playbooks), если нужен конкретный шаблон рабочего процесса.
- Используйте действие страницы `Копировать Markdown`, чтобы переносить чистый контекст документации в промпты, заметки и среды выполнения агентов.
