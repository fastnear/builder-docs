**Источник:** [https://docs.fastnear.com/ru/api/examples](https://docs.fastnear.com/ru/api/examples)

## Быстрый старт

Начните с одного поиска по публичному ключу и одного широкого чтения аккаунта.

```bash
API_BASE_URL=https://api.fastnear.com
PUBLIC_KEY='ed25519:YOUR_PUBLIC_KEY'

ENCODED_PUBLIC_KEY="$(jq -rn --arg public_key "$PUBLIC_KEY" '$public_key | @uri')"

ACCOUNT_ID="$(
  curl -s "$API_BASE_URL/v1/public_key/$ENCODED_PUBLIC_KEY" \
    | jq -r '.account_ids[0]'
)"

echo "$ACCOUNT_ID"

curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/full" \
  | jq '{
      account_id,
      state,
      token_count: (.tokens | length),
      nft_count: (.nfts | length),
      pool_count: (.pools | length)
    }'
```

Это самый короткий путь к вопросам «какой это аккаунт?» и «что сейчас видно по этому кошельку?»

## Готовые сценарии

### Определить аккаунт по публичному ключу, а затем получить сводку по нему

Используйте этот сценарий, когда у вас сначала есть только публичный ключ, а следующий практический вопрос пользователя звучит как «какому аккаунту он соответствует?» и сразу после этого «что сейчас видно по этому аккаунту?»

    Стратегия
    Сначала определите личность, а затем переиспользуйте тот же аккаунт для одной читаемой сводки по кошельку.

    01GET /v1/public_key возвращает кандидатные значения account_id для этого ключа.
    02jq поднимает тот аккаунт, который вы хотите смотреть дальше.
    03GET /v1/account/.../full в одном ответе показывает балансы, NFT и стейкинг.

**Что вы делаете**

- Ищете по публичному ключу один или несколько `account_id`.
- Извлекаете первый найденный `account_id` через `jq`.
- Переиспользуете это значение в широком эндпоинте полного снимка аккаунта.

```bash
API_BASE_URL=https://api.fastnear.com
PUBLIC_KEY='ed25519:YOUR_PUBLIC_KEY'
# Пример публичного ключа из модели страницы в документации:
# PUBLIC_KEY='ed25519:CCaThr3uokqnUs6Z5vVnaDcJdrfuTpYJHJWcAGubDjT'

ENCODED_PUBLIC_KEY="$(jq -rn --arg public_key "$PUBLIC_KEY" '$public_key | @uri')"

ACCOUNT_ID="$(
  curl -s "$API_BASE_URL/v1/public_key/$ENCODED_PUBLIC_KEY" \
    | tee /tmp/fastnear-public-key.json \
    | jq -r '.account_ids[0]'
)"

jq '{account_ids}' /tmp/fastnear-public-key.json

curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/full" \
  | jq '{
      account_id,
      state,
      token_count: (.tokens | length),
      nft_count: (.nfts | length),
      pool_count: (.pools | length)
    }'
```

**Зачем нужен следующий шаг?**

Поиск по публичному ключу говорит, с каким аккаунтом вы имеете дело. Полный снимок аккаунта — естественный следующий запрос, если нужны балансы, NFT, стейкинг и пулы в одном ответе. Если ключ сопоставляется не с одним, а с несколькими аккаунтами, переходите к [V1 Public Key Lookup All](https://docs.fastnear.com/ru/api/v1/public-key-all) или пройдитесь по каждому найденному `account_id`.

### Есть ли у этого аккаунта прямой стейкинг прямо сейчас?

Используйте этот сценарий, когда история проста: «скажи, есть ли у аккаунта видимые прямые staking pool прямо сейчас, и покажи, какие именно это пулы».

    Стратегия
    Один раз прочитайте staking-эндпоинт и превратите видимый список пулов в ответ “да / нет”.

    01GET /v1/account/.../staking возвращает видимые прямые staking-позиции аккаунта.
    02jq превращает ответ в has_direct_staking_now, pool_count и pool_ids.
    03Если массив pools пуст, ответ этой поверхности просто звучит как «прямой стейкинг сейчас не виден».

**Сеть**

- mainnet

**Официальные ссылки**

- [Валидаторский стейкинг](https://docs.near.org/concepts/basics/staking)

**Что вы делаете**

- Читаете индексированные прямые staking-позиции через staking-эндпоинт аккаунта.
- Печатаете короткий итог “да / нет” и список видимых `pool_id`.
- На этом останавливаетесь, если только следующий вопрос уже не касается `unstake` или `withdraw` в конкретном пуле.

```bash
API_BASE_URL=https://api.fastnear.com
ACCOUNT_ID=mike.near
```

1. Получите представление по прямому стейкингу.

```bash
curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/staking" \
  | tee /tmp/account-staking.json >/dev/null

jq '{
  account_id,
  has_direct_staking_now: ((.pools // []) | length > 0),
  pool_count: ((.pools // []) | length),
  pool_ids: ((.pools // []) | map(.pool_id))
}' /tmp/account-staking.json
```

На момент написания для `mike.near` здесь возвращались видимые прямые staking-пулы. Если для вашего аккаунта `pool_ids` пуст, этот эндпоинт отвечает: «прямой стейкинг сейчас не виден».

**Зачем нужен следующий шаг?**

Так вопрос остаётся узким и практическим. Если ответ `true`, следующий реальный шаг обычно связан с `unstake` или `withdraw` в конкретном пуле. Если ответ `false`, не делайте из этого примера выводов про liquid staking: этот сценарий касается только прямых пулов.

### Какие FT-балансы и NFT-коллекции этот аккаунт сейчас показывает?

Используйте этот сценарий, когда у wallet-экрана, support-инструмента или агента уже есть `account_id` и нужен быстрый индексированный обзор holdings: FT-балансы плюс NFT-коллекции, из которых этот аккаунт сейчас что-то показывает.

    Стратегия
    Сначала прочитайте FT-балансы, затем NFT-коллекции и только потом соберите их в один компактный индексированный инвентарь.

    01GET /v1/account/.../ft даёт индексированные FT-балансы кошелька.
    02GET /v1/account/.../nft даёт NFT-коллекции, из которых этот кошелёк сейчас показывает holdings.
    03jq превращает эти два индексированных чтения в один wallet-friendly инвентарь.

**Что вы делаете**

- Читаете FT-балансы аккаунта.
- Читаете NFT-holdings аккаунта на уровне коллекций.
- Печатаете один короткий индексированный инвентарь, который можно переиспользовать в wallet- или support-сценарии.

Этот пример не отвечает на вопросы про нативный баланс, стейкинг, пулы, точные NFT token ID или метаданные.

NFT-эндпоинт здесь работает на уровне коллекций. Воспринимайте его как ответ на вопрос «из каких NFT-контрактов этот аккаунт сейчас что-то держит?», а не как полный per-token crawl.

```bash
API_BASE_URL=https://api.fastnear.com
ACCOUNT_ID=YOUR_ACCOUNT_ID

# Пример живого значения, проверенного 19 апреля 2026 года:
# ACCOUNT_ID=mike.near
```

1. Прочитайте FT-балансы аккаунта.

```bash
curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/ft" \
  | tee /tmp/account-ft.json >/dev/null

jq '{
  account_id,
  ft_contracts: (
    .tokens
    | map(select((.balance // "0") != "0") | {
        contract_id,
        balance,
        last_update_block_height
      })
    | .[:10]
  )
}' /tmp/account-ft.json
```

2. Прочитайте NFT-коллекции для того же аккаунта.

```bash
curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/nft" \
  | tee /tmp/account-nft.json >/dev/null

jq '{
  account_id,
  nft_collections: (
    (.tokens // [])
    | map({
        contract_id,
        last_update_block_height
      })
    | unique_by(.contract_id)
    | .[:10]
  )
}' /tmp/account-nft.json
```

3. Соберите из этих двух чтений один компактный инвентарь.

```bash
jq -n \
  --slurpfile ft /tmp/account-ft.json \
  --slurpfile nft /tmp/account-nft.json '
  ($ft[0].tokens // []) as $ft_tokens
  | ($nft[0].tokens // []) as $nft_tokens
  | {
      account_id: ($ft[0].account_id // $nft[0].account_id),
      ft_contract_count: (
        $ft_tokens
        | map(select((.balance // "0") != "0"))
        | length
      ),
      nft_collection_count: (
        $nft_tokens
        | map(.contract_id)
        | unique
        | length
      ),
      ft_contracts: (
        $ft_tokens
        | map(select((.balance // "0") != "0") | {
            contract_id,
            balance,
            last_update_block_height
          })
        | .[:10]
      ),
      nft_collections: (
        $nft_tokens
        | map({
            contract_id,
            last_update_block_height
          })
        | unique_by(.contract_id)
        | .[:10]
      )
    }'
```

Для `mike.near` на 19 апреля 2026 года эти чтения вернули десятки FT-контрактов и NFT-коллекций. Этого достаточно для частого wallet-вопроса: «какие FT-балансы и NFT-коллекции этот аккаунт сейчас показывает?»

**Зачем нужен следующий шаг?**

Переходите к [`GET /v1/account/{account_id}/full`](https://docs.fastnear.com/ru/api/v1/account-full), когда следующий вопрос уже требует ещё и стейкинг, пулы или нативное состояние аккаунта. Переходите к contract-specific чтениям только тогда, когда вопрос меняется на «какие именно идентификаторы NFT-токенов и метаданные мне принадлежат?»

## Частые ошибки

- Сразу идти в широкий снимок аккаунта, когда пользователя интересует только одна категория активов.
- Использовать FastNear API, хотя пользователю прямо нужны точные поля RPC или права доступа.
- Оставаться на страницах сводок по аккаунту, когда вопрос уже стал вопросом об истории транзакций.
- Забывать, что `?network=testnet` поддерживается только на совместимых страницах.

## Полезные связанные страницы

- [FastNear API](https://docs.fastnear.com/ru/api)
- [API Reference](https://docs.fastnear.com/ru/api/reference)
- [RPC Reference](https://docs.fastnear.com/ru/rpc)
- [Transactions API](https://docs.fastnear.com/ru/tx)
- [Choosing the Right Surface](https://docs.fastnear.com/ru/agents/choosing-surfaces)
- [Agent Playbooks](https://docs.fastnear.com/ru/agents/playbooks)
