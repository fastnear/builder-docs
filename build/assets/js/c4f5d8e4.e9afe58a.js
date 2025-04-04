"use strict";(self.webpackChunkbuilder_docs=self.webpackChunkbuilder_docs||[]).push([[634],{4378:(e,t,s)=>{s.d(t,{A:()=>a});const a=s.p+"assets/images/cargo-ba513f31a5d63fd20b1e94679bec655a.png"},5163:(e,t,s)=>{s.r(t),s.d(t,{default:()=>p});var a=s(7167),n=(s(9214),s(1538)),c=s(9861),i=s(1308);const r={features:"features_t9lD",featureSvg:"featureSvg_GfXr",heroList:"heroList_K4gM"};var o=s(123);const l=[{title:"Smart contracts",imgSrc:s(4378).A,description:(0,o.jsx)(o.Fragment,{children:"Docusaurus was designed from the ground up to be easily installed and used to get your website up and running quickly."})},{title:"Tracking transactions",imgSrc:s(6448).A,description:(0,o.jsxs)(o.Fragment,{children:["Docusaurus lets you focus on your docs, and we'll do the chores. Go ahead and move your docs into the ",(0,o.jsx)("code",{children:"docs"})," directory."]})},{title:"Brief code snippets",imgSrc:s(8124).A,description:(0,o.jsx)(o.Fragment,{children:"Extend or customize your website layout by reusing React. Docusaurus can be extended while reusing the same header and footer."})}];function d(e){let{Svg:t,imgSrc:s,title:n,description:c}=e;return(0,o.jsxs)("div",{className:(0,a.A)("col col--4"),children:[(0,o.jsx)("div",{className:"text--center",children:t?(0,o.jsx)(t,{className:r.featureSvg,role:"img"}):(0,o.jsx)("img",{src:s,className:r.featureSvg,alt:n})}),(0,o.jsxs)("div",{className:"text--center padding-horiz--md",children:[(0,o.jsx)(i.A,{as:"h3",children:n}),(0,o.jsx)("p",{className:"text--left",children:c})]})]})}function h(){return(0,o.jsx)("section",{className:r.features,children:(0,o.jsx)("div",{className:"container",children:(0,o.jsx)("div",{className:"row",children:l.map(((e,t)=>(0,o.jsx)(d,{...e},t)))})})})}const u={heroBanner:"heroBanner_qdFl",buttons:"buttons_AeoN"};function m(){const{siteConfig:e}=(0,n.A)();return(0,o.jsx)("header",{className:(0,a.A)("hero hero--primary",u.heroBanner),children:(0,o.jsxs)("div",{className:"container",children:[(0,o.jsx)(i.A,{as:"h1",className:"hero__title",children:e.title}),(0,o.jsx)("p",{className:"hero__subtitle",children:e.tagline}),(0,o.jsx)("p",{className:"paragraph-large text--left padding-horiz--md\n",children:'We\'re building resources for technical founders, indie hackers, and hobbyists on NEAR. The aim is to explain foundational concepts, how NEAR is differentiated from other blockchains, and "how to think" as a builder.'}),(0,o.jsx)("h2",{children:"Core concepts include:"}),(0,o.jsxs)("div",{id:"hero-differentiation",className:"row margin-top--lg",children:[(0,o.jsxs)("div",{className:"col col--4",children:[(0,o.jsx)("h3",{children:"Asynchronous transactions"}),(0,o.jsxs)("div",{className:"text--left",children:[(0,o.jsx)("p",{children:'Blockchain transactions are verified by the protocol, by proof-of-stake validators running nearcore, then turned into "receipt" objects.'}),(0,o.jsxs)("p",{children:["These receipts will find their way to the correct shard, where the target smart contract is being called. Each named account, like ",(0,o.jsx)("code",{children:"root.near"})," has a dedicated state key where a smart contract is stored. In that sense, a named account is being called, and the contract state is loaded into the appropriate runtime."]}),(0,o.jsx)("p",{children:"A helpful adjustment in perspective is to consider how your smart contracts handle cross-contract calls. This doesn't add much complexity, but is important to consider if the response from your cross-contract call needs to be matched with the promise index, and any relevant state needed to continue operation."})]})]}),(0,o.jsxs)("div",{className:"col col--4",children:[(0,o.jsx)("h3",{children:"Account model"}),(0,o.jsxs)("div",{className:"text--left",children:[(0,o.jsxs)("p",{children:["The protocol has named accounts (similar to Ethereum Name Service) built in. Named accounts behave similar to internet DNS, in that the owner of ",(0,o.jsx)("code",{children:"example.near"})," can create ",(0,o.jsx)("code",{children:"my_app-123.example.near"}),", and it can be initialized with any public key."]}),(0,o.jsx)("p",{children:"Implicit accounts are the only other type of account, and they are the most minimal entity necessary, and do not have a slot for a smart contract. Implicit account names look like common 0x addresses across ecosystems."})]})]}),(0,o.jsxs)("div",{className:"col col--4",children:[(0,o.jsx)("h3",{children:"Account key pairs"}),(0,o.jsxs)("div",{className:"text--left",children:[(0,o.jsxs)("p",{children:["Both ",(0,o.jsx)("code",{children:"secp256k1"})," and ",(0,o.jsx)("code",{children:"ed25519"})," key pair types are supported. The former is used by Ethereum, and the latter by Solana. Each named account can have multiple keys, of either curve type. Among other things, this means key rotation is built into the protocol."]}),(0,o.jsx)("p",{children:"A key pair type is used to sign transactions, and there are two kinds:"}),(0,o.jsxs)("ul",{children:[(0,o.jsxs)("li",{children:[(0,o.jsx)("strong",{children:"Full access"})," key: authorized to execute any of the NEAR actions. (FunctionCall, CreateAccount, RemoveKey, etc.)"]}),(0,o.jsxs)("li",{children:[(0,o.jsx)("strong",{children:"Limited access"})," key: authorized to only use the ",(0,o.jsx)("code",{children:"FunctionCall"})," Action, without the ability to attach a deposit. These access keys can be scoped to include all contract method calls, or limited to a subset. Upon creation, they can be given an ",(0,o.jsx)("code",{children:"allowance"})," of NEAR, that can only be consumed via function-call execution, calculated by the gas price at the time."]})]})]})]})]})]})})}function p(){const{siteConfig:e}=(0,n.A)();return(0,o.jsxs)(c.A,{title:`Hello from ${e.title}`,description:"Description will go into a meta tag in <head />",children:[(0,o.jsx)(m,{}),(0,o.jsx)("main",{children:(0,o.jsx)(h,{})})]})}},6448:(e,t,s)=>{s.d(t,{A:()=>a});const a=s.p+"assets/images/protocol-3cf591219be4b31431c66bbe5d37e98a.png"},8124:(e,t,s)=>{s.d(t,{A:()=>a});const a=s.p+"assets/images/brief-examples-29a3195ffcc8048cea45bd8e0090bc6f.png"}}]);