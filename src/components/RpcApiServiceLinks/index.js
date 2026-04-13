import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

function buildServiceLinks(hideEarlyApiFamilies) {
  return [
    { href: '/docs/rpc-api/fastnear-api', label: 'FastNear API' },
    { href: '/docs/rpc-api/transactions-api', label: 'Transactions API' },
    ...(!hideEarlyApiFamilies
      ? [{ href: '/docs/rpc-api/transfers-api', label: 'Transfers API' }]
      : []),
    ...(!hideEarlyApiFamilies
      ? [{ href: '/docs/rpc-api/kv-fastdata-api', label: 'KV FastData API' }]
      : []),
    { href: '/docs/rpc-api/neardata-api', label: 'NEAR Data API' },
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
          <Link to={link.href}>{link.label}</Link>
        </li>
      ))}
    </ul>
  );
}
