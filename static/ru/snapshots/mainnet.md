**Источник:** [https://docs.fastnear.com/ru/snapshots/mainnet](https://docs.fastnear.com/ru/snapshots/mainnet)

# Mainnet

## Оптимизированный снапшот mainnet

Обычно это предпочтительный способ синхронизации. Архивный снапшот заметно больше и подходит для более узких задач.

Узлы с достаточными ресурсами могут использовать значение `$RPC_TYPE=fast-rpc`. По умолчанию используется `rpc`.

Перед запуском скрипта загрузки снапшота можно задать следующие переменные окружения:

- `CHAIN_ID` — `mainnet` или `testnet` (по умолчанию: `mainnet`)
- `RPC_TYPE` — `rpc` (по умолчанию) или `fast-rpc`
- `THREADS` — число потоков для загрузки. Используйте `128` для 10Gbps и `16` для 1Gbps (по умолчанию: `128`)
- `TPSLIMIT` — максимальное число новых HTTP-действий в секунду (по умолчанию: `4096`)
- `BWLIMIT` — максимальная пропускная способность для загрузки, если её нужно ограничить (по умолчанию: `10G`)
- `DATA_PATH` — путь, куда будет загружен снапшот (по умолчанию: `~/.near/data`)
- `BLOCK` — высота блока нужного снапшота. Если не указать, будет загружен последний снапшот.

**Выполните эту команду, чтобы скачать RPC-снапшот mainnet:**

:::info
Будут заданы следующие переменные окружения:
- `DATA_PATH=~/.near/data` — стандартный путь nearcore
- `CHAIN_ID=mainnet` — явно выбирает данные mainnet
- `RPC_TYPE=fast-rpc` — включает оптимизированный режим
:::

`RPC Mainnet Snapshot » ~/.near/data`:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/fastnear/static/refs/heads/main/down_rclone.sh | DATA_PATH=~/.near/data CHAIN_ID=mainnet RPC_TYPE=fast-rpc bash
```

## RPC-снапшот mainnet

Это стандартный способ получить снапшот без оптимизированного режима из предыдущего раздела.

Перед запуском скрипта загрузки снапшота можно задать следующие переменные окружения:

- `CHAIN_ID` — `mainnet` или `testnet` (по умолчанию: `mainnet`)
- `RPC_TYPE` — `rpc` (по умолчанию) или `fast-rpc`
- `THREADS` — число потоков для загрузки. Используйте `128` для 10Gbps и `16` для 1Gbps (по умолчанию: `128`)
- `TPSLIMIT` — максимальное число новых HTTP-действий в секунду (по умолчанию: `4096`)
- `BWLIMIT` — максимальная пропускная способность для загрузки, если её нужно ограничить (по умолчанию: `10G`)
- `DATA_PATH` — путь, куда будет загружен снапшот (по умолчанию: `~/.near/data`)
- `BLOCK` — высота блока нужного снапшота. Если не указать, будет загружен последний снапшот.

**Выполните эту команду, чтобы скачать RPC-снапшот mainnet:**

:::info
Будут заданы следующие переменные окружения:
- `DATA_PATH=~/.near/data` — стандартный путь nearcore
- `CHAIN_ID=mainnet` — явно выбирает данные mainnet
:::

`RPC Mainnet Snapshot » ~/.near/data`:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/fastnear/static/refs/heads/main/down_rclone.sh | DATA_PATH=~/.near/data CHAIN_ID=mainnet bash
```

## Архивный снапшот mainnet

:::warning
**Требует много времени и места на диске.**

Подготовьтесь к очень большому объёму загрузки и длительному времени выполнения.

Размер снапшота составляет около 60 ТБ, и он содержит более 1 миллиона файлов.
:::

Перед запуском скрипта загрузки можно задать следующие переменные окружения:

- `CHAIN_ID` — `mainnet` или `testnet` (по умолчанию: `mainnet`)
- `THREADS` — число потоков для загрузки. Используйте `128` для 10Gbps и `16` для 1Gbps (по умолчанию: `128`)
- `TPSLIMIT` — максимальное число новых HTTP-действий в секунду (по умолчанию: `4096`)
- `DATA_TYPE` — `hot-data` или `cold-data` (по умолчанию: `cold-data`)
- `BWLIMIT` — максимальная пропускная способность для загрузки, если её нужно ограничить (по умолчанию: `10G`)
- `DATA_PATH` — путь, куда будет загружен снапшот (по умолчанию: `/mnt/nvme/data/$DATA_TYPE`)
- `BLOCK` — высота блока нужного снапшота. Если не указать, будет загружен последний снапшот.

По умолчанию скрипт ожидает следующие пути для данных:

- Hot data, которые должны лежать на NVME: `/mnt/nvme/data/hot-data`
- Cold data, которые можно хранить на HDD: `/mnt/nvme/data/cold-data`

**Выполните следующие команды, чтобы скачать архивный снапшот mainnet:**

1. Получите высоту блока последнего снапшота:

`Latest archival mainnet snapshot block`:

```bash
LATEST=$(curl -s "https://snapshot.neardata.xyz/mainnet/archival/latest.txt")
echo "Latest snapshot block: $LATEST"
```

2. Скачайте данные HOT из снапшота. Их нужно разместить на NVME.

:::info
Будут заданы следующие переменные окружения:
- `DATA_TYPE=hot-data` — выбирает загрузку Hot data
- `DATA_PATH=~/.near/data` — стандартный путь nearcore
- `CHAIN_ID=mainnet` — явно выбирает данные mainnet
- `BLOCK=$LATEST` — указывает блок снапшота
:::

`Archival Mainnet Snapshot (hot-data) » ~/.near/data`:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/fastnear/static/refs/heads/main/down_rclone_archival.sh | DATA_TYPE=hot-data DATA_PATH=~/.near/data CHAIN_ID=mainnet BLOCK=$LATEST bash
```

3. Скачайте данные COLD из снапшота. Их можно разместить на HDD.

:::info
Будут заданы следующие переменные окружения:
- `DATA_TYPE=cold-data` — выбирает загрузку Cold data
- `DATA_PATH=/mnt/hdds/cold-data` — путь для размещения cold data. **Обратите внимание:** конфигурация nearcore должна указывать на тот же путь для cold data.
- `CHAIN_ID=mainnet` — явно выбирает данные mainnet
- `BLOCK=$LATEST` — указывает блок снапшота
:::

`Archival Mainnet Snapshot (cold-data) » /mnt/hdds/cold-data`:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/fastnear/static/refs/heads/main/down_rclone_archival.sh | DATA_TYPE=cold-data DATA_PATH=/mnt/hdds/cold-data CHAIN_ID=mainnet BLOCK=$LATEST bash
```
