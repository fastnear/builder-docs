import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

function buildServiceLinks(hideEarlyApiFamilies) {
  return [
    {
      href: '/api',
      label: 'FastNear API',
      description:
        'Indexed account views for balances, NFTs, staking, and public-key lookups.',
    },
    {
      href: '/tx',
      label: 'Transactions API',
      description:
        'Account, block, receipt, and transaction history from indexed execution data.',
    },
    ...(!hideEarlyApiFamilies
      ? [
          {
            href: '/transfers',
            label: 'Transfers API',
            description:
              'Purpose-built transfer history for account activity and pagination-heavy UIs.',
          },
        ]
      : []),
    ...(!hideEarlyApiFamilies
      ? [
          {
            href: '/fastdata/kv',
            label: 'KV FastData API',
            description:
              'Indexed key-value history and latest-state lookups for contract storage analysis.',
          },
        ]
      : []),
    {
      href: '/neardata',
      label: 'NEAR Data API',
      description:
        'Recent finalized and optimistic block-family reads for low-latency polling workflows.',
    },
  ];
}

export default function RpcApiServiceLinks() {
  const { siteConfig } = useDocusaurusContext();
  const hideEarlyApiFamilies = Boolean(siteConfig.customFields?.hideEarlyApiFamilies);
  const links = buildServiceLinks(hideEarlyApiFamilies);

  return (
    <ul>
      {links.map((link) => (
        <li key={link.href}>
          <Link to={link.href}>{link.label}</Link>: {link.description}
        </li>
      ))}
    </ul>
  );
}
