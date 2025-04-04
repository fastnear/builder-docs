/// entrypoint

import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <p className={"paragraph-large text--left padding-horiz--md"}>
          We're building resources for technical founders, indie hackers, and hobbyists on NEAR.
          The aim is to explain foundational concepts, how NEAR is differentiated from other blockchains,
          and "how to think" as a builder.
        </p>
        {/* Mike: might keep this idea below as reference */}
        {/*<div className={styles.buttons}>*/}
        {/*  <Link*/}
        {/*    className="button button--secondary button--lg"*/}
        {/*    to="#core-concepts">Learn More</Link>*/}
        {/*</div>*/}
      </div>
    </header>
  );
}

function CoreConcepts() {
  return (
    <section id="core-concepts" className="padding-vert--lg">
      <div className="container">
        <Heading as="h2" className="text--center margin-bottom--lg">
          Core concepts include:
        </Heading>
        <div className="row">
          <div className="col col--4">
            <div className="padding--md">
              <h3 className="text--center">Asynchronous transactions</h3>
              <div className={"text--left"}>
                <p>Blockchain transactions are verified by the protocol, by proof-of-stake validators running nearcore, then turned into "receipt" objects.</p>
                <p>These receipts will find their way to the correct shard, where the target smart contract is being called. Each named account, like <strong>root.near</strong> has a dedicated state key where a smart contract is stored. In that sense, a named account is being called, and the contract state is loaded into the appropriate runtime.</p>
                <p>A helpful adjustment in perspective is to consider how your smart contracts handle cross-contract calls. This doesn't add much complexity, but is important to consider if the response from your cross-contract call needs to be matched with the promise index, and any relevant state needed to continue operation.</p>
              </div>
            </div>
          </div>
          <div className="col col--4">
            <div className="padding--md">
              <h3 className="text--center">Account model</h3>
              <div className={"text--left"}>
                <p>The protocol has named accounts (similar to Ethereum Name Service) built in. Named accounts behave similar to internet DNS, in that the owner of <strong>example.near</strong> can create <strong>my_app-123.example.near</strong>, and it can be initialized with any public key.</p>
                <p>Implicit accounts are the only other type of account, and they are the most minimal entity necessary, and do not have a slot for a smart contract. Implicit account names look like common 0x addresses across ecosystems.</p>
              </div>
            </div>
          </div>
          <div className="col col--4">
            <div className="padding--md">
              <h3 className="text--center">Account key pairs</h3>
              <div className={"text--left"}>
                <p>Both <strong>secp256k1</strong> and <strong>ed25519</strong> key pair types are supported. The former is used by Ethereum, and the latter by Solana. Each named account can have multiple keys, of either curve type. Among other things, this means key rotation is built into the protocol.</p>
                <p>A key pair type is used to sign transactions, and there are two kinds:</p>
                <ul>
                  <li><strong>Full access</strong> key: authorized to execute any of the NEAR actions. (FunctionCall, CreateAccount, RemoveKey, etc.)</li>
                  <li><strong>Limited access</strong> key: authorized to only use the <strong>FunctionCall</strong> Action, without the ability to attach a deposit. These access keys can be scoped to include all contract method calls, or limited to a subset. Upon creation, they can be given an <strong>allowance</strong> of NEAR, that can only be consumed via function-call execution, calculated by the gas price at the time.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="NEAR Protocol technical documentation for builders, indie hackers, founders, and hobbyists.">
      <HomepageHeader />
      <main>
        <CoreConcepts />
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
