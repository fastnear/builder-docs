// @ts-check

/**
 * @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */

const hideEarlyApiFamilies = /^(1|true|yes|on)$/i.test(
  process.env.HIDE_EARLY_API_FAMILIES || ''
);

const rpcSidebar = [
  'rpc-api/rpc',
  'rpc-api/api-key',
  'rpc-api/auth-browser-demo',
  'rpc-api/auth-production-backend',
  {
    type: 'category',
    label: 'Account',
    items: [
      'rpc-api/account/view-account',
      'rpc-api/account/view-access-key',
      'rpc-api/account/view-access-key-list',
    ],
  },
  {
    type: 'category',
    label: 'Block',
    items: [
      'rpc-api/block/block-by-height',
      'rpc-api/block/block-by-id',
      'rpc-api/block/block-effects',
    ],
  },
  {
    type: 'category',
    label: 'Contract',
    items: [
      'rpc-api/contract/call-function',
      'rpc-api/contract/view-code',
      'rpc-api/contract/view-state',
      'rpc-api/contract/view-global-contract-code',
      'rpc-api/contract/view-global-contract-code-by-account-id',
    ],
  },
  {
    type: 'category',
    label: 'Protocol',
    items: [
      'rpc-api/protocol/status',
      'rpc-api/protocol/health',
      'rpc-api/protocol/gas-price',
      'rpc-api/protocol/gas-price-by-block',
      'rpc-api/protocol/genesis-config',
      'rpc-api/protocol/changes',
      'rpc-api/protocol/chunk-by-hash',
      'rpc-api/protocol/chunk-by-block-shard',
      'rpc-api/protocol/client-config',
      'rpc-api/protocol/network-info',
      'rpc-api/protocol/latest-block',
      'rpc-api/protocol/metrics',
      'rpc-api/protocol/maintenance-windows',
      'rpc-api/protocol/light-client-proof',
      'rpc-api/protocol/next-light-client-block',
      'rpc-api/protocol/experimental-protocol-config',
      'rpc-api/protocol/experimental-congestion-level',
      'rpc-api/protocol/experimental-light-client-block-proof',
      'rpc-api/protocol/experimental-light-client-proof',
      'rpc-api/protocol/experimental-split-storage-info',
    ],
  },
  {
    type: 'category',
    label: 'Transaction',
    items: [
      'rpc-api/transaction/tx-status',
      'rpc-api/transaction/send-tx',
      'rpc-api/transaction/broadcast-tx-async',
      'rpc-api/transaction/broadcast-tx-commit',
      'rpc-api/transaction/experimental-receipt',
      'rpc-api/transaction/experimental-tx-status',
    ],
  },
  {
    type: 'category',
    label: 'Validators',
    items: [
      'rpc-api/validators/validators-current',
      'rpc-api/validators/validators-by-epoch',
      'rpc-api/validators/experimental-validators-ordered',
    ],
  },
];

const fastnearApiSidebar = [
  'rpc-api/fastnear-api/index',
  {
    type: 'category',
    label: 'V0',
    collapsible: false,
    collapsed: false,
    items: [
      'rpc-api/fastnear-api/v0-public-key',
      'rpc-api/fastnear-api/v0-public-key-all',
      'rpc-api/fastnear-api/v0-account-staking',
      'rpc-api/fastnear-api/v0-account-ft',
      'rpc-api/fastnear-api/v0-account-nft',
    ],
  },
  {
    type: 'category',
    label: 'V1',
    collapsible: false,
    collapsed: false,
    items: [
      'rpc-api/fastnear-api/v1-public-key',
      'rpc-api/fastnear-api/v1-public-key-all',
      'rpc-api/fastnear-api/v1-account-staking',
      'rpc-api/fastnear-api/v1-account-ft',
      'rpc-api/fastnear-api/v1-account-nft',
      'rpc-api/fastnear-api/v1-ft-top',
      'rpc-api/fastnear-api/v1-account-full',
    ],
  },
  'rpc-api/fastnear-api/status',
  'rpc-api/fastnear-api/health',
];

const transactionsApiSidebar = [
  'rpc-api/transactions-api/index',
  'rpc-api/transactions-api/transactions',
  'rpc-api/transactions-api/account',
  'rpc-api/transactions-api/block',
  'rpc-api/transactions-api/blocks',
  'rpc-api/transactions-api/receipt',
];

const transfersApiSidebar = hideEarlyApiFamilies
  ? []
  : ['rpc-api/transfers-api/index', 'rpc-api/transfers-api/transfers'];

const nearDataApiSidebar = [
  'rpc-api/neardata-api/index',
  'rpc-api/neardata-api/first-block',
  'rpc-api/neardata-api/block',
  'rpc-api/neardata-api/block-headers',
  'rpc-api/neardata-api/block-chunk',
  'rpc-api/neardata-api/block-shard',
  'rpc-api/neardata-api/block-optimistic',
  'rpc-api/neardata-api/last-block-final',
  'rpc-api/neardata-api/last-block-optimistic',
  'rpc-api/neardata-api/health',
];

const kvFastDataSidebar = hideEarlyApiFamilies
  ? []
  : [
      'rpc-api/kv-fastdata-api/index',
      'rpc-api/kv-fastdata-api/all-by-predecessor',
      'rpc-api/kv-fastdata-api/history-by-predecessor',
      'rpc-api/kv-fastdata-api/latest-by-predecessor',
      'rpc-api/kv-fastdata-api/history-by-account',
      'rpc-api/kv-fastdata-api/latest-by-account',
      'rpc-api/kv-fastdata-api/history-by-key',
      'rpc-api/kv-fastdata-api/multi',
      'rpc-api/kv-fastdata-api/get-history-key',
      'rpc-api/kv-fastdata-api/get-latest-key',
    ];

const sidebars = {
  rpcSidebar,
  fastnearApiSidebar,
  transactionsApiSidebar,
  transfersApiSidebar,
  nearDataApiSidebar,
  kvFastDataSidebar,
  transactionFlowSidebar: [{ type: 'autogenerated', dirName: 'transaction-flow' }],
  snapshotsSidebars: [{ type: 'autogenerated', dirName: 'snapshots' }],
};

export default sidebars;
