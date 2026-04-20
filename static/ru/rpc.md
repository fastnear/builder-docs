**Источник:** [https://docs.fastnear.com/ru/rpc](https://docs.fastnear.com/ru/rpc)

# Справочник RPC

FastNear RPC даёт прямой доступ по JSON-RPC к узлам NEAR для запросов состояния, проверки блоков и чанков, отправки транзакций, чтения данных валидаторов и диагностики протокола.

## Базовые URL

Обычные RPC хранят самые свежие эпохи состояния и подходят для большинства прикладных запросов по умолчанию:

```bash title="Обычный RPC mainnet"
https://rpc.mainnet.fastnear.com
```

```bash title="Обычный RPC testnet"
https://rpc.testnet.fastnear.com
```

Архивные RPC открывают всю историю цепочки, когда нужны старые блоки, квитанции или историческое состояние контракта:

```bash title="Архивный RPC mainnet"
https://archival-rpc.mainnet.fastnear.com
```

```bash title="Архивный RPC testnet"
https://archival-rpc.testnet.fastnear.com
```

## С чего обычно начинают

- [`view_account`](https://docs.fastnear.com/ru/rpc/account/view-account), [`view_access_key`](https://docs.fastnear.com/ru/rpc/account/view-access-key), [`view_access_key_list`](https://docs.fastnear.com/ru/rpc/account/view-access-key-list) — запросы по аккаунту и ключам доступа.
- [`block`](https://docs.fastnear.com/ru/rpc/block/block-by-id) — поиск по высоте или хешу; [`block_effects`](https://docs.fastnear.com/ru/rpc/block/block-effects) — изменения внутри блока.
- [`call_function`](https://docs.fastnear.com/ru/rpc/contract/call-function), [`view_code`](https://docs.fastnear.com/ru/rpc/contract/view-code), [`view_state`](https://docs.fastnear.com/ru/rpc/contract/view-state) — работа с контрактами.
- [`status`](https://docs.fastnear.com/ru/rpc/protocol/status), [`health`](https://docs.fastnear.com/ru/rpc/protocol/health), [`gas_price`](https://docs.fastnear.com/ru/rpc/protocol/gas-price) — диагностика узла и протокола.
- [`send_tx`](https://docs.fastnear.com/ru/rpc/transaction/send-tx) — отправка транзакций; [`tx`](https://docs.fastnear.com/ru/rpc/transaction/tx-status) — статус исполнения.
- [`validators`](https://docs.fastnear.com/ru/rpc/validators/validators-current) — валидаторы текущей эпохи.

## Нужен сценарий?

Используйте [примеры RPC](https://docs.fastnear.com/ru/rpc/examples) для практических примеров: точных проверок состояния, анализа блоков, view-вызовов контрактов и отправки транзакций с подтверждением.

## Используйте RPC, когда

- нужны канонические формы запросов и ответов из протокола;
- важно поведение настоящего узла для запросов состояния и поиска блоков;
- требуется отправка транзакций или проверка результатов исполнения;
- нужен самый низкоуровневый доступ до перехода к индексированным или продуктовым представлениям.

## Не используйте RPC, когда

- нужен единый вызов для получения балансов, NFT, позиций стейкинга или поиска по публичному ключу;
- нужна индексированная история транзакций по аккаунту вместо опроса узлов и сшивания ответов;
- простота продуктового интерфейса важнее прямого контроля над протоколом.

В этих случаях переходите к индексированным REST-семействам, например [FastNear API](https://docs.fastnear.com/ru/api), [Транзакции API](https://docs.fastnear.com/ru/tx) или [NEAR Data API](https://docs.fastnear.com/ru/neardata).

## Аутентификация и лимиты

- API-ключи FastNear необязательны; публичные эндпоинты работают и без них.
- Для повышенных лимитов или единой аутентифицированной модели используйте [Аутентификацию и доступ](https://docs.fastnear.com/ru/auth): один и тот же ключ работает и на обычных, и на архивных RPC-хостах и передаётся либо в заголовке `Authorization: Bearer`, либо в URL-параметре `?apiKey=`.

## Общие интерактивные примеры

- Используйте `Copy example URL` на любой интерактивной RPC-странице, чтобы поделиться выбранной сетью, вкладкой примера, финальностью и заполненными входными данными.
- Общие URL примеров выполняются автоматически при загрузке, когда в них есть состояние операции.
- Сохранённые API-ключи и токены никогда не включаются в такие общедоступные URL документации.

## Устранение неполадок

### Запрос работает локально, но падает на продовом контуре

Проверьте, не полагались ли вы на то, что интерфейс документации автоматически подставляет API-ключ. Продовые бэкенды должны передавать учётные данные явно и не зависеть от хранения в браузере.

### Мне нужно более старое состояние, чем возвращает обычный RPC

Переключитесь с обычного RPC-эндпоинта на архивный RPC-эндпоинт.

Один и тот же FastNear API-ключ и один и тот же способ передачи через заголовок или параметр запроса работают на обоих хостах.

### Мне нужен более простой ответ, чем даёт JSON-RPC

Обычно это означает, что нужно индексированное REST-семейство, а не сырой RPC. Воспользуйтесь страницей выбора поверхности и подберите более высокий уровень абстракции.
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- FastNear предлагает щедрые кредиты и бесплатный пробный период.
- Быстро получите пробный аккаунт на [dashboard.fastnear.com](https://dashboard.fastnear.com).
