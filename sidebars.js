// @ts-check

/**
 * @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const hideEarlyApiFamilies = /^(1|true|yes|on)$/i.test(
  process.env.HIDE_EARLY_API_FAMILIES || ''
);

function loadNearcoreSource() {
  try {
    const structuredGraphPath = path.join(
      configDir,
      'src',
      'data',
      'generatedFastnearStructuredGraph.json'
    );
    const structuredGraph = JSON.parse(fs.readFileSync(structuredGraphPath, 'utf8'));
    return structuredGraph?.metadata?.nearcoreSource || null;
  } catch (_error) {
    return null;
  }
}

const nearcoreSource = loadNearcoreSource();
const nearcoreReleaseSidebarItems =
  nearcoreSource?.tag && nearcoreSource?.releaseUrl
    ? [
        {
          type: 'link',
          href: nearcoreSource.releaseUrl,
          label: `nearcore ${nearcoreSource.tag}`,
          className: 'fastnear-sidebar-release-link',
        },
      ]
    : [];

const rpcSidebar = [
  ...nearcoreReleaseSidebarItems,
  'rpc/index',
  'rpc/examples',
  'auth/index',
  {
    type: 'category',
    label: 'Account',
    items: [
      'rpc/account/view-account',
      'rpc/account/view-access-key',
      'rpc/account/view-access-key-list',
    ],
  },
  {
    type: 'category',
    label: 'Block',
    items: [
      'rpc/block/block-by-height',
      'rpc/block/block-by-id',
      'rpc/block/block-effects',
    ],
  },
  {
    type: 'category',
    label: 'Contract',
    items: [
      'rpc/contract/call-function',
      'rpc/contract/view-code',
      'rpc/contract/view-state',
      'rpc/contract/view-global-contract-code',
      'rpc/contract/view-global-contract-code-by-account-id',
    ],
  },
  {
    type: 'category',
    label: 'Protocol',
    items: [
      'rpc/protocol/status',
      'rpc/protocol/health',
      'rpc/protocol/gas-price',
      'rpc/protocol/gas-price-by-block',
      'rpc/protocol/genesis-config',
      'rpc/protocol/changes',
      'rpc/protocol/chunk-by-hash',
      'rpc/protocol/chunk-by-block-shard',
      'rpc/protocol/client-config',
      'rpc/protocol/network-info',
      'rpc/protocol/latest-block',
      'rpc/protocol/metrics',
      'rpc/protocol/maintenance-windows',
      'rpc/protocol/light-client-proof',
      'rpc/protocol/next-light-client-block',
      'rpc/protocol/experimental-protocol-config',
      'rpc/protocol/experimental-congestion-level',
      'rpc/protocol/experimental-light-client-block-proof',
      'rpc/protocol/experimental-light-client-proof',
      'rpc/protocol/experimental-split-storage-info',
    ],
  },
  {
    type: 'category',
    label: 'Transaction',
    items: [
      'rpc/transaction/tx-status',
      'rpc/transaction/send-tx',
      'rpc/transaction/broadcast-tx-async',
      'rpc/transaction/broadcast-tx-commit',
      'rpc/transaction/experimental-receipt',
      'rpc/transaction/experimental-tx-status',
    ],
  },
  {
    type: 'category',
    label: 'Validators',
    items: [
      'rpc/validators/validators-current',
      'rpc/validators/validators-by-epoch',
      'rpc/validators/experimental-validators-ordered',
    ],
  },
];

const fastnearApiSidebar = [
  'api/index',
  'api/examples',
  {
    type: 'category',
    label: 'V0',
    collapsible: false,
    collapsed: false,
    items: [
      'api/v0-public-key',
      'api/v0-public-key-all',
      'api/v0-account-staking',
      'api/v0-account-ft',
      'api/v0-account-nft',
    ],
  },
  {
    type: 'category',
    label: 'V1',
    collapsible: false,
    collapsed: false,
    items: [
      'api/v1-public-key',
      'api/v1-public-key-all',
      'api/v1-account-staking',
      'api/v1-account-ft',
      'api/v1-account-nft',
      'api/v1-ft-top',
      'api/v1-account-full',
    ],
  },
  'api/status',
  'api/health',
];

const transactionsApiSidebar = [
  'tx/index',
  'tx/examples',
  'tx/transactions',
  'tx/account',
  'tx/block',
  'tx/blocks',
  'tx/receipt',
];

const transfersApiSidebar = hideEarlyApiFamilies
  ? []
  : ['transfers/index', 'transfers/examples', 'transfers/transfers'];

const nearDataApiSidebar = [
  'neardata/index',
  'neardata/examples',
  'neardata/first-block',
  'neardata/block',
  'neardata/block-headers',
  'neardata/block-chunk',
  'neardata/block-shard',
  'neardata/block-optimistic',
  'neardata/last-block-final',
  'neardata/last-block-optimistic',
  'neardata/health',
];

const kvFastDataSidebar = hideEarlyApiFamilies
  ? []
  : [
      'fastdata/kv/index',
      'fastdata/kv/examples',
      'fastdata/kv/all-by-predecessor',
      'fastdata/kv/history-by-predecessor',
      'fastdata/kv/latest-by-predecessor',
      'fastdata/kv/history-by-account',
      'fastdata/kv/latest-by-account',
      'fastdata/kv/history-by-key',
      'fastdata/kv/multi',
      'fastdata/kv/get-history-key',
      'fastdata/kv/get-latest-key',
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
