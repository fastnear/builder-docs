**Источник:** [https://docs.fastnear.com/ru/rpc/examples](https://docs.fastnear.com/ru/rpc/examples)

# Примеры RPC

Используйте эту страницу, когда уже понятно, что ответ должен опираться на каноническое поведение RPC, и нужен самый короткий путь по документации. Цель не в том, чтобы запомнить каждый метод, а в том, чтобы выбрать правильную стартовую страницу, остановиться, как только RPC-ответ уже решает задачу, и расширять набор поверхностей только тогда, когда это действительно поможет.

## Когда начинать здесь

- Пользователь просит точное состояние в цепочке или поля в протокольной форме.
- Нужен прямой вызов view-метода контракта или сценарий отправки транзакции.
- Нужно исследовать блоки, чанки, валидаторов или метаданные протокола.
- Важна семантика узла, а не индексированное агрегированное представление.

## Минимальные входные данные

- сеть: mainnet или testnet
- основной идентификатор: `account_id`, публичный ключ, ID контракта плюс метод, хеш транзакции или высота/хеш блока
- нужно ли текущее состояние, историческое состояние или поведение отправки/финальности
- должен ли результат остаться каноническим или затем превратиться в более удобное для человека резюме

## Частые задачи

### Проверить точное состояние аккаунта или ключа доступа

**Начните здесь**

- [View Account](https://docs.fastnear.com/ru/rpc/account/view-account) для канонических полей аккаунта.
- [View Access Key](https://docs.fastnear.com/ru/rpc/account/view-access-key) или [View Access Key List](https://docs.fastnear.com/ru/rpc/account/view-access-key-list) для проверки ключей.

**Следующая страница при необходимости**

- [FastNear API full account view](https://docs.fastnear.com/ru/api/v1/account-full), если после подтверждения канонического состояния нужна ещё и сводка в формате кошелька.
- [Transactions API account history](https://docs.fastnear.com/ru/tx/account), если следующий вопрос звучит как «что этот аккаунт делал недавно?»

**Остановитесь, когда**

- Поля RPC уже отвечают на вопрос о состоянии или правах доступа.

**Расширяйте, когда**

- Пользователю нужны балансы, NFT, стейкинг или другой продуктовый вид данных.
- Пользователя интересует не текущее каноническое состояние, а недавняя история активности.

### Проверить блок или снимок состояния протокола

**Начните здесь**

- [Block by ID](https://docs.fastnear.com/ru/rpc/block/block-by-id) или [Block by Height](https://docs.fastnear.com/ru/rpc/block/block-by-height) для конкретного блока.
- [Latest Block](https://docs.fastnear.com/ru/rpc/protocol/latest-block) для текущей канонической головы цепочки.
- [Status](https://docs.fastnear.com/ru/rpc/protocol/status), [Health](https://docs.fastnear.com/ru/rpc/protocol/health) или [Network Info](https://docs.fastnear.com/ru/rpc/protocol/network-info) для диагностики узла и сети.

**Следующая страница при необходимости**

- [Block Effects](https://docs.fastnear.com/ru/rpc/block/block-effects), если после поиска блока нужен контекст по изменениям состояния.
- [Transactions API block history](https://docs.fastnear.com/ru/tx/block) или [Transactions API block range](https://docs.fastnear.com/ru/tx/blocks), если нужна более читаемая картина исполнения в рамках блока или диапазона.

**Остановитесь, когда**

- Канонический ответ блока или протокола уже напрямую отвечает на вопрос.

**Расширяйте, когда**

- Нужны данные по свежим блокам в режиме опроса, а не один канонический снимок. Переходите к [NEAR Data API](https://docs.fastnear.com/ru/neardata).
- Нужна история по нескольким транзакциям, а не только ответ одного блока. Переходите к [Transactions API](https://docs.fastnear.com/ru/tx).

### Выполнить view-вызов контракта

**Начните здесь**

- [Call Function](https://docs.fastnear.com/ru/rpc/contract/call-function) для view-метода контракта.
- [View State](https://docs.fastnear.com/ru/rpc/contract/view-state), когда вопрос касается сырого хранилища контракта.
- [View Code](https://docs.fastnear.com/ru/rpc/contract/view-code), когда на самом деле нужно понять, есть ли код и каков его хеш.

**Следующая страница при необходимости**

- [FastNear API](https://docs.fastnear.com/ru/api), если после сырого вызова пользователю нужен продуктовый ответ, например по активам или сводке аккаунта.
- [KV FastData API](https://docs.fastnear.com/ru/fastdata/kv), если следующая задача связана с индексированной историей по ключам и значениям, а не с точным RPC-чтением.

**Остановитесь, когда**

- Результат view-вызова уже отвечает на вопрос в канонической форме.

**Расширяйте, когда**

- Пользователю нужна индексированная история или более простое резюме вместо сырого ответа контракта.
- Вопрос смещается от «что метод возвращает сейчас?» к «что менялось со временем?»

### Отправить транзакцию и подтвердить результат

**Начните здесь**

- [Send Transaction](https://docs.fastnear.com/ru/rpc/transaction/send-tx), когда нужно каноническое поведение отправки с явной семантикой ожидания.
- [Broadcast Transaction Async](https://docs.fastnear.com/ru/rpc/transaction/broadcast-tx-async) или [Broadcast Transaction Commit](https://docs.fastnear.com/ru/rpc/transaction/broadcast-tx-commit), когда важны именно эти режимы отправки.
- [Transaction Status](https://docs.fastnear.com/ru/rpc/transaction/tx-status), чтобы подтвердить канонический результат.

**Следующая страница при необходимости**

- [Transactions by Hash](https://docs.fastnear.com/ru/tx/transactions), если после отправки нужна более читаемая история по транзакции.
- [Receipt Lookup](https://docs.fastnear.com/ru/tx/receipt), если нужно исследовать последующее исполнение или цепочку обратных вызовов.

**Остановитесь, когда**

- У вас уже есть результат отправки и нужный канонический финальный статус.

**Расширяйте, когда**

- Следующий вопрос относится к квитанциям, затронутым аккаунтам или истории исполнения в более человеческом порядке.
- Нужен уже не единичный статус, а более широкий сценарий расследования.

## Частые ошибки

- Начинать с RPC, когда пользователю на самом деле нужна сводка по активам или индексированная история.
- Забывать переключаться с обычного RPC на архивный RPC для старого состояния.
- Воспринимать браузерную аутентификацию в интерфейсе документации как продовый паттерн для бэкенда.
- Продолжать пользоваться низкоуровневыми статусами транзакций, когда вопрос уже превратился в расследование или исторический разбор.

## Полезные связанные страницы

- [RPC Reference](https://docs.fastnear.com/ru/rpc)
- [Auth & Access](https://docs.fastnear.com/ru/auth)
- [FastNear API](https://docs.fastnear.com/ru/api)
- [Transactions API](https://docs.fastnear.com/ru/tx)
- [Choosing the Right Surface](https://docs.fastnear.com/ru/agents/choosing-surfaces)
- [Agent Playbooks](https://docs.fastnear.com/ru/agents/playbooks)
