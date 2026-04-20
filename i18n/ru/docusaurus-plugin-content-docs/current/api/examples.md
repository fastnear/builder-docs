---
sidebar_label: Examples
slug: /api/examples
title: "Примеры API"
description: "Практические примеры FastNear API для поиска аккаунтов, проверки активов, NFT-gating и классификации стейкинга."
displayed_sidebar: fastnearApiSidebar
page_actions:
  - markdown
---

## Примеры

### Определить аккаунт по публичному ключу, а затем получить сводку по нему

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Ход</span>
    <p className="fastnear-example-strategy__title">Сначала определите личность, а затем переиспользуйте тот же аккаунт для одной читаемой сводки по кошельку.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">GET /v1/public_key</span> возвращает кандидатные значения <span className="fastnear-example-strategy__code">account_id</span> для этого ключа.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">jq</span> поднимает тот аккаунт, который вы хотите смотреть дальше.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">GET /v1/account/.../full</span> в одном ответе показывает балансы, NFT и стейкинг.</span></p>
  </div>
</div>

**Ход**

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

**Когда переходить дальше**

Поиск по публичному ключу говорит, с каким аккаунтом вы имеете дело. Полный снимок аккаунта — естественный следующий запрос, если нужны балансы, NFT, стейкинг и пулы в одном ответе. Если ключ сопоставляется не с одним, а с несколькими аккаунтами, переходите к [V1 Public Key Lookup All](/api/v1/public-key-all) или пройдитесь по каждому найденному `account_id`.

### Показывает ли этот кошелёк прямой стейкинг, ликвидные стейкинг-токены или и то и другое?

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Ход</span>
    <p className="fastnear-example-strategy__title">Сначала сравните staking-позиции и FT-балансы, а уже потом интерпретируйте кошелёк.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">GET /v1/account/.../staking</span> находит прямую экспозицию через пулы.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">GET /v1/account/.../ft</span> находит liquid staking token, которые лежат рядом с пулами или вместо них.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">jq</span> превращает эти два индексированных чтения в <span className="fastnear-example-strategy__code">direct_only</span>, <span className="fastnear-example-strategy__code">liquid_only</span> или <span className="fastnear-example-strategy__code">mixed</span>.</span></p>
  </div>
</div>

**Сеть**

- mainnet

**Официальные ссылки**

- [Валидаторский стейкинг](https://docs.near.org/concepts/basics/staking)
- [Liquid staking](https://docs.near.org/primitives/liquid-staking)

Этот пример намеренно остаётся наблюдательным. Он классифицирует то, что FastNear видит сейчас по staking-позициям и FT-балансам. Он не доказывает каждую возможную синтетическую или внешнюю форму стейкинг-экспозиции.

**Ход**

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

**Когда переходить дальше**

Если классификация показывает `direct_only`, следующий практический вопрос обычно касается сроков `unstake` и `withdraw`. Если она показывает `liquid_only`, следующий вопрос обычно про `redeem`, `swap` или провайдерский путь выхода. Если результат `mixed`, эти пути лучше рассматривать раздельно, а не пытаться свести их к одному сценарию.

### Заархивировать версию BOS-виджета как provenance NFT

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Ход</span>
    <p className="fastnear-example-strategy__title">Сначала прочитайте точный виджет, а mint делайте только тогда, когда provenance-поля уже детерминированы.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">GET /v1/account/.../nft</span> проверяет, есть ли у получателя уже архивные NFT из этой коллекции.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">RPC call_function get</span> на <span className="fastnear-example-strategy__code">social.near</span> читает точный исходник виджета и блок его записи в SocialDB.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span>Захешируйте исходник, выполните <span className="fastnear-example-strategy__code">nft_mint</span> в testnet, а потом проверьте provenance-поля через <span className="fastnear-example-strategy__code">nft_tokens_for_owner</span>.</span></p>
  </div>
</div>

**Сети**

- mainnet для чтения виджета из `social.near`
- testnet для безопасного mint provenance NFT в `nft.examples.testnet`

**Официальные ссылки**

- [Предразвёрнутый NFT-контракт](https://docs.near.org/tutorials/nfts/js/predeployed-contract)
- [Стандарт NFT NEP-171](https://docs.near.org/primitives/nft/standard)
- [API SocialDB и поверхность контракта](https://github.com/NearSocial/social-db#api)

**Ход**

- Через FastNear API проверяете, есть ли у получателя NFT из архивной коллекции.
- Читаете один точный BOS-виджет из `social.near`, включая SocialDB-блок именно этого виджета.
- Хешируете исходник виджета и превращаете его в provenance-метаданные.
- Выпускаете NFT в testnet, чьи метаданные фиксируют автора, widget-path, SocialDB-блок и хеш исходника.
- Подтверждаете, что выпущенный токен действительно несёт эти provenance-поля.

Зафиксированный исходный виджет:

- аккаунт автора: `mob.near`
- путь виджета: `mob.near/widget/Profile`
- SocialDB-блок уровня виджета: `86494825`

```bash
API_BASE_URL=https://test.api.fastnear.com
MAINNET_RPC_URL=https://rpc.mainnet.fastnear.com
TESTNET_RPC_URL=https://rpc.testnet.fastnear.com
AUTHOR_ACCOUNT_ID=mob.near
WIDGET_NAME=Profile
DESTINATION_COLLECTION_ID=nft.examples.testnet
RECEIVER_ACCOUNT_ID=YOUR_ACCOUNT_ID.testnet
SIGNER_ACCOUNT_ID="$RECEIVER_ACCOUNT_ID"
```

1. Через FastNear API посмотрите, держит ли получатель уже какие-то NFT из архивной коллекции.

```bash
curl -s "$API_BASE_URL/v1/account/$RECEIVER_ACCOUNT_ID/nft" \
  | tee /tmp/provenance-account-nfts.json >/dev/null

jq --arg destination_collection_id "$DESTINATION_COLLECTION_ID" '{
  existing_archive_tokens: [
    .tokens[]?
    | select(.contract_id == $destination_collection_id)
    | {
        contract_id,
        token_id,
        last_update_block_height
      }
  ]
}' /tmp/provenance-account-nfts.json
```

2. Прочитайте точное тело виджета и widget-level SocialDB-блок из mainnet.

```bash
WIDGET_ARGS_BASE64="$(
  jq -nc --arg author_account_id "$AUTHOR_ACCOUNT_ID" --arg widget_name "$WIDGET_NAME" '{
    keys: [($author_account_id + "/widget/" + $widget_name)],
    options: {with_block_height: true}
  }' | base64 | tr -d '\n'
)"

curl -s "$MAINNET_RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg args_base64 "$WIDGET_ARGS_BASE64" '{
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
  | jq '.result.result | implode | fromjson' \
  | tee /tmp/bos-widget.json >/dev/null

jq --arg author_account_id "$AUTHOR_ACCOUNT_ID" --arg widget_name "$WIDGET_NAME" '{
  widget_path: ($author_account_id + "/widget/" + $widget_name),
  socialdb_block_height: .[$author_account_id].widget[$widget_name][":block"],
  source_preview: (
    .[$author_account_id].widget[$widget_name][""]
    | split("\n")[0:8]
  )
}' /tmp/bos-widget.json
```

3. Захешируйте исходник виджета и постройте детерминированные provenance-метаданные.

```bash
jq -r --arg author_account_id "$AUTHOR_ACCOUNT_ID" --arg widget_name "$WIDGET_NAME" '
  .[$author_account_id].widget[$widget_name][""]
' /tmp/bos-widget.json > /tmp/bos-widget-source.jsx

WIDGET_BLOCK_HEIGHT="$(
  jq -r --arg author_account_id "$AUTHOR_ACCOUNT_ID" --arg widget_name "$WIDGET_NAME" '
    .[$author_account_id].widget[$widget_name][":block"]
  ' /tmp/bos-widget.json
)"

SOURCE_SHA256="$(shasum -a 256 /tmp/bos-widget-source.jsx | awk '{print $1}')"
SOURCE_HASH_SHORT="$(printf '%s' "$SOURCE_SHA256" | cut -c1-12)"
TOKEN_ID="bos-widget-$SOURCE_HASH_SHORT"

PROVENANCE_METADATA_JSON="$(
  jq -nc \
    --arg author_account_id "$AUTHOR_ACCOUNT_ID" \
    --arg widget_name "$WIDGET_NAME" \
    --arg widget_path "$AUTHOR_ACCOUNT_ID/widget/$WIDGET_NAME" \
    --arg block_height "$WIDGET_BLOCK_HEIGHT" \
    --arg source_sha256 "$SOURCE_SHA256" '{
      title: ("BOS widget archive: " + $widget_path),
      description: ("Archived from social.near on mainnet at block " + $block_height),
      copies: 1,
      extra: ({
        author_account_id: $author_account_id,
        widget_name: $widget_name,
        widget_path: $widget_path,
        source_contract_id: "social.near",
        source_network: "mainnet",
        socialdb_block_height: ($block_height | tonumber),
        source_sha256: $source_sha256
      } | @json)
    }'
)"

printf '%s\n' "$PROVENANCE_METADATA_JSON" | jq '.'
```

4. Выпустите provenance NFT в testnet.

```bash
near call "$DESTINATION_COLLECTION_ID" nft_mint "$(jq -nc \
  --arg token_id "$TOKEN_ID" \
  --arg receiver_id "$RECEIVER_ACCOUNT_ID" \
  --argjson metadata "$PROVENANCE_METADATA_JSON" '{
    token_id: $token_id,
    receiver_id: $receiver_id,
    metadata: $metadata
  }')" \
  --accountId "$SIGNER_ACCOUNT_ID" \
  --deposit 0.1 \
  --networkId testnet
```

5. Подтвердите, что выпущенный NFT действительно несёт ожидаемые provenance-поля.

Не считайте отсутствие токена ошибкой мгновенно: после mint-транзакции опросите view-метод несколько раз.

```bash
NFT_TOKEN_ARGS_BASE64="$(
  jq -nc --arg token_id "$TOKEN_ID" '{token_id: $token_id}' \
    | base64 | tr -d '\n'
)"

for attempt in 1 2 3 4 5; do
  curl -s "$TESTNET_RPC_URL" \
    -H 'content-type: application/json' \
    --data "$(jq -nc \
      --arg account_id "$DESTINATION_COLLECTION_ID" \
      --arg args_base64 "$NFT_TOKEN_ARGS_BASE64" '{
        jsonrpc: "2.0",
        id: "fastnear",
        method: "query",
        params: {
          request_type: "call_function",
          account_id: $account_id,
          method_name: "nft_token",
          args_base64: $args_base64,
          finality: "final"
        }
      }')" \
    | jq '.result.result | implode | fromjson' \
    | tee /tmp/bos-widget-provenance-token.json >/dev/null

  if jq -e '. != null' /tmp/bos-widget-provenance-token.json >/dev/null; then
    break
  fi

  sleep 1
done

jq '{
  token_id,
  owner_id,
  title: .metadata.title,
  provenance: (.metadata.extra | fromjson)
}' /tmp/bos-widget-provenance-token.json
```

**Когда переходить дальше**

FastNear API даёт быстрый чек со стороны получателя. Mainnet RPC даёт точное тело виджета и его SocialDB-блок. После этого mint в testnet превращает чтение в долговечную NFT-запись. Если позже понадобится доказать, какая именно историческая транзакция записала этот виджет, переходите к NEAR Social proof-расследованиям в [Transactions API examples](/tx/examples).

## Частые задачи

### Что этот аккаунт вообще держит прямо сейчас?

**Начните здесь**

- [V1 Full Account View](/api/v1/account-full), когда нужен самый быстрый понятный ответ на вопрос «что сейчас лежит в этом аккаунте?»

**Следующая страница при необходимости**

- [V1 Account FT](/api/v1/account-ft), [V1 Account NFT](/api/v1/account-nft) или [V1 Account Staking](/api/v1/account-staking), если широкая сводка уже помогла, но дальше хочется остаться только в одной категории активов.
- [Transactions API account history](/tx/account), если следующий вопрос звучит как «как аккаунт пришёл к такому состоянию?», а не «что он держит сейчас?»

**Остановитесь, когда**

- Сводка уже отвечает на вопрос по активам в одной выдаче.

**Переходите дальше, когда**

- Пользователь спрашивает о точном состоянии аккаунта, о семантике ключей доступа или о протокольных полях. Переходите к [RPC Reference](/rpc).
- Пользователя интересует история активности или исполнения, а не текущий набор активов. Переходите к [Transactions API](/tx).

### Определить аккаунты по публичному ключу

**Начните здесь**

- [V1 Public Key Lookup](/api/v1/public-key), когда нужен основной аккаунт для ключа.
- [V1 Public Key Lookup All](/api/v1/public-key-all), когда нужен более полный список связанных аккаунтов.

**Следующая страница при необходимости**

- [V1 Full Account View](/api/v1/account-full) после поиска, если сразу нужна сводка по балансам или активам найденных аккаунтов.

**Остановитесь, когда**

- Уже определён аккаунт или набор аккаунтов, которым принадлежит ключ.

**Переходите дальше, когда**

- Пользователь спрашивает о точных правах ключа, nonce или текущем состоянии access key. Переходите к [View Access Key](/rpc/account/view-access-key) или [View Access Key List](/rpc/account/view-access-key-list).
- Пользователя интересует недавняя активность найденных аккаунтов, а не только их идентификация. Переходите к [Transactions API](/tx).

### Есть ли у этого аккаунта FT, NFT или стейкинг-позиции?

**Начните здесь**

- [V1 Account FT](/api/v1/account-ft), когда вопрос относится только к балансам FT-токенов.
- [V1 Account NFT](/api/v1/account-nft), когда вопрос конкретно про владение NFT.
- [V1 Account Staking](/api/v1/account-staking), когда пользователя интересуют именно стейкинг-позиции, а не вся картина по аккаунту.

**Следующая страница при необходимости**

- [V1 Full Account View](/api/v1/account-full), если после одной категории активов позже понадобится вся картина по аккаунту.
- [Transactions API account history](/tx/account), если вопрос уже меняется с «чем аккаунт владеет?» на «как он к этому пришёл?»

**Остановитесь, когда**

- Эндпоинт по конкретной категории активов уже отвечает на вопрос о владении без пересборки всей картины аккаунта.

**Переходите дальше, когда**

- Индексированного представления недостаточно и нужна точная семантика состояния в цепочке. Переходите к [RPC Reference](/rpc).
- Вопрос становится историческим или связанным с исполнением вместо «чем этот аккаунт владеет сейчас?». Переходите к [Transactions API](/tx).

## Частые ошибки

- Сразу идти в широкий снимок аккаунта, когда пользователя интересует только одна категория активов.
- Использовать FastNear API, хотя пользователю прямо нужны точные поля RPC или права доступа.
- Оставаться на страницах сводок по аккаунту, когда вопрос уже стал вопросом об истории транзакций.
- Забывать, что `?network=testnet` поддерживается только на совместимых страницах.

## Полезные связанные страницы

- [FastNear API](/api)
- [API Reference](/api/reference)
- [RPC Reference](/rpc)
- [Transactions API](/tx)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
