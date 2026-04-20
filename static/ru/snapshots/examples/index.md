**Источник:** [https://docs.fastnear.com/ru/snapshots/examples](https://docs.fastnear.com/ru/snapshots/examples)

## Быстрый старт

Если задача звучит просто как «быстро вернуть mainnet RPC-узел», начните с одной рабочей команды.

Эти helper-скрипты поддерживаются FastNear и оптимизированы под скорость восстановления. Если в вашей среде нужен review изменений, сначала скачайте скрипт, проверьте его и только потом запускайте, вместо прямого piping в `bash`.

```bash
DATA_PATH=~/.near/data

curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/fastnear/static/refs/heads/main/down_rclone.sh \
  | DATA_PATH="$DATA_PATH" CHAIN_ID=mainnet RPC_TYPE=fast-rpc bash
```

## Пример

### Выбрать и выполнить правильный сценарий восстановления mainnet

    Ход
    Сначала выберите класс восстановления, а затем выполните минимальную последовательность команд именно для него.

    01Сначала решите, нужен ли вам optimized fast-rpc, обычный RPC или архивный режим.
    02Если нужен архив, сначала зафиксируйте одну точную высоту snapshot-блока и дальше переиспользуйте только её.
    03Выполняйте только команды выбранного пути и не смешивайте optimized, standard и archival шаги в одном сценарии.

### Минимальная команда для optimized mainnet `fast-rpc`

```bash
DATA_PATH=~/.near/data

curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/fastnear/static/refs/heads/main/down_rclone.sh \
  | DATA_PATH="$DATA_PATH" CHAIN_ID=mainnet RPC_TYPE=fast-rpc bash
```

### Минимальная команда для стандартного mainnet RPC

```bash
DATA_PATH=~/.near/data

curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/fastnear/static/refs/heads/main/down_rclone.sh \
  | DATA_PATH="$DATA_PATH" CHAIN_ID=mainnet bash
```

### Shell-сценарий архивного восстановления mainnet
Для архивного восстановления сначала получите одну высоту snapshot и переиспользуйте её для hot- и cold-data.

**Ход**

- Один раз получаете последнюю высоту архивного снапшота mainnet.
- Сохраняете её в `LATEST`.
- Переиспользуете ровно эту же высоту блока и для hot-data, и для cold-data.

```bash
HOT_DATA_PATH=~/.near/data
COLD_DATA_PATH=/mnt/hdds/cold-data

LATEST="$(curl -s "https://snapshot.neardata.xyz/mainnet/archival/latest.txt")"
echo "Latest archival mainnet snapshot block: $LATEST"

curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/fastnear/static/refs/heads/main/down_rclone_archival.sh \
  | DATA_TYPE=hot-data DATA_PATH="$HOT_DATA_PATH" CHAIN_ID=mainnet BLOCK="$LATEST" bash

curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/fastnear/static/refs/heads/main/down_rclone_archival.sh \
  | DATA_TYPE=cold-data DATA_PATH="$COLD_DATA_PATH" CHAIN_ID=mainnet BLOCK="$LATEST" bash
```

**Когда переходить дальше**

Архивные hot- и cold-данные должны происходить из одного и того же среза снапшота. Повторное использование одного сохранённого значения `LATEST` в обеих командах сохраняет внутреннюю согласованность архива и делает последующую настройку nearcore заметно менее неожиданной.

## Частые ошибки

- Использовать документацию по снапшотам, когда задача на самом деле про чтение данных цепочки.
- Выбирать архивное восстановление, когда достаточно обычного или optimized RPC.
- Забывать про разделение hot/cold-данных для архивного режима.
- Переходить к командам до выбора сети и цели узла.

## Полезные связанные страницы

- [Обзор снапшотов](https://docs.fastnear.com/ru/snapshots)
- [Снапшоты mainnet](https://docs.fastnear.com/ru/snapshots/mainnet)
- [Снапшоты testnet](https://docs.fastnear.com/ru/snapshots/testnet)
- [RPC Reference](https://docs.fastnear.com/ru/rpc)
- [NEAR Data API](https://docs.fastnear.com/ru/neardata)
