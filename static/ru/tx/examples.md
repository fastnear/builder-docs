**Источник:** [https://docs.fastnear.com/ru/tx/examples](https://docs.fastnear.com/ru/tx/examples)

# Примеры Transactions API

Используйте эту страницу, когда вопрос звучит как «что произошло?» и нужен индексированный исторический слой до того, как вы перейдёте к каноническому подтверждению через RPC. Начинайте с того идентификатора, который уже есть на руках, объясняйте историю исполнения в читаемом порядке и расширяйте её только тогда, когда действительно понадобятся точные RPC-семантики.

## Когда начинать здесь

- У вас уже есть хеш транзакции, ID квитанции, ID аккаунта или ограниченный диапазон блоков.
- Пользователю нужен исторический контекст исполнения, разбор для поддержки или отладки либо читаемая временная шкала.
- Нужна индексированная история без ручной сборки из сырых RPC-вызовов.
- Первый ответ должен объяснить, что произошло, до углубления в протокольные детали.

## Минимальные входные данные

- сеть: mainnet или testnet
- основной идентификатор: хеш транзакции, ID квитанции, `account_id` или блок/диапазон блоков
- расследуете ли вы один объект или целое окно истории
- требуется ли точное каноническое подтверждение через RPC до завершения ответа

## Частые задачи

### Найти одну транзакцию

**Начните здесь**

- [Transactions by Hash](https://docs.fastnear.com/ru/tx/transactions), когда идентификатор транзакции уже известен.

**Следующая страница при необходимости**

- [Receipt Lookup](https://docs.fastnear.com/ru/tx/receipt), если важной стала последующая квитанция.
- [Block](https://docs.fastnear.com/ru/tx/block), если нужен контекст блока.
- [Transaction Status](https://docs.fastnear.com/ru/rpc/transaction/tx-status), если требуется каноническое подтверждение через RPC.

**Остановитесь, когда**

- Уже можно объяснить результат, затронутые аккаунты и главный вывод по исполнению.

**Расширяйте, когда**

- Пользователь спрашивает о точной RPC-семантике статуса или поведения отправки.
- Одного поиска по транзакции недостаточно, чтобы объяснить последующее исполнение.

### Исследовать квитанцию

**Начните здесь**

- [Receipt Lookup](https://docs.fastnear.com/ru/tx/receipt), когда ID квитанции — лучший якорь для расследования.

**Следующая страница при необходимости**

- [Transactions by Hash](https://docs.fastnear.com/ru/tx/transactions), чтобы связать квитанцию с исходной транзакцией.
- [Account History](https://docs.fastnear.com/ru/tx/account), если нужно увидеть активность вокруг одного из затронутых аккаунтов.

**Остановитесь, когда**

- Уже можно объяснить, где квитанция находится в цепочке исполнения и почему она важна.

**Расширяйте, когда**

- Нужна точная каноническая проверка сверх индексированного вида квитанции. Переходите к [RPC Reference](https://docs.fastnear.com/ru/rpc).
- Вопрос расширяется от одной квитанции к более широкому историческому расследованию.

### Посмотреть недавнюю активность аккаунта

**Начните здесь**

- [Account History](https://docs.fastnear.com/ru/tx/account) для ленты активности по аккаунту.

**Следующая страница при необходимости**

- [Transactions by Hash](https://docs.fastnear.com/ru/tx/transactions) для конкретной транзакции из ленты.
- [Receipt Lookup](https://docs.fastnear.com/ru/tx/receipt), если фокус смещается на одну квитанцию.

**Остановитесь, когда**

- История аккаунта уже отвечает на вопрос о том, что этот аккаунт делал.

**Расширяйте, когда**

- Пользователя интересуют только переводы, а не более широкий контекст исполнения. Переходите к [Transfers API](https://docs.fastnear.com/ru/transfers).
- Пользователю нужно точное текущее состояние или активы, а не история. Переходите к [RPC Reference](https://docs.fastnear.com/ru/rpc) или [FastNear API](https://docs.fastnear.com/ru/api).

### Восстановить ограниченное окно по блокам

**Начните здесь**

- [Blocks](https://docs.fastnear.com/ru/tx/blocks) для ограниченного просмотра диапазона блоков.
- [Block](https://docs.fastnear.com/ru/tx/block), когда известен точный блок, который нужно исследовать.

**Следующая страница при необходимости**

- [Transactions by Hash](https://docs.fastnear.com/ru/tx/transactions), чтобы провалиться в конкретный элемент из окна блоков.
- [Receipt Lookup](https://docs.fastnear.com/ru/tx/receipt), если одной квитанции достаточно для следующего шага расследования.

**Остановитесь, когда**

- Ограниченное историческое окно уже отвечает на вопрос без перехода к более низкоуровневым протокольным деталям.

**Расширяйте, когда**

- Пользователю нужны точные канонические поля блока или финальность транзакции. Переходите к [RPC Reference](https://docs.fastnear.com/ru/rpc).
- На самом деле нужен polling по самым свежим блокам, а не индексированная история. Переходите к [NEAR Data API](https://docs.fastnear.com/ru/neardata).

## Готовые расследования

### Доказать порядок callback-ов в staged/release-сценарии

Используйте это расследование, когда сначала была стадия с асинхронной подготовкой работы, потом отдельный release, и нужно доказать не только успешность транзакций, но и конкретный порядок выполнения последующих обратных вызовов.

**Цель**

- Превратить два хеша транзакций в устойчивый артефакт для расследования, который включает граф квитанций, привязки к блокам и изменения состояния контракта.

В staged/release-сценариях именно stage-транзакция обычно остаётся главной опорной транзакцией расследования, потому что отложенные callback-и живут на её исходном дереве транзакции, а не на дереве release-транзакции.

| Поверхность | Эндпоинт | Как используем | Зачем используем |
| --- | --- | --- | --- |
| Захват трассы stage и release | RPC [`EXPERIMENTAL_tx_status`](https://docs.fastnear.com/ru/rpc/transaction/experimental-tx-status) | Запрашиваем хеш stage-транзакции и хеш release-транзакции с `wait_until: "FINAL"`, обычно сначала через основной RPC, а при `UNKNOWN_TRANSACTION` — через архивный RPC | Граф квитанций — это основная поверхность доказательства порядка callback-ов и лучший способ понять, какие квитанции принадлежат какому дереву транзакции |
| Проверка материализации stage | RPC [`query(call_function)`](https://docs.fastnear.com/ru/rpc/contract/call-function) | Опрашиваем view-метод staging-контракта, например `staged_calls_for({ caller_id })`, с `finality: "final"` до появления ожидаемых отложенных шагов | Подтверждает, что callback-и действительно стали доступны до того, как release-транзакция попытается их разбудить |
| Обогащение транзакций | Transactions API [`POST /v0/transactions`](https://docs.fastnear.com/ru/tx/transactions) | Забираем обе транзакции по хешам, чтобы получить `block_height`, `block_hash`, `receiver_id` и индексированный статус исполнения | Даёт каждой транзакции устойчивую привязку к блоку, чтобы дальнейший анализ не зависел от памяти или ручных заметок |
| Снимки состояния контракта recorder | RPC [`query(call_function)`](https://docs.fastnear.com/ru/rpc/contract/call-function) | Читаем состояние контракта recorder до release, а затем опрашиваем его после release до появления ожидаемых записей | Доказывает реальный порядок последующих эффектов в состоянии контракта, а не только в метаданных дерева квитанций |
| Переход по квитанции обратно к транзакции | Transactions API [`POST /v0/receipt`](https://docs.fastnear.com/ru/tx/receipt) | Используем любой интересный ID отложенной или последующей квитанции, чтобы снова привязать его к исходной транзакции | Позволяет быстро перейти от одной квитанции в графе обратно к более широкому рассказу о транзакции |
| Реконструкция по блокам | Transactions API [`POST /v0/block`](https://docs.fastnear.com/ru/tx/block) | Загружаем включающий блок и каскадные блоки с включёнными квитанциями | Восстанавливает временную шкалу исполнения по блокам, когда уже понятно, какие высоты важны |
| Контекст активности аккаунтов | Transactions API [`POST /v0/account`](https://docs.fastnear.com/ru/tx/account) | Запрашиваем историю вызовов функций для контрактов, участвовавших в каскаде, в том же окне | Даёт более удобное для человека представление истории аккаунтов, которое можно сопоставить с трассой |
| Повторное чтение состояния с привязкой к блоку | RPC [`query(call_function)`](https://docs.fastnear.com/ru/rpc/contract/call-function) | Повторно запускаем нужный view-метод recorder с `block_id`, закреплённым на интересных высотах | Превращает итоговое состояние во временной ряд, чтобы можно было сказать не только что изменилось, но и когда именно |

**Что должен включать полезный ответ**

- почему именно stage-транзакция, а не release-транзакция, обычно является главной опорной транзакцией расследования
- какой порядок callback-ов вы наблюдали
- в каких блоках стали видны изменения состояния
- какие receipt-ы или account-pivot-ы стоит сохранить для следующего расследования

### Начать с receipt ID и восстановить историю исполнения

Используйте это расследование, когда на руках есть только receipt ID из трассы, лога ошибки или дерева callback-ов и нужно вернуться к понятной человеку истории того, что произошло.

**Цель**

- Перейти от одной квитанции к исходной транзакции, а затем расширить расследование ровно настолько, чтобы объяснить окружающее исполнение и эффекты в состоянии.

| Поверхность | Эндпоинт | Как используем | Зачем используем |
| --- | --- | --- | --- |
| Якорь по квитанции | Transactions API [`POST /v0/receipt`](https://docs.fastnear.com/ru/tx/receipt) | Сначала ищем ID квитанции и определяем её содержимое, статус и связанный контекст транзакции | ID квитанции часто появляется в трассах и логах раньше, чем у человека складывается цельная история транзакции |
| История транзакции | Transactions API [`POST /v0/transactions`](https://docs.fastnear.com/ru/tx/transactions) | После перехода из поиска квитанции забираем исходную транзакцию по хешу | Превращает одну квитанцию в читаемую историю исполнения с контекстом по получателю, блоку и статусу |
| Каноническое подтверждение | RPC [`tx`](https://docs.fastnear.com/ru/rpc/transaction/tx-status) или [`EXPERIMENTAL_tx_status`](https://docs.fastnear.com/ru/rpc/transaction/experimental-tx-status) | Подтверждаем результат на уровне протокола, когда индексированного вида недостаточно или нужны точные RPC-семантики | Полезно, когда важно различить индексированную интерпретацию и точное поведение RPC |
| Контекст блока | Transactions API [`POST /v0/block`](https://docs.fastnear.com/ru/tx/block) | Загружаем содержащий блок и при необходимости расширяемся на соседние каскадные блоки, если исполнение растянулось по нескольким высотам | Помещает квитанцию во временную шкалу по блокам, которую проще объяснить |
| Окно активности аккаунта | Transactions API [`POST /v0/account`](https://docs.fastnear.com/ru/tx/account) | Забираем недавнюю активность аккаунтов, которых коснулась квитанция | Помогает связать квитанцию с окружающей историей по аккаунтам |
| Повторное чтение состояния | RPC [`query(call_function)`](https://docs.fastnear.com/ru/rpc/contract/call-function) | Повторно запускаем нужный view-метод с закреплённым `block_id`, если квитанция изменила видимое состояние контракта | Позволяет доказать, что квитанция не только существовала в метаданных, но и изменила устойчивое состояние контракта |

**Что должен включать полезный ответ**

- какую исходную транзакцию вы восстановили из квитанции
- была ли квитанция главным событием или только одним шагом в большом каскаде
- какой минимальный контекст по блоку и аккаунтам нужен, чтобы её объяснить
- был ли эффект на состояние устойчивым и на какой высоте блока он стал видимым

### Доказать, что `mike.near` установил `profile.name` в `Mike Purvis`, а затем восстановить транзакцию записи профиля в SocialDB

Используйте это расследование, когда история звучит так: «я вижу `Mike Purvis` в профиле NEAR Social аккаунта `mike.near`, но хочу точно доказать, когда это поле было записано и какая транзакция его записала».

**Цель**

- Начать с одного читаемого поля профиля в SocialDB, а затем восстановить точный receipt и исходную транзакцию, которые его записали.

**Официальные ссылки**

- [API и поверхность контракта SocialDB](https://github.com/NearSocial/social-db#api)
- [Живая поверхность чтения NEAR Social](https://api.near.social)

Этот сценарий следует тому же рецепту доказательства, что и расследование по подписке, но добавляет ещё один важный нюанс SocialDB: для исторического доказательства `:block` на уровне конкретного поля обычно точнее, чем `:block` у родительского объекта. В этом живом примере `mike.near/profile/name` был записан на блоке `78675795`, тогда как более широкий объект `mike.near/profile` позже сдвинулся на другой блок из-за изменений в соседних полях. Роль FastNear в этом сценарии — превратить этот блок уровня поля в receipt, затем в транзакцию и потом в читаемый payload записи.

Для этого живого примера текущее значение `profile.name` равно `Mike Purvis`, блок записи SocialDB на уровне поля равен `78675795`, ID receipt — `2gbAmEEdcCNARuCorquXStftqvWFmPG2GSaMJXFw5qiN`, хеш исходной транзакции — `6zMb9L6rLNufZGUgCmeHTh5LvFsn3R92dPxuubH6MRsZ`, а внешний блок транзакции — `78675794`.

| Поверхность | Эндпоинт | Как используем | Зачем используем |
| --- | --- | --- | --- |
| Семантическое чтение поля | NEAR Social `POST /get` | Читаем `mike.near/profile/name` с включёнными метаданными блока | Даёт читаемое значение поля и опорный `:block` SocialDB на уровне поля, где это значение было записано |
| Мост к receipt | Transactions API [`POST /v0/block`](https://docs.fastnear.com/ru/tx/block) | Используем блок уровня поля из SocialDB с `with_receipts: true`, а затем фильтруем receipt обратно до `mike.near -> social.near` | Превращает блок записи уровня поля в конкретный receipt и хеш исходной транзакции |
| История транзакции | Transactions API [`POST /v0/transactions`](https://docs.fastnear.com/ru/tx/transactions) | Загружаем исходную транзакцию по хешу и декодируем payload первого `FunctionCall.args` | Доказывает, что базовая запись была вызовом `social.near set`, который нёс `profile.name` и окружающие поля профиля в одном payload |
| Каноническое подтверждение текущего состояния | RPC [`query(call_function)`](https://docs.fastnear.com/ru/rpc/contract/call-function) | Напрямую вызываем `social.near get` с `final` | Подтверждает, что поле и сейчас имеет это значение, хотя предыдущие шаги уже доказали конкретную историческую запись |

**Что должен включать полезный ответ**

- разрешается ли `mike.near/profile/name` сейчас в `Mike Purvis`
- высоту блока записи SocialDB на уровне поля (`78675795`) и объяснение, почему для этого вопроса этот якорь лучше, чем блок родительского профиля
- конкретный ID receipt и хеш исходной транзакции за этой записью
- доказательство того, что запись была вызовом `set`, который нёс `profile.name` и другие поля профиля в том же payload
- различие между блоком исполнения receipt (`78675795`) и блоком включения внешней транзакции (`78675794`)

### Shell-сценарий доказательства поля профиля в NEAR Social

Используйте этот сценарий, когда нужен конкретный и воспроизводимый путь доказательства: от читаемого поля профиля в NEAR Social до точной транзакции записи в SocialDB.

**Что вы делаете**

- Читаете текущее поле `profile.name` из NEAR Social и сохраняете блок записи SocialDB на уровне поля.
- Переиспользуете эту высоту блока в FastNear block receipts, чтобы получить ID receipt и хеш транзакции.
- Переиспользуете хеш транзакции в `POST /v0/transactions`, чтобы доказать, что payload был записью `social.near set`, несущей `profile.name`.
- Завершаете каноническим RPC-подтверждением того, что поле всё ещё разрешается в то же значение на `final`.

```bash
SOCIAL_API_BASE_URL=https://api.near.social
TX_BASE_URL=https://tx.main.fastnear.com
RPC_URL=https://rpc.mainnet.fastnear.com
ACCOUNT_ID=mike.near
PROFILE_FIELD=profile/name
```

1. Прочитайте поле профиля из NEAR Social и сохраните блок записи SocialDB на уровне поля.

```bash
PROFILE_BLOCK_HEIGHT="$(
  curl -s "$SOCIAL_API_BASE_URL/get" \
    -H 'content-type: application/json' \
    --data "$(jq -nc \
      --arg account_id "$ACCOUNT_ID" \
      --arg profile_field "$PROFILE_FIELD" '{
        keys: [($account_id + "/" + $profile_field)],
        options: {with_block_height: true}
      }')" \
    | tee /tmp/mike-profile-name.json \
    | jq -r --arg account_id "$ACCOUNT_ID" \
        '.[ $account_id ].profile.name[":block"]'
)"

jq --arg account_id "$ACCOUNT_ID" '{
  current_name: .[$account_id].profile.name[""],
  field_block_height: .[$account_id].profile.name[":block"],
  parent_profile_block_height: .[$account_id].profile[":block"]
}' /tmp/mike-profile-name.json

# Ожидаемое current_name: "Mike Purvis"
# Ожидаемая высота блока уровня поля: 78675795
```

2. Переиспользуйте эту высоту блока в FastNear block receipts и восстановите мост к receipt и транзакции.

```bash
PROFILE_TX_HASH="$(
  curl -s "$TX_BASE_URL/v0/block" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --argjson block_id "$PROFILE_BLOCK_HEIGHT" '{
      block_id: $block_id,
      with_transactions: false,
      with_receipts: true
    }')" \
    | tee /tmp/mike-profile-block.json \
    | jq -r --arg account_id "$ACCOUNT_ID" '
        first(
          .block_receipts[]
          | select(.predecessor_id == $account_id and .receiver_id == "social.near")
          | .transaction_hash
        )'
)"

jq --arg account_id "$ACCOUNT_ID" '{
  profile_receipt: (
    first(
      .block_receipts[]
      | select(.predecessor_id == $account_id and .receiver_id == "social.near")
      | {
          receipt_id,
          transaction_hash,
          block_height,
          tx_block_height
        }
    )
  )
}' /tmp/mike-profile-block.json

# Ожидаемый receipt ID: 2gbAmEEdcCNARuCorquXStftqvWFmPG2GSaMJXFw5qiN
# Ожидаемый хеш транзакции: 6zMb9L6rLNufZGUgCmeHTh5LvFsn3R92dPxuubH6MRsZ
```

3. Переиспользуйте полученный хеш транзакции в `POST /v0/transactions` и декодируйте payload записи SocialDB.

```bash
curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$PROFILE_TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | tee /tmp/mike-profile-transaction.json >/dev/null

jq '{
  transaction: {
    hash: .transactions[0].transaction.hash,
    signer_id: .transactions[0].transaction.signer_id,
    receiver_id: .transactions[0].transaction.receiver_id,
    included_block_height: .transactions[0].execution_outcome.block_height
  },
  write_proof: (
    .transactions[0].receipts[0].receipt.receipt.Action.actions[0].FunctionCall
    | {
        method_name,
        profile_name: (.args | @base64d | fromjson | .data["mike.near"].profile.name),
        description: (.args | @base64d | fromjson | .data["mike.near"].profile.description),
        tags: (
          .args
          | @base64d
          | fromjson
          | .data["mike.near"].profile.tags
          | keys
        )
      }
  )
}' /tmp/mike-profile-transaction.json
```

4. Завершите каноническим подтверждением текущего состояния через raw RPC.

```bash
SOCIAL_GET_ARGS_BASE64="$(
  jq -nr --arg account_id "$ACCOUNT_ID" --arg profile_field "$PROFILE_FIELD" '{
    keys: [($account_id + "/" + $profile_field)]
  } | @base64'
)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg args_base64 "$SOCIAL_GET_ARGS_BASE64" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "query",
    params: {
      request_type: "call_function",
      account_id: "social.near",
      method_name: "get",
      args_base64: $args_base64,
      finality: "final"
    }
  }')" \
  | tee /tmp/mike-profile-rpc.json >/dev/null

jq --arg account_id "$ACCOUNT_ID" '{
  finality: "final",
  current_name: (
    .result.result
    | implode
    | fromjson
    | .[$account_id].profile.name
  )
}' /tmp/mike-profile-rpc.json
```

Этот последний шаг подтверждает, что поле и сейчас разрешается в `Mike Purvis`. Предыдущие шаги через NEAR Social и FastNear доказали, какая именно историческая запись установила это поле и какая транзакция несла эту запись.

**Зачем нужен следующий шаг?**

NEAR Social даёт семантическое значение поля. FastNear block receipts дают мост к конкретной записи. FastNear lookup транзакции превращает эту запись в читаемый payload профиля. RPC даёт каноническое подтверждение текущего состояния.

### Доказать, что `mike.near` подписался на `mob.near`, а затем восстановить транзакцию записи в SocialDB

Используйте это расследование, когда история звучит так: «я вижу, что `mike.near` подписан на `mob.near`, но хочу точно доказать, когда именно была записана эта связь и какая транзакция её записала».

**Цель**

- Начать с читаемой связи подписки из NEAR Social, а затем восстановить точный receipt и исходную транзакцию, которые записали её в SocialDB.

**Официальные ссылки**

- [API и поверхность контракта SocialDB](https://github.com/NearSocial/social-db#api)
- [Живая поверхность чтения NEAR Social](https://api.near.social)

Читаемая связь подписки приходит из данных NEAR Social, а не из FastNear. Ключевой мост здесь — метаданные SocialDB `:block`: они указывают на блок, в котором исполнился receipt, записавший это значение. Этот блок не совпадает с блоком, в который была включена внешняя транзакция. Роль FastNear в этом сценарии — превратить эту высоту блока в receipt, затем в транзакцию и, наконец, в читаемую историю исполнения.

Для этого живого примера текущая связь выглядит как `mike.near -> mob.near`, блок записи SocialDB равен `79574924`, ID receipt — `UiyiQaqHbkkMxkrB6rDkYr7X5EQLt8QG9MDATrES7Th`, хеш исходной транзакции — `FLLmTvFx9vCof79scy2uUviF5WwYmevkz9TZ8azPGVQb`, а внешний блок транзакции — `79574923`.

| Поверхность | Эндпоинт | Как используем | Зачем используем |
| --- | --- | --- | --- |
| Семантическое чтение связи | NEAR Social `POST /get` | Читаем `mike.near/graph/follow/mob.near` с включёнными метаданными блока | Даёт читаемую связь подписки и опорный `:block` из SocialDB, где это значение было записано |
| Мост к receipt | Transactions API [`POST /v0/block`](https://docs.fastnear.com/ru/tx/block) | Используем высоту блока из SocialDB с `with_receipts: true`, а затем фильтруем receipt обратно до `mike.near -> social.near` | Превращает блок записи SocialDB в конкретный receipt и хеш исходной транзакции |
| История транзакции | Transactions API [`POST /v0/transactions`](https://docs.fastnear.com/ru/tx/transactions) | Загружаем исходную транзакцию по хешу и декодируем payload первого `FunctionCall.args` | Доказывает, что базовая запись была вызовом `social.near set`, который записал и `graph.follow`, и записи `index.graph` |
| Каноническое подтверждение текущего состояния | RPC [`query(call_function)`](https://docs.fastnear.com/ru/rpc/contract/call-function) | Напрямую вызываем `social.near get` с `final` | Подтверждает, что связь подписки существует и сейчас, хотя предыдущие шаги уже доказали конкретную историческую запись |

**Что должен включать полезный ответ**

- существует ли сейчас связь подписки `mike.near -> mob.near`
- высоту блока записи SocialDB (`79574924`) и объяснение, почему это блок исполнения receipt
- конкретный ID receipt и хеш исходной транзакции за этой записью
- доказательство того, что запись была вызовом `set`, который нёс и `graph.follow.mob.near`, и соответствующую запись `index.graph`
- различие между блоком исполнения receipt (`79574924`) и блоком включения внешней транзакции (`79574923`)

### Shell-сценарий доказательства подписки в NEAR Social

Используйте этот сценарий, когда нужен конкретный и воспроизводимый путь доказательства: от читаемой связи подписки в NEAR Social до точной транзакции записи в SocialDB.

**Что вы делаете**

- Читаете текущую связь подписки из NEAR Social и сохраняете блок записи SocialDB.
- Переиспользуете эту высоту блока в FastNear block receipts, чтобы получить ID receipt и хеш транзакции.
- Переиспользуете хеш транзакции в `POST /v0/transactions`, чтобы доказать, что payload был записью `social.near set`.
- Завершаете каноническим RPC-подтверждением того, что связь всё ещё существует на `final`.

```bash
SOCIAL_API_BASE_URL=https://api.near.social
TX_BASE_URL=https://tx.main.fastnear.com
RPC_URL=https://rpc.mainnet.fastnear.com
ACCOUNT_ID=mike.near
TARGET_ACCOUNT_ID=mob.near
```

1. Прочитайте связь подписки из NEAR Social и сохраните блок записи SocialDB.

```bash
FOLLOW_BLOCK_HEIGHT="$(
  curl -s "$SOCIAL_API_BASE_URL/get" \
    -H 'content-type: application/json' \
    --data "$(jq -nc \
      --arg account_id "$ACCOUNT_ID" \
      --arg target_account_id "$TARGET_ACCOUNT_ID" '{
        keys: [($account_id + "/graph/follow/" + $target_account_id)],
        options: {with_block_height: true}
      }')" \
    | tee /tmp/mike-follow-edge.json \
    | jq -r --arg account_id "$ACCOUNT_ID" --arg target_account_id "$TARGET_ACCOUNT_ID" \
        '.[ $account_id ].graph.follow[ $target_account_id ][":block"]'
)"

jq --arg account_id "$ACCOUNT_ID" --arg target_account_id "$TARGET_ACCOUNT_ID" '{
  follow_edge: .[$account_id].graph.follow[$target_account_id][""],
  follow_block_height: .[$account_id].graph.follow[$target_account_id][":block"]
}' /tmp/mike-follow-edge.json

# Ожидаемая высота блока записи: 79574924
```

2. Переиспользуйте эту высоту блока в FastNear block receipts и восстановите мост к receipt и транзакции.

```bash
FOLLOW_TX_HASH="$(
  curl -s "$TX_BASE_URL/v0/block" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --argjson block_id "$FOLLOW_BLOCK_HEIGHT" '{
      block_id: $block_id,
      with_transactions: false,
      with_receipts: true
    }')" \
    | tee /tmp/mike-follow-block.json \
    | jq -r --arg account_id "$ACCOUNT_ID" '
        first(
          .block_receipts[]
          | select(.predecessor_id == $account_id and .receiver_id == "social.near")
          | .transaction_hash
        )'
)"

jq --arg account_id "$ACCOUNT_ID" '{
  follow_receipt: (
    first(
      .block_receipts[]
      | select(.predecessor_id == $account_id and .receiver_id == "social.near")
      | {
          receipt_id,
          transaction_hash,
          block_height,
          tx_block_height
        }
    )
  )
}' /tmp/mike-follow-block.json

# Ожидаемый receipt ID: UiyiQaqHbkkMxkrB6rDkYr7X5EQLt8QG9MDATrES7Th
# Ожидаемый хеш транзакции: FLLmTvFx9vCof79scy2uUviF5WwYmevkz9TZ8azPGVQb
```

3. Переиспользуйте полученный хеш транзакции в `POST /v0/transactions` и декодируйте payload записи SocialDB.

```bash
curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$FOLLOW_TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | tee /tmp/mike-follow-transaction.json >/dev/null

jq '{
  transaction: {
    hash: .transactions[0].transaction.hash,
    signer_id: .transactions[0].transaction.signer_id,
    receiver_id: .transactions[0].transaction.receiver_id,
    included_block_height: .transactions[0].execution_outcome.block_height
  },
  write_proof: (
    .transactions[0].receipts[0].receipt.receipt.Action.actions[0].FunctionCall
    | {
        method_name,
        follow_edge: (.args | @base64d | fromjson | .data["mike.near"].graph.follow["mob.near"]),
        index_graph: (
          .args
          | @base64d
          | fromjson
          | .data["mike.near"].index.graph
          | fromjson
          | map(select(.value.accountId == "mob.near"))
        )
      }
  )
}' /tmp/mike-follow-transaction.json
```

4. Завершите каноническим подтверждением текущего состояния через raw RPC.

```bash
SOCIAL_GET_ARGS_BASE64="$(
  jq -nr --arg account_id "$ACCOUNT_ID" --arg target_account_id "$TARGET_ACCOUNT_ID" '{
    keys: [($account_id + "/graph/follow/" + $target_account_id)]
  } | @base64'
)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg args_base64 "$SOCIAL_GET_ARGS_BASE64" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "query",
    params: {
      request_type: "call_function",
      account_id: "social.near",
      method_name: "get",
      args_base64: $args_base64,
      finality: "final"
    }
  }')" \
  | tee /tmp/mike-follow-rpc.json >/dev/null

jq --arg account_id "$ACCOUNT_ID" --arg target_account_id "$TARGET_ACCOUNT_ID" '{
  finality: "final",
  current_follow_edge: (
    .result.result
    | implode
    | fromjson
    | .[$account_id].graph.follow[$target_account_id]
  )
}' /tmp/mike-follow-rpc.json
```

Этот последний шаг подтверждает, что связь подписки существует и сейчас. Предыдущие шаги через NEAR Social и FastNear доказали, какая именно историческая запись создала эту связь и какая транзакция несла эту запись.

**Зачем нужен следующий шаг?**

NEAR Social даёт семантическую связь. FastNear block receipts дают мост к конкретной записи. FastNear lookup транзакции превращает эту запись в читаемую историю. RPC даёт каноническое подтверждение текущего состояния.

### Понять двухстороннее сопоставление `token_diff`, а затем проследить живой расчёт NEAR Intents

Используйте это расследование, когда история звучит так: «покажи, что именно NEAR Intents делает под капотом, но привяжи разбор к публичным данным, которые можно проверить самостоятельно».

**Цель**

- Сначала объяснить модель сопоставления, а затем превратить один реальный расчёт через `intents.near` в читаемую историю исполнения на базе Transactions API и канонического RPC.

**Официальные ссылки**

- [Обзор NEAR Intents](https://docs.near.org/chain-abstraction/intents/overview)
- [Типы intent и исполнение](https://docs.near-intents.org/integration/verifier-contract/intent-types-and-execution)
- [Абстракция аккаунтов](https://docs.near-intents.org/integration/verifier-contract/account-abstraction)

#### Часть 1: анатомия протокола

Базовая форма сопоставления здесь — это `token_diff` intent. Одна сторона объявляет, какие активы она готова отдать и получить, а вторая сторона объявляет противоположную разницу. В официальной документации verifier двухсторонний обмен USDC и USDT показан как один подписанный intent со смыслом «я отдам `-10` USDC и получу `+10` USDT» и второй intent, который описывает обратную сторону сделки. Такие подписанные intent можно собрать через Message Bus или через любой другой внешний канал координации и затем отправить вместе в `intents.near`.

Эта концептуальная часть полезна, чтобы понять сам протокол, но подписанные примеры в официальной документации носят иллюстративный и привязанный ко времени характер. Для рабочего FastNear-сценария полезнее разбирать один реальный расчёт из mainnet, чем делать вид, будто пример из документации является готовой живой транзакцией.

#### Часть 2: живая FastNear-трассировка

Для живой трассировки ниже используйте этот фиксированный якорь расчёта, зафиксированный **18 апреля 2026 года**:

- хеш транзакции: `4cfei8p4HBeNxJnCLjfShhDYGmXZwFVwFgY1sYpyygE7`
- аккаунт `signer` и `receiver`: `intents.near`
- высота включающего блока: `194573310`

Публичных FastNear-поверхностей уже достаточно, чтобы восстановить многое:

| Поверхность | Эндпоинт | Как используем | Зачем используем |
| --- | --- | --- | --- |
| Якорь расчёта | Transactions API [`POST /v0/transactions`](https://docs.fastnear.com/ru/tx/transactions) | Начинаем с фиксированного хеша транзакции и получаем саму транзакцию плюс список последующих receipt | Даёт читаемый каркас расчёта без необходимости сразу декодировать сырые receipt |
| Контекст включающего блока | Transactions API [`POST /v0/block`](https://docs.fastnear.com/ru/tx/block) | Загружаем включающий блок с receipt и затем фильтруем его обратно по тому же хешу транзакции | Помещает расчёт в контекст блока и показывает, какие receipt появились там |
| Канонический DAG по receipt | RPC [`EXPERIMENTAL_tx_status`](https://docs.fastnear.com/ru/rpc/transaction/experimental-tx-status) | Запрашиваем ту же транзакцию с `wait_until: "FINAL"` и смотрим `receipts_outcome` | Даёт протокольно-канонический DAG, `executor_id` и сырые логи событий |
| Классификация событий | RPC [`EXPERIMENTAL_tx_status`](https://docs.fastnear.com/ru/rpc/transaction/experimental-tx-status) | Извлекаем имена событий вроде `token_diff`, `intents_executed`, `mt_transfer` и `mt_withdraw` из строк `EVENT_JSON` | Позволяет объяснять расчёт по семействам событий, а не по непрозрачным `receipt_id` |

**Что должен включать полезный ответ**

- как концептуальная двухсторонняя модель `token_diff` отображается на реальный расчёт через `execute_intents`
- какие последующие контракты и методы появились после `intents.near`
- какие семейства событий выпустила трассировка
- какие высоты блоков сформировали основной каскад

Этот пример намеренно остаётся на публичных FastNear-поверхностях. NEAR Intents Explorer и 1Click Explorer тоже полезны, но их Explorer API защищён JWT и не подходит как дефолтный публичный сценарий в документации.

### Shell-сценарий для живой трассировки NEAR Intents

Используйте этот сценарий, когда нужен один конкретный расчёт через `intents.near`, который можно сразу разобрать через публичные FastNear-эндпоинты.

**Что вы делаете**

- Получаете историю транзакции через Transactions API.
- Переиспользуете хеш включающего блока в `POST /v0/block`, чтобы исследовать сам блок.
- Подтверждаете канонический DAG по receipt и семейства логов событий через `EXPERIMENTAL_tx_status`.

```bash
TX_BASE_URL=https://tx.main.fastnear.com
RPC_URL=https://rpc.mainnet.fastnear.com
INTENTS_TX_HASH=4cfei8p4HBeNxJnCLjfShhDYGmXZwFVwFgY1sYpyygE7
INTENTS_SIGNER_ID=intents.near
```

1. Начните с самой транзакции расчёта.

```bash
INTENTS_BLOCK_HASH="$(
  curl -s "$TX_BASE_URL/v0/transactions" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --arg tx_hash "$INTENTS_TX_HASH" '{tx_hashes: [$tx_hash]}')" \
    | tee /tmp/intents-transaction.json \
    | jq -r '.transactions[0].execution_outcome.block_hash'
)"

jq '{
  transaction: {
    hash: .transactions[0].transaction.hash,
    signer_id: .transactions[0].transaction.signer_id,
    receiver_id: .transactions[0].transaction.receiver_id,
    included_block_height: .transactions[0].execution_outcome.block_height
  },
  receipt_flow: [
    .transactions[0].receipts[:6][]
    | {
        receipt_id: .receipt.receipt_id,
        receiver_id: .receipt.receiver_id,
        block_height: .execution_outcome.block_height,
        methods: (
          [.receipt.receipt.Action.actions[]?.FunctionCall.method_name]
          | map(select(. != null))
        ),
        first_log: (.execution_outcome.outcome.logs[0] // null)
      }
  ]
}' /tmp/intents-transaction.json
```

2. Переиспользуйте хеш блока, чтобы исследовать включающий блок с включёнными receipt.

```bash
curl -s "$TX_BASE_URL/v0/block" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg block_id "$INTENTS_BLOCK_HASH" '{
    block_id: $block_id,
    with_receipts: true,
    with_transactions: false
  }')" \
  | tee /tmp/intents-block.json >/dev/null

jq --arg tx_hash "$INTENTS_TX_HASH" '{
  block_height: .block.block_height,
  block_hash: .block.block_hash,
  tx_receipts: [
    .block_receipts[]
    | select(.transaction_hash == $tx_hash)
    | {
        receipt_id,
        predecessor_id,
        receiver_id,
        block_height
      }
  ]
}' /tmp/intents-block.json
```

3. Подтвердите канонический DAG по receipt и извлеките семейства событий через RPC.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg tx_hash "$INTENTS_TX_HASH" \
    --arg sender_account_id "$INTENTS_SIGNER_ID" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "EXPERIMENTAL_tx_status",
      params: {
        tx_hash: $tx_hash,
        sender_account_id: $sender_account_id,
        wait_until: "FINAL"
      }
    }')" \
  | tee /tmp/intents-rpc.json >/dev/null

jq '{
  final_execution_status: .result.final_execution_status,
  receipts_outcome: [
    .result.receipts_outcome[:6][]
    | {
        receipt_id: .id,
        executor_id: .outcome.executor_id,
        first_log: (.outcome.logs[0] // null)
      }
  ]
}' /tmp/intents-rpc.json

jq -r '
  .result.receipts_outcome[]
  | .outcome.logs[]
  | select(startswith("EVENT_JSON:"))
  | capture("event\":\"(?<event>[^\"]+)\"").event
' /tmp/intents-rpc.json | sort -u
```

**Зачем нужен следующий шаг?**

`POST /v0/transactions` даёт читаемый каркас расчёта. `POST /v0/block` показывает, как этот расчёт расположен внутри включающего блока. `EXPERIMENTAL_tx_status` — это каноническое продолжение, когда нужны `executor_id`, структура DAG по receipt и сырые логи событий, а не только индексированное резюме.

### Shell-сценарий для pivot по receipt

Используйте этот сценарий, когда у вас уже есть один `receipt_id` и нужен самый короткий путь обратно к читаемой истории транзакции.

**Что вы делаете**

- Сначала разрешаете receipt.
- Извлекаете `receipt.transaction_hash` через `jq`.
- Переиспользуете этот хеш транзакции в `POST /v0/transactions`.

```bash
TX_BASE_URL=https://tx.main.fastnear.com
RECEIPT_ID=YOUR_RECEIPT_ID
# Пример receipt ID из недавнего mainnet-перевода:
# RECEIPT_ID='5GhZcpfKWhrpaZo5Am74QfEUFQnZBz48G7hfoLPVDXcq'

TX_HASH="$(
  curl -s "$TX_BASE_URL/v0/receipt" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --arg receipt_id "$RECEIPT_ID" '{receipt_id: $receipt_id}')" \
    | tee /tmp/receipt-lookup.json \
    | jq -r '.receipt.transaction_hash'
)"

jq '{
  receipt: {
    receipt_id: .receipt.receipt_id,
    predecessor_id: .receipt.predecessor_id,
    receiver_id: .receipt.receiver_id,
    transaction_hash: .receipt.transaction_hash,
    tx_block_height: .receipt.tx_block_height
  }
}' /tmp/receipt-lookup.json

curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | jq '{
      transaction_hash: .transactions[0].transaction.hash,
      signer_id: .transactions[0].transaction.signer_id,
      receiver_id: .transactions[0].transaction.receiver_id,
      tx_block_height: .transactions[0].execution_outcome.block_height,
      receipt_count: (.transactions[0].receipts | length)
    }'
```

**Зачем нужен следующий шаг?**

`POST /v0/receipt` даёт точку перехода. `POST /v0/transactions` превращает эту точку в читаемую историю с контекстом по отправителю, получателю, блоку и связанным receipt-ам. И только после этого обычно стоит расширяться до окон по блоку или аккаунту.

## Частые ошибки

- Пытаться отправлять транзакцию через history API вместо сырого RPC.
- Использовать Transactions API, когда пользователю нужны только текущие балансы или активы.
- Слишком рано уходить в сырой RPC до того, как индексированная история уже ответила на читаемый вопрос «что произошло?».
- Повторно использовать непрозрачные токены пагинации с другим эндпоинтом или другим набором фильтров.

## Полезные связанные страницы

- [Transactions API](https://docs.fastnear.com/ru/tx)
- [RPC Reference](https://docs.fastnear.com/ru/rpc)
- [FastNear API](https://docs.fastnear.com/ru/api)
- [NEAR Data API](https://docs.fastnear.com/ru/neardata)
- [Choosing the Right Surface](https://docs.fastnear.com/ru/agents/choosing-surfaces)
- [Agent Playbooks](https://docs.fastnear.com/ru/agents/playbooks)
