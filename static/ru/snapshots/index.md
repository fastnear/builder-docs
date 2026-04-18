**Источник:** [https://docs.fastnear.com/ru/snapshots](https://docs.fastnear.com/ru/snapshots)

# Снапшоты блокчейна

Этот раздел — для операторов узлов, которые поднимают или восстанавливают инфраструктуру NEAR. Это не поверхность для прикладных данных. Если задача — читать балансы, историю, блоки или состояние контракта, используйте документацию API и RPC, а не сценарии со снапшотами.

:::warning[Бесплатные снапшоты устарели]
Бесплатные снапшоты данных nearcore больше не выпускаются.

Infrastructure Committee и Near One рекомендуют Epoch Sync вместе с децентрализованной синхронизацией состояния. Актуальные рекомендации и режим подъёма смотрите на [NEAR Nodes](https://near-nodes.io).
:::

## Используйте этот раздел, когда

- нужно поднять узел mainnet или testnet из данных снапшота
- идёт восстановление RPC- или архивного узла
- уже известно, что нужен путь загрузки снапшота FastNear

## Не используйте этот раздел, когда

- идёт запрос данных цепочки для приложения
- нужны свежие блоки, балансы, история или состояние контракта
- нужны общие рекомендации по продуктовому API, а не настройка оператором

В этих случаях используйте [Справочник RPC](https://docs.fastnear.com/ru/rpc), [FastNear API](https://docs.fastnear.com/ru/api), [Транзакции API](https://docs.fastnear.com/ru/tx) или [NEAR Data API](https://docs.fastnear.com/ru/neardata).

## Перед загрузкой

- Сначала выберите сеть: mainnet или testnet.
- Решите, нужны обычные данные RPC или архивные.
- Убедитесь, что понимаете, где должны лежать горячие и холодные данные, прежде чем стартовать архивную загрузку.

- Установите `rclone` — скрипты загрузки от него зависят.

:::info[Установка `rclone`]
Установите `rclone` командой:

```bash
sudo -v ; curl https://rclone.org/install.sh | sudo bash
```
:::

## Что покрывает каждый путь

- **Mainnet** включает оптимизированный `fast-rpc`, обычный RPC и архивные пути загрузки для горячих и холодных данных.
- **Testnet** включает RPC и архивные пути снапшотов для операторов testnet.

Требования к узлам смотрите в [nearcore](https://github.com/near/nearcore?tab=readme-ov-file#about-near), а исходники скриптов загрузки, которые используются в этих руководствах, — в [fastnear/static](https://github.com/fastnear/static).

## Нужен сценарий?

Используйте [Snapshot Examples](https://docs.fastnear.com/ru/snapshots/examples) для операторских сценариев: выбор между optimized `fast-rpc`, standard RPC recovery и archival hot/cold snapshot paths.

## Выберите сеть

  - [Снапшоты mainnet](https://docs.fastnear.com/ru/snapshots/mainnet)
  - [Снапшоты testnet](https://docs.fastnear.com/ru/snapshots/testnet)
