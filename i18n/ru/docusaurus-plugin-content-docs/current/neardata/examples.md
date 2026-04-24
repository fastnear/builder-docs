---
sidebar_label: Examples
slug: /neardata/examples
title: "Примеры NEAR Data"
description: "Практические примеры NEAR Data: живой мониторинг, optimistic-проверки и доказательство на уровне shard."
displayed_sidebar: nearDataApiSidebar
page_actions:
  - markdown
---

## Примеры

NEAR Data возвращает каждый блок полностью гидратированным одним JSON-документом — header плюс per-shard chunks, receipts, результаты исполнения и state changes, — так что один `curl` уже даёт всё необходимое, чтобы отфильтровать нужный контракт без второго запроса.

Все shell-примеры ниже работают на публичных NEAR Data-хостах как есть. Если в shell задан `FASTNEAR_API_KEY`, они автоматически добавляют bearer header; если переменная не задана, они переходят на публичный неаутентифицированный путь.

### На каком блоке NEAR сейчас?

`/v0/last_block/final` отдаёт 302-редирект на текущий финализированный блок. Прежде чем фильтровать по конкретному контракту, полезно увидеть, как выглядит один блок на уровне протокола: транзакции приходят с разбивкой по shard, поэтому общее число транзакций в блоке — это сумма по shards, а не одно поле верхнего уровня.

```bash
AUTH_HEADER=()
if [ -n "${FASTNEAR_API_KEY:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer $FASTNEAR_API_KEY"); fi

curl -sL "https://mainnet.neardata.xyz/v0/last_block/final" \
  "${AUTH_HEADER[@]}" \
  | jq '{
      height: .block.header.height,
      timestamp_nanosec: .block.header.timestamp_nanosec,
      txs_per_shard: [.shards[] | {shard_id, tx_count: (.chunk.transactions | length)}],
      total_txs: ([.shards[].chunk.transactions[]?] | length)
    }'
```

Живой блок показывает 9 shards и горсть транзакций, распределённых по ним — большинство shards в любом блоке пустые, а активность концентрируется на тех shards, где живут загруженные контракты. `timestamp_nanosec` — это Unix-время в наносекундах (делите на 1e9, чтобы получить секунды). С этим одним вызовом у вас уже есть всё необходимое для дальнейшего копания — примеры фильтрации ниже просто применяют jq к тому же ответу.

### Был ли мой контракт затронут в последнем финализированном блоке?

`/v0/last_block/final` отдаёт 302-редирект на текущий финализированный блок. Контракт может проявиться либо в `transactions` chunk (когда он `receiver_id`), либо в `receipts` (когда прилетает cross-shard-вызов), поэтому один проход jq по shards покрывает оба случая.

```bash
TARGET_CONTRACT=intents.near
AUTH_HEADER=()
if [ -n "${FASTNEAR_API_KEY:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer $FASTNEAR_API_KEY"); fi

curl -sL "https://mainnet.neardata.xyz/v0/last_block/final" \
  "${AUTH_HEADER[@]}" \
  | jq --arg contract "$TARGET_CONTRACT" '{
      height: .block.header.height,
      contract: $contract,
      touched_shards: [
        .shards[] | {
          shard_id,
          txs:      [.chunk.transactions[]? | select(.transaction.receiver_id == $contract) | .transaction.hash],
          receipts: [.chunk.receipts[]?     | select(.receiver_id == $contract)             | .receipt_id]
        } | select((.txs | length) + (.receipts | length) > 0)
      ]
    }'
```

`touched_shards: []` — полный ответ для тихого блока. Непустой список называет shards, где контракт появился, и отдаёт конкретные `tx`-хеши или `receipt_id` — передавайте хеш в [Transactions API](/tx), когда нужна человекочитаемая история. Receipts без парных `txs` — это нормально: cross-contract-вызов приходит как incoming receipt в этом блоке, даже если исходная транзакция была раньше.

### Увидел ли я активность в optimistic-режиме, и догнала ли её finality?

Optimistic-блоки ходят по `/v0/block_opt/{height}` примерно на секунду впереди `/v0/block/{height}`. Цикл мониторинга может действовать по optimistic-сигналу и ожидать, что тот же ответ придёт на финализированный эндпоинт через один блок — если только стресс сети не расширит разрыв, и тогда финализированный fetch вернёт `null`, а вы подождёте.

```bash
TARGET_CONTRACT=intents.near
AUTH_HEADER=()
if [ -n "${FASTNEAR_API_KEY:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer $FASTNEAR_API_KEY"); fi

count_touches() {
  jq --arg contract "$1" '
    [.shards[]
     | ([.chunk.transactions[]? | select(.transaction.receiver_id == $contract)] | length)
     + ([.chunk.receipts[]?     | select(.receiver_id == $contract)]             | length)]
    | add // 0'
}

OPT_LOCATION="$(
  curl -s -D - -o /dev/null "${AUTH_HEADER[@]}" "https://mainnet.neardata.xyz/v0/last_block/optimistic" \
    | awk 'tolower($1) == "location:" {print $2}' | tr -d '\r'
)"
OPT_HEIGHT="${OPT_LOCATION##*/}"

echo "optimistic @ $OPT_HEIGHT: $(curl -s "https://mainnet.neardata.xyz$OPT_LOCATION" \
  "${AUTH_HEADER[@]}" | count_touches "$TARGET_CONTRACT") touches"
FINAL="$(curl -s "https://mainnet.neardata.xyz/v0/block/$OPT_HEIGHT" \
  "${AUTH_HEADER[@]}")"
if [ "$(printf '%s' "$FINAL" | jq 'type')" = '"null"' ]; then
  echo "finalized @ $OPT_HEIGHT: not caught up yet"
else
  echo "finalized @ $OPT_HEIGHT: $(printf '%s' "$FINAL" | count_touches "$TARGET_CONTRACT") touches"
fi
```

На здоровом mainnet оба счётчика совпадают в пределах секунды. Ценность — в самом шаблоне: optimistic-поток даёт ответ, на который можно реагировать сразу, а финализированный приходит через блок как надёжное подтверждение.

### Какой shard действительно изменил состояние моего контракта?

В большинстве финализированных блоков нет мутации состояния ни для одного конкретного контракта — активность разрежена и привязана к shard. Идите назад от финализированной головы, пока состояние контракта реально не изменится, и откройте этот shard для payload мутации. Вызов уровня блока говорит, *на каком* shard это случилось; вызов уровня shard — *как*.

```bash
TARGET_CONTRACT=intents.near
AUTH_HEADER=()
if [ -n "${FASTNEAR_API_KEY:-}" ]; then AUTH_HEADER=(-H "Authorization: Bearer $FASTNEAR_API_KEY"); fi

HEAD="$(curl -sL "https://mainnet.neardata.xyz/v0/last_block/final" \
  "${AUTH_HEADER[@]}" | jq '.block.header.height')"
FOUND_HEIGHT=""
FOUND_SHARD=""

for OFFSET in $(seq 0 15); do
  H=$((HEAD - OFFSET))
  SHARD="$(curl -s "https://mainnet.neardata.xyz/v0/block/$H" \
    "${AUTH_HEADER[@]}" \
    | jq -r --arg contract "$TARGET_CONTRACT" '
        .shards[]
        | select([.state_changes[]? | select(.change.account_id? == $contract)] | length > 0)
        | .shard_id
      ' | head -1)"
  if [ -n "$SHARD" ]; then
    FOUND_HEIGHT=$H; FOUND_SHARD=$SHARD
    break
  fi
done

if [ -z "$FOUND_HEIGHT" ]; then
  echo "no state mutation for $TARGET_CONTRACT in the last 16 finalized blocks"
else
  curl -s "https://mainnet.neardata.xyz/v0/block/$FOUND_HEIGHT/shard/$FOUND_SHARD" \
    "${AUTH_HEADER[@]}" \
    | jq --arg contract "$TARGET_CONTRACT" --argjson height "$FOUND_HEIGHT" --argjson shard_id "$FOUND_SHARD" '{
        height: $height,
        shard_id: $shard_id,
        state_changes:      [.state_changes[]              | select(.change.account_id?                        == $contract) | {type, cause: (.cause | keys[0])}][0:3],
        execution_outcomes: [.receipt_execution_outcomes[] | select(.execution_outcome.outcome.executor_id     == $contract) | {receipt_id: .execution_outcome.id, status: (.execution_outcome.outcome.status | keys[0])}][0:3]
      }'
fi
```

На mainnet `intents.near` живёт на shard 7, поэтому обход назад обычно попадает в цель за несколько блоков. Payload shard называет конкретные типы state-change (`account_update`, `data_update` и т. п.) и результаты receipt, которые их породили, — shard-локальное доказательство без догадок. Для менее активных контрактов расширьте диапазон `OFFSET`.

## Когда расширить поверхность

- Используйте [Transactions API](/tx), когда у вас уже есть `tx_hash` и нужна человекочитаемая история транзакции.
- Используйте [RPC Reference](/rpc), когда следующий вопрос касается точной протокольной семантики receipt или блока.
- Используйте [Block Headers](/neardata/block-headers), когда нужна только динамика head/finality, а не проверка contract-touch.
