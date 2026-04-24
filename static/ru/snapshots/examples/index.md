**Источник:** [https://docs.fastnear.com/ru/snapshots/examples](https://docs.fastnear.com/ru/snapshots/examples)

## Пути восстановления mainnet

Выберите один класс — optimized `fast-rpc`, standard RPC или archival — и выполняйте только команды этого пути. Смешивание классов приводит к несогласованным данным узла.

FastNear поддерживает эти скрипты ради скорости восстановления. Если в вашей среде требуется review изменений, скачайте скрипт и проверьте его перед запуском (вместо прямой передачи через pipe в `bash`).

### Optimized mainnet `fast-rpc`

```bash
DATA_PATH=~/.near/data

curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/fastnear/static/refs/heads/main/down_rclone.sh \
  | DATA_PATH="$DATA_PATH" CHAIN_ID=mainnet RPC_TYPE=fast-rpc bash
```

### Standard mainnet RPC

```bash
DATA_PATH=~/.near/data

curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/fastnear/static/refs/heads/main/down_rclone.sh \
  | DATA_PATH="$DATA_PATH" CHAIN_ID=mainnet bash
```

### Archival mainnet

Для archival нужны две загрузки из *одного и того же* среза снапшота. Зафиксируйте одно значение `LATEST` и переиспользуйте его и для hot-, и для cold-data — смешивание высот даёт внутренне несогласованный набор данных и удивляет nearcore на этапе настройки.

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

## Частые ошибки

- Использовать документацию по снапшотам, когда задача на самом деле про чтение данных цепочки.
- Выбирать archival-восстановление, когда достаточно standard или optimized RPC.
- Забывать про разделение hot/cold-хранилища для archival-данных.
- Переходить к командам до выбора сети и цели узла.

## Связанные страницы

- [Обзор snapshot](https://docs.fastnear.com/ru/snapshots)
- [Снапшоты mainnet](https://docs.fastnear.com/ru/snapshots/mainnet)
- [Снапшоты testnet](https://docs.fastnear.com/ru/snapshots/testnet)
- [RPC Reference](https://docs.fastnear.com/ru/rpc)
- [NEAR Data API](https://docs.fastnear.com/ru/neardata)
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- Один API-ключ FastNear работает и для RPC, и для индексированных API.
- Получите API-ключ на [dashboard.fastnear.com](https://dashboard.fastnear.com).
