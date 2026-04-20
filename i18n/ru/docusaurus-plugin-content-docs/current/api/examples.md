---
sidebar_label: Examples
slug: /api/examples
title: "Примеры API"
description: "Практические примеры FastNear API: поиск аккаунта по ключу, просмотр активов и классификация стейкинга."
displayed_sidebar: fastnearApiSidebar
page_actions:
  - markdown
---

## Примеры

### Свести один аккаунт за один вызов

`/v1/account/{id}/full` — это агрегатор аккаунтов в FastNear API: один вызов собирает NEAR-состояние аккаунта, каждый FT-контракт, которого он касался, каждую NFT-коллекцию, которую он получил, и каждый валидаторский пул, в который делегировал. Если у вас уже есть `account_id`, это самый быстрый ответ на вопрос «что это за аккаунт?».

```bash
ACCOUNT_ID=root.near
FASTNEAR_API_KEY=your_api_key

curl -s "https://api.fastnear.com/v1/account/$ACCOUNT_ID/full" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
  | jq '{
      account_id,
      near_balance_yocto: .state.balance,
      ft_contracts: (.tokens | length),
      nft_contracts: (.nfts | length),
      staking_pool_contracts: (.pools | length)
    }'
```

Для `root.near`: 150 FT-контрактов в списке, 102 NFT-коллекции, 2 валидаторских пула. Одни только счётчики контрактов говорят, что это оживлённый mainnet-аккаунт. Все примеры ниже погружаются в какую-то одну из этих поверхностей — начинайте отсюда, когда на руках только ID аккаунта.

### Определить аккаунт по публичному ключу и сразу получить сводку

Найдите, какому аккаунту принадлежит ключ, и прочитайте его активы за один следующий запрос.

```bash
PUBLIC_KEY='ed25519:CCaThr3uokqnUs6Z5vVnaDcJdrfuTpYJHJWcAGubDjT'
FASTNEAR_API_KEY=your_api_key

LOOKUP="$(curl -s "https://api.fastnear.com/v1/public_key/$(jq -rn --arg k "$PUBLIC_KEY" '$k | @uri')" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY")"

echo "$LOOKUP" | jq '{matched: (.account_ids | length), account_ids}'

ACCOUNT_ID="$(echo "$LOOKUP" | jq -r '.account_ids[0]')"

curl -s "https://api.fastnear.com/v1/account/$ACCOUNT_ID/full" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
  | jq '{account_id, state, tokens: (.tokens|length), nfts: (.nfts|length), pools: (.pools|length)}'
```

Если `matched` больше 1, переключайтесь на [V1 Public Key Lookup All](/api/v1/public-key-all) и пройдитесь по каждому найденному аккаунту.

### Сколько NEAR на этом аккаунте реально доступно к переводу?

Состояние аккаунта NEAR делится на три ведра, которые UI кошельков обычно сливает в одно: `balance` — это свободная часть (не в стейкинге), `locked` — NEAR, привязанный к валидаторскому стейку или lockup-контракту, а `storage_bytes` подразумевает ещё отдельную долю, пришпиленную к trie по текущей ставке 10^19 yoctoNEAR за байт. Один pipeline над `/full` разводит их по полкам.

```bash
ACCOUNT_ID=root.near
FASTNEAR_API_KEY=your_api_key

curl -s "https://api.fastnear.com/v1/account/$ACCOUNT_ID/full" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
  | jq '
      (.state.balance | tonumber) as $amount
      | (.state.locked  | tonumber) as $locked
      | (.state.storage_bytes * 10000000000000000000) as $pinned
      | 1e24 as $ynear
      | {
          account_id,
          near: {
            total_owned:       (($amount + $locked) / $ynear),
            unstaked:          ($amount / $ynear),
            stake_or_lockup:   ($locked / $ynear),
            pinned_to_storage: ($pinned / $ynear),
            spendable:         (($amount - $pinned) / $ynear)
          }
        }'
```

Для `root.near`: ~3914.67 NEAR всего, всё в свободной части, ~0.28677 NEAR закреплено за 28,677 байтами on-chain-состояния, ~3914.38 NEAR доступно к переводу. Новым аккаунтам это особенно заметно — свежесозданный именованный аккаунт ~182 байта «съедает» ~0.00182 NEAR под storage, и именно поэтому CLI-утилиты не дают отправить полный баланс.

Наведите тот же pipeline на валидаторский пул вроде `astro-stakers.poolv1.near`, и пропорции перевернутся: ~730 тыс. свободных, ~27.68 млн в `locked`. Этот `locked` — собственный протокольный валидаторский стейк пула, а не средства делегатов (те учитываются внутри состояния контракта пула). Одно и то же поле означает разное на разных типах аккаунтов.

jq считает в IEEE-754 double, поэтому NEAR-значения выше — только для отображения; для точной бухгалтерии сохраняйте сами yocto-строки.

### Когда в этом аккаунте что-либо последний раз менялось?

У каждой записи в массивах `tokens`, `nfts` и `pools` внутри `/full` есть собственное `last_update_block_height` — блок, в котором индексер последний раз видел изменение этой строки для этого аккаунта. Максимум по всем трём массивам даёт дешёвый сигнал «последняя активность» без похода в Transactions API.

```bash
ACCOUNT_ID=root.near
FASTNEAR_API_KEY=your_api_key

curl -s "https://api.fastnear.com/v1/account/$ACCOUNT_ID/full" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
  | jq '
      [
        (.tokens // [])[].last_update_block_height,
        (.nfts   // [])[].last_update_block_height,
        (.pools  // [])[].last_update_block_height
      ] as $heights
      | ($heights | map(select(. != null))) as $tracked
      | {
          account_id,
          total_entries:        ($heights | length),
          tracked_entries:      ($tracked | length),
          most_recent_block:    ($tracked | max),
          oldest_tracked_block: ($tracked | min)
        }'
```

Для `root.near` это возвращает 254 записи по FT-, NFT- и pool-контрактам, 158 с отслеживаемым блоком и самый свежий блок `194301659`. Этого уже достаточно, чтобы понять, что кошелёк живой, не заходя в историю транзакций.

Это правильный вопрос для «был ли этот кошелёк недавно активен?» или «двигалось ли что-то после блока X?» — дёшево, один запрос, без истории транзакций. Чтобы достать саму транзакцию, вызвавшую последнее изменение, расширяйте поверхность до [Transactions API](/tx). Записи с `last_update_block_height: null` относятся ко времени до per-row-отслеживания индексером (обычно старые airdrops) и здесь игнорируются, а не считаются свежими.

### Показать NFT-коллекции этого кошелька от конкретного издателя

Имена аккаунтов на NEAR кодируют иерархию: `mint.sharddog.near` — это подаккаунт `sharddog.near`, который, в свою очередь, — подаккаунт `near`. Издатели, выпускающие несколько NFT-коллекций, обычно разворачивают каждую как отдельный подаккаунт, поэтому один фильтр по суффиксу над NFT-списком аккаунта вытаскивает всё опубликованное под одним деревом — без внешнего реестра коллекций.

```bash
ACCOUNT_ID=root.near
PUBLISHER=sharddog.near
FASTNEAR_API_KEY=your_api_key

curl -s "https://api.fastnear.com/v1/account/$ACCOUNT_ID/nft" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY" \
  | jq --arg publisher "$PUBLISHER" '
      ("." + $publisher) as $suffix
      | {
          account_id: .account_id,
          publisher: $publisher,
          collections: [
            .tokens[]
            | select(.contract_id | endswith($suffix))
            | {
                contract_id,
                last_update_block_height,
                status: (if .last_update_block_height == null then "dormant" else "active" end)
              }
          ] | sort_by(.last_update_block_height // 0)
        }'
```

Для `root.near` и `sharddog.near` это возвращает четыре контракта-подаккаунта: `ndcconstellationnft`, `mint`, `harvestmoon` и `claim`. Только у `claim` есть ненулевой `last_update_block_height` (`131402024`), так что именно этот контракт явно менял позицию кошелька. Остальные — спящие, что типично для одноразовых drop-контрактов, в которые аккаунт что-то получил и больше не возвращался.

Поменяйте `PUBLISHER` на любой аккаунт, чтобы сфокусировать фильтр на другом дереве издателя.

### Показывает ли кошелёк прямой стейкинг, liquid staking-токены или оба варианта?

Прямые позиции в пулах лежат на `/staking`; liquid staking-токены (stNEAR, LiNEAR и т. п.) лежат на `/ft` как обычные FT. Прочитайте оба эндпоинта и классифицируйте кошелёк — `root.near` оказывается `mixed`.

```bash
ACCOUNT_ID=root.near
LIQUID_PROVIDERS_JSON='["meta-pool.near","lst.rhealab.near","linear-protocol.near"]'
FASTNEAR_API_KEY=your_api_key

STAKING="$(curl -s "https://api.fastnear.com/v1/account/$ACCOUNT_ID/staking" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY")"
FT="$(curl -s "https://api.fastnear.com/v1/account/$ACCOUNT_ID/ft" \
  -H "Authorization: Bearer $FASTNEAR_API_KEY")"

jq -n \
  --argjson staking "$STAKING" \
  --argjson ft "$FT" \
  --argjson providers "$LIQUID_PROVIDERS_JSON" '
  ($staking.pools // []) as $direct
  | (($ft.tokens // []) | map(select(.contract_id as $id | $providers | index($id)))) as $liquid
  | {
      classification:
        if ($direct|length)>0 and ($liquid|length)>0 then "mixed"
        elif ($direct|length)>0 then "direct_only"
        elif ($liquid|length)>0 then "liquid_only"
        else "no_visible_staking_position" end,
      direct_pools: ($direct | map(.pool_id)),
      liquid_tokens: ($liquid | map({contract_id, balance}))
    }'
```

Классификатор знает только то, чему вы его научили — расширяйте `LIQUID_PROVIDERS_JSON` по мере появления новых liquid staking-продуктов и рассматривайте результат как наблюдательный, а не исчерпывающий.

## Частые ошибки

- Сразу идти в широкий снимок аккаунта, когда пользователя интересует только одна категория активов.
- Использовать FastNear API, хотя пользователю нужны точные поля RPC или права доступа.
- Оставаться на страницах сводок по аккаунту, когда вопрос уже стал вопросом об истории транзакций.

## Связанные страницы

- [FastNear API](/api)
- [API Reference](/api/reference)
- [RPC Reference](/rpc)
- [Transactions API](/tx)
- [Choosing the Right Surface](/agents/choosing-surfaces)
- [Agent Playbooks](/agents/playbooks)
