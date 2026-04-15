# Russian Translation Glossary

Canonical term list for the Russian locale. Every entry is traceable either to an external authoritative source (Yandex Cloud, Tinkoff Invest API, Waves Enterprise) or to an internal convention.

Companion references:

- [Style guide](i18n_translating_russian.md) — the three-tier model and full rules.
- [Quick reference](i18n_ru_quick_reference.md) — one-page translator's card.
- [Adding new locales](i18n_adding_locales.md) — template for future locale rollouts.
- `yarn audit:ru-terminology` — the runnable audit that flags known terminology defects.

## How to read the tables

- ✓ means the entry is cited against the named source. Unmarked rows are internal conventions or cross-domain standards.
- **Category** indicates which of the three tiers applies:
  - **Native** — ordinary Russian word (translate).
  - **Transliterated** — Cyrillicized foreign loanword (declinable Russian noun).
  - **Latin** — protocol names, acronyms, code identifiers (leave as-is).
  - **Hybrid** — compound joining a Latin abbreviation with a Russian noun via hyphen: `API-ключ`, `HTTP-запрос`.
- Brand names — NEAR, FastNear, FastNEAR, FastData — always stay Latin.

## API and protocol vocabulary

| English | Russian | Category | Source | Notes |
|---|---|---|---|---|
| request | запрос | Native | Yandex ✓ | Universal; `HTTP-запрос` in compounds |
| response | ответ | Native | Yandex ✓ | «тело ответа» for response body |
| method | метод | Native | Yandex ✓ | Covers HTTP, RPC, class methods |
| parameter | параметр | Native | Yandex ✓ | |
| query | запрос / строка запроса | Native | Yandex ✓ | URL query params: `query-параметры` |
| endpoint | эндпоинт | Transliterated | Tinkoff ✓ | Formal alternative: «конечная точка» (Yandex). Our default: «эндпоинт» (70+ corpus uses). |
| path | путь | Native | Yandex ✓ | |
| URL / URI | URL / URI | Latin | Yandex ✓ | Not declined |
| header | заголовок | Native | Yandex ✓ | `HTTP-заголовок` |
| body | тело | Native | Yandex ✓ | «тело запроса», «тело ответа» |
| payload | полезная нагрузка / тело | Native | — | Often rendered as «тело запроса»/«тело ответа» |
| resource | ресурс | Latin-rooted | Yandex ✓ | |
| service | сервис | Latin-rooted | Tinkoff ✓ | |
| client | клиент | Latin-rooted | Tinkoff ✓ | |
| server | сервер | Latin-rooted | — | |
| schema | схема | Latin-rooted | Yandex ✓ | |
| SDK | SDK | Latin | Yandex ✓ | |
| CLI | CLI | Latin | Yandex ✓ | |
| webhook | вебхук | Transliterated | Tinkoff ✓ | |
| idempotent | идемпотентный | Latin-rooted | — | |

## Authentication and authorization

| English | Russian | Category | Source | Notes |
|---|---|---|---|---|
| authentication | аутентификация | Latin-rooted | Yandex ✓ | "Verify identity" |
| authorization | авторизация | Latin-rooted | Yandex ✓ | "Grant access rights" |
| token | токен | Transliterated | Yandex ✓ | Decline: токена (gen), токену (dat), токеном (instr) |
| access token | токен доступа | Hybrid | Tinkoff ✓ | Short-lived credential |
| refresh token | refresh-токен | Hybrid | Yandex ✓ | Long-lived credential |
| API key | API-ключ | Hybrid | — | Hyphenated; never «API ключ» |
| Bearer token | Bearer-токен | Hybrid | Tinkoff ✓ | Header: `Authorization: Bearer [токен]` |
| credentials | учётные данные | Native | — | |
| session | сессия | Transliterated | Yandex ✓ | |
| sandbox | песочница | Native | Tinkoff ✓ | «контур песочницы»; sandbox-only токены |
| production (environment) | продовый контур / продовый сервис / продовый бэкенд | Transliterated | Tinkoff ✓ | Prefer operator-style `продовый`; never «продакшен». |
| scope (auth) | область действия / разрешения | Native | — | |
| permission | право доступа | Native | Yandex ✓ | |

## Data types

| English | Russian (prose) | Source | Notes |
|---|---|---|---|
| string | строка | Yandex ✓ | In code: `string` |
| integer | целое число | — | In code: `int64`, `u64` |
| float / double | число с плавающей запятой | — | |
| boolean | логическое значение / булево значение | — | |
| array | массив | Yandex ✓ | |
| object | объект | Yandex ✓ | `JSON-объект` in compounds |
| null | null | — | Described as «пустое значение» |
| enum | перечисление | — | |
| map / dictionary | словарь | — | |
| struct | структура | — | |
| hash (value) | хеш | — | Both «хеш»/«хэш» are attested; we prefer «хеш» |
| base64 | Base64 | — | «кодировка Base64» |
| default value | значение по умолчанию | Yandex ✓ | |
| required | обязательный | Yandex ✓ | |
| optional | необязательный | Yandex ✓ | |
| field | поле | Yandex ✓ | |
| property | свойство | — | |

## RPC / gRPC / REST

| English | Russian | Category | Source | Notes |
|---|---|---|---|---|
| RPC | RPC | Latin | Yandex ✓ | Full phrase: «удалённый вызов процедур» |
| JSON-RPC | JSON-RPC | Latin | — | |
| REST | REST | Latin | Yandex ✓ | `REST-запрос`, `REST API` |
| gRPC | gRPC | Latin | Yandex ✓ | `gRPC-описание`, `gRPC-метод` |
| stream (noun) | поток / потоковая передача | Native | Yandex | In prose; «стрим» only in compounds like `стрим-соединение` (Tinkoff ✓). Never bare «стриминг». |
| unary | однонаправленный | Native | Yandex ✓ | |
| bidirectional | двунаправленный | Native | Yandex ✓ | |
| proto file | proto-файл | Hybrid | Yandex ✓ | |
| pagination | пагинация | Transliterated | Yandex ✓ | |
| page token | токен страницы | Native | Yandex ✓ | Parameter name stays Latin: `page_token` |
| resume token | токен продолжения | Native | — | Parameter name stays Latin: `resume_token` |
| cursor | курсор | Transliterated | — | Used generically; for `page_token` prefer «токен страницы» |
| rate limit | ограничение частоты запросов | Native | — | |
| timeout | тайм-аут | Transliterated | — | Internal convention |
| retry | повторная попытка | Native | — | |

## Blockchain / NEAR-specific

| English | Russian | Category | Source | Notes |
|---|---|---|---|---|
| blockchain | блокчейн | Transliterated | Waves ✓ | Formal: «цепочка блоков» |
| transaction | транзакция | Transliterated | Waves ✓ | |
| block | блок | Cognate | Waves ✓ | |
| block height | высота блока | Native | Waves ✓ | |
| block hash | хеш блока | Hybrid | — | |
| smart contract | смарт-контракт | Transliterated | Waves ✓ | In NEAR docs, bare «контракт» is unambiguous |
| contract | контракт | Transliterated | Waves ✓ | |
| receipt (NEAR) | квитанция | Native | `glossary.yml` ✓ | Repo convention: 50+ uses, glossary-codified. Rejected: «рецепт» (reads as "recipe" in modern Russian). |
| gas | газ | Cognate | — | |
| fee | комиссия | Native | Waves ✓ | |
| balance | баланс | Cognate | Waves ✓ | |
| account | аккаунт | Transliterated | Waves ✓ | |
| account ID | ID аккаунта / идентификатор аккаунта | Hybrid | — | |
| address | адрес | Cognate | Waves ✓ | |
| node | узел (formal, default) / нода (informal/operator) | Native / Transliterated | Wikipedia / Waves | Default to «узел» in docs. Operator-voice contexts may use «нода». |
| validator | валидатор | Transliterated | Waves ✓ | |
| staking | стейкинг | Transliterated | — | Ethereum.org precedent |
| shard | шард | Transliterated | — | |
| chunk (NEAR) | чанк | Transliterated | — | |
| finality | финальность | Transliterated | — | ForkLog precedent: «финальность 1,2 секунды» |
| finalized | финализированный | Transliterated | — | |
| mainnet | Mainnet (URL/label) / основная сеть (prose) | Latin / Native | — | |
| testnet | Testnet (URL/label) / тестовая сеть (prose) | Latin / Native | — | |
| snapshot | снапшот / снимок | Transliterated / Native | — | Both attested; mix per context |
| signature | подпись | Native | Waves ✓ | |
| public key | публичный ключ | Native | — | Formal crypto: «открытый ключ» |
| private key | приватный ключ | Native | — | Formal crypto: «закрытый ключ» |
| predecessor (KV API) | предшественник | Native | — | Parameter name stays Latin: `predecessor_id`; URL template `/v0/all/{predecessor_id}` stays as-is |
| epoch | эпоха | Native | — | |
| nonce | нонс | Transliterated | — | In code contexts: `nonce` |
| consensus | консенсус | Latin-rooted | Waves ✓ | |
| wallet | кошелёк | Native | — | |

## HTTP status codes

English status text is optional; numeric code and Russian description are required.

| Code | Russian description | Notes |
|---|---|---|
| 200 | «запрос выполнен успешно» | |
| 201 | «ресурс успешно создан» | |
| 204 | «нет содержимого» (No Content) | |
| 400 | «некорректный запрос» (Bad Request) | |
| 401 | «не авторизован» / «требуется аутентификация» | Also seen as «некорректный или неавторизованный API-ключ» for API-key errors |
| 403 | «доступ запрещён» | |
| 404 | «не найдено» / «ресурс не найден» | |
| 429 | «слишком много запросов» | Rate-limit family |
| 500 | «внутренняя ошибка сервера» | |

## Brand and product names — always Latin

Never Cyrillicize or transliterate:

- **NEAR**, **NEAR Protocol**
- **FastNear**, **FastNEAR**
- **FastData**, **NEAR Data API**
- Product abbreviations: **FT**, **NFT**, **RPC**, **KV**

## Critical rules (condensed)

See the full [style guide](i18n_translating_russian.md) for all rules and examples. Highest-frequency:

1. **Hyphenation.** English abbreviation + Russian noun = hyphenated compound. `API-ключ`, `HTTP-запрос`, `JSON-объект`, `Bearer-токен`, `FT-токен`, `NFT-контракт`, `REST-эндпоинт`. Never with a space.
2. **Sentence case in headings.** «Аутентификация и лимиты», not «Аутентификация И Лимиты».
3. **Imperative or impersonal voice.** «Используйте X», «Нужен Y». Avoid «Вы»-address; never capitalize «Вы».
4. **Latin preservation.** Protocol names stay Latin: JSON, REST, HTTP, API, gRPC, JWT. Never «ЖСОН», «АПИ».
5. **First-mention.** When introducing a transliterated term for the first time, include the English original: «эндпоинт (endpoint)».
6. **Code identifiers stay Latin.** Parameter names (`user_id`, `predecessor_id`), URL templates, type annotations, values (`true`, `null`).

## Forbidden calques (audit-enforced)

The `yarn audit:ru-terminology` script flags these as errors:

- ❌ «продакшен» / «продакшене» / «продакшен-бэкенды» → ✓ «продовый контур» / «продовый сервис» / «продовый бэкенд»
- ❌ bare «стриминг» in prose → ✓ «потоковая передача» (or «стрим» in compound like `стрим-соединение`)
- ❌ «API ключ», «JSON объект», «HTTP запрос» (space) → ✓ «API-ключ», «JSON-объект», «HTTP-запрос» (hyphen)
- ❌ capitalized «Вы» / «Вам» / «Ваш» mid-sentence → ✓ lowercase «вы» or impersonal rephrase
- ❌ «ЖСОН», «АПИ», «РЕСТ» → ✓ «JSON», «API», «REST»
- ❌ bare Latin `predecessor` in Russian prose → ✓ «предшественник» (the parameter `predecessor_id` and URL `/v0/all/{predecessor_id}` stay Latin — they are code)

## Authoritative sources

When a term is contested, precedence is Yandex → Tinkoff → Waves → Ethereum.org → Habr practice.

- [Yandex Cloud API Design Guide](https://cloud.yandex.ru/docs/api-design-guide) — primary reference for API design vocabulary, standard methods, pagination, error handling, REST and gRPC patterns. Russia's most-used public cloud; highly curated documentation register.
- [Tinkoff Invest API](https://tinkoff.github.io/investAPI/) — production gRPC API documented entirely in Russian. Source for token types (access/readonly/full-access/sandbox), Bearer-токен usage, streaming compounds (стрим-соединение), and imperative voice patterns.
- [Waves Enterprise glossary](https://docs.wavesenterprise.com/ru/1.6.2/glossary.html) — Russian blockchain terminology: аккаунт, транзакция, блок, подпись, консенсус, майнинг, смарт-контракт, нода, комиссия.
- [Ethereum.org Russian glossary](https://ethereum.org/ru/glossary/) — crypto and token concepts; cross-reference when Waves doesn't cover a term.
- [Russian Wikipedia](https://ru.wikipedia.org/) — general technical and CS terminology.

## Quick-reference card

The [quick-reference card](i18n_ru_quick_reference.md) lists the 30 highest-frequency terms and the five core rules on one page. Use the card during translation work; come back here when you need a term not on the card or need the citation.
