---
sidebar_label: Examples
slug: /api/examples
title: "Примеры FastNear API"
description: "Пошаговые сценарии использования FastNear API для сводок по аккаунтам, поиска по ключам и перехода к более узким представлениям активов."
displayed_sidebar: fastnearApiSidebar
page_actions:
  - markdown
---

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

- [V1 Full Account View](/api/v1/account-full) для самого широкого снимка аккаунта.

**Следующая страница при необходимости**

- [V1 Account FT](/api/v1/account-ft), [V1 Account NFT](/api/v1/account-nft) или [V1 Account Staking](/api/v1/account-staking) для более узкого продолжения.
- [Transactions API account history](/tx/account), если следующий вопрос звучит как «как аккаунт пришёл к такому состоянию?»

**Остановитесь, когда**

- Сводка уже отвечает на вопрос о портфеле или активах в нужной пользователю форме.

**Расширяйте, когда**

- Пользователь спрашивает о точной канонической семантике аккаунта или ключей доступа. Переходите к [RPC Reference](/rpc).
- Пользователя интересует история активности или исполнения, а не текущий набор активов. Переходите к [Transactions API](/tx).

### Определить аккаунты по публичному ключу

**Начните здесь**

- [V1 Public Key Lookup](/api/v1/public-key), когда нужен основной аккаунт для ключа.
- [V1 Public Key Lookup All](/api/v1/public-key-all), когда нужен более полный список связанных аккаунтов.

**Следующая страница при необходимости**

- [V1 Full Account View](/api/v1/account-full) после поиска, если сразу нужна сводка по балансам или активам найденных аккаунтов.

**Остановитесь, когда**

- Уже определён аккаунт или набор аккаунтов, которым принадлежит ключ.

**Расширяйте, когда**

- Пользователь спрашивает о точных правах ключа, nonce или каноническом состоянии access key. Переходите к [View Access Key](/rpc/account/view-access-key) или [View Access Key List](/rpc/account/view-access-key-list).
- Пользователя интересует недавняя активность найденных аккаунтов, а не только их идентификация. Переходите к [Transactions API](/tx).

### Продолжить по одной категории активов, а не по всему аккаунту

**Начните здесь**

- [V1 Account FT](/api/v1/account-ft) для балансов FT-токенов.
- [V1 Account NFT](/api/v1/account-nft) для владения NFT.
- [V1 Account Staking](/api/v1/account-staking) для позиций стейкинга.

**Следующая страница при необходимости**

- [V1 Full Account View](/api/v1/account-full), если позже понадобится более широкий снимок аккаунта.
- [Transactions API account history](/tx/account), если вопрос смещается к тому, как активы менялись со временем.

**Остановитесь, когда**

- Эндпоинт по конкретной категории активов уже даёт готовый продуктовый ответ без дополнительной реконструкции.

**Расширяйте, когда**

- Индексированного представления недостаточно и нужна точная семантика состояния в цепочке. Переходите к [RPC Reference](/rpc).
- Вопрос становится историческим или связанным с исполнением вместо «чем этот аккаунт владеет сейчас?». Переходите к [Transactions API](/tx).

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

Поиск по публичному ключу отвечает на вопрос об идентификации. Полный снимок аккаунта отвечает на следующий прикладной вопрос уже в продуктовой форме. Если ключ сопоставляется не с одним, а с несколькими аккаунтами, расширяйтесь до [V1 Public Key Lookup All](/api/v1/public-key-all) или пройдитесь по каждому найденному `account_id`.

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

2. Расширьтесь до канонического RPC, чтобы получить точные `token_id` и исходные метаданные этой коллекции.

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

5. Подтвердите новый токен тем же каноническим NFT view-методом.

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

FastNear API быстрее всего отвечает на вопрос о допуске. Как только аккаунт проходит условие, RPC становится правильной поверхностью для точной проверки токенов и подтверждения результата, потому что напрямую открывает канонические NFT view-методы коллекции.

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

## Частые ошибки

- Сразу идти в широкий снимок аккаунта, когда пользователя интересует только одна категория активов.
- Использовать FastNear API, хотя пользователю прямо нужны канонические поля RPC или права доступа.
- Оставаться на страницах сводок по аккаунту, когда вопрос уже стал вопросом об истории транзакций.
- Забывать, что `?network=testnet` поддерживается только на совместимых страницах.

## Полезные связанные страницы

- [FastNear API](/api)
- [API Reference](/api/reference)
- [RPC Reference](/rpc)
- [Transactions API](/tx)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
