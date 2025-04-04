import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Smart contracts',
    imgSrc: require('@site/static/img/cargo.png').default,
    description: (
      <>
        NEAR supports smart contracts written in different languages. These docs will focus on Rust smart contracts. These are compiled to WebAssembly, using the <strong>target wasm32-unknown-unknown</strong>, and outputs deterministic code hashes using containers. This optimization is typically done before a production deploy, and can be done with <strong>cargo near</strong>.
      </>
    ),
  },
  {
    title: 'Tracking transactions',
    imgSrc: require('@site/static/img/protocol.png').default,
    description: (
      <>
        NEAR is a sharded blockchain, but it doesn't increase the difficulty of tracking transactions. There are two types of transaction finality: <strong>optimistic</strong> and <strong>final</strong>. Transactions also have a status that can be queried by RPC calls, or subscribed to via event listeners. <strong>Pending</strong>, <strong>Included</strong>, and <strong>Executed</strong> are examples of tx statuses.
      </>
    ),
  },
  {
    title: 'Brief code snippets',
    imgSrc: require('@site/static/img/brief-examples.png').default,
    description: (
      <>
        We'll be populating this resource with dead-simple snippets/examples, for reference and reminders. Candidate topics include:
        <ul>
          <li>Simple Rust daemon interacting with NEAR</li>
          <li>Simple JS/TS service</li>
          <li>Indexing fundamentals</li>
          <li>Customizing a validator's staking pool contract</li>
          <li>Cross-contract calls that saves and references state by promise index</li>
          <li>Killer yield/resume example</li>
          <li>Running your own RPC</li>
        </ul>
      </>
    ),
  },
];

function Feature({imgSrc, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <img
          className={styles.featureSvg}
          src={imgSrc}
          alt={title}
        />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p className="text--left">{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
