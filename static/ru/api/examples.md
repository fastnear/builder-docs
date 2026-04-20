**Источник:** [https://docs.fastnear.com/ru/api/examples](https://docs.fastnear.com/ru/api/examples)

## Примеры

### Определить аккаунт по публичному ключу и сразу получить сводку

Найдите, какому аккаунту принадлежит ключ, и прочитайте его активы за один следующий запрос.

```bash
API_BASE_URL=https://api.fastnear.com
PUBLIC_KEY='ed25519:CCaThr3uokqnUs6Z5vVnaDcJdrfuTpYJHJWcAGubDjT'

LOOKUP="$(curl -s "$API_BASE_URL/v1/public_key/$(jq -rn --arg k "$PUBLIC_KEY" '$k | @uri')")"

echo "$LOOKUP" | jq '{matched: (.account_ids | length), account_ids}'

ACCOUNT_ID="$(echo "$LOOKUP" | jq -r '.account_ids[0]')"

curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/full" \
  | jq '{account_id, state, tokens: (.tokens|length), nfts: (.nfts|length), pools: (.pools|length)}'
```

Если `matched` больше 1, переключайтесь на [V1 Public Key Lookup All](https://docs.fastnear.com/ru/api/v1/public-key-all) и пройдитесь по каждому найденному аккаунту.

### Показывает ли кошелёк прямой стейкинг, liquid staking-токены или оба варианта?

Прямые позиции в пулах лежат на `/staking`; liquid staking-токены (stNEAR, LiNEAR и т. п.) лежат на `/ft` как обычные FT. Прочитайте оба эндпоинта и классифицируйте кошелёк — `root.near` оказывается `mixed`.

```bash
API_BASE_URL=https://api.fastnear.com
ACCOUNT_ID=root.near
LIQUID_PROVIDERS_JSON='["meta-pool.near","lst.rhealab.near","linear-protocol.near"]'

STAKING="$(curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/staking")"
FT="$(curl -s "$API_BASE_URL/v1/account/$ACCOUNT_ID/ft")"

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

- [FastNear API](https://docs.fastnear.com/ru/api)
- [API Reference](https://docs.fastnear.com/ru/api/reference)
- [RPC Reference](https://docs.fastnear.com/ru/rpc)
- [Transactions API](https://docs.fastnear.com/ru/tx)
- [Choosing the Right Surface](https://docs.fastnear.com/ru/agents/choosing-surfaces)
- [Agent Playbooks](https://docs.fastnear.com/ru/agents/playbooks)
