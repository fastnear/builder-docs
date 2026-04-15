# Russian Translation — Quick Reference

One-page card for translators. Full glossary: [`i18n_ru_glossary.md`](i18n_ru_glossary.md). Full style guide: [`i18n_translating_russian.md`](i18n_translating_russian.md). Run `yarn audit:ru-terminology` before committing.

## Three-tier rule

Every English term fits one of three tiers. Pick the tier first; the choice is rarely ambiguous.

| Tier | Decision | Examples |
|---|---|---|
| **Native** | Translate | request → запрос, method → метод, body → тело |
| **Transliterated** | Cyrillicize, decline as a Russian noun | token → токен, endpoint → эндпоинт, account → аккаунт |
| **Latin** | Leave as-is (acronyms, protocol names, code identifiers) | API, REST, JSON, gRPC, `user_id` |
| **Hybrid** | Latin abbreviation + Russian noun, joined with a hyphen | API-ключ, HTTP-запрос, Bearer-токен, FT-токен, REST-эндпоинт |

## Top 30 terms

| English | Russian |
|---|---|
| request / response | запрос / ответ |
| method | метод |
| parameter | параметр |
| header | заголовок |
| body | тело |
| endpoint | эндпоинт |
| API key | API-ключ |
| Bearer token | Bearer-токен |
| access token | токен доступа |
| authentication / authorization | аутентификация / авторизация |
| page token | токен страницы |
| pagination | пагинация |
| cursor | курсор |
| rate limit | ограничение частоты запросов |
| sandbox | песочница |
| production (env) | боевая среда |
| timeout | тайм-аут |
| webhook | вебхук |
| account | аккаунт |
| transaction | транзакция |
| block / block height | блок / высота блока |
| contract / smart contract | контракт / смарт-контракт |
| receipt (NEAR) | квитанция |
| gas / fee | газ / комиссия |
| validator | валидатор |
| node | узел (formal) / нода (operator) |
| shard / chunk | шард / чанк |
| finality / finalized | финальность / финализированный |
| signature | подпись |
| public / private key | публичный / приватный ключ |

## Five critical rules

1. **Hyphenation.** Latin abbreviation + Russian noun always joined by a hyphen. `API-ключ` ✓. `API ключ` ✗.
2. **Sentence case in headings.** «Аутентификация и лимиты» ✓. «Аутентификация И Лимиты» ✗.
3. **Imperative or impersonal voice.** «Используйте X» ✓. «Когда нужны Y» ✓. «Вы можете» ✗. Never capitalize «Вы».
4. **Latin preservation.** Protocol names and brand names never Cyrillicized. `JSON` ✓. `ЖСОН` ✗. `FastNear` ✓. `фастниар` ✗.
5. **First mention.** Include the English original the first time a transliterated term appears: «эндпоинт (endpoint)».

## Forbidden (audit-enforced)

- ❌ продакшен → ✓ боевой / боевая среда
- ❌ bare стриминг → ✓ потоковая передача (or стрим- in compound)
- ❌ `API ключ` (space) → ✓ `API-ключ` (hyphen)
- ❌ mid-sentence `Вы` / `Вам` / `Ваш` → ✓ lowercase or impersonal rephrase
- ❌ Cyrillicized protocol names (ЖСОН, АПИ) → ✓ Latin (JSON, API)
- ❌ bare Latin `predecessor` in Russian prose → ✓ предшественник (the code identifier `predecessor_id` stays Latin)

## Voice patterns

Prefer the **right-hand column**:

| Don't | Do |
|---|---|
| «Вы можете отправить запрос» | «Отправьте запрос» |
| «когда вам нужны X» | «когда нужны X» |
| «вы отправляете транзакции» | «требуется отправка транзакций» |
| «для вас важнее простота» | «простота важнее» |
| «ваш собственный токен» | «собственный токен» |

## Where to look next

| Need | Go to |
|---|---|
| Full term list with citations | [`i18n_ru_glossary.md`](i18n_ru_glossary.md) |
| Grammar, formatting, voice rules in depth | [`i18n_translating_russian.md`](i18n_translating_russian.md) |
| Check my draft before committing | `yarn audit:ru-terminology` |
| Adding a new locale | [`i18n_adding_locales.md`](i18n_adding_locales.md) |
