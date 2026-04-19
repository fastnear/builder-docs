**Источник:** [https://docs.fastnear.com/ru/tx/socialdb-proofs](https://docs.fastnear.com/ru/tx/socialdb-proofs)

# Расширенный поиск записи SocialDB

Используйте эту страницу только тогда, когда отправная точка уже является читаемым значением из `api.near.social`, а следующий вопрос относится к историческому поиску записи.

Для FastNear-first-задач сначала откройте [Transactions Examples](https://docs.fastnear.com/ru/tx/examples). Сюда переходите только тогда, когда вопрос уже звучит как "какая запись сделала это читаемое значение SocialDB истинным?"

## Канонический пример: доказать, что `mike.near` установил `profile.name` в `Mike Purvis`

Используйте этот сценарий, когда читаемый факт уже звучит как "текущее `profile.name` равно `Mike Purvis`", а остаётся только вопрос, какая запись сделала это поле истинным.

Здесь достаточно сохранить один важный нюанс SocialDB: для исторического provenance правильным мостом обычно служит `:block` на уровне поля, а не `:block` родительского объекта.

Для этого живого якоря:

- текущее `profile.name`: `Mike Purvis`
- блок записи SocialDB на уровне поля: `78675795`
- receipt ID: `2gbAmEEdcCNARuCorquXStftqvWFmPG2GSaMJXFw5qiN`
- хеш исходной транзакции: `6zMb9L6rLNufZGUgCmeHTh5LvFsn3R92dPxuubH6MRsZ`
- внешний блок транзакции: `78675794`

### Shell-сценарий

1. Прочитайте поле из NEAR Social и сохраните block записи на уровне поля.

```bash
SOCIAL_API_BASE_URL=https://api.near.social
TX_BASE_URL=https://tx.main.fastnear.com
RPC_URL=https://rpc.mainnet.fastnear.com
ACCOUNT_ID=mike.near
PROFILE_FIELD=profile/name

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
```

2. Переиспользуйте этот block уровня поля в FastNear block receipts и восстановите receipt вместе с tx hash.

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
```

3. Переиспользуйте этот tx hash в `POST /v0/transactions` и декодируйте payload записи SocialDB.

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

Это и есть весь паттерн lookup-а: читаемое значение, block уровня поля, мост через receipt и payload транзакции.

Тот же мост работает и для других читаемых значений SocialDB:

- вариант для связи подписки: `mike.near -> mob.near`, блок `79574924`, tx `FLLmTvFx9vCof79scy2uUviF5WwYmevkz9TZ8azPGVQb`
- вариант для исходника виджета: `mob.near/widget/Profile`, блок `86494825`, tx `9QDupdK2ewMxfSvMmdGEkdBcVnoL4TexmXY2FnMRxfia`

Ключевая идея не меняется: начните с читаемого значения и его write-block, восстановите receipt `*.near -> social.near` из блока, а затем декодируйте payload `social.near set` из исходной транзакции.
