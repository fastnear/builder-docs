**Источник:** [https://docs.fastnear.com/ru/api/examples](https://docs.fastnear.com/ru/api/examples)

## Готовые сценарии

### Определить аккаунт по публичному ключу, а затем получить сводку по нему

Используйте этот сценарий, когда у вас сначала есть только публичный ключ, а следующий практический вопрос пользователя звучит как «какому аккаунту он соответствует?» и сразу после этого «что сейчас видно по этому аккаунту?»

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

### Проверить владение коллекцией, а затем выпустить производный NFT

Используйте этот сценарий, когда история звучит так: «если аккаунт уже владеет хотя бы одним NFT из коллекции X, выпустить ещё один NFT, в чьих метаданных будет зафиксирована эта связь».

**Сеть**

- testnet

**Официальные ссылки**

- [Предразвёрнутый NFT-контракт](https://docs.near.org/tutorials/nfts/js/predeployed-contract)
- [Стандарт NFT NEP-171](https://docs.near.org/primitives/nft/standard)

Перед началом убедитесь, что аккаунт уже владеет хотя бы одним токеном из `nft.examples.testnet`. Если такого токена ещё нет, сначала выпустите его по гайду с предразвёрнутым контрактом, а затем вернитесь к этому сценарию.

**Что вы делаете**

- Используете FastNear API, чтобы быстро ответить на вопрос о допуске.
- Расширяетесь до RPC `nft_tokens_for_owner`, чтобы получить точные `token_id` и метаданные из исходной коллекции.
- Строите детерминированные производные метаданные на основе этого набора токенов.
- Выпускаете производный токен и затем подтверждаете его тем же view-методом NFT.

```bash
API_BASE_URL=https://test.api.fastnear.com
RPC_URL=https://rpc.testnet.fastnear.com
ACCOUNT_ID=YOUR_ACCOUNT_ID.testnet
SOURCE_COLLECTION_ID=nft.examples.testnet
DESTINATION_COLLECTION_ID=nft.examples.testnet
SIGNER_ACCOUNT_ID="$ACCOUNT_ID"
TOKEN_ID="derivative-$(date +%s)"
```

1. Через FastNear API проверьте, есть ли у аккаунта хоть один NFT из исходной коллекции.

```bash
curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/nft" \
  | tee /tmp/testnet-account-nfts.json >/dev/null

jq --arg source_collection_id "$SOURCE_COLLECTION_ID" '{
  holds_collection: any(.tokens[]?; .contract_id == $source_collection_id),
  matching_contracts: [
    .tokens[]?
    | select(.contract_id == $source_collection_id)
  ]
}' /tmp/testnet-account-nfts.json
```

2. Перейдите к RPC, чтобы получить точные `token_id` и исходные метаданные этой коллекции.

```bash
NFT_TOKENS_ARGS_BASE64="$(
  jq -nc --arg account_id "$ACCOUNT_ID" '{
    account_id: $account_id,
    from_index: "0",
    limit: 50
  }' | base64 | tr -d '\n'
)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$SOURCE_COLLECTION_ID" \
    --arg args_base64 "$NFT_TOKENS_ARGS_BASE64" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "call_function",
        account_id: $account_id,
        method_name: "nft_tokens_for_owner",
        args_base64: $args_base64,
        finality: "final"
      }
    }')" \
  | jq '.result.result | implode | fromjson' \
  | tee /tmp/source-collection-tokens.json >/dev/null

jq --arg source_collection_id "$SOURCE_COLLECTION_ID" '{
  source_collection_id: $source_collection_id,
  source_count: length,
  source_token_ids: (map(.token_id) | sort | .[:5])
}' /tmp/source-collection-tokens.json
```

3. Постройте детерминированные производные метаданные из этого набора токенов.

```bash
DERIVATIVE_METADATA_JSON="$(
  jq -c --arg source_collection_id "$SOURCE_COLLECTION_ID" '{
    title: ("Derivative witness for " + $source_collection_id),
    description:
      ("Minted because the holder currently owns "
      + (length | tostring)
      + " token(s) from "
      + $source_collection_id),
    media: (
      map(.metadata.media)
      | map(select(. != null))
      | .[0]
    ),
    copies: 1,
    extra: ({
      source_collection_id: $source_collection_id,
      source_count: length,
      source_token_ids: (map(.token_id) | sort | .[:5])
    } | @json)
  }' /tmp/source-collection-tokens.json
)"

printf '%s\n' "$DERIVATIVE_METADATA_JSON" | jq '.'
```

4. Выпустите производный токен в целевой коллекции.

```bash
near call "$DESTINATION_COLLECTION_ID" nft_mint "$(jq -nc \
  --arg token_id "$TOKEN_ID" \
  --arg receiver_id "$ACCOUNT_ID" \
  --argjson metadata "$DERIVATIVE_METADATA_JSON" '{
    token_id: $token_id,
    receiver_id: $receiver_id,
    metadata: $metadata
  }')" \
  --accountId "$SIGNER_ACCOUNT_ID" \
  --deposit 0.1 \
  --networkId testnet
```

5. Подтвердите новый токен тем же NFT view-методом.

Если сразу после возврата mint-транзакции токен ещё не виден, не считайте это ошибкой сразу же: опросите view-метод несколько раз.

```bash
for attempt in 1 2 3 4 5; do
  curl -s "$RPC_URL" \
    -H 'content-type: application/json' \
    --data "$(jq -nc \
      --arg account_id "$DESTINATION_COLLECTION_ID" \
      --arg args_base64 "$NFT_TOKENS_ARGS_BASE64" '{
        jsonrpc: "2.0",
        id: "fastnear",
        method: "query",
        params: {
          request_type: "call_function",
          account_id: $account_id,
          method_name: "nft_tokens_for_owner",
          args_base64: $args_base64,
          finality: "final"
        }
      }')" \
    | jq '.result.result | implode | fromjson' \
    | jq --arg token_id "$TOKEN_ID" '
        map(select(.token_id == $token_id))
      ' \
    | tee /tmp/derivative-token-verification.json >/dev/null

  if jq -e 'length > 0' /tmp/derivative-token-verification.json >/dev/null; then
    break
  fi

  sleep 1
done

jq '.' /tmp/derivative-token-verification.json
```

**Зачем нужен следующий шаг?**

FastNear API — это быстрый ответ на вопрос о допуске. Как только аккаунт проходит условие, правильным следующим шагом становится RPC, потому что именно там видны точные `token_id` и собственные NFT view-методы коллекции.

### У меня обычный стейкинг или liquid staking?

Используйте этот сценарий, когда история звучит так: «покажи, связан ли этот кошелёк с прямыми staking pool, liquid staking token или и с тем и с другим».

**Сеть**

- mainnet

**Официальные ссылки**

- [Валидаторский стейкинг](https://docs.near.org/concepts/basics/staking)
- [Liquid staking](https://docs.near.org/primitives/liquid-staking)

Этот пример намеренно остаётся наблюдательным. Он классифицирует то, что FastNear видит сейчас по staking-позициям и FT-балансам. Он не доказывает каждую возможную синтетическую или внешнюю форму стейкинг-экспозиции.

**Что вы делаете**

- Читаете индексированные прямые staking-позиции через staking-эндпоинт аккаунта.
- Читаете индексированные FT-балансы через FT-эндпоинт аккаунта.
- Классифицируете аккаунт как `direct_only`, `liquid_only`, `mixed` или `no_visible_staking_position`.
- Выводите список прямых пулов и список liquid staking-токенов, на которых основана эта классификация.

```bash
API_BASE_URL=https://api.fastnear.com
ACCOUNT_ID=YOUR_ACCOUNT_ID
LIQUID_PROVIDERS_JSON='["meta-pool.near","lst.rhealab.near","linear-protocol.near"]'
```

1. Получите представление по прямому стейкингу.

```bash
curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/staking" \
  | tee /tmp/account-staking.json \
  | jq '{account_id, pools}'
```

2. Получите FT-балансы, чтобы увидеть liquid staking-позиции.

```bash
curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/ft" \
  | tee /tmp/account-ft.json >/dev/null
```

3. Классифицируйте аккаунт на основе этих двух индексированных представлений.

```bash
jq -n \
  --slurpfile staking /tmp/account-staking.json \
  --slurpfile ft /tmp/account-ft.json \
  --argjson providers "$LIQUID_PROVIDERS_JSON" '
  ($staking[0].pools // []) as $direct_pools
  | ($ft[0].tokens // []) as $tokens
  | ($tokens | map(select(.contract_id as $id | $providers | index($id)))) as $liquid_tokens
  | {
      classification:
        if (($direct_pools | length) > 0 and ($liquid_tokens | length) > 0) then "mixed"
        elif (($direct_pools | length) > 0) then "direct_only"
        elif (($liquid_tokens | length) > 0) then "liquid_only"
        else "no_visible_staking_position"
        end,
      direct_pools: ($direct_pools | map(.pool_id)),
      liquid_tokens: (
        $liquid_tokens
        | map({
            contract_id,
            balance,
            last_update_block_height
          })
      )
    }'
```

**Зачем нужен следующий шаг?**

Если классификация показывает `direct_only`, следующий практический вопрос обычно касается сроков `unstake` и `withdraw`. Если она показывает `liquid_only`, следующий вопрос обычно про `redeem`, `swap` или провайдерский путь выхода. Если результат `mixed`, эти пути лучше рассматривать раздельно, а не пытаться свести их к одному сценарию.

## Частые задачи

### Что этот аккаунт вообще держит прямо сейчас?

**Начните здесь**

- [V1 Full Account View](https://docs.fastnear.com/ru/api/v1/account-full), когда нужен самый быстрый понятный ответ на вопрос «что сейчас лежит в этом аккаунте?»

**Следующая страница при необходимости**

- [V1 Account FT](https://docs.fastnear.com/ru/api/v1/account-ft), [V1 Account NFT](https://docs.fastnear.com/ru/api/v1/account-nft) или [V1 Account Staking](https://docs.fastnear.com/ru/api/v1/account-staking), если широкая сводка уже помогла, но дальше хочется остаться только в одной категории активов.
- [Transactions API account history](https://docs.fastnear.com/ru/tx/account), если следующий вопрос звучит как «как аккаунт пришёл к такому состоянию?», а не «что он держит сейчас?»

**Остановитесь, когда**

- Сводка уже отвечает на вопрос по активам в одной выдаче.

**Переходите дальше, когда**

- Пользователь спрашивает о точном состоянии аккаунта, о семантике ключей доступа или о протокольных полях. Переходите к [RPC Reference](https://docs.fastnear.com/ru/rpc).
- Пользователя интересует история активности или исполнения, а не текущий набор активов. Переходите к [Transactions API](https://docs.fastnear.com/ru/tx).

### Определить аккаунты по публичному ключу

**Начните здесь**

- [V1 Public Key Lookup](https://docs.fastnear.com/ru/api/v1/public-key), когда нужен основной аккаунт для ключа.
- [V1 Public Key Lookup All](https://docs.fastnear.com/ru/api/v1/public-key-all), когда нужен более полный список связанных аккаунтов.

**Следующая страница при необходимости**

- [V1 Full Account View](https://docs.fastnear.com/ru/api/v1/account-full) после поиска, если сразу нужна сводка по балансам или активам найденных аккаунтов.

**Остановитесь, когда**

- Уже определён аккаунт или набор аккаунтов, которым принадлежит ключ.

**Переходите дальше, когда**

- Пользователь спрашивает о точных правах ключа, nonce или текущем состоянии access key. Переходите к [View Access Key](https://docs.fastnear.com/ru/rpc/account/view-access-key) или [View Access Key List](https://docs.fastnear.com/ru/rpc/account/view-access-key-list).
- Пользователя интересует недавняя активность найденных аккаунтов, а не только их идентификация. Переходите к [Transactions API](https://docs.fastnear.com/ru/tx).

### Есть ли у этого аккаунта FT, NFT или стейкинг-позиции?

**Начните здесь**

- [V1 Account FT](https://docs.fastnear.com/ru/api/v1/account-ft), когда вопрос относится только к балансам FT-токенов.
- [V1 Account NFT](https://docs.fastnear.com/ru/api/v1/account-nft), когда вопрос конкретно про владение NFT.
- [V1 Account Staking](https://docs.fastnear.com/ru/api/v1/account-staking), когда пользователя интересуют именно стейкинг-позиции, а не вся картина по аккаунту.

**Следующая страница при необходимости**

- [V1 Full Account View](https://docs.fastnear.com/ru/api/v1/account-full), если после одной категории активов позже понадобится вся картина по аккаунту.
- [Transactions API account history](https://docs.fastnear.com/ru/tx/account), если вопрос уже меняется с «чем аккаунт владеет?» на «как он к этому пришёл?»

**Остановитесь, когда**

- Эндпоинт по конкретной категории активов уже отвечает на вопрос о владении без пересборки всей картины аккаунта.

**Переходите дальше, когда**

- Индексированного представления недостаточно и нужна точная семантика состояния в цепочке. Переходите к [RPC Reference](https://docs.fastnear.com/ru/rpc).
- Вопрос становится историческим или связанным с исполнением вместо «чем этот аккаунт владеет сейчас?». Переходите к [Transactions API](https://docs.fastnear.com/ru/tx).

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
