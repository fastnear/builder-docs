import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

function buildServiceLinks(hideEarlyApiFamilies) {
  return [
    { href: '/docs/api', label: 'FastNear API' },
    { href: '/docs/tx', label: 'Transactions API' },
    ...(!hideEarlyApiFamilies
      ? [{ href: '/docs/transfers', label: 'Transfers API' }]
      : []),
    ...(!hideEarlyApiFamilies
      ? [{ href: '/docs/fastdata/kv', label: 'KV FastData API' }]
      : []),
    { href: '/docs/neardata', label: 'NEAR Data API' },
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
