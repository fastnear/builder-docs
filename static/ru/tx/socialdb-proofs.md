**Источник:** [https://docs.fastnear.com/ru/tx/socialdb-proofs](https://docs.fastnear.com/ru/tx/socialdb-proofs)

# Расширенный поиск записи SocialDB

Используйте эту страницу только тогда, когда отправная точка — уже читаемое значение SocialDB из `api.near.social`, а следующий вопрос относится к историческому поиску записи.

Эти shell-шаги работают и с публичными endpoint-ами SocialDB и FastNear. Если `FASTNEAR_API_KEY` уже задан в окружении, FastNear-вызовы автоматически пробросят его как bearer-заголовок.

Для FastNear-first-задач сначала откройте [Transactions Examples](https://docs.fastnear.com/ru/tx/examples). Сюда переходите только тогда, когда вопрос звучит как «какая запись сделала это читаемое значение SocialDB истинным?».

## Канонический пример: доказать, что `root.near` установил `profile.name` в `Illia`

Используйте этот сценарий, когда читаемый факт уже звучит как «текущее `profile.name` равно `Illia`», а остаётся вопрос, какая запись сделала это поле истинным.

Это единственный нюанс SocialDB, который стоит запомнить: для исторического доказательства правильным мостом обычно служит `:block` на уровне поля, а не `:block` родительского объекта.

Для этого живого якоря:

- текущее `profile.name`: `Illia`
- блок записи SocialDB на уровне поля: `75590392`
- receipt ID: `GYvnvBxWA46UGa3aGEkqUBeT7hxhVXk2iZScJFZWU8Se`
- хеш исходной транзакции: `7HtFWv51k5Bispmh1WYPbAVkxr2X4AL6n98DhcQwVw7w`
- внешний блок транзакции: `75590391`

### Shell-сценарий

1. Прочитайте поле из NEAR Social и сохраните блок записи на уровне поля.

```bash
ACCOUNT_ID=root.near
PROFILE_FIELD=profile/name

PROFILE="$(curl -s "https://api.near.social/get" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" --arg profile_field "$PROFILE_FIELD" '{
    keys: [($account_id + "/" + $profile_field)],
    options: {with_block_height: true}
  }')")"

echo "$PROFILE" | jq --arg account_id "$ACCOUNT_ID" '{
  current_name: .[$account_id].profile.name[""],
  field_block_height: .[$account_id].profile.name[":block"],
  parent_profile_block_height: .[$account_id].profile[":block"]
}'

PROFILE_BLOCK_HEIGHT="$(echo "$PROFILE" | jq -r --arg account_id "$ACCOUNT_ID" '.[$account_id].profile.name[":block"]')"
```

2. Переиспользуйте этот блок уровня поля в FastNear block receipts и восстановите receipt вместе с tx hash.

```bash
ACCOUNT_ID=root.near
PROFILE_FIELD=profile/name
AUTH_HEADER=()
if [ -n "${FASTNEAR_API_KEY:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer $FASTNEAR_API_KEY"); fi
PROFILE_BLOCK_HEIGHT="$(
  curl -s "https://api.near.social/get" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --arg account_id "$ACCOUNT_ID" --arg profile_field "$PROFILE_FIELD" '{
      keys: [($account_id + "/" + $profile_field)],
      options: {with_block_height: true}
    }')" \
    | jq -r --arg account_id "$ACCOUNT_ID" '.[$account_id].profile.name[":block"]'
)"
BLOCK_RECEIPTS="$(curl -s "https://tx.main.fastnear.com/v0/block" \
  "${AUTH_HEADER[@]}" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --argjson block_id "$PROFILE_BLOCK_HEIGHT" '{
    block_id: $block_id,
    with_transactions: false,
    with_receipts: true
  }')")"

echo "$BLOCK_RECEIPTS" | jq --arg account_id "$ACCOUNT_ID" '{
  profile_receipt: (
    first(
      .block_receipts[]
      | select(.predecessor_id == $account_id and .receiver_id == "social.near")
      | {receipt_id, transaction_hash, block_height, tx_block_height}
    )
  )
}'

PROFILE_TX_HASH="$(echo "$BLOCK_RECEIPTS" | jq -r --arg account_id "$ACCOUNT_ID" '
  first(
    .block_receipts[]
    | select(.predecessor_id == $account_id and .receiver_id == "social.near")
    | .transaction_hash
  )')"
```

3. Переиспользуйте этот tx hash в `POST /v0/transactions` и декодируйте payload записи SocialDB.

```bash
ACCOUNT_ID=root.near
PROFILE_FIELD=profile/name
AUTH_HEADER=()
if [ -n "${FASTNEAR_API_KEY:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer $FASTNEAR_API_KEY"); fi
PROFILE_BLOCK_HEIGHT="$(
  curl -s "https://api.near.social/get" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --arg account_id "$ACCOUNT_ID" --arg profile_field "$PROFILE_FIELD" '{
      keys: [($account_id + "/" + $profile_field)],
      options: {with_block_height: true}
    }')" \
    | jq -r --arg account_id "$ACCOUNT_ID" '.[$account_id].profile.name[":block"]'
)"
PROFILE_TX_HASH="$(
  curl -s "https://tx.main.fastnear.com/v0/block" \
    "${AUTH_HEADER[@]}" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --argjson block_id "$PROFILE_BLOCK_HEIGHT" '{
      block_id: $block_id,
      with_transactions: false,
      with_receipts: true
    }')" \
    | jq -r --arg account_id "$ACCOUNT_ID" '
        first(
          .block_receipts[]
          | select(.predecessor_id == $account_id and .receiver_id == "social.near")
          | .transaction_hash
        )'
)"
curl -s "https://tx.main.fastnear.com/v0/transactions" \
  "${AUTH_HEADER[@]}" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg tx_hash "$PROFILE_TX_HASH" '{tx_hashes: [$tx_hash]}')" \
  | jq --arg account_id "$ACCOUNT_ID" '{
      transaction: {
        hash: .transactions[0].transaction.hash,
        signer_id: .transactions[0].transaction.signer_id,
        receiver_id: .transactions[0].transaction.receiver_id,
        included_block_height: .transactions[0].execution_outcome.block_height
      },
      write_proof: (
        .transactions[0].receipts[0].receipt.receipt.Action.actions[0].FunctionCall
        | (.args | @base64d | fromjson | .data[$account_id].profile) as $profile
        | {
            method_name,
            profile_name: $profile.name,
            image_fields: (($profile.image // {}) | keys),
            linktree_keys: (($profile.linktree // {}) | keys)
          }
      )
    }'
```

Это и есть весь паттерн lookup: читаемое значение, блок уровня поля, мост через receipt и payload транзакции.

Тот же мост работает и для других читаемых значений SocialDB:

- вариант для связи подписки: `root.near -> mob.near`, блок `79152039`, tx `DvNoqtDrruhmcq7mPpxdFacph2ZCqSzMFF5ZqMRFG78q`
- вариант для исходника виджета: `root.near/widget/Profile`, блок `76029540`, tx `ELS3DrE4Upoc91ZnBh4thVugxCUBAbaLFB4nyKsoyRNP`

Ключевая идея не меняется: начните с читаемого значения и его write-block, восстановите receipt `*.near -> social.near` из блока, а затем декодируйте payload `social.near set` из исходной транзакции.
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- Один API-ключ FastNear работает и для RPC, и для индексированных API.
- Получите API-ключ на [dashboard.fastnear.com](https://dashboard.fastnear.com).
