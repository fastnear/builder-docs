---
sidebar_position: 1
slug: /
title: "Справочник RPC / API"
description: "Выберите подходящую поверхность FastNear для сырого RPC, индексированных балансов, истории транзакций, снапшотов, повышенных лимитов и чтения данных почти в реальном времени."
sidebar_label: "Эндпоинты"
displayed_sidebar: null
hide_table_of_contents: true
page_actions:
  - markdown
keywords:
- блокчейн
- RPC
- справочник API
- руководство для разработчиков
- смарт-контракты
- JSON-RPC
---

import Link from '@site/src/components/LocalizedLink';
import RpcApiServiceLinks from '@site/src/components/RpcApiServiceLinks';

# Выберите подходящую поверхность FastNear

<!-- FASTNEAR_AI_DISCOVERY: Разработчикам агентов стоит начинать с /agents/choosing-surfaces, затем использовать /agents/auth для безопасной работы с учётными данными и /agents/playbooks для типовых сценариев. -->

FastNear предлагает несколько документированных поверхностей, потому что разным задачам нужны разные компромиссы. Начните с нужного сценария, а затем переходите к подробному справочнику.

<div className="fastnear-doc-card-grid">
  <article className="fastnear-doc-card">
    <span className="fastnear-doc-card__eyebrow">Канонический JSON-RPC</span>
    <Link className="fastnear-doc-card__title" to="/rpc"><strong>RPC</strong></Link>
    <span>Используйте канонические методы JSON-RPC для чтения данных напрямую из протокола, отправки транзакций и проверки состояния сети.</span>
    <span className="fastnear-doc-card__bestfor-label">Лучше всего подходит для:</span>
    <ul className="fastnear-doc-card__bestfor-list">
      <li><Link to="/rpc/account/view-account">состояния аккаунта</Link></li>
      <li><Link to="/rpc/block/block-by-id">поиска блоков</Link></li>
      <li><Link to="/rpc/contract/call-function">вызовов view-методов контракта</Link></li>
      <li><Link to="/rpc/validators/validators-current">данных валидаторов</Link></li>
    </ul>
  </article>
  <article className="fastnear-doc-card">
    <span className="fastnear-doc-card__eyebrow">Индексированные балансы</span>
    <Link className="fastnear-doc-card__title" to="/api"><strong>FastNear API</strong></Link>
    <span>Начните здесь, если вам нужны удобные для кошельков балансы, NFT, стейкинг и поиск по публичному ключу без сырых JSON-RPC-обёрток.</span>
    <span className="fastnear-doc-card__bestfor-label">Лучше всего подходит для:</span>
    <ul className="fastnear-doc-card__bestfor-list">
      <li><Link to="/api/v1/account-full">полного снимка аккаунта</Link></li>
      <li><Link to="/api/v1/account-ft">балансов FT-токенов</Link></li>
      <li><Link to="/api/v1/account-nft">активов NFT</Link></li>
      <li><Link to="/api/v1/public-key">поиска по публичному ключу</Link></li>
    </ul>
  </article>
  <article className="fastnear-doc-card">
    <span className="fastnear-doc-card__eyebrow">История транзакций</span>
    <Link className="fastnear-doc-card__title" to="/tx"><strong>Транзакции API</strong></Link>
    <span>Запрашивайте историю транзакций по аккаунту, квитанции, блоку или хешу, когда нужен индексированный API истории вместо опроса узлов.</span>
    <span className="fastnear-doc-card__bestfor-label">Лучше всего подходит для:</span>
    <ul className="fastnear-doc-card__bestfor-list">
      <li><Link to="/tx/account">активности аккаунта</Link></li>
      <li><Link to="/tx/transactions">поиска транзакций</Link></li>
      <li><Link to="/tx/receipt">трассировки квитанций</Link></li>
      <li><Link to="/tx/blocks">истории транзакций по блоку</Link></li>
    </ul>
  </article>
  <article className="fastnear-doc-card">
    <span className="fastnear-doc-card__eyebrow">Снапшоты</span>
    <Link className="fastnear-doc-card__title" to="/snapshots/"><strong>Снапшоты</strong></Link>
    <span>Используйте готовые сценарии работы со снапшотами, когда нужно поднять RPC- или архивную инфраструктуру без полного повторного воспроизведения цепочки.</span>
    <span className="fastnear-doc-card__bestfor-label">Лучше всего подходит для:</span>
    <ul className="fastnear-doc-card__bestfor-list">
      <li><Link to="/snapshots/mainnet">снапшотов mainnet</Link></li>
      <li><Link to="/snapshots/testnet">снапшотов testnet</Link></li>
      <li><Link to="/snapshots/">обзора сценариев работы со снапшотами</Link></li>
    </ul>
  </article>
  <article className="fastnear-doc-card">
    <span className="fastnear-doc-card__eyebrow">Повышенные лимиты</span>
    <Link className="fastnear-doc-card__title" to="/auth"><strong>Аутентификация и доступ</strong></Link>
    <span>Один API-ключ FastNear работает и для RPC, и для REST API; передавайте его через заголовок Authorization Bearer или как URL-параметр apiKey.</span>
    <span className="fastnear-doc-card__bestfor-label">Лучше всего подходит для:</span>
    <ul className="fastnear-doc-card__bestfor-list">
      <li><Link to="/auth">обзора аутентификации</Link></li>
      <li><a href="https://dashboard.fastnear.com">получения API-ключа</a></li>
    </ul>
  </article>
  <article className="fastnear-doc-card">
    <span className="fastnear-doc-card__eyebrow">Почти в реальном времени</span>
    <Link className="fastnear-doc-card__title" to="/neardata"><strong>NEAR Data API</strong></Link>
    <span>Используйте NEAR Data API, когда нужны оптимистичные или недавно финализированные чтения блоков без позиционирования продукта как потокового сервиса.</span>
    <span className="fastnear-doc-card__bestfor-label">Лучше всего подходит для:</span>
    <ul className="fastnear-doc-card__bestfor-list">
      <li><Link to="/neardata/block-optimistic">оптимистичных чтений блоков</Link></li>
      <li><Link to="/neardata/last-block-final">последнего финализированного блока</Link></li>
      <li><Link to="/neardata/block-headers">опроса заголовков блоков</Link></li>
    </ul>
  </article>
</div>

## Перед интеграцией

Вот детали, которые технические команды обычно хотят понять заранее:

- [Аутентификация и доступ](/auth): отправляйте API-ключ FastNear через заголовок `Authorization: Bearer` или URL-параметр `?apiKey=`.
- [FastNear Dashboard](https://dashboard.fastnear.com): управляйте API-ключами и переходите на сценарии с более высокими лимитами.
- [Статус FastNear](https://status.fastnear.com): проверяйте инциденты и деградацию сервиса до отладки поведения приложения.
- [Справочник RPC](/rpc): выбирайте между обычным и архивным RPC в зависимости от объёма нужной вам истории цепочки.
- [Снапшоты](/snapshots/): поднимайте инфраструктуру быстрее, если разворачиваете RPC- или архивные узлы.

## Практические рекомендации по выбору поверхности

- Начинайте со [Справочника RPC](/rpc), когда нужны канонические запросы JSON-RPC, отправка транзакций или ответы напрямую из протокола.
- Начинайте с [FastNear API](/api), когда строите кошелёк, обозреватель или портфельный продукт и хотите получить индексированные представления аккаунта.
- Начинайте с [Транзакции API](/tx), когда важны активность по аккаунту, квитанции и история исполнения.
- Начинайте с [NEAR Data API](/neardata), когда вы опрашиваете свежие данные по блокам и не собираетесь подавать сервис как потоковую инфраструктуру.

## Другие семейства API

Эти дополнительные API остаются полезными и после знакомства с основными поверхностями выше:

<RpcApiServiceLinks />

## Если вы создаёте решение для AI или агентов

- Начните с [Хаба для агентов](/agents), где собраны выбор поверхности, работа с ключами и типовые сценарии.
- Используйте [Как выбрать подходящую поверхность](/agents/choosing-surfaces), чтобы сопоставить задачу агента с одной поверхностью FastNear.
- Используйте [Аутентификацию для агентов](/agents/auth), когда вызывающая сторона — это сервис автоматизации, воркер или среда выполнения агента.
- Берите за основу [Сценарии для агентов](/agents/playbooks), если нужен конкретный шаблон рабочего процесса.
- Используйте действие страницы `Копировать Markdown`, чтобы переносить чистый контекст документации в промпты, заметки и среды выполнения агентов.
