---
sidebar_position: 1
slug: /
title: "Справочник RPC / API"
description: "Выберите подходящий API FastNear, справочник RPC или операторское руководство для балансов, истории транзакций, снапшотов, повышенных лимитов и чтения данных почти в реальном времени."
sidebar_label: "Эндпоинты"
displayed_sidebar: null
hide_table_of_contents: true
page_actions:
  - markdown
keywords:
- blockchain
- RPC
- API reference
- developer guide
- smart contracts
- JSON-RPC
- блокчейн
- справочник API
- руководство для разработчиков
- смарт-контракты
---

import Link from '@site/src/components/LocalizedLink';

<!-- FASTNEAR_AI_DISCOVERY: Разработчикам агентов стоит начинать с /agents/choosing-surfaces, затем использовать /agents/auth для безопасной работы с учётными данными и /agents/playbooks для типовых сценариев. -->

<div className="fastnear-home">
  <div className="fastnear-home-hero">
    <div className="fastnear-home-hero__content">
      <span className="fastnear-home-section-label">Обзор документации FastNear</span>
      <p className="fastnear-home-hero__title">Выберите API или справочник FastNear.</p>
      <p className="fastnear-home-hero__lede">
        Используйте RPC для канонических чтений состояния по JSON-RPC, вызовов контрактов и отправки транзакций. Используйте индексированные API для балансов, активов, истории активности и свежих данных семейства блоков.
      </p>
      <div className="fastnear-home-hero__actions">
        <Link className="fastnear-home-button fastnear-home-button--primary" to="/api">Начать с FastNear API</Link>
        <Link className="fastnear-home-button fastnear-home-button--secondary" to="/rpc">Начать с RPC</Link>
        <Link className="fastnear-home-button fastnear-home-button--ghost" to="/auth">Получить API-ключ</Link>
      </div>
      <div className="fastnear-home-auth-callout">
        <div className="fastnear-home-auth-callout__header">
          <span className="fastnear-home-auth-callout__eyebrow">Аутентификация</span>
          <p className="fastnear-home-auth-callout__title">API-ключи FastNear работают и для RPC, и для API.</p>
        </div>
        <div className="fastnear-home-auth-callout__methods">
          <div className="fastnear-home-auth-callout__method">
            <span className="fastnear-home-auth-callout__method-label">Заголовок</span>
            <span className="fastnear-home-auth-callout__code">Authorization: Bearer ...</span>
          </div>
          <div className="fastnear-home-auth-callout__method">
            <span className="fastnear-home-auth-callout__method-label">URL-параметр</span>
            <span className="fastnear-home-auth-callout__code">?apiKey=...</span>
          </div>
        </div>
        <p className="fastnear-home-auth-callout__copy">
          Получите API-ключ на <Link href="https://dashboard.fastnear.com">dashboard.fastnear.com</Link> и используйте его во всех запросах к FastNear из одного и того же рабочего окружения.
        </p>
      </div>
    </div>

    <div className="fastnear-home-hero__panel">
      <span className="fastnear-home-section-label">Быстрая маршрутизация</span>
      <div className="fastnear-home-route-stack">
        <div className="fastnear-home-route-card fastnear-home-route-card--primary">
          <span className="fastnear-home-route-card__tag">Большинство команд начинают здесь</span>
          <Link className="fastnear-home-route-card__title" to="/api">FastNear API</Link>
          <p>Индексированные эндпоинты для аккаунтов, активов, стейкинга и публичных ключей для чтения в прикладных сценариях вокруг аккаунта.</p>
        </div>
        <div className="fastnear-home-route-card">
          <span className="fastnear-home-route-card__tag">На уровне протокола</span>
          <Link className="fastnear-home-route-card__title" to="/rpc">Справочник RPC</Link>
          <p>Канонические методы JSON-RPC для блоков, вызовов контрактов, валидаторов и отправки транзакций.</p>
        </div>
        <div className="fastnear-home-route-card">
          <span className="fastnear-home-route-card__tag">История исполнения</span>
          <Link className="fastnear-home-route-card__title" to="/tx">Транзакции API</Link>
          <p>Активность аккаунта, квитанции, поиск транзакций и история по блокам из индексированных данных исполнения.</p>
        </div>
        <div className="fastnear-home-route-card">
          <span className="fastnear-home-route-card__tag">Чтения с низкой задержкой</span>
          <Link className="fastnear-home-route-card__title" to="/neardata">NEAR Data API</Link>
          <p>Свежие оптимистичные и финализированные блоки, заголовки и вспомогательные перенаправления для опроса и лёгкого мониторинга.</p>
        </div>
      </div>
    </div>
  </div>

  <div className="fastnear-home-section">
    <div className="fastnear-home-section-heading">
      <span className="fastnear-home-section-label">Основные API и справочники</span>
      <p className="fastnear-home-section-title">Это основные точки входа FastNear.</p>
      <p>
        Начните с API или раздела справочника, подходящего под нужные данные, затем переходите к подробному справочнику по конкретному эндпоинту.
      </p>
    </div>

    <div className="fastnear-home-surface-grid">
      <div className="fastnear-home-surface-card fastnear-home-surface-card--api fastnear-home-surface-card--wide">
        <span className="fastnear-home-surface-card__eyebrow">Индексированные представления аккаунта</span>
        <Link className="fastnear-home-surface-card__title" to="/api">FastNear API</Link>
        <p>
          Используйте индексированные REST-эндпоинты для балансов, NFT, позиций стейкинга и поиска по публичному ключу без сырых обёрток запросов и ответов JSON-RPC.
        </p>
        <div className="fastnear-home-surface-links">
          <span className="fastnear-home-surface-links__label">Полезные ссылки</span>
          <Link to="/api/v1/account-full">Полное состояние аккаунта</Link>
          <Link to="/api/v1/account-ft">Балансы FT-токенов</Link>
          <Link to="/api/v1/account-nft">Активы NFT</Link>
          <Link to="/api/v1/public-key">Поиск по публичному ключу</Link>
        </div>
      </div>

      <div className="fastnear-home-surface-card fastnear-home-surface-card--rpc fastnear-home-surface-card--narrow">
        <span className="fastnear-home-surface-card__eyebrow">Канонический JSON-RPC</span>
        <Link className="fastnear-home-surface-card__title" to="/rpc">Справочник RPC</Link>
        <p>
          Используйте методы на уровне протокола для прямых чтений состояния, отправки транзакций, вызовов контрактов и инспекции цепочки.
        </p>
        <div className="fastnear-home-surface-links">
          <span className="fastnear-home-surface-links__label">Полезные ссылки</span>
          <Link to="/rpc/account/view-account">Состояние аккаунта</Link>
          <Link to="/rpc/block/block-by-id">Поиск блоков</Link>
          <Link to="/rpc/contract/call-function">view-вызовы контрактов</Link>
          <Link to="/rpc/validators/validators-current">Данные валидаторов</Link>
        </div>
      </div>

      <div className="fastnear-home-surface-card fastnear-home-surface-card--tx fastnear-home-surface-card--narrow">
        <span className="fastnear-home-surface-card__eyebrow">История исполнения</span>
        <Link className="fastnear-home-surface-card__title" to="/tx">Транзакции API</Link>
        <p>
          Используйте индексированные эндпоинты для активности аккаунта, квитанций, поиска транзакций и истории исполнения по блокам.
        </p>
        <div className="fastnear-home-surface-links">
          <span className="fastnear-home-surface-links__label">Полезные ссылки</span>
          <Link to="/tx/account">Активность аккаунта</Link>
          <Link to="/tx/transactions">Поиск транзакций</Link>
          <Link to="/tx/receipt">Трассировка квитанций</Link>
          <Link to="/tx/blocks">История транзакций по блоку</Link>
        </div>
      </div>

      <div className="fastnear-home-surface-card fastnear-home-surface-card--data fastnear-home-surface-card--wide">
        <span className="fastnear-home-surface-card__eyebrow">Свежие чтения семейства блоков</span>
        <Link className="fastnear-home-surface-card__title" to="/neardata">NEAR Data API</Link>
        <p>
          Используйте NEAR Data для свежих оптимистичных и финализированных блоков, заголовков блоков и маршрутов-помощников по последнему блоку, когда нужны чтения почти в реальном времени или лёгкий мониторинг.
        </p>
        <div className="fastnear-home-surface-links">
          <span className="fastnear-home-surface-links__label">Полезные ссылки</span>
          <Link to="/neardata/block-optimistic">Оптимистичные чтения блоков</Link>
          <Link to="/neardata/last-block-final">Последний финализированный блок</Link>
          <Link to="/neardata/block-headers">Опрос заголовков блоков</Link>
        </div>
      </div>
    </div>
  </div>

  <div className="fastnear-home-section">
    <div className="fastnear-home-section-heading">
      <span className="fastnear-home-section-label">Операции и доступ</span>
      <p className="fastnear-home-section-title">Всё, о чём команды обычно спрашивают перед переходом на продовые лимиты.</p>
      <p>Держите под рукой на переходе от исследования к продовым нагрузкам.</p>
    </div>

    <div className="fastnear-home-utility-grid">
      <div className="fastnear-home-utility-card">
        <span className="fastnear-home-utility-card__eyebrow">Повышенные лимиты</span>
        <Link className="fastnear-home-utility-card__title" to="/auth">Аутентификация и доступ</Link>
        <p>Один API-ключ FastNear работает и для RPC, и для REST API.</p>
      </div>
      <div className="fastnear-home-utility-card">
        <span className="fastnear-home-utility-card__eyebrow">Ключи и оплата</span>
        <Link className="fastnear-home-utility-card__title" to="https://dashboard.fastnear.com">FastNear Dashboard</Link>
        <p>Войдите, создайте ключи и переходите на сценарии с более высокими лимитами, когда понадобится.</p>
      </div>
      <div className="fastnear-home-utility-card">
        <span className="fastnear-home-utility-card__eyebrow">Живые операции</span>
        <Link className="fastnear-home-utility-card__title" to="https://status.fastnear.com">Status</Link>
        <p>Проверяйте инциденты и деградацию сервиса до отладки поведения приложения.</p>
      </div>
      <div className="fastnear-home-utility-card">
        <span className="fastnear-home-utility-card__eyebrow">Подъём инфраструктуры</span>
        <Link className="fastnear-home-utility-card__title" to="/snapshots/">Снапшоты</Link>
        <p>Поднимайте инфраструктуру RPC или архива быстрее, без повторного воспроизведения цепочки с нуля.</p>
      </div>
    </div>
  </div>

  <div className="fastnear-home-agent-callout">
    <div>
      <span className="fastnear-home-section-label">Агенты и автоматизация</span>
      <p className="fastnear-home-agent-callout__title">Строите с ИИ-агентами или фоновыми воркерами?</p>
      <p>
        Используйте документацию для агентов, чтобы настроить режим работы с учётными данными, логику маршрутизации и Markdown-экспорты, пригодные для промптов.
      </p>
    </div>
    <div className="fastnear-home-agent-callout__actions">
      <Link className="fastnear-home-button fastnear-home-button--secondary" to="/agents">Открыть хаб агентов</Link>
      <Link className="fastnear-home-button fastnear-home-button--ghost" to="/agents/choosing-surfaces">Как выбрать поверхность</Link>
    </div>
  </div>
</div>
