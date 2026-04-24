**Источник:** [https://docs.fastnear.com/ru/snapshots/testnet](https://docs.fastnear.com/ru/snapshots/testnet)

# Testnet

## RPC-снапшот testnet

Обычно это предпочтительный способ синхронизации. Архивный снапшот заметно больше и нужен для более узких задач.

Перед запуском скрипта загрузки снапшота можно задать следующие переменные окружения:

- `CHAIN_ID` — `mainnet` или `testnet` (по умолчанию: `mainnet`)
- `THREADS` — число потоков для загрузки. Используйте `128` для 10Gbps и `16` для 1Gbps (по умолчанию: `128`)
- `TPSLIMIT` — максимальное число новых HTTP-действий в секунду (по умолчанию: `4096`)
- `BWLIMIT` — максимальная пропускная способность для загрузки, если её нужно ограничить (по умолчанию: `10G`)
- `DATA_PATH` — путь, куда будет загружен снапшот (по умолчанию: `~/.near/data`)
- `BLOCK` — высота блока нужного снапшота. Если не указать, будет загружен последний снапшот.

**Выполните эту команду, чтобы скачать RPC-снапшот testnet:**

:::info
Будут заданы следующие переменные окружения:
- `DATA_PATH=~/.near/data` — стандартный путь nearcore
- `CHAIN_ID=testnet` — явно выбирает данные testnet
:::

`RPC Testnet Snapshot » ~/.near/data`:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/fastnear/static/refs/heads/main/down_rclone.sh | DATA_PATH=~/.near/data CHAIN_ID=testnet bash
```

## Архивный снапшот testnet

:::warning
**Требует много времени и места на диске.**

Подготовьтесь к большому объёму загрузки и длительному времени выполнения.
:::

Перед запуском скрипта загрузки можно задать следующие переменные окружения:

- `CHAIN_ID` — `mainnet` или `testnet` (по умолчанию: `mainnet`)
- `THREADS` — число потоков для загрузки. Используйте `128` для 10Gbps и `16` для 1Gbps (по умолчанию: `128`)
- `TPSLIMIT` — максимальное число новых HTTP-действий в секунду (по умолчанию: `4096`)
- `DATA_TYPE` — `hot-data` или `cold-data` (по умолчанию: `cold-data`)
- `BWLIMIT` — максимальная пропускная способность для загрузки, если её нужно ограничить (по умолчанию: `10G`)
- `DATA_PATH` — путь, куда будет загружен снапшот (по умолчанию: `/mnt/nvme/data/$DATA_TYPE`)
- `BLOCK` — высота блока нужного снапшота. Если не указать, будет загружен последний снапшот.

По умолчанию скрипт ожидает следующий путь для данных:

- Hot data, которые должны лежать на NVME: `/mnt/nvme/data/hot-data`

**Выполните следующие команды, чтобы скачать архивный снапшот testnet:**

1. Получите высоту блока последнего снапшота:

`Latest archival testnet snapshot block`:

```bash
LATEST=$(curl -s "https://snapshot.neardata.xyz/testnet/archival/latest.txt")
echo "Latest snapshot block: $LATEST"
```

2. Скачайте данные HOT из снапшота. Их нужно разместить на NVME.

:::info
Будут заданы следующие переменные окружения:
- `DATA_TYPE=hot-data` — выбирает загрузку Hot data
- `DATA_PATH=~/.near/data` — стандартный путь nearcore
- `CHAIN_ID=testnet` — явно выбирает сеть testnet
- `BLOCK=$LATEST` — указывает блок снапшота
:::

`Archival Testnet Snapshot (hot-data) » ~/.near/data`:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/fastnear/static/refs/heads/main/down_rclone_archival.sh | DATA_TYPE=hot-data DATA_PATH=~/.near/data CHAIN_ID=testnet BLOCK=$LATEST bash
```
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- Один API-ключ FastNear работает и для RPC, и для индексированных API.
- Получите API-ключ на [dashboard.fastnear.com](https://dashboard.fastnear.com).
