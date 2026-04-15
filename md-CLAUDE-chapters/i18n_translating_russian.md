# Translating API and RPC documentation into Russian

**Russian technical documentation follows a three-tier system for handling English terminology: translate established concepts into native Russian, transliterate newer technical jargon into Cyrillic, and leave code-level identifiers and protocol names in Latin script.** This pattern is consistent across every major Russian tech company — Yandex Cloud, VK, Tinkoff, and Sber — as well as community resources like Habr and Russian Wikipedia. The resulting documentation has a characteristic bilingual texture: Russian prose with embedded English code fragments, connected by hyphenated compound terms like «HTTP-запрос» and «API-ключ». This guide, drawn from analysis of production Russian API documentation and industry style standards, provides a comprehensive reference for making accurate translation decisions.

---

## Authoritative references for Russian API documentation

This guide is validated against three production Russian-language API documentation corpora. When a term is contested, the order of precedence is Yandex → Tinkoff → Waves → Ethereum.org RU glossary → Habr practice. Rows marked ✓ in the tables below are confirmed against the cited source; unmarked rows are internal conventions.

- **Yandex Cloud API Design Guide** (https://cloud.yandex.ru/docs/api-design-guide) — the most rigorous Russian-language reference for REST and gRPC API design patterns, standard methods, pagination, and error handling. Source for: конечная точка / эндпоинт, запрос, ответ, параметр, HTTP-метод patterns, sentence-case headings, «токен страницы» for `page_token`.
- **Tinkoff Invest API** (https://tinkoff.github.io/investAPI/) — a production gRPC API documented entirely in Russian. Source for: песочница (sandbox), стрим-соединение, access/readonly/full-access токены, `Authorization: Bearer [токен]` usage, imperative voice.
- **Waves Enterprise glossary** (https://docs.wavesenterprise.com/ru/1.6.2/glossary.html) — Russian blockchain terminology. Source for: аккаунт, транзакция, блок, подпись, консенсус, майнинг, нода, комиссия, смарт-контракт, стейт (informal) vs состояние (formal).

---

## The three-tier translation framework

Every English API term falls into one of three categories, and the choice is rarely ambiguous once the conventions are understood.

**Tier 1 — Native Russian equivalents** are used for terms with long-established Russian words, often of Latin or Greek origin. These include: запрос (request), ответ (response), метод (method), параметр (parameter), заголовок (header), тело (body), ключ (key), значение (value), ошибка (error), строка (string), массив (array), объект (object), функция (function). These words are never left in English in running text.

**Tier 2 — Transliteration into Cyrillic** is applied to newer technical terms that lack natural Russian equivalents but are used frequently enough to need grammatical integration. These include: токен (token), эндпоинт (endpoint), вебхук (webhook), сессия (session), кэш (cache), блокчейн (blockchain), стейкинг (staking), валидатор (validator), шард (shard). Transliterated words are declined like standard Russian nouns — «токена» (genitive), «токену» (dative), «токеном» (instrumental).

**Tier 3 — English left intact** covers protocol names, abbreviations, code identifiers, and HTTP verbs. API, REST, HTTP, JSON, gRPC, OAuth, JWT, GET, POST, PUT, DELETE, PATCH — all remain in Latin script. Parameter names (`user_id`, `page_size`), status code labels (404 Not Found), and everything inside code blocks stays in English. This is non-negotiable across all Russian documentation sources examined.

---

## Core API and RPC terminology

The table below consolidates findings from Yandex Cloud, VK, Tinkoff, Sber, Russian Wikipedia, and Habr into a definitive reference for core terms.

| English | Russian | Category | Notes |
|---|---|---|---|
| request | **запрос** | Native | Universal across all sources |
| response | **ответ** | Native | Universal; «тело ответа» for response body |
| endpoint | **эндпоинт** | Transliterated | Yandex Cloud uses this as section heading; rare alternative: «конечная точка» |
| method | **метод** | Native | «метод API», «HTTP-метод GET» |
| parameter | **параметр** | Native | Universal |
| query | **запрос** | Native | Same word as "request"; URL query params → «query-параметры» |
| payload | **полезная нагрузка** or **тело запроса** | Native | No transliteration exists |
| header | **заголовок** | Native | «заголовок Authorization», «HTTP-заголовок» |
| body | **тело** | Native | «тело запроса» (request body), «тело ответа» (response body) |
| callback | **обратный вызов** (formal) / **коллбэк** (informal) | Mixed | VK uses English "Callback API" as a product name |
| webhook | **вебхук** | Transliterated | Tinkoff ✓ — «У нас есть вебхуки» |
| middleware | **мидлвар** / **промежуточное ПО** | Transliterated/Translated | Less standardized; often left in English |
| rate limit | **ограничение частоты запросов** | Translated | VK: «частотное ограничение — 3 запроса в секунду» |
| throttling | **троттлинг** or **ограничение частоты** | Mixed | Transliteration common in developer contexts |
| authentication | **аутентификация** | Russified Latin root | Wikipedia: «процедура проверки подлинности» |
| authorization | **авторизация** | Russified Latin root | Distinct from аутентификация in Russian usage |
| token | **токен** | Transliterated | Universal; «IAM-токен», «OAuth-токен» |
| API key | **API-ключ** | Hybrid | English abbreviation + Russian word, hyphenated |
| access token | **токен доступа** | Translated + transliterated | Sber GigaChat: «токен доступа (access token)» |
| bearer token | **Bearer-токен** | Hybrid | "Bearer" stays English as a protocol keyword |
| session | **сессия** | Transliterated | Tinkoff: «платёжную сессию» |
| remote procedure call | **удалённый вызов процедур** | Translated | Wikipedia title; abbreviation RPC stays in Latin |
| idempotent | **идемпотентный** | Russified Latin root | Habr: «Должен быть идемпотентным» |
| pagination | **пагинация** | Transliterated | Yandex ✓ — used as section heading |
| page token | **токен страницы** (prose) / `page_token` (code) | Translated / Latin | Yandex ✓ — keeps `page_token` as the parameter name |
| sandbox | **песочница** | Native Russian | Tinkoff ✓ — «контур песочницы», sandbox-only токены |
| production (environment) | **продовый контур** / **продовый сервис** / **продовый бэкенд** | Transliterated | Tinkoff ✓ — `продовый контур`; avoid calque `продакшен` |
| streaming | **потоковая передача** (prose) / **стрим** (compounds like `стрим-соединение`) | Translated / Transliterated | Yandex: `потоковая передача`; Tinkoff ✓ — `стрим-соединение` |
| timeout | **тайм-аут** | Transliterated | Internal convention; not cited by Yandex/Tinkoff/Waves |
| node | **узел** (formal, our default) / **нода** (informal/operator) | Native / Transliterated | Waves: `нода`; Wikipedia: `узел`; our register → `узел` |
| resource | **ресурс** | Russified Latin root | Habr: «ключевая концепция REST — ресурсы» |
| caching | **кэширование** | Transliterated root | «HTTP-кэширование» |

---

## HTTP methods and status codes stay in English — descriptions don't

**HTTP verbs are never translated or transliterated.** GET, POST, PUT, DELETE, PATCH, HEAD, and OPTIONS always appear in uppercase Latin script, typically in code formatting. Two naming patterns dominate in Russian prose:

- **«метод GET»** — when referring to the HTTP method abstractly
- **«GET-запрос»** — when referring to a specific request using that method (hyphenated compound)

Yandex Cloud's API Design Guide uses the pattern «Методу Create соответствует HTTP-метод `POST`», showing how Russian method names (Create) coexist with English HTTP verbs.

**Status codes use a layered convention.** The numeric code is always present. The English status name is optionally appended. The description is always in Russian. Observed patterns across sources:

| Pattern | Example | Where used |
|---|---|---|
| Number only | «API возвращает ответ с кодом **200**» | Yandex Cloud |
| Number + English name | «ошибку **401 Unauthorized**» | Sber, Yandex |
| Number + Russian description | «404 — запрошенный объект не был найден» | Yandex Tracker |
| Full triple | «**200 OK** — запрос выполнен успешно» | Habr reference docs |

Russian Wikipedia's article «Список кодов состояния HTTP» uses the term **«код состояния»** (status code). Habr articles also use **«код ответа»** (response code) and **«статус-код»** (calque). gRPC error codes like `ALREADY_EXISTS` remain entirely in English.

The key Russian descriptions for common status codes are:

- **200** — запрос выполнен успешно
- **201** — ресурс успешно создан
- **204** — нет содержимого (No Content)
- **400** — некорректный запрос (Bad Request)
- **401** — не авторизован / требуется аутентификация
- **403** — доступ запрещён
- **404** — не найдено / ресурс не найден
- **429** — слишком много запросов
- **500** — внутренняя ошибка сервера

---

## Data types: Russian in prose, English in code

A strict **code/prose split** governs data type names. In protobuf definitions, JSON schemas, and parameter tables, types appear in English: `string`, `int64`, `boolean`, `repeated`, `map<string, string>`. In Russian explanatory text, native equivalents are used:

| English type | Russian (in prose) | Notes |
|---|---|---|
| string | **строка** | Universal |
| integer / int | **целое число** | «Число» alone for generic numeric |
| float / double | **число с плавающей запятой** | Or «вещественное число» |
| boolean | **логическое значение** / **булево значение** | VK: «булево значение, означающее...» |
| array | **массив** | Universal; Sber: «Массив сообщений» |
| object | **объект** | «JSON-объект» is the standard compound |
| null | **null** | Left in English; explained as «нет данных» or «пустое значение» |
| enum | **перечисление** | VK: «Перечисление прав пользователя» |
| map / dictionary | **словарь** or **ассоциативный массив** | «Словарь» more common in Python contexts |
| tuple | **кортеж** | Standard CS translation |
| struct | **структура** | Native Russian word |
| hash (data structure) | **хеш-таблица** | «Хеш» / «хэш» for the hash value itself |
| JSON | **JSON** | Never translated; «формат JSON», «JSON-объект» |
| base64 | **Base64** | Left in English; «кодировка Base64» |
| unsigned integer | **беззнаковое целое число** | Technical contexts may keep `u64`, `u128` in code |
| BigInt | **BigInt** | Left in English in code; described as «большое целое число» |

---

## Blockchain and NEAR Protocol terminology

The Russian blockchain community strongly favors transliteration over translation, creating a rich Cyrillic vocabulary for concepts that originated in English. Ethereum.org's professionally reviewed Russian glossary and Waves blockchain's official Russian documentation serve as the authoritative references. **NEAR Protocol has no official Russian documentation**, but Russian community content on Habr, vc.ru, and ForkLog follows Ethereum-established conventions.

| English | Russian | Type | Notes |
|---|---|---|---|
| blockchain | **блокчейн** | Transliterated | «Цепочка блоков» only in explanatory contexts |
| transaction | **транзакция** | Transliterated | Universal |
| block | **блок** | Cognate | Natural Russian word |
| smart contract | **смарт-контракт** | Transliterated | Ethereum.org also uses «умный контракт» |
| deploy | **деплой** (noun) / **деплоить** (verb) | Transliterated | Formal: **развёртывание** / **развернуть** |
| stake / staking | **стейкинг** | Transliterated | Verb: «стейкать», «застейкать» |
| delegate / delegation | **делегирование** | Native Russian | Existing word; used consistently |
| fungible token | **взаимозаменяемый токен** | Translated + transliterated | Standard |
| non-fungible token | **невзаимозаменяемый токен** / **NFT** | Translated / English abbreviation | NFT abbreviation dominates |
| validator | **валидатор** | Transliterated | Universal |
| node | **нода** (informal) / **узел** (formal) | Transliterated / Native | Waves uses «нода»; Wikipedia uses «узел» |
| shard / sharding | **шард** / **шардинг** | Transliterated | Universal in Russian blockchain community |
| cross-shard | **межшардовый** | Russian prefix + transliteration | «Межшардовые вызовы» |
| block height | **высота блока** | Translated | Waves: «Порядковый номер блока в блокчейне» |
| block hash | **хеш блока** | Transliterated + translated | Both «хеш» and «хэш» spellings exist |
| finality | **финальность** | Transliterated | ForkLog NEAR coverage: «финальность 1,2 секунды» |
| receipt (NEAR-specific) | **квитанция** | Native Russian | Established convention: defined in `i18n/ru/glossary.yml` as `receipt → квитанция`, applied across 50+ corpus occurrences (index pages, sidebar labels, `/tx/receipt` route, translation pool). In Russian, «квитанция» (receipt as a transaction unit) reads more naturally than «рецепт» (recipe / medical prescription) for NEAR's internal message concept. |
| gas | **газ** | Cognate | Russian word «газ» matches naturally |
| nonce | **нонс** | Transliterated | Often left as `nonce` in code contexts |
| account ID | **идентификатор аккаунта** | Translated + transliterated | «Аккаунт» is standard transliteration |
| public key | **публичный ключ** / **открытый ключ** | Two variants | «Открытый» is formally correct in cryptography |
| private key | **приватный ключ** / **закрытый ключ** | Two variants | «Закрытый» is formally correct in cryptography |
| signature | **подпись** | Native Russian | «Цифровая подпись» for digital signature |
| wallet | **кошелёк** | Native Russian | Universal |
| consensus | **консенсус** | Established Russian word | From Latin; long-established |
| epoch | **эпоха** | Native Russian | Natural fit |
| proof of stake | **доказательство доли владения** / **PoS** | Translated / abbreviation | Full translation per Ethereum.org |
| mainnet | **основная сеть** / **мейннет** | Translated / transliterated | Both used |
| testnet | **тестовая сеть** / **тестнет** | Translated / transliterated | Both used |
| chunk (NEAR) | **чанк** | Transliterated | NEAR-specific; explained with parenthetical «(chunk)» |

---

## Formatting rules and grammatical conventions

**Hyphenated compounds** are the signature pattern of Russian tech documentation. When an English abbreviation or protocol name modifies a Russian noun, the two are joined with a hyphen: «HTTP-запрос», «API-ключ», «IAM-токен», «gRPC-описание», «JSON-объект», «GET-запрос», «OAuth-токен». This convention is universal across Yandex, VK, Tinkoff, and Sber.

**First-mention convention** requires providing both forms when introducing a transliterated term. Two patterns exist: «токен доступа (access token)» places Russian first, while «endpoint (эндпоинт)» places English first. The Russian-first pattern is more common in formal documentation. Sber GigaChat uses bilingual labels: «ключ авторизации (англ. Authorization key)».

**Gender assignment** follows a simple rule: transliterated English terms ending in a consonant (which is nearly all of them) are **masculine** in Russian. Токен, эндпоинт, вебхук, кэш, фреймворк — all masculine. They decline as standard second-declension nouns: «токен» → «токена» (gen.) → «токену» (dat.) → «токеном» (instr.) → «о токене» (prep.). Plural: «токены» → «токенов». Terms left in Latin script (API, JSON, URL) are **not declined** — «документация API», never «документация APIя».

**Code formatting** in Russian text uses inline code (backticks or monospace) for all code-level identifiers: parameter names (`user_id`), type annotations (`string`), method names (`getUser()`), paths (`/api/v1/users`), CLI commands, and values (`true`, `null`). Code blocks remain entirely in English. Comments inside code blocks may optionally be translated. Documentation tables keep parameter names and types in English while descriptions appear in Russian:

| Параметр | Тип | Обязательный | Описание |
|---|---|---|---|
| `api_key` | `string` | Да | Ключ API для аутентификации |
| `page_size` | `integer` | Нет | Количество элементов на странице |
| `include_deleted` | `boolean` | Нет | Включать ли удалённые записи |

**Capitalization** in Russian differs fundamentally from English: headings and section titles use **sentence case only** (first word capitalized, rest lowercase). «Руководство по началу работы», not «Руководство По Началу Работы». Technical terms remain lowercase in running text: «используйте токен доступа». UI element references use guillemet quotes: «Нажмите **«Сохранить»**».

---

## Voice and register

Russian technical documentation overwhelmingly prefers **imperative mood** or **indirect/passive constructions** to direct «Вы»-address. All three authoritative sources follow this pattern:

- Yandex: «Передайте параметр `folder_id`» (imperative), «Метод возвращает представление ресурса» (passive).
- Tinkoff: «Для использования API требуется токен» (indirect), «Ознакомьтесь с доступными SDK» (imperative).
- Waves: «Ознакомьтесь с разделом», «Узнайте больше».

Rules for this repo:

1. **Default to imperative** for instructions: «Используйте токен доступа», «Передайте заголовок `Authorization`».
2. **Avoid «Вы»-address.** Never capitalize «Вы». If the sentence reads awkwardly in imperative, rephrase into a passive or indirect form.
3. **Use passive for conceptual explanations**: «Параметр `page_size` определяет количество записей на странице».
4. **No calques of English "You can…".** Replace «Вы можете отправить запрос» with «Можно отправить запрос» or, better, «Отправьте запрос».

---

## Conclusion

Russian API documentation operates on a remarkably consistent set of conventions that have emerged organically across major tech companies and been reinforced by community practice on Habr. The core principle is pragmatic bilingualism: Russian handles the narrative and explanatory layer while English owns the code layer, with transliteration serving as the bridge for terms that need grammatical integration. Three decisions drive nearly every translation choice. First, does the term have a natural Russian equivalent with the same precision? If yes, use it (запрос, ответ, заголовок, массив). Second, does the term need to be declined, pluralized, or used as an adjective? If yes, transliterate it into Cyrillic (токен, эндпоинт, вебхук, валидатор). Third, is the term a protocol name, abbreviation, code identifier, or HTTP verb? If yes, leave it in Latin script (API, REST, GET, `user_id`). For blockchain terminology specifically, transliteration dominates because these concepts originated in English and the Russian developer community reads English fluently — but formal documentation (Ethereum.org, Waves) tends toward more fully translated equivalents, especially for non-developer audiences. The Microsoft Terminology Database and Ethereum.org Russian glossary remain the two most authoritative references for resolving edge cases.
