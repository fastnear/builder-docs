---
sidebar_label: Examples
slug: /api/examples
title: "Примеры API"
description: "Пошаговые сценарии использования FastNear API для поиска аккаунтов, инвентаризации активов и проверки прямого стейкинга."
displayed_sidebar: fastnearApiSidebar
page_actions:
  - markdown
---

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

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Стратегия</span>
    <p className="fastnear-example-strategy__title">Сначала определите личность, а затем либо сразу проверьте один аккаунт, либо пройдитесь по всему списку, если ключ сопоставляется с несколькими аккаунтами.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">GET /v1/public_key</span> возвращает кандидатные значения <span className="fastnear-example-strategy__code">account_id</span> для этого ключа.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">jq</span> поднимает тот аккаунт, который вы хотите смотреть дальше.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">GET /v1/account/.../full</span> в одном ответе показывает балансы, NFT и стейкинг.</span></p>
  </div>
</div>

**Что вы делаете**

- Ищете по публичному ключу один или несколько `account_id`.
- Сначала считаете, сколько `account_id` вернулось, прежде чем выбирать один.
- Сразу переиспользуете один аккаунт или проходите по всему списку, если ключ сопоставляется с несколькими аккаунтами.

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

ACCOUNT_COUNT="$(
  jq -r '.account_ids | length' /tmp/fastnear-public-key.json
)"

jq '{
  account_ids,
  account_count: (.account_ids | length)
}' /tmp/fastnear-public-key.json

if [ "$ACCOUNT_COUNT" -eq 1 ]; then
  curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/full" \
    | jq '{
        account_id,
        state,
        token_count: (.tokens | length),
        nft_count: (.nfts | length),
        pool_count: (.pools | length)
      }'
else
  jq -r '.account_ids[]' /tmp/fastnear-public-key.json \
    | while read -r candidate_account_id; do
        curl -s "$API_BASE_URL/v1/account/$candidate_account_id/full" \
          | jq '{
              account_id,
              state,
              token_count: (.tokens | length),
              nft_count: (.nfts | length),
              pool_count: (.pools | length)
            }'
      done
fi
```

**Зачем нужен следующий шаг?**

Поиск по публичному ключу говорит, с каким аккаунтом или аккаунтами вы имеете дело. Полный снимок аккаунта — естественный следующий запрос, если нужны балансы, NFT, стейкинг и пулы в одном ответе. Если ключ сопоставляется не с одним, а с несколькими аккаунтами, именно здесь стоит либо пройтись по каждому найденному `account_id`, либо перейти к [V1 Public Key Lookup All](/api/v1/public-key-all) для более широкого исторического ответа.

### Есть ли у этого аккаунта прямой стейкинг прямо сейчас?

Используйте этот сценарий, когда история проста: «скажи, есть ли у аккаунта видимые прямые staking pool прямо сейчас, и покажи, какие именно это пулы».

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Стратегия</span>
    <p className="fastnear-example-strategy__title">Один раз прочитайте staking-эндпоинт и превратите видимый список пулов в ответ “да / нет”.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">GET /v1/account/.../staking</span> возвращает видимые прямые staking-позиции аккаунта.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">jq</span> превращает ответ в <span className="fastnear-example-strategy__code">has_direct_staking_now</span>, <span className="fastnear-example-strategy__code">pool_count</span> и <span className="fastnear-example-strategy__code">pool_ids</span>.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span>Если массив <span className="fastnear-example-strategy__code">pools</span> пуст, ответ этой поверхности просто звучит как «прямой стейкинг сейчас не виден».</span></p>
  </div>
</div>

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

Так вопрос остаётся узким и практическим. Если ответ `true`, важно помнить, что это значит на chain-уровне: аккаунт обычно делегировал средства в staking-pool-контракт вроде `polkachu.poolv1.near`, отправив `FunctionCall` наподобие `deposit_and_stake` с attached deposit. Сам `Stake` action позже выполняет уже сам pool-контракт на своём аккаунте. Если ответ `false`, не делайте из этого примера выводов про liquid staking: liquid staking-позиции обычно сначала видны как FT-holdings в конкретных LST-контрактах, поэтому правильный follow-up здесь — FT-пример ниже. И ещё одна граница этой поверхности: этот эндпоинт сейчас не показывает pending-unstake или withdraw-ready amount, так что по нему не стоит отвечать на вопросы о задержках по эпохам.

#### Необязательное продолжение: Что сделал этот контрактный вызов для делегирования?

Используйте это продолжение, когда staking-эндпоинт уже показал пул вроде `polkachu.poolv1.near`, и теперь вы хотите увидеть форму одной реальной делегационной транзакции.

Этот зафиксированный mainnet tx хорош тем, что очень ясно показывает весь паттерн:

- хеш транзакции: `5Qo96GonLaAfuh6eHWdi8zPRk92TFW8W2xWqSAoYKBVz`
- top-level receiver: `polkachu.poolv1.near`
- top-level метод: `deposit_and_stake`
- attached deposit: `34650000000000000000000000` (≈34.65 NEAR)

Важная форма chain-истории здесь такая:

- делегатор отправляет `FunctionCall deposit_and_stake` в pool-контракт
- pool-контракт учитывает депозит и staking shares
- затем pool выпускает self-receipt с настоящим `Stake` action

```bash
TX_BASE_URL=https://tx.main.fastnear.com
TX_HASH=5Qo96GonLaAfuh6eHWdi8zPRk92TFW8W2xWqSAoYKBVz

curl -s "$TX_BASE_URL/v0/transactions" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | tee /tmp/staking-delegation-tx.json >/dev/null

jq '{
  top_level_call: {
    hash: .transactions[0].transaction.hash,
    signer_id: .transactions[0].transaction.signer_id,
    receiver_id: .transactions[0].transaction.receiver_id,
    method_name: .transactions[0].transaction.actions[0].FunctionCall.method_name,
    attached_deposit: .transactions[0].transaction.actions[0].FunctionCall.deposit
  },
  pool_side_effects: [
    .transactions[0].receipts[]
    | select(.receipt.receiver_id == "polkachu.poolv1.near")
    | {
        predecessor_id: .receipt.predecessor_id,
        receiver_id: .receipt.receiver_id,
        actions: (
          .receipt.receipt.Action.actions
          | map(if type == "string" then . else keys[0] end)
        ),
        first_logs: (.execution_outcome.outcome.logs[:3])
      }
  ]
}' /tmp/staking-delegation-tx.json
```

Простой вывод здесь такой: делегатор не подписывал сырой `Stake` action напрямую. Он вызвал staking-pool-контракт через `deposit_and_stake` и приложил депозит, а затем уже pool-контракт сам выполнил `Stake` action на своём аккаунте.

### Какие FT-балансы и NFT-коллекции этот аккаунт сейчас показывает?

Используйте этот сценарий, когда у wallet-экрана, support-инструмента или агента уже есть `account_id` и нужен быстрый индексированный обзор holdings: FT-балансы плюс NFT-коллекции, из которых этот аккаунт сейчас что-то показывает.

<div className="fastnear-example-strategy">
  <div className="fastnear-example-strategy__header">
    <span className="fastnear-example-strategy__eyebrow">Стратегия</span>
    <p className="fastnear-example-strategy__title">Сначала прочитайте FT-балансы, затем NFT-коллекции и только потом соберите их в один компактный индексированный инвентарь.</p>
  </div>
  <div className="fastnear-example-strategy__items">
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">01</span><span><span className="fastnear-example-strategy__code">GET /v1/account/.../ft</span> даёт индексированные FT-балансы кошелька.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">02</span><span><span className="fastnear-example-strategy__code">GET /v1/account/.../nft</span> даёт NFT-коллекции, из которых этот кошелёк сейчас показывает holdings.</span></p>
    <p className="fastnear-example-strategy__item"><span className="fastnear-example-strategy__step">03</span><span><span className="fastnear-example-strategy__code">jq</span> превращает эти два индексированных чтения в один wallet-friendly инвентарь.</span></p>
  </div>
</div>

**Что вы делаете**

- Читаете FT-балансы аккаунта.
- Читаете NFT-holdings аккаунта на уровне коллекций.
- Печатаете один короткий индексированный инвентарь, который можно переиспользовать в wallet- или support-сценарии.

Этот пример не отвечает на вопросы про нативный баланс, стейкинг, пулы, точные NFT token ID или метаданные.

FT-эндпоинт здесь решает задачу балансов. Он не включает display-метаданные вроде `symbol` или `decimals`; когда нужно форматировать баланс для UI, вызовите у токен-контракта read-метод `ft_metadata` через RPC.

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

Переходите к [`GET /v1/account/{account_id}/full`](/api/v1/account-full), когда следующий вопрос уже требует ещё и стейкинг, пулы или нативное состояние аккаунта. Переходите к contract-specific чтениям только тогда, когда вопрос меняется на «какие именно идентификаторы NFT-токенов и метаданные мне принадлежат?»

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
