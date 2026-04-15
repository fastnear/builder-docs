**Источник:** [https://docs.fastnear.com/ru/snapshots](https://docs.fastnear.com/ru/snapshots)

# Снапшоты блокчейна

:::warning[Бесплатные снапшоты устарели]
Бесплатные снапшоты данных nearcore больше не поддерживаются.

Infrastructure Committee и Near One рекомендуют использовать Epoch Sync и децентрализованную синхронизацию состояния. Подробности есть на [NEAR Nodes](https://near-nodes.io).
:::

Скачайте состояние блокчейна, чтобы развернуть узел валидатора или RPC. Подробнее о требованиях к узлам и запуску смотрите в [nearcore](https://github.com/near/nearcore?tab=readme-ov-file#about-near).

:::info[Установка rclone]
Для этих крупных загрузок используется `rclone`, который можно установить так:

```bash
sudo -v ; curl https://rclone.org/install.sh | sudo bash
```
:::

Валидаторы найдут больше информации по настройке на [NEAR Nodes](https://near-nodes.io).

Эти руководства используют логику из [репозитория FastNear static](https://github.com/fastnear/static).

## Выберите сеть

  - [Снапшоты mainnet](https://docs.fastnear.com/ru/snapshots/mainnet)
  - [Снапшоты testnet](https://docs.fastnear.com/ru/snapshots/testnet)
