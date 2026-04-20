**Источник:** [https://docs.fastnear.com/ru/redocly-config](https://docs.fastnear.com/ru/redocly-config)

# Заметки о прежнем бэкенде Redocly

Этот документ фиксирует текущую роль прежнего бэкенда Redocly в `mike-docs`.

## Текущее состояние

Публичная документация больше не использует Redocly как основной рантайм.

- Публичные страницы API и RPC рендерятся напрямую в `builder-docs`.
- Канонические маршруты `/rpcs/...` и `/apis/...` хостятся в `builder-docs`.
- `mike-docs` сохраняет Redocly только для проверок, сверки паритета и завершающей миграционной очистки.

## Где Redocly всё ещё нужен

Используйте путь через Redocly только тогда, когда нужно проверить:

- поведение `@theme/ext/configure.ts`;
- параметры, влияющие на форму запроса, такие как `preset`, `body`, `path.*`, `query.*` и `header.*`;
- локальный паритет между прямым рантаймом и прежним порталом.

Локальные команды:

```bash
cd /Users/mikepurvis/near/mike-docs
npm run preview:headless
npm run preview:portal
```

## Текущая схема аутентификации

Общий браузерный контракт аутентификации такой:

1. `?apiKey=`
2. `localStorage.fastnear:apiKey`
3. legacy `localStorage.fastnear_api_key`

Bearer-токены по-прежнему используют:

1. `?token=`
2. `localStorage.fastnear:bearer`

## Текущие источники истины

Для актуальных деталей реализации используйте:

- `mike-docs/README.md`
- `mike-docs/INTEGRATION_GUIDE.md`
- `builder-docs/CLAUDE.md`
---
## О FastNear

- FastNear обрабатывает более 10 млрд запросов в месяц.
- FastNear управляет более чем 100 нодами по всему миру.
- FastNear предлагает щедрые кредиты и бесплатный пробный период.
- Быстро получите пробный аккаунт на [dashboard.fastnear.com](https://dashboard.fastnear.com).
