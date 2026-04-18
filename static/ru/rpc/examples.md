**Источник:** [https://docs.fastnear.com/ru/rpc/examples](https://docs.fastnear.com/ru/rpc/examples)

# Примеры RPC

Используйте эту страницу, когда уже понятно, что ответ должен опираться на каноническое поведение RPC, и нужен самый короткий путь по документации. Цель не в том, чтобы запомнить каждый метод, а в том, чтобы выбрать правильную стартовую страницу, остановиться, как только RPC-ответ уже решает задачу, и расширять набор поверхностей только тогда, когда это действительно поможет.

## Когда начинать здесь

- Пользователь просит точное состояние в цепочке или поля в протокольной форме.
- Нужен прямой вызов view-метода контракта или сценарий отправки транзакции.
- Нужно исследовать блоки, чанки, валидаторов или метаданные протокола.
- Важна семантика узла, а не индексированное агрегированное представление.

## Минимальные входные данные

- сеть: mainnet или testnet
- основной идентификатор: `account_id`, публичный ключ, ID контракта плюс метод, хеш транзакции или высота/хеш блока
- нужно ли текущее состояние, историческое состояние или поведение отправки/финальности
- должен ли результат остаться каноническим или затем превратиться в более удобное для человека резюме

## Частые задачи

### Проверить точное состояние аккаунта или ключа доступа

**Начните здесь**

- [View Account](https://docs.fastnear.com/ru/rpc/account/view-account) для канонических полей аккаунта.
- [View Access Key](https://docs.fastnear.com/ru/rpc/account/view-access-key) или [View Access Key List](https://docs.fastnear.com/ru/rpc/account/view-access-key-list) для проверки ключей.

**Следующая страница при необходимости**

- [FastNear API full account view](https://docs.fastnear.com/ru/api/v1/account-full), если после подтверждения канонического состояния нужна ещё и сводка в формате кошелька.
- [Transactions API account history](https://docs.fastnear.com/ru/tx/account), если следующий вопрос звучит как «что этот аккаунт делал недавно?»

**Остановитесь, когда**

- Поля RPC уже отвечают на вопрос о состоянии или правах доступа.

**Расширяйте, когда**

- Пользователю нужны балансы, NFT, стейкинг или другой продуктовый вид данных.
- Пользователя интересует не текущее каноническое состояние, а недавняя история активности.

### Проверить блок или снимок состояния протокола

**Начните здесь**

- [Block by ID](https://docs.fastnear.com/ru/rpc/block/block-by-id) или [Block by Height](https://docs.fastnear.com/ru/rpc/block/block-by-height) для конкретного блока.
- [Latest Block](https://docs.fastnear.com/ru/rpc/protocol/latest-block) для текущей канонической головы цепочки.
- [Status](https://docs.fastnear.com/ru/rpc/protocol/status), [Health](https://docs.fastnear.com/ru/rpc/protocol/health) или [Network Info](https://docs.fastnear.com/ru/rpc/protocol/network-info) для диагностики узла и сети.

**Следующая страница при необходимости**

- [Block Effects](https://docs.fastnear.com/ru/rpc/block/block-effects), если после поиска блока нужен контекст по изменениям состояния.
- [Transactions API block history](https://docs.fastnear.com/ru/tx/block) или [Transactions API block range](https://docs.fastnear.com/ru/tx/blocks), если нужна более читаемая картина исполнения в рамках блока или диапазона.

**Остановитесь, когда**

- Канонический ответ блока или протокола уже напрямую отвечает на вопрос.

**Расширяйте, когда**

- Нужны данные по свежим блокам в режиме опроса, а не один канонический снимок. Переходите к [NEAR Data API](https://docs.fastnear.com/ru/neardata).
- Нужна история по нескольким транзакциям, а не только ответ одного блока. Переходите к [Transactions API](https://docs.fastnear.com/ru/tx).

### Выполнить view-вызов контракта

**Начните здесь**

- [Call Function](https://docs.fastnear.com/ru/rpc/contract/call-function) для view-метода контракта.
- [View State](https://docs.fastnear.com/ru/rpc/contract/view-state), когда вопрос касается сырого хранилища контракта.
- [View Code](https://docs.fastnear.com/ru/rpc/contract/view-code), когда на самом деле нужно понять, есть ли код и каков его хеш.

**Следующая страница при необходимости**

- [FastNear API](https://docs.fastnear.com/ru/api), если после сырого вызова пользователю нужен продуктовый ответ, например по активам или сводке аккаунта.
- [KV FastData API](https://docs.fastnear.com/ru/fastdata/kv), если следующая задача связана с индексированной историей по ключам и значениям, а не с точным RPC-чтением.

**Остановитесь, когда**

- Результат view-вызова уже отвечает на вопрос в канонической форме.

**Расширяйте, когда**

- Пользователю нужна индексированная история или более простое резюме вместо сырого ответа контракта.
- Вопрос смещается от «что метод возвращает сейчас?» к «что менялось со временем?»

### Отправить транзакцию и подтвердить результат

**Начните здесь**

- [Send Transaction](https://docs.fastnear.com/ru/rpc/transaction/send-tx), когда нужно каноническое поведение отправки с явной семантикой ожидания.
- [Broadcast Transaction Async](https://docs.fastnear.com/ru/rpc/transaction/broadcast-tx-async) или [Broadcast Transaction Commit](https://docs.fastnear.com/ru/rpc/transaction/broadcast-tx-commit), когда важны именно эти режимы отправки.
- [Transaction Status](https://docs.fastnear.com/ru/rpc/transaction/tx-status), чтобы подтвердить канонический результат.

**Следующая страница при необходимости**

- [Transactions by Hash](https://docs.fastnear.com/ru/tx/transactions), если после отправки нужна более читаемая история по транзакции.
- [Receipt Lookup](https://docs.fastnear.com/ru/tx/receipt), если нужно исследовать последующее исполнение или цепочку обратных вызовов.

**Остановитесь, когда**

- У вас уже есть результат отправки и нужный канонический финальный статус.

**Расширяйте, когда**

- Следующий вопрос относится к квитанциям, затронутым аккаунтам или истории исполнения в более человеческом порядке.
- Нужен уже не единичный статус, а более широкий сценарий расследования.

## Готовые сценарии

### Проверить и удалить старые function-call-ключи Near Social

Используйте этот сценарий, когда вы знаете, что на аккаунте накопились старые function-call-ключи для `social.near`, и хотите осмысленно их просмотреть, выбрать один конкретный ключ и удалить его через сырой RPC.

**Что вы делаете**

- Через канонический RPC получаете полный список access key аккаунта.
- Сужаете этот список до function-call-ключей, привязанных к `social.near`.
- Точно проверяете один выбранный ключ перед удалением.
- Собираете и подписываете транзакцию `DeleteKey` с помощью full-access-key, затем отправляете её через RPC и подтверждаете, что ключ исчез.

Сразу важны два ограничения:

- Ключ, которым вы удаляете другой ключ, должен быть full-access. Function-call-key не может подписать действие `DeleteKey`.
- Этот сценарий про точное состояние ключей и очистку. Необязательный шаг с Transactions API ниже даёт контекст на уровне аккаунта, но не является надёжным источником «когда использовался именно этот ключ».

```bash
export NETWORK_ID=mainnet
export RPC_URL=https://rpc.mainnet.fastnear.com
export TX_BASE_URL=https://tx.main.fastnear.com
export ACCOUNT_ID=YOUR_ACCOUNT_ID
export SOCIAL_RECEIVER_ID=social.near
export DELETE_PUBLIC_KEY='ed25519:PASTE_THE_KEY_YOU_PLAN_TO_REMOVE'
export FULL_ACCESS_PUBLIC_KEY='ed25519:PASTE_THE_FULL_ACCESS_PUBLIC_KEY_YOU_WILL_SIGN_WITH'
export FULL_ACCESS_PRIVATE_KEY='ed25519:PASTE_THE_MATCHING_FULL_ACCESS_PRIVATE_KEY'
```

1. Получите все access key аккаунта, затем сузьте результат до function-call-ключей для `social.near`.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "query",
    params: {
      request_type: "view_access_key_list",
      account_id: $account_id,
      finality: "final"
    }
  }')" \
  | tee /tmp/fastnear-access-keys.json >/dev/null

jq -r --arg receiver "$SOCIAL_RECEIVER_ID" '
  .result.keys[]
  | select((.access_key.permission | type) == "object")
  | select(.access_key.permission.FunctionCall.receiver_id == $receiver)
  | {
      public_key,
      nonce: .access_key.nonce,
      receiver_id: .access_key.permission.FunctionCall.receiver_id,
      method_names: .access_key.permission.FunctionCall.method_names,
      allowance: (.access_key.permission.FunctionCall.allowance // "unlimited")
    }
' /tmp/fastnear-access-keys.json
```

Выберите один `public_key` из этого отфильтрованного списка и присвойте его переменной `DELETE_PUBLIC_KEY`.

2. Ещё раз проверьте конкретный ключ перед удалением.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$ACCOUNT_ID" \
    --arg public_key "$DELETE_PUBLIC_KEY" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "view_access_key",
        account_id: $account_id,
        public_key: $public_key,
        finality: "final"
      }
    }')" \
  | jq '{nonce: .result.nonce, permission: .result.permission}'
```

3. Необязательно: получите недавнюю function-call-активность аккаунта, если хотите понять, стоит ли сначала расследовать контекст, а уже потом чистить ключи.

```bash
curl -s "$TX_BASE_URL/v0/account" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" '{
    account_id: $account_id,
    is_function_call: true,
    limit: 10
  }')" \
  | jq '{
    account_txs: [
      .account_txs[]
      | {
          transaction_hash,
          tx_block_height,
          is_success
        }
    ]
  }'
```

Этот запрос помогает ответить на вопрос «делал ли аккаунт недавно function-call-операции вообще?», но не доказывает, что использовался именно этот access key.

4. Подпишите транзакцию `DeleteKey` для `DELETE_PUBLIC_KEY` с помощью full-access-key.

Выполняйте это в каталоге, где установлен `near-api-js@5`. Команда использует переменные окружения выше, получает актуальный nonce для `FULL_ACCESS_PUBLIC_KEY`, запрашивает свежий хеш финализированного блока, подписывает действие `DeleteKey` и сохраняет `signed_tx_base64` в `SIGNED_TX_BASE64`.

```bash
SIGNED_TX_BASE64="$(
  node --input-type=module <<'EOF'

const {
  ACCOUNT_ID,
  NETWORK_ID = 'mainnet',
  RPC_URL = 'https://rpc.mainnet.fastnear.com',
  DELETE_PUBLIC_KEY,
  FULL_ACCESS_PUBLIC_KEY,
  FULL_ACCESS_PRIVATE_KEY,
} = process.env;

for (const name of [
  'ACCOUNT_ID',
  'DELETE_PUBLIC_KEY',
  'FULL_ACCESS_PUBLIC_KEY',
  'FULL_ACCESS_PRIVATE_KEY',
]) {
  if (!process.env[name]) {
    throw new Error(`Missing ${name}`);
  }
}

async function rpc(method, params) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'fastnear',
      method,
      params,
    }),
  });
  const json = await response.json();
  if (json.error) {
    throw new Error(JSON.stringify(json.error));
  }
  return json.result;
}

const keyPair = KeyPair.fromString(FULL_ACCESS_PRIVATE_KEY);
const derivedPublicKey = keyPair.getPublicKey().toString();

if (derivedPublicKey !== FULL_ACCESS_PUBLIC_KEY) {
  throw new Error(
    `FULL_ACCESS_PUBLIC_KEY does not match FULL_ACCESS_PRIVATE_KEY (${derivedPublicKey})`
  );
}

const signer = await InMemorySigner.fromKeyPair(NETWORK_ID, ACCOUNT_ID, keyPair);

const accessKey = await rpc('query', {
  request_type: 'view_access_key',
  account_id: ACCOUNT_ID,
  public_key: FULL_ACCESS_PUBLIC_KEY,
  finality: 'final',
});

const block = await rpc('block', { finality: 'final' });

const transaction = transactions.createTransaction(
  ACCOUNT_ID,
  utils.PublicKey.fromString(FULL_ACCESS_PUBLIC_KEY),
  ACCOUNT_ID,
  BigInt(accessKey.nonce) + 1n,
  [transactions.deleteKey(utils.PublicKey.fromString(DELETE_PUBLIC_KEY))],
  utils.serialize.base_decode(block.header.hash)
);

const [, signedTx] = await transactions.signTransaction(
  transaction,
  signer,
  ACCOUNT_ID,
  NETWORK_ID
);

process.stdout.write(Buffer.from(signedTx.encode()).toString('base64'));
EOF
)"
```

5. Отправьте подписанную транзакцию через сырой RPC и дождитесь `FINAL`.

```bash
curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg signed_tx_base64 "$SIGNED_TX_BASE64" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "send_tx",
    params: {
      signed_tx_base64: $signed_tx_base64,
      wait_until: "FINAL"
    }
  }')" \
  | jq '{
    final_execution_status: .result.final_execution_status,
    transaction_hash: .result.transaction.hash,
    status: .result.status
  }'
```

6. Повторно получите список access key и убедитесь, что нужного ключа больше нет.

```bash
if curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg account_id "$ACCOUNT_ID" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "query",
    params: {
      request_type: "view_access_key_list",
      account_id: $account_id,
      finality: "final"
    }
  }')" \
  | jq -e --arg public_key "$DELETE_PUBLIC_KEY" '
      .result.keys[]
      | select(.public_key == $public_key)
    ' >/dev/null; then
  echo "Key is still present: $DELETE_PUBLIC_KEY"
else
  echo "Key deleted: $DELETE_PUBLIC_KEY"
fi
```

**Зачем нужен следующий шаг?**

Повторный вызов `view_access_key_list` замыкает сценарий на той же канонической поверхности, с которой вы начинали поиск. Если ключ исчез именно там, дополнительная индексированная сводка уже не нужна, чтобы подтвердить удаление.

### Проверить регистрацию FT storage и затем перевести токены

Используйте этот сценарий, когда история звучит так: «безопасно отправить FT-токен, но сначала доказать, зарегистрирован ли получатель для storage на этом FT-контракте».

**Сеть**

- testnet

**Официальные ссылки**

- [FT storage и перевод токенов](https://docs.near.org/integrations/fungible-tokens)
- [Предразвёрнутый FT-контракт](https://docs.near.org/tutorials/fts/predeployed-contract)

В этом сценарии используется безопасный публичный контракт `ft.predeployed.examples.testnet`. Перед началом убедитесь, что у отправителя уже есть немного `gtNEAR` на этом контракте. Если баланса ещё нет, сначала получите небольшой объём через гайд по предразвёрнутому контракту и затем вернитесь к этому сценарию.

**Что вы делаете**

- Через канонические RPC view-вызовы проверяете, есть ли у получателя FT storage на контракте.
- При необходимости получаете минимальный размер storage deposit.
- Подписываете и отправляете `storage_deposit`, а затем `ft_transfer`.
- Подтверждаете баланс получателя тем же каноническим view-методом контракта.

```bash
export NETWORK_ID=testnet
export RPC_URL=https://rpc.testnet.fastnear.com
export TOKEN_CONTRACT_ID=ft.predeployed.examples.testnet
export SENDER_ACCOUNT_ID=YOUR_ACCOUNT_ID.testnet
export RECEIVER_ACCOUNT_ID=YOUR_RECEIVER_ID.testnet
export SENDER_PUBLIC_KEY='ed25519:YOUR_FULL_ACCESS_PUBLIC_KEY'
export SENDER_PRIVATE_KEY='ed25519:YOUR_MATCHING_PRIVATE_KEY'
export AMOUNT_YOCTO_GTNEAR='10000000000000000000000'
```

1. Проверьте, зарегистрирован ли получатель на FT-контракте.

```bash
STORAGE_BALANCE_ARGS_BASE64="$(
  jq -nc --arg account_id "$RECEIVER_ACCOUNT_ID" '{
    account_id: $account_id
  }' | base64 | tr -d '\n'
)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$TOKEN_CONTRACT_ID" \
    --arg args_base64 "$STORAGE_BALANCE_ARGS_BASE64" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "call_function",
        account_id: $account_id,
        method_name: "storage_balance_of",
        args_base64: $args_base64,
        finality: "final"
      }
    }')" \
  | tee /tmp/ft-storage-balance.json >/dev/null

jq '{
  registered: ((.result.result | implode | fromjson) != null),
  storage_balance: (.result.result | implode | fromjson)
}' /tmp/ft-storage-balance.json
```

2. Если получатель ещё не зарегистрирован, получите минимальный storage deposit.

```bash
MIN_STORAGE_YOCTO="$(
  curl -s "$RPC_URL" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --arg account_id "$TOKEN_CONTRACT_ID" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "call_function",
        account_id: $account_id,
        method_name: "storage_balance_bounds",
        args_base64: "e30=",
        finality: "final"
      }
    }')" \
    | tee /tmp/ft-storage-bounds.json \
    | jq -r '.result.result | implode | fromjson | .min'
)"

printf 'Minimum storage deposit: %s yoctoNEAR\n' "$MIN_STORAGE_YOCTO"
```

3. Определите одну переиспользуемую функцию подписи для function-call к контракту.

Выполняйте этот шаг в каталоге, где установлен `near-api-js@5`. Функция ниже читает экспортированные shell-переменные выше и превращает каждый function-call в подписанный payload для отправки через сырой RPC.

```bash
sign_function_call() {
  METHOD_NAME="$1" \
  ARGS_JSON="$2" \
  DEPOSIT_YOCTO="$3" \
  GAS_TGAS="$4" \
  node --input-type=module <<'EOF'

const {
  NETWORK_ID = 'testnet',
  RPC_URL = 'https://rpc.testnet.fastnear.com',
  TOKEN_CONTRACT_ID,
  SENDER_ACCOUNT_ID,
  SENDER_PUBLIC_KEY,
  SENDER_PRIVATE_KEY,
  METHOD_NAME,
  ARGS_JSON,
  DEPOSIT_YOCTO = '0',
  GAS_TGAS = '100',
} = process.env;

for (const name of [
  'TOKEN_CONTRACT_ID',
  'SENDER_ACCOUNT_ID',
  'SENDER_PUBLIC_KEY',
  'SENDER_PRIVATE_KEY',
  'METHOD_NAME',
  'ARGS_JSON',
]) {
  if (!process.env[name]) {
    throw new Error(`Missing ${name}`);
  }
}

async function rpc(method, params) {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'fastnear',
      method,
      params,
    }),
  });
  const json = await response.json();
  if (json.error) {
    throw new Error(JSON.stringify(json.error));
  }
  return json.result;
}

const keyPair = KeyPair.fromString(SENDER_PRIVATE_KEY);
const signer = await InMemorySigner.fromKeyPair(
  NETWORK_ID,
  SENDER_ACCOUNT_ID,
  keyPair
);

const derivedPublicKey = keyPair.getPublicKey().toString();
if (derivedPublicKey !== SENDER_PUBLIC_KEY) {
  throw new Error(
    `SENDER_PUBLIC_KEY does not match SENDER_PRIVATE_KEY (${derivedPublicKey})`
  );
}

const accessKey = await rpc('query', {
  request_type: 'view_access_key',
  account_id: SENDER_ACCOUNT_ID,
  public_key: SENDER_PUBLIC_KEY,
  finality: 'final',
});

const block = await rpc('block', { finality: 'final' });

const action = transactions.functionCall(
  METHOD_NAME,
  Buffer.from(ARGS_JSON),
  BigInt(GAS_TGAS) * 10n ** 12n,
  BigInt(DEPOSIT_YOCTO)
);

const transaction = transactions.createTransaction(
  SENDER_ACCOUNT_ID,
  utils.PublicKey.fromString(SENDER_PUBLIC_KEY),
  TOKEN_CONTRACT_ID,
  BigInt(accessKey.nonce) + 1n,
  [action],
  utils.serialize.base_decode(block.header.hash)
);

const [, signedTx] = await transactions.signTransaction(
  transaction,
  signer,
  SENDER_ACCOUNT_ID,
  NETWORK_ID
);

process.stdout.write(Buffer.from(signedTx.encode()).toString('base64'));
EOF
}
```

4. При необходимости сначала зарегистрируйте storage для получателя.

```bash
if jq -e '.result.result | implode | fromjson == null' /tmp/ft-storage-balance.json >/dev/null; then
  SIGNED_TX_BASE64="$(
    sign_function_call \
      storage_deposit \
      "$(jq -nc --arg account_id "$RECEIVER_ACCOUNT_ID" '{
        account_id: $account_id,
        registration_only: true
      }')" \
      "$MIN_STORAGE_YOCTO" \
      100
  )"

  curl -s "$RPC_URL" \
    -H 'content-type: application/json' \
    --data "$(jq -nc --arg signed_tx_base64 "$SIGNED_TX_BASE64" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "send_tx",
      params: {
        signed_tx_base64: $signed_tx_base64,
        wait_until: "FINAL"
      }
    }')" \
    | jq '{
        final_execution_status: .result.final_execution_status,
        transaction_hash: .result.transaction.hash
      }'
fi
```

5. После готовности storage переведите FT.

```bash
SIGNED_TX_BASE64="$(
  sign_function_call \
    ft_transfer \
    "$(jq -nc \
      --arg receiver_id "$RECEIVER_ACCOUNT_ID" \
      --arg amount "$AMOUNT_YOCTO_GTNEAR" '{
        receiver_id: $receiver_id,
        amount: $amount,
        memo: "FastNear RPC example"
      }')" \
    1 \
    100
)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc --arg signed_tx_base64 "$SIGNED_TX_BASE64" '{
    jsonrpc: "2.0",
    id: "fastnear",
    method: "send_tx",
    params: {
      signed_tx_base64: $signed_tx_base64,
      wait_until: "FINAL"
    }
  }')" \
  | jq '{
      final_execution_status: .result.final_execution_status,
      transaction_hash: .result.transaction.hash,
      status: .result.status
    }'
```

6. Подтвердите FT-баланс получателя каноническим view-методом контракта.

```bash
RECEIVER_BALANCE_ARGS_BASE64="$(
  jq -nc --arg account_id "$RECEIVER_ACCOUNT_ID" '{
    account_id: $account_id
  }' | base64 | tr -d '\n'
)"

curl -s "$RPC_URL" \
  -H 'content-type: application/json' \
  --data "$(jq -nc \
    --arg account_id "$TOKEN_CONTRACT_ID" \
    --arg args_base64 "$RECEIVER_BALANCE_ARGS_BASE64" '{
      jsonrpc: "2.0",
      id: "fastnear",
      method: "query",
      params: {
        request_type: "call_function",
        account_id: $account_id,
        method_name: "ft_balance_of",
        args_base64: $args_base64,
        finality: "final"
      }
    }')" \
  | jq '{
      receiver_balance: (.result.result | implode | fromjson)
    }'
```

**Зачем нужен следующий шаг?**

Это канонический RPC-сценарий, потому что каждый шаг остаётся на точном состоянии контракта и точной семантике отправки транзакций: сначала вы доказываете состояние storage, затем отправляете минимально необходимые change-call, а потом напрямую подтверждаете итоговое состояние на контракте.

## Частые ошибки

- Начинать с RPC, когда пользователю на самом деле нужна сводка по активам или индексированная история.
- Забывать переключаться с обычного RPC на архивный RPC для старого состояния.
- Воспринимать браузерную аутентификацию в интерфейсе документации как продовый паттерн для бэкенда.
- Продолжать пользоваться низкоуровневыми статусами транзакций, когда вопрос уже превратился в расследование или исторический разбор.

## Полезные связанные страницы

- [RPC Reference](https://docs.fastnear.com/ru/rpc)
- [Auth & Access](https://docs.fastnear.com/ru/auth)
- [FastNear API](https://docs.fastnear.com/ru/api)
- [Transactions API](https://docs.fastnear.com/ru/tx)
- [Choosing the Right Surface](https://docs.fastnear.com/ru/agents/choosing-surfaces)
- [Agent Playbooks](https://docs.fastnear.com/ru/agents/playbooks)
