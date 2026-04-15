import React from 'react';
import { translate } from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import LocalizedLink from '@site/src/components/LocalizedLink';

function buildServiceLinks(hideEarlyApiFamilies) {
  return [
    {
      href: '/api',
      label: translate({
        id: 'fastnear.serviceLinks.fastnear.label',
        message: 'FastNear API',
      }),
      description: translate({
        id: 'fastnear.serviceLinks.fastnear.description',
        message: 'Indexed account views for balances, NFTs, staking, and public-key lookups.',
      }),
    },
    {
      href: '/tx',
      label: translate({
        id: 'fastnear.serviceLinks.transactions.label',
        message: 'Transactions API',
      }),
      description: translate({
        id: 'fastnear.serviceLinks.transactions.description',
        message:
          'Account, block, receipt, and transaction history from indexed execution data.',
      }),
    },
    ...(!hideEarlyApiFamilies
      ? [
          {
            href: '/transfers',
            label: translate({
              id: 'fastnear.serviceLinks.transfers.label',
              message: 'Transfers API',
            }),
            description: translate({
              id: 'fastnear.serviceLinks.transfers.description',
              message:
                'Purpose-built transfer history for account activity and pagination-heavy UIs.',
            }),
          },
        ]
      : []),
    ...(!hideEarlyApiFamilies
      ? [
          {
            href: '/fastdata/kv',
            label: translate({
              id: 'fastnear.serviceLinks.fastdata.label',
              message: 'KV FastData API',
            }),
            description: translate({
              id: 'fastnear.serviceLinks.fastdata.description',
              message:
                'Indexed key-value history and latest-state lookups for contract storage analysis.',
            }),
          },
        ]
      : []),
    {
      href: '/neardata',
      label: translate({
        id: 'fastnear.serviceLinks.neardata.label',
        message: 'NEAR Data API',
      }),
      description: translate({
        id: 'fastnear.serviceLinks.neardata.description',
        message:
          'Recent finalized and optimistic block-family reads for low-latency polling workflows.',
      }),
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
          <LocalizedLink to={link.href}>{link.label}</LocalizedLink>: {link.description}
        </li>
      ))}
    </ul>
  );
}
