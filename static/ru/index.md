**Источник:** [https://docs.fastnear.com/ru](https://docs.fastnear.com/ru)

<!-- FASTNEAR_AI_DISCOVERY: Разработчикам агентов стоит начинать с /agents/choosing-surfaces, затем использовать /agents/auth для безопасной работы с учётными данными и /agents/playbooks для типовых сценариев. -->

      Обзор документации FastNear
      Выберите API или справочник FastNear.

        Используйте RPC для канонических чтений состояния по JSON-RPC, вызовов контрактов и отправки транзакций. Используйте индексированные API для балансов, активов, истории активности и свежих данных семейства блоков.

        [Начать с FastNear API](https://docs.fastnear.com/ru/api)
        [Начать с RPC](https://docs.fastnear.com/ru/rpc)
        [Получить API-ключ](https://docs.fastnear.com/ru/auth)

          Аутентификация
          API-ключи FastNear работают и для RPC, и для API.

            Заголовок
            Authorization: Bearer ...

            URL-параметр
            ?apiKey=...

          Сначала возьмите ключ — войдите на [dashboard.fastnear.com](https://dashboard.fastnear.com) через Google или email, получите бесплатные стартовые кредиты и подключайте месячную подписку или бессрочные резервные кредиты только тогда, когда понадобятся повышенные лимиты.

      Быстрая маршрутизация

          Большинство команд начинают здесь
          [FastNear API](https://docs.fastnear.com/ru/api)
          Индексированные эндпоинты для аккаунтов, активов, стейкинга и публичных ключей для чтения в прикладных сценариях вокруг аккаунта.

          На уровне протокола
          [Справочник RPC](https://docs.fastnear.com/ru/rpc)
          Канонические методы JSON-RPC для блоков, вызовов контрактов, валидаторов и отправки транзакций.

          История исполнения
          [Транзакции API](https://docs.fastnear.com/ru/tx)
          Активность аккаунта, квитанции, поиск транзакций и история по блокам из индексированных данных исполнения.

          Чтения с низкой задержкой
          [NEAR Data API](https://docs.fastnear.com/ru/neardata)
          Свежие оптимистичные и финализированные блоки, заголовки и вспомогательные перенаправления для опроса и лёгкого мониторинга.

      Основные API и справочники
      Это основные точки входа FastNear.

        Начните с API или раздела справочника, подходящего под нужные данные, затем переходите к подробному справочнику по конкретному эндпоинту.

        Индексированные представления аккаунта
        [FastNear API](https://docs.fastnear.com/ru/api)

          Используйте индексированные REST-эндпоинты для балансов, NFT, позиций стейкинга и поиска по публичному ключу без сырых обёрток запросов и ответов JSON-RPC.

          Полезные ссылки
          [Полное состояние аккаунта](https://docs.fastnear.com/ru/api/v1/account-full)
          [Балансы FT-токенов](https://docs.fastnear.com/ru/api/v1/account-ft)
          [Активы NFT](https://docs.fastnear.com/ru/api/v1/account-nft)
          [Поиск по публичному ключу](https://docs.fastnear.com/ru/api/v1/public-key)

        Канонический JSON-RPC
        [Справочник RPC](https://docs.fastnear.com/ru/rpc)

          Используйте методы на уровне протокола для прямых чтений состояния, отправки транзакций, вызовов контрактов и инспекции цепочки.

          Полезные ссылки
          [Состояние аккаунта](https://docs.fastnear.com/ru/rpc/account/view-account)
          [Поиск блоков](https://docs.fastnear.com/ru/rpc/block/block-by-id)
          [view-вызовы контрактов](https://docs.fastnear.com/ru/rpc/contract/call-function)
          [Данные валидаторов](https://docs.fastnear.com/ru/rpc/validators/validators-current)

        История исполнения
        [Транзакции API](https://docs.fastnear.com/ru/tx)

          Используйте индексированные эндпоинты для активности аккаунта, квитанций, поиска транзакций и истории исполнения по блокам.

          Полезные ссылки
          [Активность аккаунта](https://docs.fastnear.com/ru/tx/account)
          [Поиск транзакций](https://docs.fastnear.com/ru/tx/transactions)
          [Трассировка квитанций](https://docs.fastnear.com/ru/tx/receipt)
          [История транзакций по блоку](https://docs.fastnear.com/ru/tx/blocks)

        Свежие чтения семейства блоков
        [NEAR Data API](https://docs.fastnear.com/ru/neardata)

          Используйте NEAR Data для свежих оптимистичных и финализированных блоков, заголовков блоков и маршрутов-помощников по последнему блоку, когда нужны чтения почти в реальном времени или лёгкий мониторинг.

          Полезные ссылки
          [Оптимистичные чтения блоков](https://docs.fastnear.com/ru/neardata/block-optimistic)
          [Последний финализированный блок](https://docs.fastnear.com/ru/neardata/last-block-final)
          [Опрос заголовков блоков](https://docs.fastnear.com/ru/neardata/block-headers)

      Операции и доступ
      Всё, о чём команды обычно спрашивают перед переходом на продовые лимиты.
      Держите под рукой на переходе от исследования к продовым нагрузкам.

        Повышенные лимиты
        [Аутентификация и доступ](https://docs.fastnear.com/ru/auth)
        Один API-ключ FastNear работает и для RPC, и для REST API.

        Ключи и оплата
        [Dashboard](https://dashboard.fastnear.com)
        Войдите, создайте ключи и переходите на сценарии с более высокими лимитами, когда понадобится.

        Живые операции
        [Status](https://status.fastnear.com)
        Проверяйте инциденты и деградацию сервиса до отладки поведения приложения.

        Подъём инфраструктуры
        [Снапшоты](https://docs.fastnear.com/ru/snapshots)
        Поднимайте инфраструктуру RPC или архива быстрее, без повторного воспроизведения цепочки с нуля.

      Агенты и автоматизация
      Строите с ИИ-агентами или фоновыми воркерами?

        Используйте документацию для агентов, чтобы настроить режим работы с учётными данными, логику маршрутизации и Markdown-экспорты, пригодные для промптов.

      [Открыть хаб агентов](https://docs.fastnear.com/ru/agents)
      [Как выбрать поверхность](https://docs.fastnear.com/ru/agents/choosing-surfaces)
