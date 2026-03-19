// ============================================================
//  DAWNQUIZ
//  Dawn Internet Ecosystem — Educational Web3 Quiz Game
//  Clean modular React with hooks + localStorage persistence
// ============================================================

import { useState, useEffect, useReducer, useCallback, useRef, useMemo } from "react";
// Supabase tournament module — optional, works without it
import {
  supabaseEnabled, createTournament, getTournamentByCode,
  getActiveTournaments, getAllTournaments, submitEntry,
  getLeaderboard, getMyBest, buildTournamentUrl, genTournamentCode,
} from "./supabase.js";

// ─────────────────────────────────────────────────────────────
//  CONSTANTS & STATIC DATA
// ─────────────────────────────────────────────────────────────

export const RANKS = [
  { level:1,  name:"Beginner",            threshold:0,   color:"#6b7280", accent:"#9ca3af", icon:"◎" },
  { level:2,  name:"Trailblazer",          threshold:4,   color:"#059669", accent:"#34d399", icon:"◈" },
  { level:3,  name:"Beacon",               threshold:10,  color:"#2563eb", accent:"#60a5fa", icon:"✦" },
  { level:4,  name:"Architect",            threshold:20,  color:"#7c3aed", accent:"#a78bfa", icon:"⬡" },
  { level:5,  name:"Luminary",             threshold:35,  color:"#d97706", accent:"#fbbf24", icon:"✺" },
  { level:6,  name:"Keeper of the Flames", threshold:55,  color:"#ea580c", accent:"#fb923c", icon:"⚘" },
  { level:7,  name:"Solar Sentinel",       threshold:80,  color:"#dc2626", accent:"#f87171", icon:"⊕" },
  { level:8,  name:"Ascendant",            threshold:110, color:"#be185d", accent:"#f472b6", icon:"⋆" },
  { level:9,  name:"BlackBox Holder",      threshold:140, color:"#5b21b6", accent:"#8b5cf6", icon:"◼" },
  { level:10, name:"Deployer",             threshold:180, color:"#b45309", accent:"#fbbf24", icon:"☀" },
];

export const DIFF_COLOR = { beginner:"#34d399", intermediate:"#fbbf24", expert:"#f87171" };

// ─── QUESTION BANK ────────────────────────────────────────────
const BEGINNER_QS = [
  { id:"b1",  diff:"beginner", question:"What is Dawn Internet?", options:["A peer-to-peer social media network built on Ethereum","A decentralized internet protocol and bandwidth-sharing ecosystem","A subscription VPN service with privacy-first routing","A cloud gaming platform with distributed render nodes"], correct:1, hint:"Think about what problem Dawn solves for internet access.", explanation:"Dawn is a decentralized internet protocol enabling users to contribute bandwidth and computing power to build a more open, permissionless internet." },
  { id:"b2",  diff:"beginner", question:"What does 'decentralized internet' mean?", options:["Internet infrastructure owned and managed by a single tech giant","Internet distributed across many nodes with no single controlling authority","Internet accessible only through government-approved service providers","A private fiber network shared between partner organizations"], correct:1, hint:"Decentralization means no single point of control.", explanation:"Decentralized internet distributes control and data across many independent nodes rather than relying on central servers owned by corporations." },
  { id:"b3",  diff:"beginner", question:"What is a 'node' in the Dawn network?", options:["A routing algorithm used to optimize bandwidth delivery","A participant device contributing resources to the network","A smart contract handling reward distribution on-chain","A browser extension that monitors network performance"], correct:1, hint:"Nodes are the building blocks of any decentralized network.", explanation:"A node is any device or service that contributes bandwidth, storage, or compute to the Dawn network, strengthening its decentralization." },
  { id:"b4",  diff:"beginner", question:"What are 'Sunrays' in the Dawn ecosystem?", options:["A liquid staking token redeemable for network bandwidth","Reward points earned through active participation in the ecosystem","An on-chain governance token used to vote on protocol upgrades","A unit of measurement for network latency across nodes"], correct:1, hint:"Sunrays reflect your contribution and progress in Dawn.", explanation:"Sunrays are reputation/reward points earned by completing quizzes, modules, and daily activities within the Dawn ecosystem." },
  { id:"b5",  diff:"beginner", question:"Which best describes 'bandwidth contribution'?", options:["Paying a monthly fee to access the Dawn protocol network","Sharing your unused internet capacity with the network","Staking tokens as collateral to earn validator rewards","Writing and deploying smart contracts on the Dawn chain"], correct:1, hint:"You're sharing something your device already has.", explanation:"Bandwidth contribution means lending your device's unused internet capacity to help power the decentralized Dawn network infrastructure." },
  { id:"b6",  diff:"beginner", question:"Why is a decentralized internet better for users than a centralized one?", options:["It always provides faster speeds regardless of network conditions","No single entity can censor, block, or control your access to it","It eliminates the need for any hardware investment by end users","It guarantees lower monthly costs compared to traditional ISPs"], correct:1, hint:"Think about who has control in each model.", explanation:"Decentralization removes single points of failure and control. No corporation or government can unilaterally cut off your access or censor content." },
  { id:"b7",  diff:"beginner", question:"What does 'permissionless' mean in the context of Web3?", options:["Users can access the network without paying any transaction fees","Anyone can participate without needing approval from a gatekeeper","Developers can deploy contracts without undergoing a security audit","All network data is publicly readable without authentication"], correct:1, hint:"Permission implies needing someone else's approval.", explanation:"Permissionless means anyone with an internet connection can participate — run a node, build on the protocol, or contribute — without requiring approval from any central authority." },
  { id:"b8",  diff:"beginner", question:"What problem does Dawn solve that traditional ISPs cannot?", options:["Slow peak-hour speeds caused by neighborhood network congestion","Centralized control and single points of censorship and data exploitation","High hardware costs that prevent users from running home servers","Limited video streaming quality on older copper cable infrastructure"], correct:1, hint:"ISPs are centralized — what's the core weakness of that?", explanation:"Traditional ISPs are centralized chokepoints that can throttle, block, or sell user data. Dawn distributes this function across the community, removing the single point of control." },
  { id:"b9",  diff:"beginner", question:"What does 'DePIN' stand for?", options:["Decentralized Protocol for Incentivized Node-operators","Decentralized Physical Infrastructure Network","Distributed Private Internet with Native token rewards","Delegated Proof of Infrastructure Node consensus"], correct:1, hint:"It involves real-world physical infrastructure.", explanation:"DePIN stands for Decentralized Physical Infrastructure Network — protocols that incentivize communities to build and own real-world infrastructure like wireless networks, storage, and bandwidth." },
  { id:"b10", diff:"beginner", question:"How does Dawn differ from a traditional VPN?", options:["Dawn encrypts all traffic end-to-end unlike most VPN providers","Dawn decentralizes the network itself rather than routing through a private server","Dawn offers faster speeds by compressing traffic before transmission","Dawn requires no software installation and runs in any web browser"], correct:1, hint:"A VPN reroutes traffic; Dawn replaces the underlying infrastructure.", explanation:"A VPN routes traffic through a private server, still controlled centrally. Dawn replaces the infrastructure itself with a community-owned decentralized network, removing central control entirely." },
  { id:"b11", diff:"beginner", question:"What is a blockchain in simple terms?", options:["A high-speed distributed database optimized for financial transactions","A shared, tamper-resistant ledger of records maintained by many computers","A cryptographic protocol for securing peer-to-peer communications","A type of consensus algorithm used in proof-of-stake networks"], correct:1, hint:"Think of a shared notebook that no one can erase.", explanation:"A blockchain is a distributed ledger replicated across many computers. Entries are cryptographically linked in sequence, making it extremely difficult to alter past records without network consensus." },
  { id:"b12", diff:"beginner", question:"What does it mean for a network to be 'trustless'?", options:["All participants are verified through a rigorous KYC identity process","Participants don't need to trust each other — the protocol enforces rules automatically","The network operates without any financial incentives for validators","Only read-only access is permitted until identity is established"], correct:1, hint:"Trust is replaced by code and cryptography.", explanation:"Trustless means the protocol's rules are enforced by code and cryptographic proofs, so participants don't need to trust each other or a central party — the system itself guarantees correct behaviour." },
  { id:"b13", diff:"beginner", question:"What is a 'wallet' in the Web3 context?", options:["A mobile app for tracking portfolio value across multiple exchanges","A software or hardware tool that stores cryptographic keys and manages digital assets","A smart contract that holds funds under multi-signature governance","A hardware device that mines tokens using dedicated processing chips"], correct:1, hint:"It holds keys, not coins.", explanation:"A Web3 wallet stores private and public cryptographic keys, allowing users to sign transactions, interact with protocols, and control their digital assets without relying on a bank." },
  { id:"b14", diff:"beginner", question:"Why do decentralized networks need token incentives?", options:["To fund the core team's ongoing development and marketing expenses","To motivate participants to contribute resources when there is no central employer paying them","To comply with financial regulations in jurisdictions that require licensed operators","To limit participation to users who have demonstrated long-term commitment"], correct:1, hint:"Who pays the people running the infrastructure if there's no company?", explanation:"Token incentives replace the employer-employee relationship. They reward node operators economically for contributing bandwidth, storage, or compute — making self-sustaining decentralized infrastructure economically viable." },
  { id:"b15", diff:"beginner", question:"What is the primary role of a node operator in Dawn?", options:["Auditing smart contracts and reporting vulnerabilities to the core team","Contributing bandwidth and maintaining network infrastructure in exchange for rewards","Managing the governance treasury and executing approved protocol upgrades","Developing and maintaining the open-source codebase for the Dawn protocol"], correct:1, hint:"Operators provide the physical layer of the network.", explanation:"Node operators contribute their device's bandwidth and uptime to the Dawn network. In return they earn rewards, collectively forming the decentralized infrastructure that replaces centralized ISPs." },
  { id:"b16", diff:"beginner", question:"What is 'uptime' and why does it matter for Dawn nodes?", options:["The maximum bandwidth speed a node can sustain during peak traffic hours","The percentage of time a node is online and available; higher uptime earns more rewards","The geographic coverage area a node can serve based on its physical location","The number of simultaneous connections a node can handle without packet loss"], correct:1, hint:"If a node is offline, it can't contribute.", explanation:"Uptime measures how consistently a node is online and serving the network. Higher uptime means more consistent bandwidth contribution, which translates directly to higher rewards in Dawn's incentive system." },
  { id:"b17", diff:"beginner", question:"What does 'open-source' mean in the context of a protocol?", options:["The protocol is free to use but closed to external developer contributions","Anyone can read, audit, fork, and contribute to the codebase publicly","The software is available for download but requires a commercial license for production","All protocol fees are redistributed to developers who submit pull requests"], correct:1, hint:"Open source means transparent, auditable, and community-editable.", explanation:"Open-source protocols publish their code publicly, allowing anyone to audit it for security issues, build on top of it, or fork it. This transparency is fundamental to trust in decentralized systems." },
  { id:"b18", diff:"beginner", question:"What is 'bandwidth' in networking terms?", options:["The physical distance data can travel before signal degradation occurs","The maximum data transfer rate a connection supports, measured in Mbps or Gbps","The encryption overhead added to each packet during secure transmission","The number of unique IP addresses a network can assign simultaneously"], correct:1, hint:"Think of it as the capacity of a pipe.", explanation:"Bandwidth is the maximum rate at which data can be transmitted over a network connection, typically measured in Mbps or Gbps. More bandwidth means more data can flow simultaneously." },
  { id:"b19", diff:"beginner", question:"Why is censorship resistance important for internet infrastructure?", options:["It allows content platforms to avoid copyright enforcement obligations","It ensures no single authority can block access to information or communication","It improves packet routing efficiency across international network boundaries","It reduces infrastructure costs by eliminating redundant compliance systems"], correct:1, hint:"Who benefits when no one controls the off switch?", explanation:"Censorship resistance ensures that information, services, and communication cannot be unilaterally blocked by governments, corporations, or bad actors — a fundamental property of truly open internet infrastructure." },
  { id:"b20", diff:"beginner", question:"What is a 'smart contract'?", options:["A legal agreement between two parties encoded in natural language and stored on-chain","Self-executing code on a blockchain that automatically enforces agreed terms","A cryptographic signature scheme used to authenticate protocol participants","A multi-party escrow service operated by a regulated financial institution"], correct:1, hint:"It executes itself when conditions are met.", explanation:"Smart contracts are programs deployed on a blockchain that automatically execute when predetermined conditions are met, removing the need for intermediaries to enforce agreements." },
  { id:"b21", diff:"beginner", question:"Which of the following best describes 'Web3'?", options:["A faster broadband standard developed by the IEEE networking committee","A vision for a decentralized internet where users own their data and identity","A Google initiative for making web pages load faster on mobile devices","The third major revision of the HTTP protocol with improved security headers"], correct:1, hint:"Web3 is about ownership and decentralization.", explanation:"Web3 refers to the next evolution of the internet built on blockchain technology, emphasizing user ownership of data, decentralized applications, and reducing reliance on centralized platforms." },
  { id:"b22", diff:"beginner", question:"What is a 'private key' in cryptography?", options:["A symmetric encryption key shared between two parties for secure communication","A secret number that proves ownership and authorizes transactions — never to be shared","A hardware token used alongside a password for two-factor authentication","A certificate issued by a trusted authority to verify a server's identity"], correct:1, hint:"If someone has this, they control your assets.", explanation:"A private key is a secret cryptographic number that gives its holder control over associated digital assets. Sharing it is equivalent to handing over ownership — it should never be disclosed to anyone." },
  { id:"b23", diff:"beginner", question:"What does 'staking' mean in a blockchain network?", options:["Purchasing tokens on a centralized exchange to support a project's liquidity","Locking up tokens as collateral to participate in network validation or earn rewards","Delegating your voting rights to an elected representative in a DAO governance system","Providing liquidity to a decentralized exchange pool to earn trading fees"], correct:1, hint:"You lock tokens to show commitment to the network.", explanation:"Staking means locking up tokens as collateral to participate in network functions like validation or governance. It aligns participants' economic interests with network health, since misbehaviour risks losing staked tokens." },
  { id:"b24", diff:"beginner", question:"Why might a user prefer Dawn over a centralized ISP?", options:["Dawn provides higher guaranteed speeds during peak evening usage hours","Dawn removes the single corporate entity that controls, throttles, or monetizes your connection","Dawn offers a cheaper monthly subscription with better customer support","Dawn is fully compatible with all existing routers and requires no hardware changes"], correct:1, hint:"Think about control and censorship.", explanation:"Dawn removes the centralized ISP as a gatekeeper that can throttle connections, sell browsing data, or comply with government censorship orders. The network is owned and operated by its community instead." },
  { id:"b25", diff:"beginner", question:"What is 'latency' in simple terms?", options:["The total cost of bandwidth consumed during a data transfer session","The time it takes for data to travel from sender to receiver across the network","The rate at which packets are dropped during periods of network congestion","The encryption delay introduced by TLS handshakes on secure connections"], correct:1, hint:"Think of it as the network's reaction time.", explanation:"Latency is the delay between sending a request and receiving a response. Lower latency means faster, more responsive connections — critical for real-time applications like video calls and gaming." },
  { id:"b26", diff:"beginner", question:"What makes a network 'resilient'?", options:["Having a single powerful server with redundant power supply and cooling","Distributing functions across many nodes so failure of one doesn't bring down the whole network","Using the latest TLS encryption standards to protect against man-in-the-middle attacks","Requiring all participants to maintain identical hardware specifications"], correct:1, hint:"No single point of failure is the key principle.", explanation:"Network resilience comes from distributing functions across many independent nodes. If one fails, traffic reroutes through others. Centralized networks have single points of failure that decentralized ones avoid by design." },
  { id:"b27", diff:"beginner", question:"What is the role of cryptography in decentralized networks?", options:["To compress network traffic and reduce latency for end users worldwide","To mathematically prove identity, ownership, and data integrity without trusting a third party","To prevent ISPs from throttling traffic by obscuring packet metadata","To speed up consensus by reducing the overhead of validator communication"], correct:1, hint:"Cryptography replaces the need to trust institutions.", explanation:"Cryptography provides mathematical guarantees that underpin trustless systems: proving who sent a transaction, ensuring data hasn't been tampered with, and securing communications — all without relying on a trusted intermediary." },
  { id:"b28", diff:"beginner", question:"What is a 'public key' in cryptography?", options:["A master password used to decrypt all messages in an encrypted conversation","An address others use to send assets or verify your signatures — safe to share publicly","A certificate issued by a certificate authority confirming your real-world identity","A shared secret key generated during a Diffie-Hellman key exchange process"], correct:1, hint:"It's like your account number — shareable but not spendable.", explanation:"A public key is the shareable half of your cryptographic key pair. Others use it to send you assets or verify messages you've signed. Unlike your private key, sharing your public key carries no security risk." },
  { id:"b29", diff:"beginner", question:"What happens to internet access in a centralized system when the controlling company shuts down?", options:["Users are automatically migrated to the next largest provider without interruption","Access fails for all users dependent on that provider simultaneously","A community-run backup system activates to maintain partial connectivity","Traffic reroutes through government infrastructure until a replacement is found"], correct:1, hint:"Single point of failure = single point of shutdown.", explanation:"Centralized systems have a single point of failure. If the controlling entity shuts down, goes bankrupt, or is seized, all dependent users lose access simultaneously. Decentralized systems avoid this by design." },
  { id:"b30", diff:"beginner", question:"What does 'peer-to-peer' (P2P) mean in networking?", options:["A network architecture where clients connect through a load-balanced server cluster","Devices that communicate directly with each other without a central intermediary","A billing arrangement where two ISPs exchange traffic at equal cost","A protocol that prioritizes real-time traffic over background data transfers"], correct:1, hint:"Peers interact directly — no middleman.", explanation:"Peer-to-peer networking allows devices to communicate and share resources directly without routing through a central server. This is foundational to decentralized systems like Dawn, BitTorrent, and Bitcoin." },
  { id:"b31", diff:"beginner", question:"Why can't a government easily shut down a well-designed decentralized network?", options:["Decentralized networks operate under international maritime law beyond jurisdiction","There is no central server or company to seize — it runs across thousands of independent nodes worldwide","All traffic is encrypted with quantum-resistant algorithms that bypass legal interception","The network automatically relocates its core infrastructure to friendly jurisdictions"], correct:1, hint:"What would a government even target?", explanation:"Without a central company, office, or server to seize or order offline, shutting down a decentralized network would require simultaneously stopping thousands of independent nodes worldwide — practically infeasible." },
  { id:"b32", diff:"beginner", question:"What does 'token economics' (tokenomics) study?", options:["Historical price movements and trading volume of cryptocurrency assets","How a token's supply, distribution, incentives, and utility sustain a network","Technical specifications of the blockchain's consensus and finality mechanisms","Tax implications of earning and trading tokens in various global jurisdictions"], correct:1, hint:"It's about designing incentives, not just coin prices.", explanation:"Tokenomics studies how a token's supply, emission schedule, distribution, and utility create the incentive structures that sustain network participation — essentially the economic engine of a decentralized protocol." },
  { id:"b33", diff:"beginner", question:"What is a 'gas fee' in blockchain terms?", options:["A monthly maintenance charge paid to the blockchain's founding organization","A small payment to compensate network validators for processing a transaction","An optional tip given to validators to prioritize your transaction in the mempool","A penalty charged when a smart contract execution fails due to insufficient funds"], correct:1, hint:"Someone has to pay the computers doing the work.", explanation:"Gas fees compensate the validators or miners who process and verify transactions on a blockchain. They prevent spam by making every operation have a cost and incentivize validators to maintain the network." },
  { id:"b34", diff:"beginner", question:"What is the significance of Dawn having a mobile-first approach?", options:["Mobile devices have more processing power than laptops for running nodes","Most people in the world access the internet via mobile, making mobile nodes critical for global reach","Mobile apps are significantly cheaper to develop than desktop applications","Mobile networks have higher bandwidth capacity than fixed-line broadband globally"], correct:1, hint:"Global internet access is predominantly mobile.", explanation:"The majority of internet users globally — especially in emerging markets — access the web via mobile devices. A mobile-first approach makes Dawn's decentralized infrastructure accessible to the broadest possible contributor and user base." },
  { id:"b35", diff:"beginner", question:"What is 'consensus' in a blockchain network?", options:["A legal agreement signed by all founding validators before the network launches","The mechanism by which all nodes agree on the current valid state of the ledger","A governance vote requiring a two-thirds supermajority to approve protocol changes","The process of cryptographically signing each block before it is broadcast to peers"], correct:1, hint:"All nodes need to agree on what the truth is.", explanation:"Consensus mechanisms allow independent, distributed nodes to agree on the current valid state of the blockchain without needing a central authority. Examples include Proof of Work, Proof of Stake, and Proof of Bandwidth." },
  { id:"b36", diff:"beginner", question:"What does 'data sovereignty' mean for internet users?", options:["All user data must be stored in servers physically located in the user's home country","Users have full ownership and control over their own data and who accesses it","Governments have the right to audit any data passing through their national infrastructure","Data can only be processed by companies that hold a recognized data protection license"], correct:1, hint:"Sovereignty means control over something that's yours.", explanation:"Data sovereignty means individuals control their own data — where it's stored, who accesses it, and how it's used. Centralized platforms routinely harvest and monetize user data; decentralized alternatives aim to return that control to users." },
  { id:"b37", diff:"beginner", question:"What does it mean to 'run a node' for a network like Dawn?", options:["Purchase and hold the protocol's native token to support its market valuation","Install and operate software or hardware that contributes resources to the decentralized network","Become a paid contractor responsible for monitoring network uptime and reliability","Submit code contributions to the open-source repository on a regular basis"], correct:1, hint:"Nodes are the physical participants in the network.", explanation:"Running a node means operating hardware or software that actively participates in the Dawn network by contributing bandwidth, relaying traffic, and helping maintain network connectivity — the physical backbone of decentralization." },
  { id:"b38", diff:"beginner", question:"What is an 'airdrop' in the Web3 context?", options:["A physical courier service delivering hardware wallets to early protocol investors","The distribution of free tokens to eligible wallet addresses, often to reward early participants","A governance mechanism used to distribute newly minted tokens to active validators","A cross-chain bridge transfer that moves assets between two compatible blockchains"], correct:1, hint:"Free tokens dropped into qualifying wallets.", explanation:"An airdrop is when a project distributes tokens for free to specific wallet addresses — often to reward early community members, node operators, or to bootstrap a new network's user base." },
  { id:"b39", diff:"beginner", question:"Why is open participation important for decentralized infrastructure?", options:["It reduces the legal liability of the founding team by distributing responsibility broadly","Anyone can contribute resources and earn rewards, making the network more robust and censorship-resistant","It ensures the network never needs to raise external capital from institutional investors","It guarantees that all participants receive equal rewards regardless of their contribution size"], correct:1, hint:"The more independent contributors, the harder to control or shut down.", explanation:"Open participation means anyone can join the network as a contributor without permission. This distributes power across many independent operators, increasing resilience and making it far harder for any single party to capture or censor the network." },
  { id:"b40", diff:"beginner", question:"What does 'decentralization' protect against in internet infrastructure?", options:["Slow loading speeds caused by geographic distance between users and servers","Single points of failure, censorship, and monopolistic control over network access","High electricity consumption from running always-on infrastructure at scale","The risk of intellectual property theft on open-source protocol codebases"], correct:1, hint:"Think about what a central controller could do with their power.", explanation:"Decentralization protects against censorship (no one controls the off switch), monopolistic pricing (no single provider), single points of failure (network survives node losses), and data exploitation (no central harvester)." },
  { id:"b41", diff:"beginner", question:"What is 'immutability' in blockchain?", options:["The ability to quickly update smart contract code after a security vulnerability is found","Once data is written to the blockchain, it cannot be altered or deleted by anyone","All stored data is automatically encrypted so only authorized parties can read it","Transactions are confirmed within a fixed maximum time regardless of network load"], correct:1, hint:"Immutable means it can't be changed.", explanation:"Immutability means data recorded on a blockchain is permanently stored and cannot be altered or deleted after sufficient confirmations. This property ensures historical integrity and prevents fraud or record manipulation." },
  { id:"b42", diff:"beginner", question:"What is the difference between a 'token' and a 'coin' in crypto?", options:["Coins have fixed supply; tokens have programmable supply curves controlled by DAOs","Coins operate on their own native blockchain; tokens are built on top of an existing blockchain","Tokens are only used for governance; coins are only used for paying transaction fees","Coins require proof-of-work mining; tokens are always issued via proof-of-stake consensus"], correct:1, hint:"Native vs. built on top of another chain.", explanation:"A coin (like Bitcoin or Ether) is the native currency of its own blockchain. A token is built on an existing blockchain using smart contracts (like ERC-20 tokens on Ethereum) and relies on that chain's infrastructure." },
  { id:"b43", diff:"beginner", question:"Why does the Dawn network get stronger as more nodes join?", options:["More nodes vote in governance decisions, making protocol upgrades faster to approve","Each additional node adds more bandwidth capacity, redundancy, and geographic coverage","More nodes increase token scarcity by consuming rewards faster than they are emitted","Additional nodes improve block finality speed by reducing validator communication overhead"], correct:1, hint:"More contributors = more capacity and resilience.", explanation:"Network effects mean each additional node adds bandwidth, creates routing redundancy, and extends geographic coverage. A larger node network is faster, more resilient, harder to censor, and more valuable to users." },
  { id:"b44", diff:"beginner", question:"What does 'governance' mean in a decentralized protocol?", options:["The legal framework established by regulators to oversee blockchain-based businesses","The mechanisms by which token holders collectively vote on changes to the protocol","A committee of core developers who review and approve all proposed code changes","A set of automated rules that execute protocol upgrades without any human input"], correct:1, hint:"Governance = who decides the rules.", explanation:"In decentralized protocols, governance refers to the system by which stakeholders — typically token holders — propose and vote on changes to the protocol, treasury spending, or network rules, replacing decisions made by a central company." },
  { id:"b45", diff:"beginner", question:"What is 'interoperability' in the context of blockchain networks?", options:["The ability for any device to run a node regardless of its operating system","The ability of different blockchains to communicate and share assets with each other","A standard that ensures all wallets display token balances in the same format","The capacity for a blockchain to process transactions from multiple programming languages"], correct:1, hint:"Can different chains talk to each other?", explanation:"Interoperability refers to the ability of different blockchain networks to exchange data and assets. It enables users and protocols to interact across chains without centralized bridges being the sole connection point." },
  { id:"b46", diff:"beginner", question:"What is the purpose of a 'whitepaper' in crypto and Web3?", options:["A government-issued regulatory framework defining legal standards for token issuers","A technical document explaining a project's purpose, design, and token economics","A marketing prospectus designed to attract retail investors to a token sale","An independent audit report assessing the security of a protocol's smart contracts"], correct:1, hint:"The founding technical document of a project.", explanation:"A whitepaper is a detailed technical document that explains a protocol's vision, architecture, tokenomics, and roadmap. It allows developers, investors, and users to understand and evaluate the project's design and legitimacy." },
  { id:"b47", diff:"beginner", question:"What does 'self-custody' mean in crypto?", options:["Using an insured institutional custodian to hold assets on your behalf for a fee","Controlling your own private keys rather than leaving assets with an exchange or third party","Setting up a multi-signature wallet that requires approval from two of your own devices","Storing a recovery phrase in a bank safety deposit box for secure offline backup"], correct:1, hint:"Not your keys, not your coins.", explanation:"Self-custody means you hold your own private keys and thus have direct control over your assets. Leaving crypto on an exchange means trusting a third party — if they're hacked or go bankrupt, your assets are at risk." },
  { id:"b48", diff:"beginner", question:"What is a 'block' in blockchain terminology?", options:["A security restriction that prevents unauthorized contracts from accessing stored state","A bundle of validated transactions grouped together and added to the chain in sequence","A fixed-size memory unit used by validators to cache frequently accessed state data","A cryptographic hash function that links each transaction to the previous one"], correct:1, hint:"Think of it as a page in the ledger.", explanation:"A block is a bundle of validated transactions that are cryptographically linked to the previous block, forming the 'chain'. Each block has a fixed capacity and is added to the chain at regular intervals by validators." },
  { id:"b49", diff:"beginner", question:"What does 'decentralized autonomous organisation' (DAO) mean?", options:["A corporation that uses AI to automate its internal decision-making processes","An organisation whose rules and governance are encoded in smart contracts run by token holders","A non-profit foundation that oversees the development of open-source blockchain protocols","A syndicate of anonymous developers who collectively maintain a protocol's codebase"], correct:1, hint:"Autonomous = self-running; decentralized = no single boss.", explanation:"A DAO is an organisation governed by smart contracts and community token holders rather than a traditional corporate structure. Rules are transparent and enforced on-chain, enabling coordination without trusting a central authority." },
  { id:"b50", diff:"beginner", question:"Why is geographic distribution of nodes important for Dawn's mission?", options:["It reduces the average latency for all users by placing nodes closer to data centers","It ensures network coverage and censorship resistance across regions so no government can sever access","It lowers the operational cost per node by spreading infrastructure expenses globally","It improves token price stability by distributing staking rewards across more participants"], correct:1, hint:"Coverage everywhere means censorship nowhere.", explanation:"Geographic distribution of nodes means the network has coverage across many regions and jurisdictions. No single government can sever the network by targeting nodes in one country, and users everywhere get low-latency access." },
];

const INTERMEDIATE_QS = [
  { id:"i1",  diff:"intermediate", question:"What is the BlackBox in the Dawn ecosystem?", options:["A privacy-preserving smart contract that shields node reward transactions","A specialized hardware node device engineered for high-performance deployment","A staking vault that locks tokens in exchange for enhanced reward multipliers","A decentralized storage module for archiving bandwidth contribution proofs"], correct:1, hint:"Think physical infrastructure for the network.", explanation:"The BlackBox is a dedicated hardware node engineered for optimal bandwidth contribution, enabling high-performance deployment on the Dawn network." },
  { id:"i2",  diff:"intermediate", question:"What is 'network economics' in a decentralized system?", options:["The total capital expenditure required to bootstrap a viable node network from scratch","The incentive structures and reward mechanisms that sustain participant contributions","The market capitalization dynamics of the protocol's native token over time","The cost-benefit analysis performed before deploying a new hardware node"], correct:1, hint:"Economics = incentives. What keeps participants contributing?", explanation:"Network economics refers to the system of incentives, tokenomics, and reward mechanisms that motivate participants to contribute resources and sustain network health." },
  { id:"i3",  diff:"intermediate", question:"Why is censorship resistance a core property of Dawn?", options:["It improves packet routing efficiency by removing redundant filtering layers","It ensures no entity can block or manipulate content or access on the network","It reduces the operating costs of nodes by eliminating compliance overhead","It simplifies the user onboarding experience by removing verification steps"], correct:1, hint:"Censorship resistance is about who controls the switch.", explanation:"Censorship resistance means no government, corporation, or bad actor can arbitrarily block, restrict, or manipulate access to the network or its content." },
  { id:"i4",  diff:"intermediate", question:"What distinguishes Dawn's bandwidth model from traditional cloud hosting?", options:["Dawn uses a proprietary satellite backbone instead of ground-based infrastructure","Bandwidth comes from a distributed community of contributors rather than centralized data centers","Dawn partners exclusively with renewable energy data centers for its infrastructure","Dawn's model eliminates latency by caching all content at the protocol layer"], correct:1, hint:"Community vs. corporate datacenter.", explanation:"Instead of renting bandwidth from corporate data centers, Dawn draws from a distributed community of node operators — making the network more resilient and censorship-resistant." },
  { id:"i5",  diff:"intermediate", question:"How does Proof-of-Bandwidth differ from Proof-of-Work?", options:["PoB uses the same SHA-256 hashing algorithm but applies it to network packets","PoB rewards useful internet resource sharing; PoW rewards computational puzzle-solving","PoB is significantly faster to verify but produces weaker security guarantees","PoB requires dedicated ASICs while PoW can run on commodity hardware"], correct:1, hint:"What resource is being proven and rewarded in each case?", explanation:"Proof-of-Work rewards miners for solving cryptographic puzzles (computationally wasteful). Proof-of-Bandwidth rewards nodes for providing verifiable, useful internet resources to the network." },
  { id:"i6",  diff:"intermediate", question:"What is an Automated Market Maker (AMM)?", options:["A trading bot operated by professional market makers on centralized exchanges","A smart contract that provides liquidity using a mathematical formula instead of an order book","An algorithm that automatically rebalances a portfolio based on predefined price targets","A protocol that matches buyers and sellers directly without any liquidity pool"], correct:1, hint:"It prices assets algorithmically — no order book needed.", explanation:"An AMM is a type of decentralized exchange protocol that uses a mathematical formula (like x*y=k) to price assets and provide liquidity automatically, without needing buyers and sellers to match orders directly." },
  { id:"i7",  diff:"intermediate", question:"What is 'impermanent loss' in DeFi liquidity provision?", options:["The permanent destruction of LP tokens when a liquidity pool is exploited by a flash loan","A temporary reduction in value experienced by LPs when asset prices diverge from deposit ratio","The fee collected by the protocol from liquidity providers on each swap transaction","A penalty applied to early withdrawals from locked liquidity positions"], correct:1, hint:"It's the difference between holding vs providing liquidity when prices move.", explanation:"Impermanent loss occurs when the price ratio of assets in a liquidity pool changes after deposit. LPs may have been better off simply holding the assets. The loss is 'impermanent' because it reverses if prices return to the original ratio." },
  { id:"i8",  diff:"intermediate", question:"What is 'yield farming' in DeFi?", options:["Staking a single governance token indefinitely to receive predictable fixed APY returns","Moving assets across DeFi protocols to maximize returns from interest, fees, and token rewards","Providing concentrated liquidity within a narrow price band on a v3 AMM protocol","Participating in IDOs to receive newly launched tokens at a discounted entry price"], correct:1, hint:"Optimize returns by actively managing positions across protocols.", explanation:"Yield farming involves strategically deploying assets across multiple DeFi protocols to maximize returns by capturing interest, liquidity fees, and token incentive rewards simultaneously." },
  { id:"i9",  diff:"intermediate", question:"What is a 'liquidity pool'?", options:["A venture capital fund that allocates capital to early-stage DeFi projects","A smart contract holding pairs of tokens that enable decentralized trading and earn fees for depositors","A treasury controlled by a DAO that holds reserves for protocol development spending","A pool of validators that collectively sign transactions to reach consensus"], correct:1, hint:"It enables trading without a traditional order book.", explanation:"A liquidity pool is a smart contract that holds reserves of two or more tokens. Traders swap against the pool, and liquidity providers deposit tokens to earn a share of trading fees proportional to their contribution." },
  { id:"i10", diff:"intermediate", question:"What does 'TVL' (Total Value Locked) measure in DeFi?", options:["The total number of unique wallets that have interacted with a DeFi protocol","The total value of assets deposited into DeFi protocols as liquidity or collateral","The total market capitalization of all governance tokens across the DeFi ecosystem","The cumulative trading volume processed by a decentralized exchange in one month"], correct:1, hint:"It measures assets committed to protocols, not circulating supply.", explanation:"TVL measures the total dollar value of assets that users have deposited into DeFi protocols — including lending platforms, liquidity pools, and staking contracts. It's used as a proxy for a protocol's adoption and health." },
  { id:"i11", diff:"intermediate", question:"What is an NFT and what makes it unique?", options:["A governance token that grants weighted voting rights proportional to holding duration","A non-fungible token — each is cryptographically distinct and not interchangeable","A cross-chain wrapped asset that represents a token from a different blockchain","A type of synthetic asset that tracks the price of a real-world commodity"], correct:1, hint:"Non-fungible means each token is one-of-a-kind.", explanation:"An NFT (Non-Fungible Token) is a blockchain-based token where each instance has a unique identifier, making it distinct from all others. Unlike currencies, one NFT cannot be substituted for another — they represent unique ownership." },
  { id:"i12", diff:"intermediate", question:"What is a Layer 2 blockchain solution?", options:["A secondary consensus layer that provides additional finality guarantees to validators","A protocol built on top of a base chain that processes transactions off-chain to reduce fees","A sidechain that operates independently but uses the same token as the main network","A second copy of the blockchain maintained by a separate set of archive nodes"], correct:1, hint:"It offloads work from the main chain without sacrificing security.", explanation:"Layer 2 solutions (like Optimism, Arbitrum, Lightning Network) process transactions off the main blockchain and periodically settle on it. This dramatically reduces fees and increases throughput while inheriting the security of the base layer." },
  { id:"i13", diff:"intermediate", question:"What is a 'bridge' in blockchain?", options:["A governance mechanism connecting two DAOs for coordinated protocol upgrades","A protocol enabling assets or data to move between two different blockchains","A validator set that coordinates cross-chain MEV extraction opportunities","A liquidity aggregator that routes swaps across multiple chains simultaneously"], correct:1, hint:"Think cross-chain asset transfer.", explanation:"A bridge is a protocol that enables users to move tokens or data between different blockchains. It typically locks assets on one chain and mints equivalent tokens on another, enabling cross-chain interoperability." },
  { id:"i14", diff:"intermediate", question:"What is an 'oracle' in blockchain?", options:["A consensus mechanism that uses historical data to predict future validator behaviour","A service that brings real-world external data onto the blockchain in a verifiable way","A governance role granted to long-term token holders with a proven track record","A specialized node that validates zero-knowledge proofs for rollup settlement"], correct:1, hint:"Blockchains can't access the internet — oracles bridge that gap.", explanation:"Blockchain oracles supply smart contracts with external real-world data (price feeds, weather, sports scores). Without them, smart contracts are isolated from the outside world. Oracles are critical infrastructure but also potential attack vectors." },
  { id:"i15", diff:"intermediate", question:"What is 'slippage' in decentralized trading?", options:["A fee charged by the protocol for trades that exceed a daily volume threshold","The difference between the expected trade price and the actual execution price due to low liquidity","A type of MEV attack where validators reorder transactions to extract value","The latency between order submission and on-chain confirmation during congestion"], correct:1, hint:"Large orders in small pools move the price.", explanation:"Slippage occurs when a trade executes at a different price than expected. In AMMs, larger trades relative to pool size move the price more, causing slippage. It's especially significant in low-liquidity pools." },
  { id:"i16", diff:"intermediate", question:"What is 'staking' in a Proof-of-Stake network?", options:["Providing tokens as liquidity to a DEX pool to earn a share of trading fees","Locking tokens as collateral to participate in block validation and earn staking rewards","Delegating your tokens to a yield optimizer that auto-compounds across multiple pools","Purchasing tokens and holding them long-term without participating in governance"], correct:1, hint:"Validators put skin in the game to earn rewards.", explanation:"In PoS networks, validators stake (lock) tokens as collateral to gain the right to validate blocks and earn staking rewards. If they behave dishonestly, their stake can be 'slashed' — an economic disincentive for misbehaviour." },
  { id:"i17", diff:"intermediate", question:"What is 'slashing' in Proof-of-Stake?", options:["A fee applied to validators who claim rewards before the minimum staking period ends","A penalty that destroys a portion of a validator's staked tokens for provably malicious behaviour","A governance action that removes a validator from the active set by community vote","A mechanism that reduces token emissions when the network reaches a certain size"], correct:1, hint:"It's the punishment for validators who cheat.", explanation:"Slashing is a PoS mechanism that penalizes validators who violate protocol rules (e.g., signing conflicting blocks) by destroying a percentage of their staked tokens. It makes attacks economically costly." },
  { id:"i18", diff:"intermediate", question:"What is the significance of a 'halving' event in Bitcoin?", options:["Every four years, Bitcoin's transaction fee structure is repriced by miner consensus","The block reward paid to miners is cut in half, reducing the rate of new Bitcoin issuance","Bitcoin's maximum supply is recalculated and reduced by half of the remaining unmined supply","The difficulty adjustment algorithm doubles the mining difficulty to maintain block times"], correct:1, hint:"Supply shock — new issuance drops.", explanation:"A Bitcoin halving reduces the block reward by 50% approximately every four years. This programmatically decreases the rate of new Bitcoin entering supply, a mechanism designed to enforce Bitcoin's fixed 21M supply cap." },
  { id:"i19", diff:"intermediate", question:"What is 'Proof of Stake' consensus?", options:["Validators prove their identity using government-issued credentials stored on-chain","Validators are chosen to create blocks based on the amount of tokens they stake as collateral","Validators are selected based on their node's historical uptime and reputation score","A lottery system that randomly selects validators regardless of their stake size"], correct:1, hint:"Validators are selected proportional to their economic commitment.", explanation:"In Proof of Stake, validators lock tokens as collateral and are probabilistically selected to propose and vote on blocks proportional to their stake. It's energy-efficient compared to Proof of Work and aligns validators' economic interests with network security." },
  { id:"i20", diff:"intermediate", question:"What is 'MEV' (Maximal Extractable Value)?", options:["The maximum annual percentage yield a validator can earn through staking rewards","The profit miners or validators extract by reordering, inserting, or censoring transactions in blocks","The highest price a token has reached during a given validator's staking period","The total value of transactions a block producer can include before hitting the gas limit"], correct:1, hint:"Block producers have power over transaction order — MEV exploits it.", explanation:"MEV is the value block producers extract beyond standard fees by strategically reordering transactions, front-running trades, or inserting their own transactions. It's a significant and controversial aspect of blockchain economics." },
  { id:"i21", diff:"intermediate", question:"What is a 'rug pull' in DeFi?", options:["A governance attack where a whale votes to drain the protocol treasury legally","When project developers drain a liquidity pool or abandon a project, stealing investors' funds","A smart contract bug that causes funds to be locked permanently without recovery","A coordinated short-selling campaign targeting a DeFi token's liquidity pool"], correct:1, hint:"The rug is pulled from under investors' feet.", explanation:"A rug pull occurs when developers of a DeFi project suddenly withdraw all liquidity or sell their token allocation, crashing the price and leaving investors with worthless assets. It's a common form of DeFi fraud." },
  { id:"i22", diff:"intermediate", question:"What is 'governance token' utility?", options:["Tokens that are burned on each transaction to create deflationary supply pressure","Tokens that grant holders the right to vote on protocol changes, treasury spending, and upgrades","Tokens that are staked exclusively to earn a share of protocol revenue streams","Tokens that represent fractional ownership of the protocol's physical infrastructure"], correct:1, hint:"Governance tokens are voting rights.", explanation:"Governance tokens give holders the right to propose and vote on protocol changes — fee structures, treasury allocation, parameter adjustments, or upgrades. They represent ownership of a protocol's decision-making power." },
  { id:"i23", diff:"intermediate", question:"What is 'token vesting' and why is it important?", options:["A mechanism that burns unsold tokens after a public sale to prevent supply overhang","A schedule that releases tokens to founders or investors gradually over time, preventing immediate dumping","A lockup applied to all circulating tokens during periods of extreme market volatility","A smart contract that reinvests staking rewards automatically on a fixed schedule"], correct:1, hint:"It aligns long-term incentives by delaying access.", explanation:"Token vesting locks tokens and releases them gradually (e.g., over 2-4 years). It aligns founders' and early investors' incentives with long-term project success by preventing them from selling immediately at launch." },
  { id:"i24", diff:"intermediate", question:"What does 'circulating supply' mean for a token?", options:["The total number of tokens that will ever be created according to the protocol's hard cap","The number of tokens currently in circulation and available for trading on the open market","The tokens held in the protocol treasury reserved for future development milestones","The supply of tokens that have been staked and are therefore temporarily locked from trading"], correct:1, hint:"It's the tradeable supply right now.", explanation:"Circulating supply is the number of tokens currently available and tradeable in the market. It excludes locked, vested, or reserved tokens. It's used to calculate market cap (price × circulating supply)." },
  { id:"i25", diff:"intermediate", question:"What is a 'DEX' (Decentralized Exchange)?", options:["A centralized exchange that holds user funds in cold storage for enhanced security","A peer-to-peer trading platform operating via smart contracts that requires no custodian","A regulated crypto trading venue that operates under a traditional securities license","A cross-chain aggregator that sources the best swap rates across multiple platforms"], correct:1, hint:"Trade without giving up your private keys.", explanation:"A DEX allows users to trade tokens directly via smart contracts without depositing funds with a centralized custodian. Users retain self-custody throughout and can trade permissionlessly, though they forgo some liquidity depth vs. centralized exchanges." },
  { id:"i26", diff:"intermediate", question:"What is the 'trilemma' in blockchain design?", options:["The three competing priorities of throughput, cost, and developer experience in chain design","The trade-off between scalability, security, and decentralization — improving one compromises another","The three types of node roles — validator, archive, and light — that every chain must balance","The conflict between regulatory compliance, privacy, and permissionless access in DeFi"], correct:1, hint:"You can optimize for two of three, but not all three simultaneously.", explanation:"The blockchain trilemma states that it's extremely difficult for a blockchain to simultaneously be scalable, secure, and decentralized. Most chains sacrifice one to achieve the other two." },
  { id:"i27", diff:"intermediate", question:"What is 'front-running' in blockchain?", options:["Being the first validator in an epoch to propose a block and collect priority fees","Inserting your own transaction ahead of a known pending trade to profit from its price impact","Purchasing tokens before a major protocol upgrade announcement becomes public knowledge","A strategy of acquiring governance tokens before a controversial vote to influence the outcome"], correct:1, hint:"See a big trade incoming, jump ahead of it.", explanation:"Front-running occurs when a validator or mempool observer sees a large pending transaction, then inserts their own transaction with a higher gas fee to execute first and profit from the price movement that the large trade will cause." },
  { id:"i28", diff:"intermediate", question:"What is a 'flash loan' in DeFi?", options:["A high-interest microloan protocol for users without sufficient collateral history","An uncollateralized loan borrowed and repaid within a single transaction, or it fully reverts","A short-term lending product offered by centralized exchanges for leveraged trading","A liquidity bootstrapping mechanism that temporarily borrows from the protocol treasury"], correct:1, hint:"Borrow millions with no collateral — but repay in the same transaction.", explanation:"Flash loans let users borrow arbitrarily large sums without collateral, as long as the loan is repaid within the same transaction. If repayment fails, the entire transaction reverts. Used legitimately for arbitrage, also exploited in protocol attacks." },
  { id:"i29", diff:"intermediate", question:"What is 'network effect' in the context of DePIN?", options:["The marketing impact of influencer promotion on a DePIN token's trading volume","The phenomenon where a network becomes more valuable to all participants as more nodes join","The performance improvement achieved by upgrading node hardware to the latest specification","The governance effect of large token holders dominating protocol decision-making"], correct:1, hint:"More participants = more valuable for everyone.", explanation:"Network effects mean each additional participant increases the network's value for all others. In DePIN, more nodes mean more bandwidth, better coverage, lower latency, and greater resilience — creating a virtuous cycle of growth." },
  { id:"i30", diff:"intermediate", question:"What is 'bandwidth throttling' and why is it problematic?", options:["A quality-of-service tool used by networks to fairly share capacity during congestion","When ISPs deliberately slow certain traffic types to benefit their own services or enforce censorship","A network optimization technique that prioritizes latency-sensitive traffic over bulk transfers","A DePIN mechanism that reduces node rewards when the network is oversupplied with bandwidth"], correct:1, hint:"An ISP can deliberately slow down traffic it doesn't like.", explanation:"Throttling is when an ISP deliberately slows specific traffic types — streaming, VPNs, or competitors' services. It violates net neutrality and is a key reason decentralized alternatives like Dawn matter: no central operator can throttle on a distributed network." },
  { id:"i31", diff:"intermediate", question:"What is 'cold storage' in cryptocurrency?", options:["Holding tokens in a smart contract vault with a 30-day timelock before withdrawal","Keeping private keys offline on hardware or paper to protect against online attacks","A custodial service offered by regulated banks for institutional crypto holdings","Archiving transaction history on a dedicated node that is isolated from the validator network"], correct:1, hint:"Offline means it can't be remotely hacked.", explanation:"Cold storage means keeping private keys completely offline — on a hardware wallet or paper wallet. Since they're never connected to the internet, they're immune to remote hacking. Critical for long-term or large holdings." },
  { id:"i32", diff:"intermediate", question:"What is 'token burn' and what effect does it have?", options:["A scheduled reduction in the staking reward rate as the network matures over time","The deliberate permanent removal of tokens from circulation, reducing supply to create scarcity","A governance penalty applied to validators who vote against approved protocol changes","A cross-chain bridge mechanism that destroys tokens on one chain before minting on another"], correct:1, hint:"Destroying supply increases scarcity.", explanation:"Token burning permanently removes tokens from circulation by sending them to an unspendable address. Reducing supply while demand remains constant tends to increase the value of remaining tokens — a deflationary mechanism used by many protocols." },
  { id:"i33", diff:"intermediate", question:"What is 'KYC' (Know Your Customer) and why do decentralized protocols avoid it?", options:["A smart contract audit standard used to verify that a protocol's code has no critical bugs","Identity verification required by regulated financial institutions; avoided by DeFi to stay permissionless","A consensus mechanism that validates transactions based on the operator's verified identity","A governance framework that restricts voting rights to users who have completed identity checks"], correct:1, hint:"Permissionless = no identity gatekeeping.", explanation:"KYC is mandatory identity verification required by regulated financial institutions. Decentralized protocols avoid KYC to remain permissionless — anyone can participate without revealing identity, preserving financial privacy and global accessibility." },
  { id:"i34", diff:"intermediate", question:"What is a 'multi-signature wallet'?", options:["A wallet that supports multiple token standards including ERC-20, ERC-721, and ERC-1155","A wallet requiring approval from multiple private keys before a transaction can execute","A hardware wallet with a backup seed phrase split across multiple physical locations","A smart contract wallet that automatically signs recurring payments on a fixed schedule"], correct:1, hint:"Multiple approvals required — like a bank vault with multiple keys.", explanation:"A multi-sig wallet requires M-of-N key holders to sign a transaction before it executes (e.g., 3-of-5). Used by DAOs, exchanges, and businesses to prevent single-point-of-compromise theft and enable shared governance of funds." },
  { id:"i35", diff:"intermediate", question:"What is 'on-chain governance' vs. 'off-chain governance'?", options:["Governance executed by smart contracts vs. governance performed by core developers offline","Votes conducted and recorded on the blockchain vs. informal coordination happening outside the chain","Governance decisions that affect token economics vs. decisions that only affect protocol parameters","Binding supermajority votes vs. advisory polls with no enforcement mechanism"], correct:1, hint:"On-chain = binding votes enforced by code.", explanation:"On-chain governance records proposals and votes directly on the blockchain, with outcomes automatically executed via smart contracts. Off-chain governance is informal and requires trusted execution of results." },
  { id:"i36", diff:"intermediate", question:"What is 'tail emission' in token economics?", options:["The final tranche of tokens released to the founding team after a 4-year vesting cliff","A small, ongoing token issuance after initial supply caps, designed to perpetually incentivize operators","A mechanism that gradually reduces transaction fees as the network reaches full capacity","The residual token supply remaining after all scheduled burns have been completed"], correct:1, hint:"A small perpetual reward to keep operators running nodes long-term.", explanation:"Tail emission is a small ongoing token issuance even after an initial supply milestone, ensuring there's always some incentive for node operators and validators to continue maintaining the network after launch rewards decline." },
  { id:"i37", diff:"intermediate", question:"What is the difference between 'custodial' and 'non-custodial' crypto services?", options:["Custodial services offer higher yields because they lend user funds to institutional borrowers","Custodial services hold your keys for you; non-custodial services let you control your own keys","Non-custodial services are always fully regulated and insured by government deposit schemes","Custodial services execute transactions faster by batching signatures on dedicated servers"], correct:1, hint:"Custodial = someone else holds your keys.", explanation:"Custodial services (like centralized exchanges) hold private keys on behalf of users — you trust them with your assets. Non-custodial services let you control your own keys, so only you can authorize transactions. 'Not your keys, not your coins.'" },
  { id:"i38", diff:"intermediate", question:"What is 'epoch' in blockchain staking systems?", options:["A single block interval during which exactly one validator is selected to propose","A defined time period after which rewards are calculated and validator sets are updated","The duration of a governance proposal's voting window before results are tallied","A rolling average window used to calculate the current network difficulty target"], correct:1, hint:"A regular cycle boundary for network accounting.", explanation:"An epoch is a fixed time period used in many PoS systems to batch staking calculations, rotate validator sets, and distribute rewards. It creates predictable accounting periods for the network's reward and validation mechanisms." },
  { id:"i39", diff:"intermediate", question:"What is a 'token swap' on a DEX?", options:["Converting tokens to fiat currency through a regulated off-ramp provider","The exchange of one cryptocurrency for another via a liquidity pool smart contract with no custodian","A cross-chain bridge transfer that moves tokens between two different blockchains","A bilateral OTC trade agreed off-chain and settled manually between two counterparties"], correct:1, hint:"Direct exchange via smart contract, no middleman.", explanation:"A token swap on a DEX is the exchange of one cryptocurrency for another via a liquidity pool smart contract. No custodian holds funds — the smart contract atomically handles the exchange, typically within a single transaction." },
  { id:"i40", diff:"intermediate", question:"What is 'ERC-20'?", options:["A token standard on Ethereum defining a common interface for non-fungible collectibles","A token standard on Ethereum defining a common interface for fungible tokens","An Ethereum scaling proposal that introduced optimistic rollup support to the EVM","A governance standard specifying how DAOs should conduct and record on-chain votes"], correct:1, hint:"The standard that made the ICO boom possible.", explanation:"ERC-20 is a smart contract standard on Ethereum that defines a common interface for fungible tokens. It ensures any ERC-20 token works with the same wallets, DEXs, and DeFi protocols — creating interoperability across the ecosystem." },
  { id:"i41", diff:"intermediate", question:"What is 'Byzantine Fault Tolerance' (BFT) in distributed systems?", options:["A routing protocol that tolerates packet loss of up to one third without degrading throughput","The ability of a distributed system to function correctly even if some nodes fail or act maliciously","A consensus algorithm that achieves finality by requiring unanimous agreement among all validators","A type of smart contract that continues executing correctly even if its dependencies are compromised"], correct:1, hint:"The system must work even with traitors in the network.", explanation:"BFT describes a distributed system's ability to maintain correct operation even when some nodes fail or actively send false information. Named after the Byzantine Generals problem, most BFT systems tolerate up to 1/3 malicious nodes." },
  { id:"i42", diff:"intermediate", question:"What is 'data availability' in blockchain scaling?", options:["The speed at which historical transaction data can be queried from an archive node","The guarantee that all nodes can access and verify data needed to check a block is valid","How much raw storage capacity a blockchain allocates per block to smart contract state","The public accessibility of a blockchain's API for reading transaction histories"], correct:1, hint:"Nodes need to be able to verify what they can't store in full.", explanation:"Data availability ensures all network participants can access the full data needed to verify state transitions, even on resource-constrained nodes. It's a core challenge in scaling blockchains with rollups and sharding solutions." },
  { id:"i43", diff:"intermediate", question:"What is 'sharding' in blockchain?", options:["Splitting a validator's private key across multiple secure hardware enclaves","Partitioning the blockchain into parallel segments that each process a subset of transactions","Distributing smart contract storage across multiple IPFS nodes to reduce on-chain costs","A technique for compressing transaction data before posting it to a data availability layer"], correct:1, hint:"Divide and conquer — parallel transaction processing.", explanation:"Sharding splits the blockchain's state and transaction processing across multiple parallel segments (shards). Each shard processes a subset of transactions, dramatically increasing overall throughput without every node processing all transactions." },
  { id:"i44", diff:"intermediate", question:"What is a 'rollup' in Ethereum scaling?", options:["A validator rotation mechanism that periodically shuffles the active committee set","A Layer 2 solution that batches many transactions off-chain and posts compressed proofs to mainnet","A token distribution mechanism that consolidates rewards from multiple epochs into one payment","A governance upgrade path that bundles multiple EIPs into a single coordinated hard fork"], correct:1, hint:"Batch off-chain, settle on-chain.", explanation:"Rollups execute transactions on a Layer 2 chain, bundle them, and post compressed proofs or data to Ethereum. This batching dramatically reduces fees per transaction while inheriting Ethereum's security for final settlement." },
  { id:"i45", diff:"intermediate", question:"What is 'gas optimization' in smart contract development?", options:["Configuring a validator node to run on renewable energy to reduce its carbon footprint","Writing smart contract code to minimize computational operations and reduce execution gas fees","Compressing calldata before submitting transactions to reduce the bytes charged per transaction","Selecting the optimal gas price based on mempool conditions to achieve fast confirmation"], correct:1, hint:"Fewer operations = lower fees for users.", explanation:"Gas optimization involves writing smart contracts to perform the minimum necessary operations, reducing the gas fees users pay. Techniques include packing storage variables, using efficient data types, and minimizing on-chain computation." },
  { id:"i46", diff:"intermediate", question:"What is the purpose of a 'mempool' in blockchain?", options:["A memory buffer that validators use to cache the current world state between blocks","The holding area for broadcast transactions waiting to be included in a block by validators","A shared off-chain database where Layer 2 operators coordinate before posting rollup batches","A cryptographic accumulator that stores pending governance proposals before they go on-chain"], correct:1, hint:"Transactions wait here before being confirmed.", explanation:"The mempool (memory pool) is where unconfirmed transactions wait after being broadcast to the network. Validators/miners pick transactions from the mempool to include in blocks, typically prioritizing higher-fee transactions first." },
  { id:"i47", diff:"intermediate", question:"What distinguishes a 'public blockchain' from a 'private blockchain'?", options:["Public blockchains have higher transaction throughput due to fewer participating nodes","Public blockchains are permissionlessly accessible to anyone; private blockchains restrict access to approved parties","Public blockchains settle transactions faster because they use more efficient consensus algorithms","Private blockchains are always more decentralized because they have stricter validator requirements"], correct:1, hint:"Permission vs. permissionless access.", explanation:"Public blockchains (like Ethereum, Bitcoin) are open to anyone to read, write, and validate. Private blockchains restrict participation to approved entities, sacrificing decentralization for privacy and performance — typically used by enterprises." },
  { id:"i48", diff:"intermediate", question:"What is 'proof of history' (used by Solana)?", options:["A mechanism that requires validators to prove they have been operating for a minimum duration","A cryptographic clock that timestamps events in sequence, enabling validators to agree on ordering efficiently","A consensus mechanism that weights validator votes by their historical uptime and accuracy record","A replay-protection scheme that prevents previously confirmed transactions from being resubmitted"], correct:1, hint:"Timestamps as cryptographic proof of sequence.", explanation:"Proof of History is Solana's mechanism for creating a verifiable, trustless sequence of events. A SHA256 hash chain creates a cryptographic clock that timestamps transactions, reducing coordination overhead and enabling Solana's high throughput." },
  { id:"i49", diff:"intermediate", question:"What is 'collateral' in DeFi lending?", options:["A reputation score built from on-chain activity that substitutes for traditional credit checks","Assets locked as security for a loan; if their value falls below a threshold, they are liquidated","An insurance fund maintained by the protocol to cover losses from smart contract exploits","A governance bond that validators must post to participate in protocol parameter votes"], correct:1, hint:"You lock assets to prove you can repay.", explanation:"In DeFi lending, borrowers must lock collateral worth more than the loan (over-collateralization). If the collateral's value drops below a liquidation threshold, it's automatically sold to repay the loan — removing counterparty risk without requiring trust." },
  { id:"i50", diff:"intermediate", question:"What is 'on-chain reputation' and why is it valuable?", options:["A social credit score assigned by a DAO committee based on community contributions","A verifiable, transparent record of an address's on-chain history that informs trust without revealing identity","A staking tier system that grants higher rewards to addresses with longer holding periods","A governance weighting mechanism that gives experienced voters more influence over proposals"], correct:1, hint:"Your address's track record, provable without revealing who you are.", explanation:"On-chain reputation is a verifiable history of an address's actions — contributions, governance votes, protocol interactions — that builds trust without requiring identity disclosure. In DePIN and DeFi, it can gate access to better rewards or credit." },
];

const EXPERT_QS = [
  { id:"e1",  diff:"expert", question:"A node operator notices their BlackBox is consistently routing traffic to a geographic cluster, increasing latency for distant users. What is the ideal architectural response?", options:["Throttle the node's output to avoid overloading the regional routing infrastructure","Implement geographic load balancing and peer discovery optimization to distribute routing more evenly","Migrate the BlackBox hardware to a data center located at the network's geographic midpoint","Report the routing concentration to the Dawn team and await a protocol-level fix"], correct:1, hint:"Distributed systems solve geographic concentration with... more distribution.", explanation:"Geographic load balancing and smart peer discovery algorithms ensure traffic is routed through the closest available node, reducing latency and preventing regional bottlenecks — a core DePIN design principle." },
  { id:"e2",  diff:"expert", question:"What is the primary attack vector that a well-designed decentralized internet protocol must defend against at the node layer?", options:["Bandwidth oversaturation attacks where legitimate nodes are flooded with junk traffic","Sybil attacks, where a single actor creates many fake identities to gain disproportionate network influence","DNS hijacking attacks that redirect node discovery requests to attacker-controlled infrastructure","Eclipse attacks that partition a specific node from the rest of the honest network"], correct:1, hint:"Creating many fake identities to dominate a network is a classic attack.", explanation:"Sybil attacks involve creating many fake node identities to gain outsized control. Dawn's reputation system and staking requirements make this economically prohibitive by requiring real resource commitment per node." },
  { id:"e3",  diff:"expert", question:"Why is economic finality important in Dawn's reward distribution mechanism?", options:["It ensures that reward calculations are completed within a fixed number of blocks after each epoch","It prevents retroactive reversal of earned rewards, giving node operators predictable income and investment confidence","It limits the maximum reward any single node can earn to prevent wealth concentration in the network","It simplifies the smart contract logic by eliminating the need for complex clawback mechanisms"], correct:1, hint:"Finality = certainty. Why does an operator need to trust their rewards won't disappear?", explanation:"Economic finality ensures that once a reward is distributed, it cannot be clawed back or reversed. This certainty is critical for node operators making long-term infrastructure investment decisions." },
  { id:"e4",  diff:"expert", question:"What happens to network resilience when a critical mass of BlackBox nodes are geographically concentrated in one region?", options:["Routing efficiency improves because nodes are closer together and can peer with lower latency","The network becomes vulnerable to regional outages, regulatory seizures, and reduced censorship resistance elsewhere","Token emissions automatically increase to incentivize new operators to deploy in underserved regions","The protocol's consensus mechanism temporarily switches to a centralized fallback mode"], correct:1, hint:"Concentration = single point of failure, just at a regional scale.", explanation:"Geographic concentration reintroduces single points of failure and undermines censorship resistance. If one region faces a regulatory crackdown or outage, large portions of the network degrade — a key decentralization challenge." },
  { id:"e5",  diff:"expert", question:"How does Dawn's token incentive model address the 'cold start problem' for new node operators?", options:["By requiring a minimum staking threshold that filters out operators without long-term commitment","By offering bootstrapping rewards that are higher early on, declining as the network matures and organic demand grows","By partnering with existing ISPs to guarantee minimum demand levels before organic users arrive","By delaying reward distribution until the network reaches a critical mass of nodes and traffic"], correct:1, hint:"New networks need incentives to attract early participants before organic demand exists.", explanation:"Early-stage bootstrap rewards (higher emissions rate) incentivize initial node operators to join before organic bandwidth demand exists. As the network matures, natural demand replaces artificial incentives — a standard token economy design pattern." },
  { id:"e6",  diff:"expert", question:"A Deployer-level node is experiencing packet loss during peak hours. What is the most likely root cause in a DePIN context?", options:["A bug in the Dawn protocol's routing algorithm causing incorrect packet forwarding decisions","Contention at the local ISP upstream connection, causing bandwidth promises to exceed available capacity","An on-chain congestion event causing the reward settlement layer to queue bandwidth proofs","Hardware degradation in the BlackBox device causing intermittent NIC failures under sustained load"], correct:1, hint:"Peak hours = congestion. Where does the congestion live?", explanation:"Packet loss during peak hours typically indicates upstream bandwidth contention — the node operator's local ISP connection is saturated. Effective Deployers must provision sufficient upstream headroom to honor their bandwidth commitments reliably." },
  { id:"e7",  diff:"expert", question:"What fundamental property ensures that a Dawn node's contribution cannot be fabricated or spoofed to earn illegitimate rewards?", options:["A legal terms-of-service agreement that node operators sign before receiving any hardware","Cryptographic proof of bandwidth delivery, verified by the network through challenge-response protocols","A reputation oracle that cross-references ISP billing records against claimed bandwidth contributions","A trusted execution environment inside the BlackBox hardware that attests to genuine traffic delivery"], correct:1, hint:"Crypto-economic systems need mathematical proof, not trust.", explanation:"Challenge-response verification with cryptographic proofs ensures that bandwidth delivery claims are mathematically verifiable. Nodes must demonstrably serve real traffic under network-issued challenges — making reward fabrication computationally infeasible." },
  { id:"e8",  diff:"expert", question:"What is a 're-entrancy attack' in smart contracts?", options:["An attack where an adversary replays signed transactions on a different chain with the same chain ID","A vulnerability where a malicious contract repeatedly calls back into a vulnerable contract before its state updates, draining funds","A governance attack where a proposal is resubmitted multiple times to extract treasury funds incrementally","A front-running technique that submits the same arbitrage transaction across multiple blocks"], correct:1, hint:"The DAO hack in 2016 used this exact exploit.", explanation:"Re-entrancy exploits a contract that sends ETH before updating its state. A malicious receiver re-calls the sender contract recursively, draining funds before any balance updates are recorded. The 2016 DAO hack lost $60M this way." },
  { id:"e9",  diff:"expert", question:"What is an 'eclipse attack' on a peer-to-peer network?", options:["A DDoS attack that overwhelms a node with fake peer connection requests until it crashes","Isolating a target node by surrounding it with attacker-controlled peers, controlling all its information and connectivity","A routing attack that intercepts traffic between two nodes and silently modifies the packets in transit","A Sybil attack variant that specifically targets nodes in geographic proximity to the victim"], correct:1, hint:"Surround a node with your own — control everything it sees.", explanation:"In an eclipse attack, an attacker surrounds a target node with adversary-controlled peers, monopolising its connections. The attacker can feed false blockchain data, enable double-spending, or partition the target from the honest network." },
  { id:"e10", diff:"expert", question:"Why is the BFT (Byzantine Fault Tolerant) limit of 1/3 malicious nodes significant for DePIN network security?", options:["It defines how many nodes must be online simultaneously for the network to produce valid blocks","Consensus algorithms can tolerate up to 1/3 malicious nodes — above this threshold correct consensus cannot be guaranteed","It determines the minimum number of nodes required before the protocol activates its reward mechanism","It sets the quorum threshold for governance proposals to pass with binding on-chain effect"], correct:1, hint:"Classic distributed systems result — the safety threshold for consensus.", explanation:"BFT consensus can guarantee correctness as long as fewer than 1/3 of validators are malicious or faulty. Above this threshold, attackers can potentially split consensus or cause finality violations. DePIN must ensure honest validators exceed 2/3." },
  { id:"e11", diff:"expert", question:"What is 'cross-chain MEV' and why is it a growing concern?", options:["MEV that occurs on Ethereum Layer 2s due to the centralized sequencer having ordering power","Value extracted by exploiting transaction ordering across multiple connected blockchains via bridges and interoperability protocols","A governance attack executed simultaneously across two DAOs that share the same token for voting","MEV extracted during bridge finalization windows when cross-chain message ordering is temporarily centralized"], correct:1, hint:"When multiple chains connect, MEV opportunities multiply.", explanation:"Cross-chain MEV arises when bridges or multi-chain protocols create arbitrage and ordering opportunities that span chains. Attackers can exploit price differences or ordering across chains simultaneously, making it harder to detect and defend against." },
  { id:"e12", diff:"expert", question:"What is a '51% attack' and how does DePIN design mitigate it?", options:["An attack where an adversary acquires 51% of governance tokens to pass malicious proposals","A situation where an attacker controls more than 50% of consensus power, enabling block rewriting and double-spends","A Sybil attack where 51 fake node identities are created to flood the peer discovery mechanism","A validator collusion where 51% of the active set agrees to censor a specific address's transactions"], correct:1, hint:"Majority control breaks the consensus guarantee.", explanation:"A 51% attack gives an attacker control over block production, enabling double-spends and transaction censorship. DePIN mitigates this through decentralized node distribution, economic penalties (slashing), and reputation systems requiring real resource commitment." },
  { id:"e13", diff:"expert", question:"What is 'long-range attack' in Proof-of-Stake?", options:["An attack that uses high-latency routing to delay block propagation and cause accidental forks","An attack where an adversary uses old validator keys to rewrite blockchain history from a point in the past","A sustained governance campaign that gradually accumulates tokens over years to achieve majority control","A cross-shard attack that targets state inconsistencies between shards that diverged from a common ancestor"], correct:1, hint:"Old keys, old stake, rewrite history.", explanation:"Long-range attacks in PoS exploit the fact that once validators unstake they have nothing to lose — they can use old keys to create an alternative chain from a historical point. Defenses include weak subjectivity checkpoints and slashing for equivocation." },
  { id:"e14", diff:"expert", question:"What is 'Verkle tree' and how does it improve blockchain scalability?", options:["A sharding scheme that partitions validator responsibilities across geographic regions dynamically","A cryptographic data structure replacing Merkle trees, enabling much smaller proof sizes for stateless clients","A type of recursive zero-knowledge proof used to compress rollup verification on the base layer","A data availability scheme that encodes block data using erasure coding across multiple committees"], correct:1, hint:"Smaller proofs → lighter nodes → better scalability.", explanation:"Verkle trees use polynomial commitments instead of hash-based Merkle proofs, producing dramatically smaller witness sizes. This enables 'stateless clients' that can verify blocks without storing full state — critical for Ethereum's scalability roadmap." },
  { id:"e15", diff:"expert", question:"What is 'proof of bandwidth' verification in Dawn's protocol and what makes it hard to forge?", options:["Node operators submit signed invoices from their ISP to prove they paid for the claimed bandwidth tier","The network issues cryptographic challenges requiring nodes to demonstrate real data delivery that cannot be simulated cheaply","A trusted third-party auditor performs monthly spot checks and certifies each node's contribution level","Nodes stake tokens proportional to their claimed bandwidth, making overclaiming economically self-punishing"], correct:1, hint:"Genuine traffic delivery cannot be computationally faked cheaply.", explanation:"Dawn's PoB uses challenge-response protocols where verifiers send traffic through nodes and measure real delivery metrics (throughput, latency, packet loss). Since delivering actual traffic consumes real resources, fabricating it is more expensive than honest participation." },
  { id:"e16", diff:"expert", question:"What is 'validator collusion' and what mechanisms prevent it in decentralized networks?", options:["Validators sharing infrastructure costs to reduce their operational overhead without coordination on consensus","A coordinated attack where validators conspire to censor transactions — mitigated by random selection and slashing","Validators delegating their signing keys to a shared service provider for operational convenience","A governance cartel where validators vote as a bloc to capture protocol parameter changes for profit"], correct:1, hint:"If validators cooperate maliciously, who stops them?", explanation:"Validator collusion occurs when multiple validators coordinate to extract MEV, censor transactions, or manipulate finality. Mitigations include cryptographically random validator selection, slashing for detectable violations, and cryptographic commit-reveal schemes." },
  { id:"e17", diff:"expert", question:"What is a 'zero-knowledge proof' (ZKP) and its significance for blockchain privacy and scaling?", options:["A consensus mechanism that achieves finality without revealing which validators signed each block","A cryptographic method proving a statement is true without revealing the underlying data — used for privacy and scaling","A privacy protocol that mixes transactions together before settlement to obscure sender and receiver identity","A type of threshold signature that hides the individual contributions of each signing party"], correct:1, hint:"Prove you know something without revealing what you know.", explanation:"ZKPs allow one party to prove a statement's truth to another without revealing any information beyond validity. In blockchain, they enable privacy (shielding transaction details) and scaling (rollups using ZK proofs for succinct verification of thousands of transactions)." },
  { id:"e18", diff:"expert", question:"What is 'latency-based routing optimization' in a DePIN bandwidth network?", options:["Pre-caching popular content at nodes with high storage capacity to reduce origin server requests","Dynamically selecting routing paths based on real-time latency measurements to minimize delay per user","Routing all traffic through the node with the highest staked balance to maximize reward distribution","Assigning static routes at node registration time based on geographic proximity to the nearest data center"], correct:1, hint:"Optimize routes in real time, not at setup time.", explanation:"Latency-based routing continuously measures actual path latency and dynamically reroutes traffic through the fastest available nodes for each user-destination pair. Static geographic routing fails to account for congestion, peering changes, and network conditions." },
  { id:"e19", diff:"expert", question:"What is 'cryptoeconomic security' in the context of a DePIN protocol?", options:["Encryption of all economic transactions to prevent front-running by validators reading the mempool","The guarantee that attacking the network is economically irrational because the cost exceeds potential gain","A legal framework that holds node operators liable for any financial losses caused by their misbehaviour","A cryptographic audit trail ensuring that all reward distributions can be verified and traced on-chain"], correct:1, hint:"Making attacks more expensive than they're worth.", explanation:"Cryptoeconomic security means the protocol is secure because rational economic actors will not attack it — the required stake to attack exceeds potential gains, and slashing destroys that stake if malicious behavior is detected." },
  { id:"e20", diff:"expert", question:"What is the 'data availability problem' in rollups and how do data availability layers solve it?", options:["The high cost of posting raw transaction data to Ethereum mainnet, solved by compressing calldata before submission","The challenge of ensuring rollup transaction data was actually published — solved by dedicated DA layers that guarantee availability","The inability of light clients to verify rollup state without downloading the entire transaction history","The risk of rollup sequencers withholding transaction data to extract MEV before publishing batches"], correct:1, hint:"If data isn't available, validity proofs become meaningless.", explanation:"For rollups to be trustless, the underlying transaction data must be verifiably available so anyone can reconstruct state. DA layers provide scalable, cost-efficient data publication with cryptographic availability proofs, decoupling data storage from execution and settlement." },
  { id:"e21", diff:"expert", question:"What is 'chain reorganisation' (reorg) and what are its security implications?", options:["A planned upgrade process that migrates state from one chain version to the next without downtime","When a longer competing chain branch replaces the canonical chain, potentially reversing recent transactions","A validator rotation that replaces underperforming nodes with new entrants from the waiting queue","The process of merging two previously forked chains back into a single canonical history"], correct:1, hint:"A competing chain branch wins, rolling back recent history.", explanation:"A reorg occurs when a longer (or higher-weight) competing branch of the chain surpasses the canonical chain. Recent blocks and their transactions are reversed. Deep reorgs can enable double-spends. Fast finality mechanisms in modern PoS chains make deep reorgs extremely difficult." },
  { id:"e22", diff:"expert", question:"What is 'stake dilution' in token economics and how can it harm node operators?", options:["The reduction in governance power that occurs when a whale splits their stake across multiple wallets","When token inflation from new issuance reduces the percentage ownership and real purchasing power of existing stakers","A slashing event that reduces the effective staking weight of validators who have accrued penalties","The gradual erosion of staking rewards as more nodes compete for the same fixed reward pool"], correct:1, hint:"New tokens issued → existing holdings worth less in real terms.", explanation:"Stake dilution happens when token emission rates are too high relative to network value growth. New token issuance inflates supply, reducing each existing staker's ownership percentage and real reward value. Sustainable tokenomics must balance emission incentives against dilution effects." },
  { id:"e23", diff:"expert", question:"What is 'maximal extractable value sandwiching' and how does it harm DeFi users?", options:["A liquidity provision strategy that places concentrated positions just above and below the current market price","When bots place one transaction before and one after a victim's trade, profiting from the price impact they induce","A governance tactic of buying tokens before and selling them after a controversial proposal resolves","A cross-chain arbitrage that exploits brief price discrepancies during bridge finalization windows"], correct:1, hint:"Squeeze the victim between two bot transactions.", explanation:"MEV sandwiching involves a bot front-running a victim's trade (buying before) and back-running it (selling after). The bot profits from the price impact the victim's trade creates. The victim suffers worse price execution." },
  { id:"e24", diff:"expert", question:"What is the 'optimistic vs. ZK rollup' trade-off?", options:["Optimistic rollups have higher throughput; ZK rollups have stronger privacy guarantees for users","Optimistic rollups assume validity and use fraud proofs with a challenge period; ZK rollups use validity proofs that are immediately final","Optimistic rollups settle to Ethereum; ZK rollups use their own separate consensus and finality layer","ZK rollups are permissionless to operate; optimistic rollups require sequencer whitelisting by the core team"], correct:1, hint:"One trusts and verifies later; the other proves upfront.", explanation:"Optimistic rollups presume validity and rely on fraud proofs (7-day withdrawal window). ZK rollups generate validity proofs immediately — withdrawals are instant and no challenge window is needed, but proof generation is computationally intensive and circuit-specific." },
  { id:"e25", diff:"expert", question:"What is 'stake-weighted governance' and what are its limitations?", options:["A governance model that weights votes by the duration tokens have been staked, rewarding long-term holders","A governance model where voting power is proportional to stake — susceptible to plutocratic control by large holders","A governance system where all token holders receive equal votes regardless of their holdings size","A hybrid model combining stake-weighted voting with quadratic scaling to reduce whale dominance"], correct:1, hint:"More tokens = more votes — who wins in that system?", explanation:"Stake-weighted governance gives large holders disproportionate influence. While it aligns economic stake with decision-making, it risks plutocracy where wealthy insiders control protocol direction against the interests of smaller operators and users." },
  { id:"e26", diff:"expert", question:"What is 'node churning' in DePIN and what problem does it cause?", options:["Nodes that rotate their reward addresses frequently to obscure earnings from public blockchain explorers","High rates of nodes joining and leaving the network, degrading routing stability and making bandwidth SLAs unreliable","A hardware maintenance cycle where nodes are periodically rebooted to apply firmware and security updates","The process of replacing underperforming nodes with higher-capacity hardware to improve network throughput"], correct:1, hint:"Instability in the node set undermines network reliability.", explanation:"Node churning — frequent joining and leaving — degrades routing table stability, makes it harder to maintain consistent performance SLAs, and increases the overhead of peer discovery. Staking requirements and uptime-based rewards discourage churning." },
  { id:"e27", diff:"expert", question:"What is 'dual-spending' (double spend) and how does blockchain consensus prevent it?", options:["Paying gas fees on two different chains simultaneously for the same cross-chain bridge operation","An attack where the same tokens are spent in two conflicting transactions — prevented by consensus establishing single canonical ordering","Deploying the same smart contract to two chains and using both deployments to drain a shared liquidity pool","Signing two different governance votes with the same key to gain double the voting weight on a proposal"], correct:1, hint:"Consensus picks one valid history, invalidating the other spend.", explanation:"A double-spend attempts to use the same tokens twice. Blockchain consensus ensures all nodes agree on a single canonical history, so once a transaction is finalized, any conflicting transaction is rejected." },
  { id:"e28", diff:"expert", question:"What makes 'permissionless innovation' on a protocol layer strategically valuable?", options:["It reduces the cost of running the protocol by distributing development work across volunteers","Anyone can build applications on the base layer without approval, creating compounding innovation velocity no single company could match","It improves protocol security by exposing the codebase to a larger number of external security researchers","It removes the legal liability of the founding team by distributing responsibility to independent builders"], correct:1, hint:"Composability + open access = unrestricted innovation surface.", explanation:"Permissionless composability lets any developer build on, fork, or combine protocol primitives without gating by a central authority. This creates a compounding innovation effect — applications are built faster, more diversely, and in ways founders never anticipated." },
  { id:"e29", diff:"expert", question:"What is 'protocol capture' and why is it a long-term risk for DePIN projects?", options:["When a competitor forks the protocol and siphons users away with lower fees and higher rewards","When a small group of insiders gradually controls governance to extract value, subverting the protocol's original purpose","When a regulatory body classifies the protocol's token as a security and mandates compliance changes","When the core development team loses interest and abandons maintenance of the protocol's codebase"], correct:1, hint:"Gradual capture by insiders is harder to detect than a sudden attack.", explanation:"Protocol capture occurs when a small coalition of token-rich insiders gains persistent governance control, then adjusts parameters in their favor. The DePIN community must monitor governance concentration as a key health metric." },
  { id:"e30", diff:"expert", question:"What is a 'flash loan attack' on a DeFi governance system?", options:["Using a flash loan to temporarily inflate a protocol's TVL metric before a token sale or audit","Borrowing massive governance tokens via flash loan within one transaction to pass a malicious proposal, then repaying","A type of oracle manipulation that uses a flash loan to temporarily distort a price feed mid-block","Exploiting a reentrancy vulnerability in a governance contract to vote multiple times in the same block"], correct:1, hint:"Borrow enough votes, pass the proposal, repay — all in one block.", explanation:"Flash loan governance attacks borrow massive token amounts within a transaction, use them to vote on a malicious proposal (if snapshot-based voting allows), then repay — effectively buying temporary majority control. Defenses include time-delayed execution and quorum thresholds." },
  { id:"e31", diff:"expert", question:"What is 'IP fragmentation' and how can it be exploited in network attacks?", options:["Assigning multiple IP addresses to a single node to increase its apparent network presence","Breaking IP packets into smaller pieces during transmission — exploitable to bypass firewall inspection or deliver malicious payloads","A technique for hiding a node's true IP address by routing traffic through a series of proxy servers","Splitting a large smart contract across multiple deployment addresses to circumvent size limits"], correct:1, hint:"Small innocent fragments that assemble into something malicious.", explanation:"IP fragmentation splits large packets into smaller ones for transmission. Attackers exploit this by crafting fragments that individually appear benign but reassemble into malicious payloads, bypassing security inspection." },
  { id:"e32", diff:"expert", question:"What is 'verifiable random function' (VRF) and its role in DePIN?", options:["A deterministic hash function that produces the same output given the same input across all nodes","A cryptographic primitive that produces a random output with a proof that it was generated correctly from a given input","A consensus mechanism that uses physical entropy sources to generate tamper-proof randomness for validator selection","A zero-knowledge proof scheme that allows nodes to prove they generated a random number honestly"], correct:1, hint:"Prove the randomness wasn't manipulated.", explanation:"A VRF generates randomness with a cryptographic proof that the output is correct and unpredictable. In DePIN, VRFs are used for fair validator selection, unpredictable challenge assignment, and verifiable reward attribution." },
  { id:"e33", diff:"expert", question:"What is 'griefing' in smart contract design?", options:["A social engineering attack targeting protocol developers to extract sensitive deployment keys","An attack where an adversary spends small resources to cause disproportionate cost or disruption with no profit motive","A type of reentrancy attack that exploits contracts with multiple external call sites in sequence","A governance spam attack that floods a DAO's proposal queue with low-quality submissions"], correct:1, hint:"Small cost to attacker, large cost to everyone else — purely destructive.", explanation:"Griefing attacks exploit smart contract designs where a small expenditure can cause a much larger disruption. Unlike profit-motivated exploits, griefing is purely destructive. Protocol design must ensure attackers cannot impose asymmetric costs on others." },
  { id:"e34", diff:"expert", question:"In the context of Dawn's architecture, what is the risk of using a centralized DNS for node discovery?", options:["Centralized DNS introduces latency into the node discovery process, slowing peer connection establishment","A centralized DNS for node discovery creates a single censorship point — seizure neutralizes the entire peer discovery mechanism","Centralized DNS records can become stale if nodes change their IP addresses frequently without updating records","DNS resolution adds a round-trip overhead that degrades performance for latency-sensitive DePIN applications"], correct:1, hint:"Centralizing discovery defeats decentralization of the rest.", explanation:"If node discovery relies on a centralized DNS, that DNS becomes the network's Achilles heel. A government or regulator can pressure the DNS provider to remove node records, making the network undiscoverable despite nodes remaining online." },
  { id:"e35", diff:"expert", question:"What is 'EigenLayer restaking' and how does it relate to DePIN infrastructure security?", options:["A liquid staking derivative that tokenizes staked ETH into a tradeable asset used as DePIN collateral","A protocol enabling ETH stakers to re-stake their stake to provide cryptoeconomic security for additional protocols","A cross-chain bridge that allows Ethereum validators to also validate transactions on DePIN L2 networks","A slashing insurance product that protects DePIN node operators against validator penalties on Ethereum"], correct:1, hint:"Borrow Ethereum's security budget for your own protocol.", explanation:"EigenLayer lets ETH stakers opt in to secure additional protocols with their existing stake. DePIN projects can leverage Ethereum's massive staked ETH to secure their own network without waiting to build a large native token stake." },
  { id:"e36", diff:"expert", question:"What is 'proof of location' and why is it valuable — and hard — in DePIN?", options:["A staking requirement that nodes must deposit tokens in a wallet registered to their jurisdiction","A cryptographic attestation that a node is physically located where it claims — valuable for routing but hard because location is easily faked","A regulatory compliance mechanism that requires nodes to register their physical address with authorities","A reputation signal derived from a node's historical routing patterns that approximates its geographic region"], correct:1, hint:"Location claims are easy to fake — proving them cryptographically is hard.", explanation:"Proof of location would allow DePIN networks to verify node geographic claims, enabling accurate coverage maps and load balancing. However, GPS spoofing, VPNs, and IP geolocation inaccuracies make it extremely difficult to prove without trusted hardware attestation." },
  { id:"e37", diff:"expert", question:"What is 'slippage tolerance' in DEX trading and what is the risk of setting it too high?", options:["A parameter that limits the maximum gas fee a user will pay for a swap during periods of network congestion","The maximum price deviation a user accepts for their trade to execute — setting it too high invites MEV sandwich attacks","A DEX fee tier that scales with trade size to compensate liquidity providers for high-impact transactions","A safety mechanism that cancels a trade if the pool's liquidity drops below a minimum threshold mid-execution"], correct:1, hint:"High slippage tolerance is an invitation to MEV bots.", explanation:"Slippage tolerance is the maximum price movement a user accepts. Setting it too high makes trades vulnerable to MEV sandwich attacks — bots see your high tolerance and maximally front-run and back-run your transaction." },
  { id:"e38", diff:"expert", question:"What is 'time-weighted average price' (TWAP) and why do DeFi protocols use it?", options:["A token vesting schedule that releases tokens at a price averaged over the vesting period to prevent gaming","A price oracle mechanism that averages prices over a time window, making it resistant to single-block price manipulation","A fee calculation method that charges users based on the average gas price over the past N blocks","A liquidity mining reward that distributes tokens proportional to the time-weighted value of a user's LP position"], correct:1, hint:"Averaging over time makes instant manipulation expensive.", explanation:"TWAP calculates the average asset price over a defined time window. Because manipulation requires sustaining a false price across multiple blocks (costly), TWAP oracles are much harder to exploit than spot prices. They're widely used in DeFi for liquidation triggers and option pricing." },
  { id:"e39", diff:"expert", question:"What is 'tail risk' in DePIN network economics and how should it be managed?", options:["The risk of token emission rates exceeding network growth, causing gradual dilution of operator rewards","Low-probability but catastrophic events — a critical exploit, major node collusion, or a regulatory shock — that standard models underestimate","The risk of the last remaining nodes defecting once rewards drop below their operational cost threshold","The probability that a competing DePIN protocol captures the majority of bandwidth demand in a key market"], correct:1, hint:"Rare but devastating events that normal models underestimate.", explanation:"Tail risk in DePIN covers extreme scenarios: a zero-day in the core protocol, collusion by top nodes controlling majority stake, or regulatory seizure of major operators. Protocols manage it through insurance funds, multi-client diversity, and emergency circuit breakers." },
  { id:"e40", diff:"expert", question:"What is 'validator set decentralization' and why is it the ultimate security metric for PoS networks?", options:["The geographic spread of validators across different countries and time zones in the network","The number of independent, economically unrelated entities controlling validators — the true measure of resistance to collusion","The technical diversity of validator client software implementations running across the active set","The distribution of staking amounts across validators, measured by the Gini coefficient of the stake distribution"], correct:1, hint:"Count the truly independent entities, not the total node count.", explanation:"High validator count means little if 80% are controlled by three entities. True decentralization requires many economically and jurisdictionally independent validators with no collusion paths. This is the deepest security guarantee in PoS — and the hardest to fake." },
  { id:"e41", diff:"expert", question:"What is 'PBS' (Proposer-Builder Separation) and why does Ethereum implement it?", options:["A privacy protocol that separates transaction proposers from block signers to prevent identity linkage","A design separating block building (selecting and ordering transactions) from block proposing (signing), reducing MEV centralization","A Layer 2 architecture that separates proof generation from transaction execution for efficiency","A Solidity pattern that separates contract logic from storage to enable cheaper upgrades"], correct:1, hint:"Separate who picks transactions from who signs blocks.", explanation:"PBS decouples block building (choosing transactions, extracting MEV) from block proposing (signing). This allows specialised builders to optimise blocks without validators needing MEV expertise, preventing MEV pressure from centralising the validator set." },
  { id:"e42", diff:"expert", question:"What is a 'poison pill' governance defence in DAOs?", options:["A smart contract that irreversibly burns the treasury if a hostile actor achieves governance control","A governance mechanism that triggers massive token dilution or deterrents when a single entity acquires a threshold of governance power","A time-lock mechanism that delays all governance proposals by 30 days to allow community review","An emergency multisig that can veto any governance proposal within 48 hours of passage"], correct:1, hint:"Make hostile acquisition prohibitively expensive.", explanation:"Inspired by corporate anti-takeover defenses, DAO poison pills trigger automatic responses (like minting tokens to dilute an acquirer, or requiring supermajority approval) when any entity accumulates beyond a threshold of governance power." },
  { id:"e43", diff:"expert", question:"What is 'state bloat' and how does it threaten long-term blockchain scalability?", options:["The accumulation of orphaned transactions in the mempool that are never included in a block","The unbounded growth of on-chain state that all full nodes must store, causing hardware requirements to outpace commodity hardware","The increasing size of block headers as more validators are added to the active consensus set","The growth of historical transaction data that archive nodes must retain indefinitely for auditability"], correct:1, hint:"Every new state entry must be stored forever by every full node.", explanation:"State bloat occurs as smart contract interactions continuously add new entries to global state. This unbounded growth eventually means only well-resourced nodes can store full state, pushing out home operators and centralising validation." },
  { id:"e44", diff:"expert", question:"What is 'eclipse routing' as an optimisation in decentralised networks (distinct from eclipse attack)?", options:["Routing traffic exclusively through the geographically closest nodes to minimise physical path length","A routing strategy that selects paths based on historical reliability metrics — uptime, packet loss, latency — not just capacity","A load-balancing approach that distributes traffic evenly across all available nodes regardless of their performance","A caching strategy that routes repeated requests to the same node to improve hit rates for cached content"], correct:1, hint:"Route through the reliable ones, not just the available ones.", explanation:"Eclipse routing (as optimisation) selects paths based on historical reliability metrics — uptime, packet loss rates, consistent latency — rather than purely bandwidth capacity. In DePIN networks where nodes vary in reliability, this dramatically improves real-world QoS." },
  { id:"e45", diff:"expert", question:"What is 'account abstraction' (ERC-4337) and its significance for DePIN user adoption?", options:["A privacy mechanism that abstracts wallet addresses into human-readable ENS names for easier sharing","A smart contract standard enabling programmable wallets with gas sponsorship, social recovery, and session keys","A scaling mechanism that batches multiple user operations into a single on-chain transaction for cost efficiency","A token standard that abstracts the difference between fungible and non-fungible tokens into a unified interface"], correct:1, hint:"Smart wallets with programmable rules lower the UX barrier to Web3.", explanation:"ERC-4337 allows wallets to be smart contracts with custom logic: gas sponsorship, social recovery (no seed phrase loss), and session keys (automated signing). For DePIN, this dramatically lowers the technical barrier for node operators to interact with reward contracts." },
  { id:"e46", diff:"expert", question:"What is the 'honest minority' assumption and why does it matter for censorship resistance in Dawn?", options:["The assumption that the majority of token holders will vote honestly in governance even when bribed","As long as a small fraction of nodes remain honest and connected, motivated users can route around censorship","The minimum percentage of nodes that must remain online for the network to maintain its performance SLAs","The assumption that new node operators are more likely to be honest than established ones with profit motives"], correct:1, hint:"Even a small honest set can preserve censorship resistance.", explanation:"The honest minority assumption means censorship resistance doesn't require majority honesty — just enough honest nodes for users to find an uncensored path. Geographic and jurisdictional diversity of nodes ensures censorship by any one actor leaves honest paths available." },
  { id:"e47", diff:"expert", question:"What is 'selective disclosure' in zero-knowledge proofs and its application to DePIN identity?", options:["A privacy setting that allows users to choose which on-chain transactions are visible to the public","The ability to prove specific attributes without revealing underlying data — enabling compliant but privacy-preserving DePIN identity","A governance mechanism that restricts sensitive protocol parameters to visibility by verified node operators only","A ZK scheme that reveals the identity of malicious nodes to the network while keeping honest nodes anonymous"], correct:1, hint:"Prove what you need to prove, nothing more.", explanation:"Selective disclosure using ZKPs lets node operators prove specific claims — minimum stake, geographic region, uptime threshold — without revealing their full identity or wallet balances. This enables DePIN compliance requirements without sacrificing operator privacy." },
  { id:"e48", diff:"expert", question:"What is 'network partition tolerance' and what does the CAP theorem say about distributed systems?", options:["The ability to route around physical cable cuts by dynamically rerouting traffic through satellite links","The CAP theorem states distributed systems can guarantee only two of: Consistency, Availability, and Partition tolerance simultaneously","The capacity of a network to maintain full throughput when up to one third of its nodes are offline","A consensus property ensuring the network can merge two independently operating partitions without data loss"], correct:1, hint:"You can't have all three — pick two.", explanation:"CAP theorem states distributed systems must trade off between Consistency (all nodes see the same data), Availability (every request gets a response), and Partition tolerance (system works despite network splits). Blockchains generally prioritise Consistency + Partition tolerance." },
  { id:"e49", diff:"expert", question:"What is 'reward smoothing' in DePIN and why might it be preferable to per-block rewards?", options:["A tokenomics mechanism that gradually reduces reward rates as the network approaches its maximum node capacity","Averaging rewards across a time window so operators receive predictable income rather than volatile per-block payouts","A governance mechanism that redistributes rewards from high-earning nodes to underperforming nodes for equity","A staking feature that automatically compounds rewards back into the operator's stake without manual reinvestment"], correct:1, hint:"Predictable income keeps operators committed through volatility.", explanation:"Reward smoothing distributes earnings averaged over an epoch rather than per-block lottery payouts. This gives node operators more predictable cash flows, reducing the churn incentive when block rewards are temporarily low. Predictable income is critical for infrastructure investment decisions." },
  { id:"e50", diff:"expert", question:"What is 'cryptographic commitment scheme' and how is it used in trustless bandwidth auctions?", options:["A token lockup mechanism that commits node operators to a minimum service level for a fixed duration","A two-phase protocol where participants commit to a hashed bid then reveal it — preventing manipulation while keeping bids private","A zero-knowledge proof system that proves a bid is within a valid range without revealing the actual amount","A smart contract pattern that escrows funds until both parties confirm that the agreed service was delivered"], correct:1, hint:"Commit first (sealed bid), reveal second — prevents last-minute manipulation.", explanation:"Commitment schemes in bandwidth auctions work as sealed bids: participants submit H(bid, nonce) in the commit phase (hidden but binding), then reveal bid and nonce in the reveal phase. This prevents sniping and manipulation, ensuring fair price discovery in trustless bandwidth markets." },
];

// BlackBox Challenge questions (10 expert scenarios)
const BLACKBOX_QS = [
  { id:"bb1", diff:"expert", question:"You've just received your BlackBox. Before connecting it, what is the most important first step?", options:["Mine as much bandwidth as possible immediately","Review the network's contribution requirements and ensure your ISP connection meets minimum uptime and bandwidth thresholds","Connect it to the fastest available WiFi","Register on 5 different accounts to maximize rewards"], correct:1, hint:"Infrastructure requires preparation before deployment.", explanation:"Before deploying, verifying that your connection meets the network's SLA requirements ensures you won't be penalized for failing to deliver promised bandwidth — protecting your reputation score." },
  { id:"bb2", diff:"expert", question:"Your BlackBox is running but your contribution score is low. Diagnostics show 40% packet loss. What do you investigate first?", options:["The Dawn app version","Your upstream router's QoS settings and ISP bandwidth contention ratio","The color indicator on the BlackBox","Your Sunray balance"], correct:1, hint:"QoS = Quality of Service. What controls packet prioritization?", explanation:"QoS misconfiguration is the most common cause of packet loss for new deployments. Ensuring the router prioritizes the BlackBox's traffic and checking your ISP's contention ratio resolves most reliability issues." },
  { id:"bb3", diff:"expert", question:"The Dawn network issues a bandwidth challenge to your BlackBox. What does successfully responding to this challenge prove?", options:["That you paid your subscription fee","That your node is genuinely online and delivering real, verifiable bandwidth to the network","That your hardware is new","That you've answered quiz questions correctly"], correct:1, hint:"Challenges exist to verify real contribution, not just presence.", explanation:"Challenge-response protocols cryptographically verify that your node is actively serving real traffic. This prevents reward farming by nodes that claim to be online without actually delivering bandwidth." },
  { id:"bb4", diff:"expert", question:"Another node operator offers to share reward fees if you point your BlackBox to their private routing server instead of the Dawn network. What is this?", options:["A legitimate business partnership","A Sybil/routing attack attempt that undermines network integrity and violates contribution rules","A valid optimization strategy","Standard DePIN practice"], correct:1, hint:"If it routes your contribution away from the main network, what does that do to the network?", explanation:"This is a routing attack — redirecting your node's bandwidth away from the legitimate network to a private server breaks the decentralized trust model and likely violates contribution agreements, risking node banning." },
  { id:"bb5", diff:"expert", question:"Your BlackBox has been running for 30 days with near-perfect uptime. What mechanism rewards this long-term reliability?", options:["One-time signup bonus","Streak multipliers or uptime bonuses that increase your effective reward rate for sustained high-availability contribution","Random lottery rewards","Higher hardware resale value"], correct:1, hint:"Long-term reliable nodes are more valuable to the network than intermittent ones.", explanation:"Uptime streak bonuses incentivize sustained, reliable contribution. Long-running nodes with high availability SLAs are disproportionately valuable to network reliability, so the reward model compensates them accordingly." },
  { id:"bb6", diff:"expert", question:"The Dawn network is under a coordinated DDoS attack targeting active nodes. What should a BlackBox operator do?", options:["Disconnect immediately and wait for instructions","Apply rate limiting, enable flood protection, and check Dawn's official communication channels for network-wide guidance","Ignore it — hardware will handle it","Increase bandwidth contribution to fight back"], correct:1, hint:"Defense-in-depth: local mitigation + staying informed.", explanation:"Rate limiting and flood protection mitigate the immediate impact while staying connected to official channels ensures coordinated response. Isolated disconnection doesn't help the network defend itself." },
  { id:"bb7", diff:"expert", question:"As a BlackBox Holder, why are you considered 'pre-Deployer' rather than already at Deployer level?", options:["BlackBox Holders haven't paid the Deployer fee","The Deployer level requires demonstrated mastery of advanced scenarios and sustained network contribution that goes beyond hardware ownership","BlackBox Holders are on a waiting list","It's an arbitrary distinction"], correct:1, hint:"Ownership of hardware ≠ mastery of the ecosystem.", explanation:"The Deployer rank requires proving expert-level understanding of network economics, attack vectors, and contribution mechanics — not just hardware ownership. This ensures Deployers can responsibly support the network's growth." },
  { id:"bb8", diff:"expert", question:"Two nodes in your area both report 1Gbps bandwidth availability. Node A has been active for 6 months; Node B started yesterday. Which should receive more routing priority and why?", options:["Node B, because fresh nodes are faster","Node A, because its sustained track record provides higher reliability confidence than an unproven new node","Both equally — past performance is irrelevant","Neither — routing is random"], correct:1, hint:"Track record is evidence of reliability. New nodes are unknown quantities.", explanation:"Reputation-weighted routing prioritizes nodes with proven reliability histories. Node A's 6-month track record provides statistical confidence in future performance that Node B simply cannot offer yet." },
  { id:"bb9", diff:"expert", question:"What is the economic significance of the 160 Sunray threshold for BlackBox Holder rank?", options:["It's the cost of purchasing a BlackBox","It represents sufficient demonstrated ecosystem engagement that the network can trust the operator with higher-responsibility deployment roles","It unlocks a special discount","It's an arbitrary game mechanic"], correct:1, hint:"Thresholds signal earned trust and commitment.", explanation:"The 160 Sunray threshold ensures BlackBox Holders have invested significant time learning the ecosystem before taking on deployment responsibilities. It's a trust signal, not just a game mechanic — it filters for genuine participants." },
  { id:"bb10", diff:"expert", question:"A future protocol upgrade changes Dawn's reward distribution formula, reducing payouts for nodes below a minimum bandwidth threshold. How should a responsible BlackBox Holder respond?", options:["Immediately sell the hardware","Review the upgrade rationale, assess whether current setup meets the new threshold, upgrade infrastructure if needed, and participate in governance discussion","Ignore it and hope rewards continue","Create multiple accounts to compensate"], correct:1, hint:"Protocol upgrades require active, engaged participation from operators — not passive reaction.", explanation:"Responsible operators review protocol changes rationally, adapt their infrastructure if needed, and participate in governance. Decentralized networks depend on engaged, thoughtful operators — not passive participants who react only to personal financial impact." },
];

// Deployer Final Run questions (20 ultra-hard)
const DEPLOYER_QS = [
  { id:"d1",  diff:"expert", question:"In a Byzantine Fault Tolerant consensus model, what is the maximum fraction of malicious nodes a network can tolerate while maintaining correctness?", options:["Up to 1/2","Up to 1/3","Up to 2/3","Up to 1/4"], correct:1, hint:"Byzantine Generals Problem — the classical bound.", explanation:"BFT systems can tolerate up to f malicious nodes out of 3f+1 total nodes — meaning less than 1/3 of nodes can be adversarial before consensus breaks down. This is why node distribution and operator diversity matter in Dawn." },
  { id:"d2",  diff:"expert", question:"What cryptographic primitive enables a Dawn node to prove bandwidth delivery without revealing the actual data packets transmitted?", options:["Symmetric encryption","Zero-knowledge proofs combined with commitment schemes","Simple digital signatures","Hash functions alone"], correct:1, hint:"Prove a fact without revealing the underlying data.", explanation:"Zero-knowledge proofs allow nodes to cryptographically demonstrate that they served specific data to specific requesters without exposing the content — preserving user privacy while enabling fraud-proof contribution verification." },
  { id:"d3",  diff:"expert", question:"Why does Dawn's architecture prioritize 'data plane separation' between routing decisions and actual traffic forwarding?", options:["To reduce code complexity","To enable rapid protocol upgrades and attack response without disrupting active traffic flows","To decrease node hardware requirements","To allow centralized monitoring"], correct:1, hint:"Control vs. data plane separation is a core networking design pattern.", explanation:"Separating the control plane (routing decisions, protocol governance) from the data plane (actual traffic) means protocol upgrades and emergency responses can be applied without dropping live connections — critical for production-grade infrastructure." },
  { id:"d4",  diff:"expert", question:"A Deployer is tasked with onboarding 50 new nodes in a new geographic market. What metric is most critical to validate first?", options:["Hardware cost per unit","Upstream ISP peering agreements and local internet exchange point (IXP) availability","Number of potential users","Regulatory environment for crypto assets"], correct:1, hint:"The network is only as good as its upstream connectivity.", explanation:"IXP availability and upstream peering quality determine whether new nodes can efficiently exchange traffic with the broader internet. Without quality upstream connectivity, new nodes create local islands rather than true network expansion." },
  { id:"d5",  diff:"expert", question:"What is 'eclipse attack' in the context of a P2P network like Dawn, and what's the primary defense?", options:["A DDoS attack using solar interference","An attack where a malicious actor surrounds a target node with adversarial peers, isolating it from the honest network; defended by diverse peer selection","An eclipse of bandwidth contribution","A hardware failure during peak hours"], correct:1, hint:"Imagine being surrounded by enemies who control all your information sources.", explanation:"An eclipse attack isolates a node by controlling all its peer connections, feeding it false information about the network state. Randomized peer selection with cryptographic peer ID verification makes it statistically impractical to surround a target." },
  { id:"d6",  diff:"expert", question:"Token inflation through excessive node reward emissions can destabilize a DePIN economy. What mechanism does a well-designed protocol use to counterbalance this?", options:["Simply stop paying rewards","Emission halvings, demand-side token burns tied to bandwidth consumption, and difficulty adjustments that increase with network growth","Print more tokens to compensate","Centralize reward distribution"], correct:1, hint:"Supply-demand balance requires mechanisms on both sides.", explanation:"Sustainable token economies combine decreasing emission curves (halvings/tail decay) with demand-side sinks (burning tokens for bandwidth access) to maintain value. As the network grows, organic demand absorbs new supply — a key Tokenomics design principle." },
  { id:"d7",  diff:"expert", question:"As a Deployer supporting the Dawn network, what is your primary responsibility beyond just running hardware?", options:["Marketing the protocol on social media","Actively contributing to network health through uptime reliability, participation in governance, and helping onboard new operators","Holding as many Sunrays as possible","Competing against other Deployers for dominance"], correct:1, hint:"A Deployer is a network steward, not just a hardware operator.", explanation:"Deployers are infrastructure stewards — their responsibility extends to reliable uptime, governance participation, and ecosystem growth. The network's credibility depends on its most advanced operators behaving as committed long-term participants." },
  { id:"d8",  diff:"expert", question:"What is 'routing table poisoning' and why is it particularly dangerous in a decentralized bandwidth network?", options:["A database corruption error","Injection of false routing information that misdirects traffic, causing nodes to waste bandwidth on invalid routes or enabling man-in-the-middle attacks","A protocol for faster routing","A consensus mechanism flaw"], correct:1, hint:"False routing info = traffic goes to the wrong place or the attacker.", explanation:"Routing table poisoning corrupts the distributed routing map, sending traffic through malicious nodes or black holes. In a bandwidth network, this causes node penalties, user service degradation, and potential data interception — far worse than in traditional networks." },
  { id:"d9",  diff:"expert", question:"What does 'slashing' mean in a proof-of-stake-adjacent node accountability system?", options:["Reducing hardware performance","Automatically destroying a portion of a node operator's staked tokens as punishment for provable misbehavior or downtime violations","Increasing reward rates","A network speed boost mechanism"], correct:1, hint:"It's the stick that makes the carrot (staking) meaningful.", explanation:"Slashing creates economic accountability — operators who violate SLAs or behave maliciously lose a portion of their stake. This aligns node operator incentives with network health: the cost of misbehavior outweighs potential gains." },
  { id:"d10", diff:"expert", question:"Dawn's long-term vision involves displacing significant market share from centralized ISPs. What is the single most critical adoption barrier to overcome?", options:["Hardware is too expensive","Last-mile quality-of-service parity — decentralized bandwidth must match or exceed centralized ISP reliability and latency to achieve mainstream adoption","Marketing budget","Number of token holders"], correct:1, hint:"Users won't switch unless the alternative is at least as good.", explanation:"Quality-of-service parity is the ultimate adoption barrier. End users and enterprises will only migrate from familiar ISP relationships to decentralized alternatives when reliability, latency, and support match existing expectations — technical excellence must precede market share." },
  { id:"d11", diff:"expert", question:"A governance proposal suggests increasing the BlackBox minimum bandwidth requirement from 100Mbps to 250Mbps. What is the primary trade-off?", options:["No significant trade-off","Higher minimum improves network quality but reduces accessibility for operators in emerging markets with limited connectivity options","Higher minimum reduces rewards for all","Lower minimum is always better"], correct:1, hint:"Quality vs. accessibility — the eternal infrastructure tension.", explanation:"Raising minimum requirements improves the average network quality and user experience, but excludes operators in regions where 250Mbps isn't accessible or affordable. Governance must balance network performance goals with global accessibility — a core tension in decentralized infrastructure." },
  { id:"d12", diff:"expert", question:"What is 'economic abstraction' in the context of DePIN reward systems, and why do some protocols avoid it?", options:["Using fiat currency instead of tokens","Allowing users to pay for bandwidth in any token, abstracting away the native token requirement; avoided because it can reduce native token demand and destabilize tokenomics","A form of token burning","A routing optimization technique"], correct:1, hint:"If you don't need the native token, why hold it?", explanation:"Economic abstraction lets users transact in any asset, removing mandatory native token utility. While user-friendly, it severs the link between network demand and token value — potentially making the token purely speculative rather than functionally necessary." },
  { id:"d13", diff:"expert", question:"When evaluating a DePIN protocol's long-term viability per the Messari DePIN 2025 framework, which factor is weighted most heavily?", options:["Total token market cap","Ratio of organic demand (real users paying for services) to reward-driven supply (nodes running only for tokens)","Number of Twitter followers","Speed of the founding team's previous exits"], correct:1, hint:"Organic demand = real-world utility. Without it, it's all speculation.", explanation:"The organic demand ratio is the critical long-term viability signal. Networks where real users pay for real services are self-sustaining; networks where nodes run purely for token rewards are vulnerable to death spirals when token prices fall." },
  { id:"d14", diff:"expert", question:"What is the purpose of a 'watchtower' node in advanced decentralized network architectures?", options:["A node with the tallest physical location","An independent monitoring node that detects and reports misbehavior by other nodes without requiring those nodes to self-report","A node reserved for the founding team","A performance monitoring dashboard"], correct:1, hint:"External oversight is more reliable than self-reporting.", explanation:"Watchtower nodes independently monitor network participants and cryptographically attest to misbehavior, enabling slashing without requiring victims to report attacks themselves. They're a trustless accountability layer." },
  { id:"d15", diff:"expert", question:"A large enterprise wants to use Dawn for last-mile connectivity for a remote workforce. What technical requirement is non-negotiable for enterprise SLA compliance?", options:["Custom branding on the BlackBox","Deterministic failover to redundant nodes with sub-second recovery time and cryptographically verifiable uptime SLA attestation","Lowest possible cost per gigabyte","Support for a specific operating system"], correct:1, hint:"Enterprises need guaranteed uptime with proof — not just best-effort.", explanation:"Enterprise SLAs require guaranteed failover behavior and cryptographic uptime proofs that can be audited. Without deterministic redundancy and verifiable attestation, enterprises cannot fulfill their own downstream service obligations." },
  { id:"d16", diff:"expert", question:"How does content-addressed storage differ from location-addressed storage, and why is it relevant to decentralized internet?", options:["Content-addressed is faster","Content is identified by what it IS (its hash) rather than where it lives, enabling any node to serve it and eliminating single-location dependencies","They are functionally equivalent","Content-addressed requires centralized indexing"], correct:1, hint:"Address the data by its fingerprint, not its location.", explanation:"Content addressing (e.g., IPFS CIDs) allows any node holding a piece of data to serve it, because requests specify what data is needed (its hash) not where it lives. This eliminates single-origin dependencies and enables true decentralization of content delivery." },
  { id:"d17", diff:"expert", question:"What systemic risk does excessive Deployer concentration in a single jurisdiction create for the Dawn network?", options:["Higher average latency worldwide","Regulatory capture — a single government can compel network disruption by threatening Deployers in its jurisdiction, undermining global censorship resistance","Lower token value","Reduced hardware compatibility"], correct:1, hint:"Geographic diversity is as important as technical diversity.", explanation:"Deployer concentration in one jurisdiction creates regulatory capture risk — a single government can effectively shut down or control a significant portion of the network. True censorship resistance requires Deployers distributed across multiple regulatory environments." },
  { id:"d18", diff:"expert", question:"In Dawn's contribution model, what distinguishes a 'cold node' from a 'warm node'?", options:["Temperature of the hardware","A cold node is dormant/offline or contributing below minimum viable thresholds; a warm node is active, routing real traffic, and accumulating reputation","Cold nodes mine tokens, warm nodes route traffic","Hardware age"], correct:1, hint:"Hot/warm/cold = activity and availability level.", explanation:"Warm nodes are actively serving traffic and building reputation score. Cold nodes are offline or below threshold — they don't contribute to network health and don't earn meaningful rewards. The distinction matters for understanding true network capacity." },
  { id:"d19", diff:"expert", question:"Why is verifiable random function (VRF) important for fair node selection in decentralized networks?", options:["It speeds up the network","VRF provides cryptographically provable randomness that cannot be manipulated by any party, ensuring node selection for tasks is unpredictable and bias-free","It reduces bandwidth requirements","It simplifies smart contract logic"], correct:1, hint:"Unbiased, unpredictable, and provably fair selection.", explanation:"VRF-based selection ensures that no single actor can predict or manipulate which node is selected for a task. This prevents targeted Sybil attacks on selection and ensures fair reward distribution proportional to honest contribution." },
  { id:"d20", diff:"expert", question:"You are now a Deployer. What does your continued participation in the Dawn network represent beyond personal reward?", options:["A personal financial investment only","Stewardship of decentralized infrastructure — your node is part of the foundation that makes censorship-resistant internet access possible for users worldwide","A competitive advantage over other nodes","A commitment to holding Sunrays"], correct:1, hint:"The final question: why does any of this matter?", explanation:"Deployers are the backbone of a genuinely decentralized internet. Every node you run strengthens the network's resistance to censorship, corporate capture, and single points of failure — contributing to a more open internet for everyone, not just token holders." },
];

// ─────────────────────────────────────────────────────────────
//  CUSTOM HOOKS
// ─────────────────────────────────────────────────────────────

function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredValue = useCallback((val) => {
    setValue(prev => {
      const next = typeof val === "function" ? val(prev) : val;
      try { window.localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);

  return [value, setStoredValue];
}

// ─────────────────────────────────────────────────────────────
//  AUDIO ENGINE
// ─────────────────────────────────────────────────────────────

// Swap this URL for your GitHub Raw URL once you upload the anthem:
// e.g. https://raw.githubusercontent.com/yourname/dawn-assets/main/anthem.mp3
// Paste your Cloudinary (or any CORS-enabled CDN) MP3 URL here:
const ANTHEM_URL = "https://archive.org/download/praise-the-sun-256k/Praise%20the%20Sun_256k.mp3";

const AudioCtx = { ctx: null };
function getCtx() {
  if (!AudioCtx.ctx) AudioCtx.ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (AudioCtx.ctx.state === "suspended") AudioCtx.ctx.resume();
  return AudioCtx.ctx;
}

// Core: play a sequence of [freq, duration, type, gain] notes
function playTones(notes, masterGain = 0.18) {
  try {
    const ctx = getCtx();
    const master = ctx.createGain();
    master.gain.setValueAtTime(masterGain, ctx.currentTime);
    master.connect(ctx.destination);
    let t = ctx.currentTime;
    notes.forEach(([freq, dur, type = "sine", vol = 1]) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g); g.connect(master);
      osc.start(t); osc.stop(t + dur);
      t += dur * 0.55;
    });
  } catch {}
}

// ── SFX enabled flag (synced from localStorage by useAudio) ─
let _sfxEnabled = true;
export function setSfxEnabled(v) { _sfxEnabled = v; }

// ── Music ducking — defined before SFX block ───────────────────
// Temporarily lowers background music during SFX, then restores
function duckMusic(durationMs = 600) {
  if (typeof musicEl === "undefined" || !musicEl || musicEl.paused) return;
  const orig = musicEl.volume;
  musicEl.volume = Math.max(orig * 0.15, 0);
  setTimeout(() => { if (musicEl) musicEl.volume = orig; }, durationMs);
}

// Individual sound definitions
const SFX = {
  correct() {
    duckMusic(600);
    try {
      const ctx = getCtx();
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.32, ctx.currentTime);
      master.connect(ctx.destination);
      [[523.25,0],[659.25,0.08],[783.99,0.16],[1046.5,0.26]].forEach(([freq, delay]) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = "sine"; osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        g.gain.setValueAtTime(1.0, ctx.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
        osc.connect(g); g.connect(master);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.4);
      });
    } catch {}
  },

  wrong() {
    duckMusic(500);
    playTones([
      [320, 0.06, "square",   1.0],
      [220, 0.14, "sawtooth", 0.9],
      [160, 0.20, "sawtooth", 0.5],
    ], 0.28);
  },

  lifeLost() {
    // Deeper, more impactful thud than wrong — signals real cost
    duckMusic(700);
    try {
      const ctx = getCtx();
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.4, ctx.currentTime);
      master.connect(ctx.destination);
      // Low thud
      const osc1 = ctx.createOscillator(); const g1 = ctx.createGain();
      osc1.type = "sine"; osc1.frequency.setValueAtTime(110, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.3);
      g1.gain.setValueAtTime(1.0, ctx.currentTime);
      g1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc1.connect(g1); g1.connect(master);
      osc1.start(ctx.currentTime); osc1.stop(ctx.currentTime + 0.55);
      // Short dissonant scratch
      const osc2 = ctx.createOscillator(); const g2 = ctx.createGain();
      osc2.type = "sawtooth"; osc2.frequency.setValueAtTime(280, ctx.currentTime + 0.05);
      osc2.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.3);
      g2.gain.setValueAtTime(0.6, ctx.currentTime + 0.05);
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc2.connect(g2); g2.connect(master);
      osc2.start(ctx.currentTime + 0.05); osc2.stop(ctx.currentTime + 0.45);
    } catch {}
  },

  milestone() {
    duckMusic(800);
    try {
      const ctx = getCtx();
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.3, ctx.currentTime);
      master.connect(ctx.destination);
      [[523.25,0],[659.25,0.07],[783.99,0.14],[1046.5,0.21],[1318.5,0.3]].forEach(([freq, delay]) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = delay > 0.25 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        g.gain.setValueAtTime(1.0, ctx.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.45);
        osc.connect(g); g.connect(master);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.5);
      });
    } catch {}
  },

  // Level complete — big celebratory fanfare
  levelComplete() {
    duckMusic(2000);
    try {
      const ctx = getCtx();
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.05);
      master.connect(ctx.destination);
      // chord swell
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        g.gain.setValueAtTime(0.8 - i * 0.1, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.6);
        osc.connect(g); g.connect(master);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1.8);
      });
      // ascending run after chord
      [783.99,880,1046.5,1174.66,1318.5,1568].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.3 + i * 0.07);
        g.gain.setValueAtTime(0.6, ctx.currentTime + 0.3 + i * 0.07);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3 + i * 0.07 + 0.4);
        osc.connect(g); g.connect(master);
        osc.start(ctx.currentTime + 0.3 + i * 0.07);
        osc.stop(ctx.currentTime + 0.3 + i * 0.07 + 0.5);
      });
    } catch {}
  },

  // Button click — subtle UI tick (respects SFX toggle)
  click() {
    if (!_sfxEnabled) return;
    playTones([[880, 0.04, "sine", 0.6]], 0.06);
    duckMusic(150);
  },

  rankUp() {
    duckMusic(1000);
    playTones([
      [392.00, 0.10, "triangle", 1.0],  // G4
      [523.25, 0.10, "triangle", 1.0],  // C5
      [659.25, 0.10, "triangle", 1.0],  // E5
      [783.99, 0.28, "triangle", 0.9],  // G5
      [1046.5, 0.22, "sine",     0.5],  // C6 shimmer
    ], 0.22);
  },

  victory() {
    duckMusic(3500);
    try {
      const ctx = getCtx();
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.02, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 1.2);
      master.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2.6);
      master.connect(ctx.destination);

      const chord = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C4 chord + octave run
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.type = i < 4 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);
        g.gain.setValueAtTime(0.7, ctx.currentTime + i * 0.18);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.8);
        osc.connect(g); g.connect(master);
        osc.start(ctx.currentTime + i * 0.18);
        osc.stop(ctx.currentTime + 3.0);
      });
    } catch {}
  },

  sunray() {
    // Subtle soft ping per sunray earned
    playTones([[1046.5, 0.10, "sine", 0.6]], 0.08);
  },

  // ── Tournament sounds ──────────────────────────────────────
  tournamentStart() {
    // Battle horn — dramatic low-to-high fanfare
    duckMusic(2200);
    try {
      const ctx = getCtx();
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.38, ctx.currentTime + 0.08);
      master.connect(ctx.destination);
      // Two bold low hits
      [[130.81, 0], [130.81, 0.18]].forEach(([freq, delay]) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        g.gain.setValueAtTime(0.9, ctx.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.28);
        osc.connect(g); g.connect(master);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.3);
      });
      // Rising arpeggio: E2 G2 B2 E3 B3 E4
      [[82.41,0.42],[98.00,0.52],[123.47,0.62],[164.81,0.74],[246.94,0.88],[329.63,1.04]].forEach(([freq, delay]) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = delay > 0.85 ? "triangle" : "square";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        g.gain.setValueAtTime(0.7, ctx.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
        osc.connect(g); g.connect(master);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.35);
      });
      // Final bright chord stab
      [329.63, 523.25, 659.25, 987.77].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + 1.22);
        g.gain.setValueAtTime(0.6 - i * 0.1, ctx.currentTime + 1.22);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.22 + 0.7);
        osc.connect(g); g.connect(master);
        osc.start(ctx.currentTime + 1.22); osc.stop(ctx.currentTime + 1.22 + 0.8);
      });
    } catch {}
  },

  tournamentCorrect() {
    // Sharper, punchier correct — competitive edge
    duckMusic(500);
    try {
      const ctx = getCtx();
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.35, ctx.currentTime);
      master.connect(ctx.destination);
      // Quick double-ping: perfect fifth
      [[659.25, 0], [987.77, 0.07], [1318.51, 0.14]].forEach(([freq, delay]) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        g.gain.setValueAtTime(0.8, ctx.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.22);
        osc.connect(g); g.connect(master);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.25);
      });
    } catch {}
  },

  tournamentTimerWarn() {
    // Urgent double-beep — fires when run timer < 20%
    try {
      const ctx = getCtx();
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.22, ctx.currentTime);
      master.connect(ctx.destination);
      [0, 0.18].forEach(delay => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
        g.gain.setValueAtTime(1.0, ctx.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.1);
        osc.connect(g); g.connect(master);
        osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.12);
      });
    } catch {}
  },

  tournamentSubmit() {
    // Score posted — triumphant rising flourish
    duckMusic(2500);
    try {
      const ctx = getCtx();
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 0.06);
      master.connect(ctx.destination);
      // Ascending major scale run
      [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = i < 4 ? "triangle" : "sine";
        const t0 = ctx.currentTime + i * 0.075;
        osc.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(0.8, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45);
        osc.connect(g); g.connect(master);
        osc.start(t0); osc.stop(t0 + 0.5);
      });
      // Sustained bright chord at end
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = "sine";
        const t0 = ctx.currentTime + 0.65;
        osc.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(0.5 - i * 0.08, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 1.2);
        osc.connect(g); g.connect(master);
        osc.start(t0); osc.stop(t0 + 1.4);
      });
    } catch {}
  },
};

// ── Music player ─────────────────────────────────────────────
// The artifact sandbox blocks all outbound fetch/XHR.
// Solution: hidden <audio> element the USER activates via a visible
// button tap — satisfies browser autoplay policy and sandbox rules.

const musicEl = (() => {
  if (typeof window === "undefined") return null;
  const a = document.createElement("audio");
  a.loop    = true;
  a.volume  = Number(JSON.parse(localStorage.getItem("dawn_music_vol") ?? "35")) / 100;
  a.preload = "none";
  // Do NOT set src yet — we set it only when user taps play,
  // which counts as a user gesture and bypasses autoplay block.
  return a;
})();

let musicEnabled = true;

function musicPlay(url) {
  if (!musicEl) return;
  if (!musicEl.src || !musicEl.src.includes("archive.org")) {
    musicEl.src = url;
  }
  musicEl.play().catch(() => {});
}

function musicPause() {
  if (!musicEl) return;
  musicEl.pause();
}

// ── useAudio hook ─────────────────────────────────────────────

function useAudio() {
  const [musicOn, setMusicOn] = useLocalStorage("dawn_music_on", true);
  const [sfxOn,   setSfxOn]   = useLocalStorage("dawn_sfx_on",   true);
  useEffect(() => { setSfxEnabled(sfxOn); }, [sfxOn]);
  const [musicStarted, setMusicStarted] = useState(false);
  const musicOnRef = useRef(musicOn);
  useEffect(() => { musicOnRef.current = musicOn; }, [musicOn]);

  function startMusic() {
    // Called from a direct user tap — clears autoplay restrictions
    setMusicStarted(true);
    musicPlay(ANTHEM_URL);
  }

  function toggleMusic() {
    const next = !musicOn;
    setMusicOn(next);
    if (!musicStarted) {
      if (next) startMusic();
      return;
    }
    next ? musicPlay(ANTHEM_URL) : musicPause();
  }

  function play(sfxName) {
    if (!sfxOn) return;
    try { getCtx(); } catch {}
    // Duck music briefly while SFX plays
    if (musicEl && !musicEl.paused) {
      const vol = musicEl.volume;
      musicEl.volume = vol * 0.25;
      setTimeout(() => { try { musicEl.volume = vol; } catch {} }, 700);
    }
    SFX[sfxName]?.();
  }

  // Play button click sound — respects sfxOn setting
  function click() {
    if (!sfxOn) return;
    try { getCtx(); } catch {}
    SFX.click?.();
  }

  return { musicOn, sfxOn, setMusicOn, setSfxOn, play, click,
           musicStarted, startMusic, toggleMusic };
}

// ── AudioToggle ───────────────────────────────────────────────

function AudioToggle({ audio }) {
  const [expanded, setExpanded] = useState(false);
  const { musicOn, sfxOn, setSfxOn, musicStarted, startMusic, toggleMusic } = audio;
  const [volume, setVolume] = useLocalStorage("dawn_music_vol", 35);

  // Sync volume to audio element whenever it changes
  useEffect(() => {
    if (musicEl) musicEl.volume = volume / 100;
  }, [volume]);

  const needsTap = !musicStarted && musicOn;

  const volIcon = volume === 0 ? "🔇" : volume < 40 ? "🔉" : "🔊";

  return (
    <div style={{
      position: "fixed", bottom: "1.5rem", right: "1rem",
      display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem",
      zIndex: 900,
    }}>
      {/* Nudge label when music hasn't started yet */}
      {needsTap && !expanded && (
        <div onClick={() => { startMusic(); setExpanded(false); }} style={{
          background: "#1c1200", border: `1px solid ${T.gold}`,
          borderRadius: 20, padding: "0.35rem 0.75rem",
          color: T.gold, fontSize: "0.7rem", fontWeight: 700,
          cursor: "pointer", whiteSpace: "nowrap",
          animation: "fadeUp 0.3s ease",
          boxShadow: `0 0 12px ${T.gold}33`,
        }}>
          ▶ Tap to play music
        </div>
      )}

      {expanded && (
        <div style={{
          display: "flex", flexDirection: "column", gap: "0.4rem",
          animation: "fadeUp 0.2s ease",
          background: T.surface, border: `1px solid ${T.borderHigh}`,
          borderRadius: 16, padding: "0.75rem", minWidth: 190,
          boxShadow: "0 8px 32px #00000066",
        }}>
          {/* Music toggle row */}
          <button onClick={() => {
            if (!musicStarted) { startMusic(); }
            else toggleMusic();
          }} style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.45rem 0.7rem", borderRadius: 10,
            background: musicOn ? "#1c1200" : T.surfaceHigh,
            border: `1px solid ${musicOn ? T.gold : T.borderHigh}`,
            color: musicOn ? T.gold : T.textMuted,
            cursor: "pointer", fontSize: "0.75rem", fontWeight: 600,
            fontFamily: "inherit", width: "100%", textAlign: "left",
          }}>
            🎵 <span style={{ flex: 1 }}>{!musicStarted ? "▶ Start music" : musicOn ? "Music ON" : "Music OFF"}</span>
          </button>

          {/* Volume slider row — shown when music is on */}
          {musicOn && (
            <div style={{ padding: "0.3rem 0.4rem 0.1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <span style={{ color: T.textMuted, fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.05em" }}>VOLUME</span>
                <span style={{ color: T.gold, fontSize: "0.68rem", fontWeight: 700 }}>{volIcon} {volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                style={{ width: "100%", accentColor: T.gold, cursor: "pointer", height: 4 }}
              />
              {/* Quick preset buttons */}
              <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.45rem" }}>
                {[25, 50, 75, 100].map(v => (
                  <button key={v} onClick={() => setVolume(v)} style={{
                    flex: 1, padding: "0.2rem 0", borderRadius: 6,
                    background: volume === v ? "#1c1200" : T.surfaceHigh,
                    border: `1px solid ${volume === v ? T.gold : T.borderHigh}`,
                    color: volume === v ? T.gold : T.textDim,
                    cursor: "pointer", fontSize: "0.62rem", fontFamily: "inherit", fontWeight: volume === v ? 700 : 400,
                  }}>{v}%</button>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: T.borderHigh, margin: "0.1rem 0" }} />

          {/* SFX row */}
          <button onClick={() => setSfxOn(v => !v)} style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.45rem 0.7rem", borderRadius: 10,
            background: sfxOn ? "#0a1c1a" : T.surfaceHigh,
            border: `1px solid ${sfxOn ? T.green : T.borderHigh}`,
            color: sfxOn ? T.green : T.textMuted,
            cursor: "pointer", fontSize: "0.75rem", fontWeight: 600,
            fontFamily: "inherit", width: "100%", textAlign: "left",
          }}>
            🔊 <span>{sfxOn ? "SFX ON" : "SFX OFF"}</span>
          </button>
        </div>
      )}

      {/* Main ♪ button */}
      <button onClick={() => {
        if (needsTap) { startMusic(); return; }
        setExpanded(e => !e);
      }} style={{
        width: 44, height: 44, borderRadius: "50%",
        background: (musicOn && musicStarted) ? "#1c1200" : T.surfaceHigh,
        border: `1.5px solid ${needsTap ? T.gold : (musicOn || sfxOn) ? T.gold : T.borderHigh}`,
        color: needsTap ? T.gold : (musicOn || sfxOn) ? T.gold : T.textMuted,
        cursor: "pointer", fontSize: "1.1rem",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: (musicOn && musicStarted) ? `0 0 16px ${T.gold}44` : needsTap ? `0 0 10px ${T.gold}33` : "none",
        transition: "all 0.2s",
      }} title="Audio settings">
        {needsTap ? "▶" : (musicOn || sfxOn) ? "♪" : "♪̸"}
      </button>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes answerCorrect {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.03); box-shadow: 0 0 28px #34d39977; }
          60%  { transform: scale(0.98); }
          100% { transform: scale(1); }
        }
        @keyframes answerWrong {
          0%   { transform: translateX(0); }
          15%  { transform: translateX(-7px); }
          30%  { transform: translateX(7px); }
          45%  { transform: translateX(-5px); }
          60%  { transform: translateX(5px); }
          75%  { transform: translateX(-2px); }
          100% { transform: translateX(0); }
        }
        @keyframes sunrayPop {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.4); color: #fef08a; }
          100% { transform: scale(1); }
        }
        @keyframes reactionPop {
          0%   { opacity: 0; transform: translateX(-50%) scale(0.3); }
          25%  { opacity: 1; transform: translateX(-50%) scale(1.15); }
          60%  { opacity: 1; transform: translateX(-50%) scale(1); }
          85%  { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) scale(0.9) translateY(-20px); }
        }
        input[type=range]::-webkit-slider-thumb { width: 14px; height: 14px; }
      `}</style>
    </div>
  );
}

function useCountdown(seconds, active, onExpire) {
  const [remaining, setRemaining] = useState(seconds);
  const ref = useRef(null);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!active) { clearInterval(ref.current); return; }
    ref.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(ref.current); onExpire(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [active, onExpire]);

  return remaining;
}

// ─────────────────────────────────────────────────────────────
//  UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────

export function getRank(sunrays) {
  let r = RANKS[0];
  for (const x of RANKS) if (sunrays >= x.threshold) r = x;
  return r;
}

export function getNextRank(sunrays) {
  for (const x of RANKS) if (sunrays < x.threshold) return x;
  return null;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleOptions(q) {
  // Pair each option with whether it is the correct answer
  const paired = q.options.map((opt, i) => ({ opt, isCorrect: i === q.correct }));
  const shuffled = shuffle(paired);
  return {
    ...q,
    options: shuffled.map(p => p.opt),
    correct: shuffled.findIndex(p => p.isCorrect),
  };
}

// Normalise a question's diff tag — custom questions may be missing it
function normaliseDiff(q) {
  const d = (q.diff || "").toLowerCase();
  if (d === "beginner" || d === "intermediate" || d === "expert") return q;
  // Assign based on id prefix if diff is missing
  const id = String(q.id || "");
  const guessed = id.startsWith("b") ? "beginner"
                : id.startsWith("e") ? "expert"
                : "intermediate";
  return { ...q, diff: guessed };
}

// Seeded shuffle — deterministic for a given seed (used for daily question)
function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// RUN_LENGTH_CONFIG: how many questions per tier for each run length
const RUN_LENGTH_OPTIONS = [
  { value: 10, label: "Quick",    desc: "Beginner only",           tiers: [10, 0,  0]  },
  { value: 20, label: "Standard", desc: "Beginner + Intermediate", tiers: [10, 10, 0]  },
  { value: 30, label: "Full Run", desc: "All 3 tiers",             tiers: [10, 10, 10] },
];

function buildLadderPool(customQuestions = [], runLength = 30) {
  const cfg = RUN_LENGTH_OPTIONS.find(o => o.value === runLength) || RUN_LENGTH_OPTIONS[2];
  const [bTarget, iTarget, eTarget] = cfg.tiers;
  // Merge all sources and normalise diff
  const all = [
    ...BEGINNER_QS,
    ...INTERMEDIATE_QS,
    ...EXPERT_QS,
    ...customQuestions,
  ].map(normaliseDiff);

  // Deduplicate by id
  const seen = new Set();
  const unique = all.filter(q => {
    if (seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });

  const byDiff = {
    beginner:     shuffle(unique.filter(q => q.diff === "beginner")),
    intermediate: shuffle(unique.filter(q => q.diff === "intermediate")),
    expert:       shuffle(unique.filter(q => q.diff === "expert")),
  };

  const picked = [];
  const usedIds = new Set();

  function take(pool, n) {
    const results = [];
    for (const q of pool) {
      if (results.length >= n) break;
      if (!usedIds.has(q.id)) { results.push(q); usedIds.add(q.id); }
    }
    return results;
  }

  picked.push(...take(byDiff.beginner, bTarget));
  picked.push(...take(byDiff.intermediate, iTarget));
  picked.push(...take(byDiff.expert, eTarget));

  // If any tier came up short, fill from overflow
  const totalNeeded = runLength;
  if (picked.length < totalNeeded) {
    const overflow = shuffle(unique.filter(q => !usedIds.has(q.id)));
    for (const q of overflow) {
      if (picked.length >= totalNeeded) break;
      picked.push(q);
      usedIds.add(q.id);
    }
  }

  // Shuffle options on every question so correct answer isn't always position 1
  return picked.map(shuffleOptions);
}


// ── Per-tier question length options ────────────────────────────
const TIER_LENGTH_OPTIONS = [5, 10, 15, 20];

// Lives awarded per tier x question count
// beginner / intermediate: max 2 lives (1 @ 5Q, 2 @ 10Q+)
// expert: max 3 lives (1 @ 5Q, 2 @ 10Q, 3 @ 15Q+)
const TIER_LIVES = {
  beginner:     { 5: 1, 10: 2, 15: 2, 20: 2 },
  intermediate: { 5: 1, 10: 2, 15: 2, 20: 2 },
  expert:       { 5: 1, 10: 2, 15: 3, 20: 3 },
};

function livesForTier(diff, length) {
  return (TIER_LIVES[diff] || TIER_LIVES.beginner)[length] || 1;
}


// ─────────────────────────────────────────────────────────────
//  AI AUTO TOP-UP
//  Silently generates extra questions when the built-in pool
//  for a tier runs low. Stores them in localStorage so they
//  persist across sessions. Deduped against built-in IDs.
// ─────────────────────────────────────────────────────────────

const AI_TOPUP_STORAGE_KEY = {
  beginner:     "dawn_ai_questions_beginner",
  intermediate: "dawn_ai_questions_intermediate",
  expert:       "dawn_ai_questions_expert",
};

function loadAIQuestions(diff) {
  try {
    const raw = localStorage.getItem(AI_TOPUP_STORAGE_KEY[diff] || "");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAIQuestions(diff, questions) {
  try {
    localStorage.setItem(AI_TOPUP_STORAGE_KEY[diff], JSON.stringify(questions));
  } catch {}
}

const TOP_UP_PROMPT = (diff, n) => `You are generating quiz questions about Dawn Internet and the broader Web3/DePIN/blockchain ecosystem for a learning app called DawnQuiz.

Generate exactly ${n} ${diff}-level multiple-choice questions. Each question must be unique, factually accurate, and directly relevant to Dawn Internet, decentralized infrastructure (DePIN), blockchain technology, DeFi, or Web3 concepts.

Difficulty guidance:
- beginner: foundational concepts, terminology, basic mechanics — no prior knowledge required
- intermediate: node operations, tokenomics, DeFi mechanics, Layer 2s, real-world protocol behaviour
- expert: advanced attack vectors, cryptoeconomic security, protocol design trade-offs, zero-knowledge proofs, Byzantine fault tolerance

Return ONLY a valid JSON array with no markdown, no preamble, no trailing text. Each object must have exactly these fields:
{
  "id": "ai_${diff}_TIMESTAMP_INDEX",
  "diff": "${diff}",
  "question": "...",
  "options": ["option A", "option B", "option C", "option D"],
  "correct": 0,
  "hint": "...",
  "explanation": "..."
}

Rules:
- "correct" is the 0-based index of the correct option in the "options" array
- CRITICAL: All 4 options must be similar in length and specificity. Wrong answers must be as detailed and plausible as the correct answer — never short throwaway phrases. A player should not be able to guess the correct answer by picking the longest or most detailed option.
- Hint must not give away the answer directly
- Explanation must be 1-3 sentences, educational, and accurate
- Do not repeat questions already covered by basic definitions — go deeper`;

// Returns the first saved provider key it can find
function getFirstSavedKey() {
  for (const prov of Object.values(AI_PROVIDERS)) {
    const k = localStorage.getItem(prov.storageKey);
    if (k) return { provider: prov.id, apiKey: k };
  }
  return null;
}

// Runs silently in the background — does NOT block gameplay
async function triggerAITopUp(diff, targetCount = 30) {
  const creds = getFirstSavedKey();
  if (!creds) return; // No API key — skip silently

  const existing = loadAIQuestions(diff);
  const builtIn = { beginner: BEGINNER_QS, intermediate: INTERMEDIATE_QS, expert: EXPERT_QS }[diff] || [];
  const totalHave = builtIn.length + existing.length;
  if (totalHave >= targetCount) return; // Already enough — skip

  const needed = targetCount - totalHave;
  const ts = Date.now();
  try {
    const raw = await callAI(creds.provider, creds.apiKey, TOP_UP_PROMPT(diff, needed));
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (!Array.isArray(parsed)) return;

    // Assign stable IDs and dedupe against existing
    const existingIds = new Set([...builtIn.map(q => q.id), ...existing.map(q => q.id)]);
    const fresh = parsed
      .filter(q => q.question && Array.isArray(q.options) && q.options.length === 4)
      .map((q, i) => ({ ...q, id: `ai_${diff}_${ts}_${i}`, diff }))
      .filter(q => !existingIds.has(q.id));

    if (fresh.length > 0) {
      saveAIQuestions(diff, [...existing, ...fresh]);
      console.log(`[DawnQuiz] AI top-up: +${fresh.length} ${diff} questions saved`);
    }
  } catch (err) {
    // Silent failure — gameplay is never affected
    console.debug("[DawnQuiz] AI top-up skipped:", err.message);
  }
}

// Build a pool for a single difficulty tier (variable length)
// Also pulls from AI-generated questions stored in localStorage
function buildTierPool(customQuestions = [], diff = "beginner", length = 10) {
  const aiQs = loadAIQuestions(diff).map(normaliseDiff);
  const all = [
    ...BEGINNER_QS, ...INTERMEDIATE_QS, ...EXPERT_QS,
    ...aiQs,
    ...customQuestions,
  ].map(normaliseDiff);
  const seen = new Set();
  const unique = all.filter(q => { if (seen.has(q.id)) return false; seen.add(q.id); return true; });
  const pool = shuffle(unique.filter(q => q.diff === diff));
  // Fallback: fill from any diff if not enough
  if (pool.length < length) {
    const rest = shuffle(unique.filter(q => q.diff !== diff));
    for (const q of rest) { if (pool.length >= length) break; pool.push(q); }
  }
  // Trigger a background top-up if pool is getting small (< 2x the requested length)
  if (pool.filter(q => q.diff === diff).length < length * 2) {
    triggerAITopUp(diff, 80).catch(() => {});
  }
  return pool.slice(0, length).map(shuffleOptions);
}


const TIER_META = {
  beginner:     { label: "Beginner",     icon: "🌱", color: "#34d399", bg: "#011c11", border: "#34d39933", order: 0 },
  intermediate: { label: "Intermediate", icon: "⚡", color: "#fbbf24", bg: "#1c1200", border: "#fbbf2433", order: 1 },
  expert:       { label: "Expert",       icon: "🔴", color: "#f87171", bg: "#1c0505", border: "#f8717133", order: 2 },
};

// ─────────────────────────────────────────────────────────────
//  SHARE UTILITY
// ─────────────────────────────────────────────────────────────

const APP_URL = "https://deployer-quiz.vercel.app";

// Generate a stable 4-char hex suffix from a device fingerprint
// Stored in localStorage so it never changes for this device
function getDeviceSuffix() {
  const LS_KEY = "dawn_device_suffix";
  try {
    let sfx = localStorage.getItem(LS_KEY);
    if (!sfx) {
      // Generate from random + timestamp, take 4 hex chars
      sfx = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, "0");
      localStorage.setItem(LS_KEY, sfx);
    }
    return sfx;
  } catch { return "0000"; }
}

// Format username for display: "Name#A9E3"
function formatUsername(username) {
  if (!username) return "Anonymous";
  if (username.includes("#")) return username; // already suffixed
  return `${username}#${getDeviceSuffix()}`;
}
const DAWN_HANDLE = "@dawninternet";

// ── Challenge seed helpers ─────────────────────────────────────
function genChallengeSeed() {
  return Math.floor(Math.random() * 999983).toString(36).toUpperCase().padStart(5, "0");
}
function getChallengeFromUrl() {
  try { return new URLSearchParams(window.location.search).get("challenge") || null; } catch { return null; }
}
function getTournamentCodeFromUrl() {
  try { return new URLSearchParams(window.location.search).get("tournament") || null; } catch { return null; }
}
function buildChallengeUrl(seed, runLength) {
  return `${APP_URL}?challenge=${seed}&ql=${runLength}`;
}
function buildChallengePool(customQuestions, runLength, seed) {
  // Same as buildLadderPool but with seeded shuffle instead of random
  const cfg = RUN_LENGTH_OPTIONS.find(o => o.value === runLength) || RUN_LENGTH_OPTIONS[2];
  const [bTarget, iTarget, eTarget] = cfg.tiers;
  const all = [...BEGINNER_QS, ...INTERMEDIATE_QS, ...EXPERT_QS, ...customQuestions].map(normaliseDiff);
  const seen = new Set();
  const unique = all.filter(q => { if (seen.has(q.id)) return false; seen.add(q.id); return true; });
  const numSeed = seed.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 0);
  const byDiff = {
    beginner:     seededShuffle(unique.filter(q => q.diff === "beginner"),     numSeed),
    intermediate: seededShuffle(unique.filter(q => q.diff === "intermediate"), numSeed + 1),
    expert:       seededShuffle(unique.filter(q => q.diff === "expert"),       numSeed + 2),
  };
  const picked = [];
  const usedIds = new Set();
  function take(pool, n) {
    const r = [];
    for (const q of pool) { if (r.length >= n) break; if (!usedIds.has(q.id)) { r.push(q); usedIds.add(q.id); } }
    return r;
  }
  picked.push(...take(byDiff.beginner, bTarget));
  picked.push(...take(byDiff.intermediate, iTarget));
  picked.push(...take(byDiff.expert, eTarget));
  if (picked.length < runLength) {
    const overflow = seededShuffle(unique.filter(q => !usedIds.has(q.id)), numSeed + 3);
    for (const q of overflow) { if (picked.length >= runLength) break; picked.push(q); usedIds.add(q.id); }
  }
  // For challenges, shuffle options consistently using seed (not random)
  return picked.map(q => { const s = shuffleOptions(q); return s; });
}

async function shareContent(text) {
  const fullText = `${text}\n\n${DAWN_HANDLE} | ${APP_URL}`;
  // Try native share sheet first (mobile)
  if (navigator.share) {
    try {
      await navigator.share({ text: fullText });
      return "shared";
    } catch (e) {
      if (e.name === "AbortError") return "cancelled";
      // Fall through to clipboard
    }
  }
  // Clipboard fallback — works on desktop
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(fullText);
      return "copied";
    }
    // Legacy fallback for older browsers
    const ta = document.createElement("textarea");
    ta.value = fullText;
    ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return "copied";
  } catch {
    return "failed";
  }
}

function ShareBtn({ text, label = "Share", style = {} }) {
  const [status, setStatus] = useState(null); // null | "copied" | "shared" | "failed"

  async function handleShare() {
    const result = await shareContent(text);
    if (result === "cancelled") return;
    setStatus(result);
    setTimeout(() => setStatus(null), 2500);
  }

  const btnText = status === "copied" ? "✓ Copied!" :
                  status === "shared" ? "✓ Shared!" :
                  status === "failed" ? "✕ Try again" :
                  `↗ ${label}`;

  const btnColor = status === "copied" || status === "shared" ? T.green :
                   status === "failed" ? T.red : T.gold;

  return (
    <button onClick={handleShare} style={{
      background: "none",
      border: `1.5px solid ${btnColor}`,
      borderRadius: 12,
      padding: "0.75rem 1rem",
      color: btnColor,
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 700,
      fontSize: "0.88rem",
      width: "100%",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.4rem",
      ...style,
    }}>
      {btnText}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
//  PLAYER STATE REDUCER
// ─────────────────────────────────────────────────────────────

const DEFAULT_ARCHIVE = [
  {
    id: "a1", title: "Dawn Discord AMA Quiz", source: "Discord", date: "Mar 1",
    sunrays: 3, desc: "Community AMA session quiz covering Dawn fundamentals.",
    questionList: [
      { id:"da1", question:"What is Dawn's core mission?", options:["Build a social network","Decentralize internet access and bandwidth","Create a new cryptocurrency","Replace mobile apps"], correct:1, explanation:"Dawn's mission is to decentralize internet infrastructure by enabling community bandwidth contribution." },
      { id:"da2", question:"How do you earn Sunrays?", options:["By purchasing them","By completing quizzes, modules and daily activities","By referring friends only","By staking tokens"], correct:1, explanation:"Sunrays are earned through active participation — quizzes, modules, daily questions and challenges." },
      { id:"da3", question:"What is a BlackBox node?", options:["A cloud server","A dedicated hardware device for high-performance network deployment","A mobile app","A browser extension"], correct:1, explanation:"The BlackBox is Dawn's dedicated hardware node for maximum bandwidth contribution." },
    ],
  },
  {
    id: "a2", title: "X Community Challenge #1", source: "X (Twitter)", date: "Feb 20",
    sunrays: 2, desc: "Twitter/X community challenge on nodes and deployment.",
    questionList: [
      { id:"xc1", question:"What does DePIN stand for?", options:["Decentralized Proof-of-Infrastructure Network","Decentralized Physical Infrastructure Network","Distributed Private Internet Node","Delegated Protocol Infrastructure Network"], correct:1, explanation:"DePIN = Decentralized Physical Infrastructure Network. Dawn is a DePIN protocol." },
      { id:"xc2", question:"What resource does Dawn's network rely on from contributors?", options:["Electricity only","Unused internet bandwidth","GPU processing power","Hard drive storage"], correct:1, explanation:"Dawn contributors share unused internet bandwidth to build the decentralized network." },
    ],
  },
  {
    id: "a3", title: "Telegram Weekly Trivia", source: "Telegram", date: "Feb 14",
    sunrays: 4, desc: "Weekly trivia from the Dawn Telegram community.",
    questionList: [
      { id:"tg1", question:"What is Proof-of-Bandwidth?", options:["A mining algorithm","A consensus mechanism rewarding verifiable internet resource sharing","A payment method","A type of smart contract"], correct:1, explanation:"Proof-of-Bandwidth rewards nodes for providing measurable, useful internet resources to the Dawn network." },
      { id:"tg2", question:"What rank comes after Trailblazer?", options:["Beacon","Architect","Luminary","Solar Sentinel"], correct:0, explanation:"The rank ladder goes: Beginner → Trailblazer → Beacon → Architect → Luminary..." },
      { id:"tg3", question:"How many Sunrays do you need to unlock the BlackBox Challenge?", options:["100","140","160","200"], correct:2, explanation:"The BlackBox Challenge unlocks at 160 Sunrays." },
    ],
  },
  {
    id: "a4", title: "Solar Surge Feb Edition", source: "Special Event", date: "Feb 7",
    sunrays: 6, desc: "Double-Sunray special event quiz from February.",
    questionList: [
      { id:"ss1", question:"What is censorship resistance in decentralized networks?", options:["Blocking spam content","The ability to prevent any single entity from restricting access","Faster content delivery","Encrypted messaging"], correct:1, explanation:"Censorship resistance means no government or corporation can block your access to the network." },
      { id:"ss2", question:"How many questions must you answer correctly in the BlackBox Challenge?", options:["6 out of 10","8 out of 10","10 out of 10","7 out of 10"], correct:1, explanation:"You must score 8/10 or better to pass the BlackBox Challenge and earn the title." },
      { id:"ss3", question:"What is the Deployer Final Run?", options:["A beginner quiz","A 20-question expert gauntlet with a 15-second timer per question","A team challenge","A daily quiz"], correct:1, explanation:"The Deployer Final Run is the ultimate challenge — 20 hard questions, 15s timer, no lifelines." },
    ],
  },
];

const NAV_DEFAULTS = {
  game:        { label: "Play Game",       sub: "DawnQuiz" },
  learn:       { label: "Dawn Academy",    sub: "Learn & earn Sunrays" },
  study:       { label: "Study Materials", sub: "Official Dawn resources" },
  archive:     { label: "Quiz Archive",    sub: "Community quizzes" },
  leaderboard: { label: "Leaderboard",     sub: "Top players" },
  profile:     { label: "Profile",         sub: "Your stats & rank" },
};

const PLAYER_DEFAULT = {
  sunrays: 0,
  totalRuns: 0,
  perfectRuns: 0,
  longestStreak: 0,
  currentStreak: 0,
  lastPlayedDate: null,
  blackboxUnlocked: false,
  blackboxPassed: false,
  deployerUnlocked: false,
  deployerCompleted: false,
  questionsAnswered: 0,
  correctAnswers: 0,
  customQuestions: [],
  completedModules: [],
  archiveQuizzes: DEFAULT_ARCHIVE,
  completedArchive: [],
  lastRankLevel: 1,
  username: null,       // set during onboarding
  onboarded: false,     // whether onboarding has been completed
  streakMultiplier: 1,  // 1x default, increases with streak
  streakFreezes: 0,      // banked freezes (max 3); 1 earned per Expert run
  streakAtRisk: false,   // true if player missed yesterday but has a freeze available
  lastNodeProfile: null, // persisted after each completed run
  dailyHistory: [],      // array of dateStrings when daily was completed
};

function playerReducer(state, action) {
  const archive = () => state.archiveQuizzes || DEFAULT_ARCHIVE;
  const completed = () => state.completedArchive || [];
  switch (action.type) {
    case "EARN_SUNRAYS": {
      const mult = state.streakMultiplier || 1;
      const earned = Math.round(action.amount * mult);
      const next = state.sunrays + earned;
      const newRank = getRank(next);
      return {
        ...state,
        sunrays: next,
        blackboxUnlocked: next >= 160,
        deployerUnlocked: next >= 200 && state.blackboxPassed,
        lastRankLevel: newRank.level,
        _lastEarned: earned, // store for toast display
      };
    }
    case "RECORD_RUN":
      return {
        ...state,
        totalRuns: state.totalRuns + 1,
        perfectRuns: action.perfect ? state.perfectRuns + 1 : state.perfectRuns,
        questionsAnswered: state.questionsAnswered + action.answered,
        correctAnswers: state.correctAnswers + action.correct,
      };
    case "BLACKBOX_PASSED":
      return { ...state, blackboxPassed: true, deployerUnlocked: state.sunrays >= 200 };
    case "DEPLOYER_COMPLETED":
      return { ...state, deployerCompleted: true };
    case "ADD_QUESTION":
      return { ...state, customQuestions: [...state.customQuestions, action.question] };
    case "EDIT_QUESTION":
      return { ...state, customQuestions: state.customQuestions.map(q => q.id === action.question.id ? action.question : q) };
    case "DELETE_QUESTION":
      return { ...state, customQuestions: state.customQuestions.filter(q => q.id !== action.id) };
    case "CLEAR_ALL_QUESTIONS":
      return { ...state, customQuestions: [] };
    case "COMPLETE_MODULE":
      return { ...state, completedModules: [...state.completedModules.filter(m => m !== action.id), action.id] };
    case "ADD_ARCHIVE":
      return { ...state, archiveQuizzes: [...archive(), action.quiz] };
    case "EDIT_ARCHIVE":
      return { ...state, archiveQuizzes: archive().map(q => q.id === action.quiz.id ? action.quiz : q) };
    case "DELETE_ARCHIVE":
      return { ...state, archiveQuizzes: archive().filter(q => q.id !== action.id), completedArchive: completed().filter(id => id !== action.id) };
    case "COMPLETE_ARCHIVE":
      return { ...state, completedArchive: [...completed().filter(id => id !== action.id), action.id] };
    case "UPDATE_STREAK": {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const last = state.lastPlayedDate;
      const freezes = state.streakFreezes || 0;
      let newStreak, usedFreeze = false, atRisk = false;
      if (last === today) {
        // Already played today — no change
        newStreak = state.currentStreak;
      } else if (last === yesterday) {
        // Consecutive day — grow streak
        newStreak = state.currentStreak + 1;
      } else if (last && freezes > 0) {
        // Missed a day but has a freeze — auto-protect streak, mark at-risk
        newStreak = state.currentStreak;
        usedFreeze = true;
        atRisk = true;
      } else {
        // No freeze or never played — reset
        newStreak = 1;
      }
      const mult = newStreak >= 30 ? 2 : newStreak >= 14 ? 1.5 : newStreak >= 7 ? 1.25 : newStreak >= 3 ? 1.1 : 1;
      return {
        ...state,
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, state.longestStreak || 0),
        lastPlayedDate: today,
        streakMultiplier: mult,
        streakFreezes: usedFreeze ? Math.max(0, freezes - 1) : freezes,
        streakAtRisk: atRisk,
      };
    }
    case "EARN_STREAK_FREEZE": {
      const maxFreezes = 3;
      return { ...state, streakFreezes: Math.min(maxFreezes, (state.streakFreezes || 0) + 1) };
    }
    case "CLEAR_STREAK_AT_RISK":
      return { ...state, streakAtRisk: false };
    case "SAVE_NODE_PROFILE":
      return { ...state, lastNodeProfile: action.profile };
    case "DAILY_DONE": {
      const today = new Date().toDateString();
      const history = state.dailyHistory || [];
      if (history.includes(today)) return state;
      return { ...state, dailyHistory: [...history, today] };
    }
    case "SET_USERNAME":
      return { ...state, username: action.username };
    case "COMPLETE_ONBOARDING":
      return { ...state, onboarded: true, username: action.username };
    case "RESET_PROGRESS":
      return {
        ...PLAYER_DEFAULT,
        // Preserve account identity
        username: state.username,
        onboarded: state.onboarded,
      };
    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────
//  DESIGN TOKENS & SHARED STYLES
// ─────────────────────────────────────────────────────────────

const T = {
  bg: "#050d1a",        // Dawn deep navy
  surface: "#0a1628",   // slightly lighter navy
  surfaceHigh: "#0f1f35", // card surface
  border: "#1a3050",    // navy border
  borderHigh: "#2a2a48",
  gold: "#fbbf24",   // kept for sunrays
  orange: "#FF6B1A", // Dawn brand orange
  goldDim: "#92400e",
  text: "#eef2ff",
  textMuted: "#7b90b8",
  textDim: "#2e4a6e",
  green: "#34d399",
  red: "#f87171",
  purple: "#8b5cf6",
  blue: "#60a5fa",
};

const css = {
  screen: {
    minHeight: "100vh",
    background: T.bg,
    color: T.text,
    fontFamily: "'DM Sans', 'Syne', system-ui, sans-serif",
    overflowY: "auto",
    paddingBottom: "2rem",
  },
  card: {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: 16,
    padding: "1.1rem 1.25rem",
  },
  inp: {
    width: "100%",
    background: T.surfaceHigh,
    border: `1px solid ${T.borderHigh}`,
    borderRadius: 10,
    padding: "0.65rem 0.85rem",
    color: T.text,
    fontSize: "0.88rem",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  lbl: {
    color: T.textMuted,
    fontSize: "0.7rem",
    marginBottom: "0.35rem",
    display: "block",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  tag: c => ({
    fontSize: "0.65rem",
    fontWeight: 700,
    padding: "2px 8px",
    border: `1px solid ${c}`,
    borderRadius: 20,
    color: c,
    display: "inline-block",
    letterSpacing: "0.05em",
  }),
};

// Reusable UI primitives
function Btn({ children, onClick, variant = "primary", disabled, style = {}, ...rest }) {
  const base = {
    border: "none",
    borderRadius: 12,
    padding: "0.85rem 1rem",
    fontFamily: "inherit",
    fontWeight: 700,
    fontSize: "0.9rem",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: "transform 0.1s, opacity 0.2s",
    width: "100%",
    letterSpacing: "0.02em",
  };
  const variants = {
    primary: { background: "linear-gradient(135deg,#c44d0e,#e85d15,#FF6B1A)", color: "#fff", boxShadow: "0 4px 24px #FF6B1A33" },
    ghost: { background: "none", border: `1px solid ${T.borderHigh}`, color: T.textMuted },
    danger: { background: "linear-gradient(135deg,#7f1d1d,#dc2626)", color: "#fff", boxShadow: "0 4px 16px #dc262633" },
    purple: { background: "linear-gradient(135deg,#3b0764,#7c3aed,#a78bfa)", color: "#fff", boxShadow: "0 4px 20px #7c3aed44" },
  };
  return (
    <button onClick={disabled ? undefined : (e) => { try { SFX.click(); } catch {} onClick?.(e); }} style={{ ...base, ...variants[variant], ...style }} {...rest}>
      {children}
    </button>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: "0.85rem", padding: "0", display: "flex", alignItems: "center", gap: "0.35rem" }}>
      ← Back
    </button>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ color: T.text, fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.01em" }}>{children}</div>
      {sub && <div style={{ color: T.textMuted, fontSize: "0.8rem", marginTop: "0.2rem" }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, max, color = T.gold, height = 6 }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div style={{ height, background: T.border, borderRadius: height / 2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: height / 2, transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: `0 0 8px ${color}66` }} />
    </div>
  );
}

function RankBadge({ rank, size = "md" }) {
  const sz = size === "lg" ? { icon: "2.2rem", name: "1.1rem", pad: "0.6rem 1.25rem" } : { icon: "1rem", name: "0.8rem", pad: "0.3rem 0.85rem" };
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: T.surfaceHigh, border: `1px solid ${rank.color}44`, borderRadius: 24, padding: sz.pad }}>
      <span style={{ color: rank.accent, fontSize: sz.icon }}>{rank.icon}</span>
      <span style={{ color: rank.accent, fontWeight: 700, fontSize: sz.name }}>{rank.name}</span>
    </div>
  );
}

function DawnLogo({ height = 28 }) {
  return (
    <svg height={height} viewBox="0 0 380 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 55 C10 55, 24 10, 42 10 C60 10, 60 55, 78 55 C96 55, 96 10, 114 10 C132 10, 132 55, 150 55" stroke="#FF6B1A" strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M78 55 C96 55, 96 10, 114 10 C132 10, 132 55, 150 55 C168 55, 168 10, 186 10" stroke="#FF6B1A" strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
      <text x="210" y="62" fontFamily="'DM Sans','Syne','Arial Black',sans-serif" fontWeight="900" fontSize="58" fill="#FF6B1A" letterSpacing="-2">DAWN</text>
    </svg>
  );
}

function SunIcon({ size = 40, glow = false }) {
  const r = size / 2;
  const rays = 12;
  const pts = Array.from({ length: rays }, (_, i) => {
    const a = (i * 360 / rays) * Math.PI / 180;
    const r1 = r * 0.58, r2 = r * 0.82;
    return { x1: r + r1 * Math.cos(a), y1: r + r1 * Math.sin(a), x2: r + r2 * Math.cos(a), y2: r + r2 * Math.sin(a) };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: glow ? "drop-shadow(0 0 12px #fbbf24bb)" : "none" }}>
      <defs>
        <radialGradient id={`sg_${size}`}>
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f97316" />
        </radialGradient>
      </defs>
      {pts.map((p, i) => <line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke="#fbbf24" strokeWidth={size * 0.042} strokeLinecap="round" />)}
      <circle cx={r} cy={r} r={r * 0.48} fill={`url(#sg_${size})`} />
      <circle cx={r} cy={r} r={r * 0.3} fill="#fef9c3" opacity={0.35} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
//  ANSWER OPTION COMPONENT
// ─────────────────────────────────────────────────────────────

function AnswerOption({ letter, text, state, disabled, onClick, highlight }) {
  // state: null | "selected" | "correct" | "wrong" | "eliminated" | "highlighted"
  const colors = {
    null:        { bg: T.surface,    border: T.borderHigh, color: T.text },
    selected:    { bg: "#0f1e35",    border: T.blue,       color: "#93c5fd" },
    correct:     { bg: "#022c22",    border: T.green,      color: T.green },
    wrong:       { bg: "#2d0a0a",    border: T.red,        color: T.red },
    eliminated:  { bg: T.bg,         border: T.border,     color: T.textDim },
    highlighted: { bg: "#1c1008",    border: T.gold,       color: T.gold },
  };
  const { bg, border, color } = colors[state] || colors.null;

  const animation =
    state === "correct" ? "answerCorrect 0.5s ease forwards" :
    state === "wrong"   ? "answerWrong 0.4s ease forwards" :
    "none";

  return (
    <button
      disabled={disabled || state === "eliminated"}
      onClick={onClick}
      style={{
        background: bg,
        border: `1.5px solid ${border}`,
        borderRadius: 12,
        padding: "0.85rem 1rem",
        textAlign: "left",
        color,
        cursor: (disabled || state === "eliminated") ? "default" : "pointer",
        display: "flex",
        gap: "0.75rem",
        alignItems: "center",
        fontSize: "0.88rem",
        lineHeight: 1.4,
        opacity: state === "eliminated" ? 0.3 : 1,
        transition: "background 0.2s, border-color 0.2s, color 0.2s",
        width: "100%",
        fontFamily: "inherit",
        fontWeight: state === "correct" || state === "wrong" ? 600 : 400,
        animation,
        boxShadow: state === "correct" ? `0 0 18px ${T.green}55` :
                   state === "wrong"   ? `0 0 18px ${T.red}44` : "none",
      }}
    >
      <span style={{
        width: 26, height: 26, borderRadius: "50%",
        border: `1.5px solid ${border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.72rem", fontWeight: 700, flexShrink: 0, color: border,
      }}>{letter}</span>
      {text}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
//  REACTION EMOJI — pops up on correct/wrong answer
// ─────────────────────────────────────────────────────────────

function ReactionEmoji({ correct }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 900);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      top: "38%",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9000,
      pointerEvents: "none",
      fontSize: "6rem",
      animation: "reactionPop 0.9s cubic-bezier(0.34,1.56,0.64,1) forwards",
      filter: correct
        ? "drop-shadow(0 0 24px #34d39988)"
        : "drop-shadow(0 0 24px #f8717188)",
      lineHeight: 1,
    }}>
      {correct ? "😄" : "😢"}
    </div>
  );
}



function ReportQuestionBtn({ question }) {
  const [reports, setReports] = useLocalStorage("dawn_question_reports", []);
  const already = reports.some(r => r.questionId === question.id);
  const [open, setOpen]   = useState(false);
  const [done, setDone]   = useState(already);
  const [issue, setIssue] = useState(""); // which type of issue
  const [suggestion, setSuggestion] = useState(""); // player's note

  const ISSUE_TYPES = [
    { k: "wrong_answer",   l: "The marked correct answer is wrong" },
    { k: "misleading",     l: "The question is misleading or unclear" },
    { k: "wrong_info",     l: "The explanation contains incorrect info" },
    { k: "outdated",       l: "Information is outdated" },
    { k: "other",          l: "Other issue" },
  ];

  function submitReport() {
    if (!issue) return;
    setReports(r => [...r, {
      questionId:  question.id,
      question:    question.question,
      correctAnswer: question.options[question.correct],
      options:     question.options,
      correct:     question.correct,
      issue,
      suggestion:  suggestion.trim(),
      ts:          Date.now(),
    }]);
    setDone(true);
    setOpen(false);
  }

  if (done) return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.5rem",
      marginTop: "0.5rem", padding: "0.45rem 0.75rem",
      background: "#071a07", border: "1px solid #34d39944",
      borderRadius: 8, animation: "sunrayPop 0.4s cubic-bezier(0.34,1.56,0.64,1)"
    }}>
      <span style={{ fontSize: "1rem" }}>✅</span>
      <div>
        <div style={{ color: T.green, fontWeight: 700, fontSize: "0.72rem" }}>Report received — thank you!</div>
        <div style={{ color: T.textDim, fontSize: "0.65rem" }}>Our team will review this question.</div>
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: "0.5rem" }}>
      {!open ? (
        <button onClick={() => setOpen(true)} style={{
          background: "none", border: "none", color: T.textMuted,
          fontSize: "0.7rem", cursor: "pointer", fontFamily: "inherit",
          padding: "0.2rem 0", display: "flex", alignItems: "center", gap: "0.3rem",
        }}>
          ⚐ Report an issue with this question
        </button>
      ) : (
        <div style={{ background: "#130a0a", border: `1px solid ${T.red}44`, borderRadius: 12, padding: "0.85rem 1rem", marginTop: "0.25rem" }}>
          <div style={{ color: T.red, fontWeight: 700, fontSize: "0.8rem", marginBottom: "0.6rem" }}>⚑ Report Issue</div>

          {/* Issue type selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.75rem" }}>
            {ISSUE_TYPES.map(t => (
              <button key={t.k} onClick={() => setIssue(t.k)} style={{
                textAlign: "left", padding: "0.45rem 0.7rem", borderRadius: 8,
                border: `1px solid ${issue === t.k ? T.red : T.border}`,
                background: issue === t.k ? "#2d0a0a" : T.surface,
                color: issue === t.k ? "#fca5a5" : T.textMuted,
                cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: "0.5rem",
              }}>
                <span>{issue === t.k ? "●" : "○"}</span> {t.l}
              </button>
            ))}
          </div>

          {/* Optional note */}
          <textarea
            value={suggestion}
            onChange={e => setSuggestion(e.target.value)}
            placeholder="Optional: What do you think the correct answer or fix should be?"
            rows={2}
            style={{ ...css.inp, resize: "vertical", fontSize: "0.78rem", marginBottom: "0.6rem" }}
          />

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={submitReport} disabled={!issue} style={{
              flex: 1, padding: "0.6rem", borderRadius: 10,
              background: issue ? T.red : T.border,
              border: "none", color: issue ? "#fff" : T.textDim,
              cursor: issue ? "pointer" : "default",
              fontFamily: "inherit", fontWeight: 700, fontSize: "0.8rem",
            }}>Submit Report</button>
            <button onClick={() => { setOpen(false); setIssue(""); setSuggestion(""); }} style={{
              padding: "0.6rem 0.85rem", borderRadius: 10, border: `1px solid ${T.border}`,
              background: "none", color: T.textMuted, cursor: "pointer",
              fontFamily: "inherit", fontSize: "0.8rem",
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionCard({ question, questionNumber, totalQuestions, onAnswer, answered, selectedIndex, lifelines, onLifeline, showTimer, timerSecs, timerActive, onTimerExpire, mode = "standard" }) {
  const [eliminated, setEliminated] = useState([]);
  const [highlighted, setHighlighted] = useState(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [reaction, setReaction] = useState(null); // null | "correct" | "wrong"
  const [reactionKey, setReactionKey] = useState(0);

  const timerLeft = useCountdown(timerSecs || 15, showTimer && timerActive && !answered, onTimerExpire || (() => {}));

  useEffect(() => {
    setEliminated([]);
    setHighlighted(null);
    setHintVisible(false);
    setReaction(null);
  }, [questionNumber]);

  function handleAnswerWithReaction(i) {
    const isCorrect = i === question.correct;
    setReaction(isCorrect ? "correct" : "wrong");
    setReactionKey(k => k + 1);
    // Pass metadata so GameScreen can compute multipliers
    onAnswer(i, { timeLeft: timerLeft, timerSecs: timerSecs || 0, hintUsed: hintVisible });
  }

  function useLifeline(type) {
    if (!lifelines || !lifelines[type]) return;
    onLifeline(type);
    if (type === "fifty") {
      const wrong = [0, 1, 2, 3].filter(i => i !== question.correct);
      setEliminated(shuffle(wrong).slice(0, 2));
    } else if (type === "community") {
      setHighlighted(question.correct);
    } else if (type === "hint") {
      setHintVisible(true);
    }
  }

  const getState = (i) => {
    if (eliminated.includes(i)) return "eliminated";
    if (answered) {
      if (i === question.correct) return "correct";
      if (i === selectedIndex) return "wrong";
      return null;
    }
    if (highlighted === i) return "highlighted";
    if (selectedIndex === i) return "selected";
    return null;
  };

  const pct = totalQuestions > 0 ? ((questionNumber - 1) / totalQuestions) * 100 : 0;
  const diffColor = question.diff === "beginner" ? T.green : question.diff === "intermediate" ? T.gold : T.red;
  const timerPct = timerSecs ? (timerLeft / timerSecs) * 100 : 100;
  const timerColor = timerLeft > 10 ? T.green : timerLeft > 5 ? T.gold : T.red;

  return (
    <div>
      {/* Reaction emoji overlay */}
      {reaction && <ReactionEmoji key={reactionKey} correct={reaction === "correct"} />}
      <div style={{ padding: "0 1.25rem", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
          <span style={{ ...css.tag(diffColor) }}>{question.diff.toUpperCase()}</span>
          <span style={{ color: T.textMuted, fontSize: "0.8rem" }}>Q{questionNumber} / {totalQuestions}</span>
          {showTimer && (
            <span style={{ color: timerColor, fontWeight: 700, fontSize: "0.9rem", fontVariantNumeric: "tabular-nums" }}>
              {timerLeft}s
            </span>
          )}
        </div>
        <ProgressBar value={questionNumber - 1} max={totalQuestions} />
        {showTimer && <ProgressBar value={timerLeft} max={timerSecs} color={timerColor} height={3} />}
      </div>

      {/* Question text */}
      <div style={{ ...css.card, margin: "0 1.25rem 0.75rem", borderLeft: `3px solid ${diffColor}` }}>
        <p style={{ color: T.text, fontSize: "1rem", fontWeight: 600, lineHeight: 1.55, margin: 0 }}>
          {question.question}
        </p>
      </div>

      {/* Hint */}
      {hintVisible && (
        <div style={{ margin: "0 1.25rem 0.75rem", background: "#0e1a0e", border: `1px solid ${T.green}44`, borderRadius: 10, padding: "0.75rem 1rem", fontSize: "0.8rem", color: "#86efac", lineHeight: 1.5 }}>
          💡 {question.hint}
        </div>
      )}

      {/* Options */}
      <div style={{ padding: "0 1.25rem", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
        {["A", "B", "C", "D"].map((letter, i) => (
          <AnswerOption
            key={i}
            letter={letter}
            text={question.options[i]}
            state={getState(i)}
            disabled={answered}
            onClick={() => handleAnswerWithReaction(i)}
          />
        ))}
      </div>

      {/* Post-answer explanation + report */}
      {answered && (
        <div style={{ margin: "0.75rem 1.25rem 0" }}>
          <div style={{ padding: "0.85rem 1rem", background: selectedIndex === question.correct ? "#011c11" : "#1c0505", border: `1px solid ${selectedIndex === question.correct ? T.green + "55" : T.red + "55"}`, borderRadius: 12, fontSize: "0.82rem", color: selectedIndex === question.correct ? "#86efac" : "#fca5a5", lineHeight: 1.6 }}>
            <strong>{selectedIndex === question.correct ? "✓ Correct! " : "✗ Wrong. "}</strong>
            {question.explanation}
          </div>
          <ReportQuestionBtn question={question} />
        </div>
      )}

      {/* Lifelines (standard mode only) */}
      {lifelines && mode === "standard" && (
        <div style={{ padding: "1rem 1.25rem 0" }}>
          <div style={{ ...css.lbl, marginBottom: "0.5rem" }}>LIFELINES</div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[
              { key: "fifty", icon: "½", label: "50/50" },
              { key: "community", icon: "📡", label: "Ask" },
              { key: "hint", icon: "📖", label: "Docs" },
            ].map(ll => (
              <button key={ll.key}
                disabled={!lifelines[ll.key] || answered}
                onClick={() => useLifeline(ll.key)}
                style={{
                  flex: 1, padding: "0.6rem 0.25rem",
                  background: lifelines[ll.key] ? T.surfaceHigh : T.bg,
                  border: `1px solid ${lifelines[ll.key] ? T.borderHigh : T.border}`,
                  borderRadius: 10, color: lifelines[ll.key] ? T.text : T.textDim,
                  cursor: lifelines[ll.key] && !answered ? "pointer" : "default",
                  fontSize: "0.7rem", textAlign: "center", fontFamily: "inherit",
                  opacity: lifelines[ll.key] ? 1 : 0.35,
                }}>
                <div style={{ fontSize: "1.1rem" }}>{ll.icon}</div>
                <div style={{ fontSize: "0.6rem", marginTop: "0.2rem" }}>{ll.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  SCORE MULTIPLIER SYSTEM
// ─────────────────────────────────────────────────────────────

// Multipliers — small %s that stack onto checkpoint sunrays
const MULTIPLIERS = {
  fast:    { label: "Fast Answer",    bonus: 0.08, icon: "⚡" },
  noHint:  { label: "No Hint",        bonus: 0.05, icon: "📖" },
  streak:  { label: "Correct Streak", bonus: 0.08, icon: "🔥" },
  perfect: { label: "Perfect Tier",   bonus: 0.10, icon: "✦"  },
};
// Max possible stack: 1.31× — multipliers apply only to checkpoint sunrays

// Sunrays per checkpoint (×3 per tier) by diff × tierLength
const SUNRAY_CHECKPOINT = {
  beginner:     { 5: 0, 10: 1, 15: 2, 20: 3 },
  intermediate: { 5: 0, 10: 2, 15: 3, 20: 4 },
  expert:       { 5: 1, 10: 3, 15: 4, 20: 5 },
};

function checkpointSunrays(diff, length) {
  return (SUNRAY_CHECKPOINT[diff] || SUNRAY_CHECKPOINT.beginner)[length] || 0;
}

const SUNRAY_PERFECT_FLAT = 1;  // flat bonus on top of multiplied total

// Returns { base, bonuses: [{key,label,icon,pct}], total, multiplier }
function calcMultiplier(meta, correctStreak, isPerfect = false) {
  const bonuses = [];

  // Graduated speed bonus: +10% per 5 seconds saved (earn modes with rewards only)
  // meta.secsPerQ = per-question time allocation; meta.secsUsed = actual time taken
  if (meta?.secsPerQ > 0 && meta?.secsUsed !== undefined && meta?.hasReward) {
    const timeLeft = Math.max(0, meta.secsPerQ - meta.secsUsed);
    const speedTiers = Math.floor(timeLeft / 5);
    if (speedTiers > 0) {
      const speedBonusPct = speedTiers * 0.10;  // +10% per 5s saved
      bonuses.push({ label: `Speed ×${speedTiers} (${timeLeft.toFixed(0)}s left)`, bonus: speedBonusPct, icon: "⚡" });
    }
  }

  // No hint used
  if (!meta?.hintUsed) {
    bonuses.push(MULTIPLIERS.noHint);
  }

  // Correct streak: 3 or more correct in a row
  if (correctStreak >= 3) {
    bonuses.push(MULTIPLIERS.streak);
  }

  // Perfect run bonus (applied at end of run only)
  if (isPerfect) {
    bonuses.push(MULTIPLIERS.perfect);
  }

  const multiplier = 1 + bonuses.reduce((sum, b) => sum + b.bonus, 0);
  return { bonuses, multiplier };
}

// ─────────────────────────────────────────────────────────────
//  NODE OPERATOR PERSONALITY SYSTEM
// ─────────────────────────────────────────────────────────────

const NODE_PROFILES = [
  {
    id: "architect",
    type: "Infrastructure Architect",
    icon: "🏗",
    color: "#60a5fa",
    tagline: "You think in systems, not shortcuts.",
    strength: "Network Design",
    weakness: "Token Economics",
    desc: "You excel at seeing the big picture — routing, resilience, and architecture. You take your time and get it right. The network's backbone is built by operators like you.",
    trait: "Deliberate & precise",
  },
  {
    id: "pioneer",
    type: "Protocol Pioneer",
    icon: "⚡",
    color: "#fbbf24",
    tagline: "First in, fastest out — and usually right.",
    strength: "Protocol Mechanics",
    weakness: "Edge Case Analysis",
    desc: "You move fast and trust your instincts. Your speed without sacrificing accuracy marks you as a rare talent — someone who's internalized the protocol deeply.",
    trait: "Fast & intuitive",
  },
  {
    id: "analyst",
    type: "The Analyst",
    icon: "🔬",
    color: "#8b5cf6",
    tagline: "No assumption goes unverified.",
    strength: "Research & Due Diligence",
    weakness: "Real-time Decision Making",
    desc: "You read the docs, use the hints, and verify everything before committing. Your deployment will never fail because of something you didn't check.",
    trait: "Methodical & thorough",
  },
  {
    id: "baron",
    type: "Bandwidth Baron",
    icon: "📡",
    color: "#34d399",
    tagline: "You know the pipes better than anyone.",
    strength: "Bandwidth & Connectivity",
    weakness: "Cryptographic Security",
    desc: "Infrastructure and connectivity are your domain. You understand what moves across the network better than most — now it's time to go deeper on the security layer.",
    trait: "Practical & network-savvy",
  },
  {
    id: "economist",
    type: "Token Theorist",
    icon: "💰",
    color: "#f59e0b",
    tagline: "You see the incentives everyone else misses.",
    strength: "Token Economics",
    weakness: "Physical Infrastructure",
    desc: "You understand why the network works — the incentive design, the emissions model, the game theory. You'd make a great tokenomics designer. Now go touch some hardware.",
    trait: "Strategic & incentive-driven",
  },
  {
    id: "sentinel",
    type: "The Sentinel",
    icon: "🛡",
    color: "#f97316",
    tagline: "Consistent. Reliable. Unbreakable.",
    strength: "Security & Reliability",
    weakness: "Experimental Features",
    desc: "You don't miss. Your node would have 99.99% uptime because you understand every failure mode before it happens. The network needs more operators like you.",
    trait: "Consistent & unshakeable",
  },
  {
    id: "nomad",
    type: "Network Nomad",
    icon: "🌐",
    color: "#ec4899",
    tagline: "You roam the protocol, learning as you go.",
    strength: "Adaptability",
    weakness: "Specialisation",
    desc: "You've got broad knowledge across the whole stack — fundamentals, deployment, economics. You're harder to categorise than most, which means you can fill any gap the network needs.",
    trait: "Versatile & curious",
  },
  {
    id: "builder",
    type: "BlackBox Builder",
    icon: "◼",
    color: "#a78bfa",
    tagline: "You came here to deploy, not to theorise.",
    strength: "Hardware Deployment",
    weakness: "Protocol Theory",
    desc: "You're hands-on. You understand the BlackBox, the physical layer, and what it takes to keep a node running. The gap between theory and running hardware? You've already crossed it.",
    trait: "Hands-on & deployment-focused",
  },
];

// Analyse the run log and assign a node profile
// runLog: [{ qi, qId, diff, correct, fast, hintUsed }]
function calcNodeProfile(runLog, pool) {
  const total   = runLog.length;
  if (total === 0) return NODE_PROFILES.find(p => p.id === "nomad");

  const byDiff  = { beginner: [], intermediate: [], expert: [] };
  runLog.forEach(r => {
    const d = r.diff || "intermediate";
    if (byDiff[d]) byDiff[d].push(r);
  });

  const pct = arr => arr.length ? arr.filter(r => r.correct).length / arr.length : 0;
  const bPct = pct(byDiff.beginner);
  const iPct = pct(byDiff.intermediate);
  const ePct = pct(byDiff.expert);
  const overallPct = pct(runLog);

  const fastCount  = runLog.filter(r => r.fast).length;
  const hintCount  = runLog.filter(r => r.hintUsed).length;
  const fastRatio  = total > 0 ? fastCount / total : 0;
  const hintRatio  = total > 0 ? hintCount / total : 0;

  // Scoring map — higher = more likely to be that type
  const scores = {
    architect:  (ePct * 3) + (iPct) + (1 - fastRatio) * 1.5,
    pioneer:    (fastRatio * 3) + (overallPct * 2),
    analyst:    (hintRatio * 3) + (overallPct * 1.5),
    baron:      (bPct * 1.5) + (iPct * 2) + (1 - ePct) * 0.5,
    economist:  (iPct * 2.5) + (ePct * 1.5),
    sentinel:   (overallPct * 3) + (1 - hintRatio) + (1 - fastRatio) * 0.5,
    nomad:      (bPct + iPct + ePct) / 3 * 2, // broad, even spread
    builder:    (ePct * 2) + ((1 - iPct) * 1.5),
  };

  // Penalise types that need conditions not met
  if (fastRatio < 0.3) scores.pioneer  *= 0.5;
  if (hintRatio < 0.2) scores.analyst  *= 0.6;
  if (ePct < 0.4)      scores.architect *= 0.7;
  if (ePct < 0.4)      scores.builder   *= 0.7;
  if (overallPct < 0.7) scores.sentinel *= 0.4;

  const topId = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  return NODE_PROFILES.find(p => p.id === topId) || NODE_PROFILES.find(p => p.id === "nomad");
}




// ─────────────────────────────────────────────────────────────
//  CARD PRIVACY — shared field definitions + toggle hook
// ─────────────────────────────────────────────────────────────

// Fields that can appear on BOTH card types
const CARD_FIELD_DEFS = [
  { key: "score",      label: "Score",          desc: "e.g. 8 / 10",             defaultOn: true  },
  { key: "accuracy",   label: "Accuracy %",     desc: "Correct answer %",         defaultOn: true  },
  { key: "sunrays",    label: "Sunrays Earned",  desc: "☀ earned this tier",      defaultOn: true  },
  { key: "rank",       label: "Rank",            desc: "Your current rank tier",   defaultOn: true  },
  { key: "lives",      label: "Lives",           desc: "Lives remaining",          defaultOn: false },
  { key: "username",   label: "Username / ID",   desc: "OP/YOUR_NAME",             defaultOn: true  },
  { key: "totalSunrays", label: "Total Sunrays", desc: "Cumulative ☀ total",      defaultOn: false },
  { key: "nodeType",   label: "Node Archetype",  desc: "e.g. Protocol Pioneer",    defaultOn: true  },
  { key: "tagline",    label: "Tagline",         desc: "Archetype quote",          defaultOn: true  },
  { key: "strength",   label: "Strength",        desc: "Your strongest area",      defaultOn: true  },
  { key: "weakness",   label: "Weakness",        desc: "Your weakest area",        defaultOn: false },
  { key: "branding",   label: "DawnQuiz Brand",  desc: "☀ DAWNQUIZ + URL",        defaultOn: true  },
  { key: "disclaimer", label: "Disclaimer",      desc: "Not affiliated notice",    defaultOn: true  },
];

function useCardFields() {
  const [fields, setFields] = useState(() =>
    Object.fromEntries(CARD_FIELD_DEFS.map(f => [f.key, f.defaultOn]))
  );
  function toggle(key) {
    setFields(prev => ({ ...prev, [key]: !prev[key] }));
  }
  return [fields, toggle];
}

function CardPrivacyPanel({ fields, onToggle, accentColor }) {
  const ACCENT = accentColor || "#fbbf24";
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "0.85rem 1rem", marginBottom: "0.6rem" }}>
      <div style={{ color: T.text, fontWeight: 700, fontSize: "0.82rem", marginBottom: "0.65rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <span>🔒</span> Customise Card Before Sharing
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem" }}>
        {CARD_FIELD_DEFS.map(f => {
          const on = fields[f.key];
          return (
            <button
              key={f.key}
              onClick={() => onToggle(f.key)}
              title={f.desc}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.4rem 0.55rem", borderRadius: 8,
                border: `1px solid ${on ? ACCENT + "66" : T.border}`,
                background: on ? ACCENT + "12" : T.surfaceHigh,
                cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              <span style={{
                width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                background: on ? ACCENT : "transparent",
                border: `1.5px solid ${on ? ACCENT : T.textDim}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.55rem", color: "#000",
              }}>{on ? "✓" : ""}</span>
              <span style={{ color: on ? T.text : T.textMuted, fontSize: "0.68rem", fontWeight: on ? 600 : 400, textAlign: "left" }}>
                {f.label}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ color: T.textDim, fontSize: "0.62rem", marginTop: "0.55rem", textAlign: "center" }}>
        Unchecked fields are hidden from the downloaded image
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  TIER RESULT CANVAS IMAGE GENERATOR
//  Combined tier result + node profile — 1080×1350 (4:5 ratio)
// ─────────────────────────────────────────────────────────────
async function generateTierResultImage({ tier, correct, total, sunraysEarned, totalSunrays, rank, username, nodeProfile, lives, fields = {} }) {
  const F = key => fields[key] !== false; // default true if not specified
  const W = 1080, H = 1350;
  const PAD = 72;
  const IW = W - PAD * 2;
  const TIER = TIER_META[tier] || TIER_META.beginner;
  const ACCENT = TIER.color;

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  // ── Background ───────────────────────────────────────────────
  ctx.fillStyle = "#050d1a";
  ctx.fillRect(0, 0, W, H);

  // Radial glow top
  const g1 = ctx.createRadialGradient(W/2, 0, 0, W/2, 0, H * 0.6);
  g1.addColorStop(0, rgba(ACCENT, 0.20));
  g1.addColorStop(1, rgba("#07070f", 0));
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  // Dot grid
  ctx.fillStyle = rgba("#ffffff", 0.03);
  for (let gx = PAD; gx < W - PAD; gx += 52) {
    for (let gy = PAD; gy < H - PAD; gy += 52) {
      ctx.beginPath(); ctx.arc(gx, gy, 1.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ── Top accent bar ───────────────────────────────────────────
  drawRoundRect(ctx, PAD, PAD, IW, 6, 3);
  const barG = ctx.createLinearGradient(PAD, 0, PAD + IW, 0);
  barG.addColorStop(0, rgba(ACCENT, 0));
  barG.addColorStop(0.3, ACCENT);
  barG.addColorStop(0.7, ACCENT);
  barG.addColorStop(1, rgba(ACCENT, 0));
  ctx.fillStyle = barG;
  ctx.fill();

  // Outer card border
  drawRoundRect(ctx, PAD, PAD, IW, H - PAD * 2, 32);
  ctx.strokeStyle = rgba(ACCENT, 0.30);
  ctx.lineWidth = 2;
  ctx.stroke();

  let cy = PAD + 6 + 60;

  // ── DawnQuiz wordmark ────────────────────────────────────────
  ctx.font = "700 24px Arial";
  ctx.fillStyle = "#FF6B1A";
  ctx.textAlign = "right";
  ctx.fillText("☀ DAWNQUIZ", W - PAD - 16, PAD + 44);

  // ── Tier badge (icon + name) ─────────────────────────────────
  ctx.font = "700 26px Arial";
  ctx.fillStyle = rgba("#ffffff", 0.28);
  ctx.textAlign = "center";
  ctx.letterSpacing = "6px";
  ctx.fillText("TIER COMPLETE", W/2, cy);
  cy += 52;

  // Big tier icon circle
  const iconR = 68;
  ctx.beginPath();
  ctx.arc(W/2, cy + iconR, iconR, 0, Math.PI * 2);
  const iG = ctx.createRadialGradient(W/2, cy + iconR - 16, 0, W/2, cy + iconR, iconR);
  iG.addColorStop(0, rgba(ACCENT, 0.40));
  iG.addColorStop(1, rgba(ACCENT, 0.08));
  ctx.fillStyle = iG;
  ctx.fill();
  ctx.strokeStyle = rgba(ACCENT, 0.55);
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.font = "64px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(TIER.icon, W/2, cy + iconR + 4);
  ctx.textBaseline = "alphabetic";

  cy += iconR * 2 + 48;

  // Tier name
  ctx.font = "900 60px Arial";
  ctx.fillStyle = ACCENT;
  ctx.textAlign = "center";
  ctx.fillText(TIER.label, W/2, cy);
  cy += 56;

  // ── Score pill ───────────────────────────────────────────────
  const accPct = total > 0 ? Math.round((correct / total) * 100) : 0;
  if (F("score")) {
    const pillW = 480, pillH = 88, pillX = (W - pillW) / 2;
    drawRoundRect(ctx, pillX, cy, pillW, pillH, 44);
    ctx.fillStyle = rgba(ACCENT, 0.12); ctx.fill();
    ctx.strokeStyle = rgba(ACCENT, 0.4); ctx.lineWidth = 2; ctx.stroke();
    ctx.font = "900 48px Arial"; ctx.fillStyle = ACCENT; ctx.textAlign = "center";
    ctx.fillText(`${correct} / ${total}`, W/2, cy + 56);
    cy += pillH + 20;
  }
  if (F("accuracy")) {
    ctx.font = "26px Arial"; ctx.fillStyle = rgba("#ffffff", 0.38); ctx.textAlign = "center";
    ctx.fillText(`${accPct}% accuracy`, W/2, cy);
    cy += 52;
  } else if (F("score")) { cy += 52; }

  // ── Divider ──────────────────────────────────────────────────
  const divG = ctx.createLinearGradient(PAD + 40, 0, W - PAD - 40, 0);
  divG.addColorStop(0, rgba(ACCENT, 0));
  divG.addColorStop(0.5, rgba(ACCENT, 0.3));
  divG.addColorStop(1, rgba(ACCENT, 0));
  ctx.strokeStyle = divG;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD + 40, cy); ctx.lineTo(W - PAD - 40, cy); ctx.stroke();
  cy += 44;

  // ── Stats row: SUNRAYS | RANK | LIVES (only visible ones) ─────
  const allStats = [
    { key: "sunrays", label: "EARNED", value: `+${sunraysEarned} ☀`, color: ACCENT },
    { key: "rank",    label: "RANK",   value: rank,                   color: "#fbbf24" },
    { key: "lives",   label: "LIVES",  value: "☀".repeat(lives) + "○".repeat(3 - lives), color: lives === 3 ? "#34d399" : lives === 2 ? "#fbbf24" : "#f87171" },
  ].filter(s => F(s.key));
  if (allStats.length > 0) {
    const sW = IW / allStats.length;
    allStats.forEach((s, i) => {
      const sx = PAD + sW * i + sW / 2;
      ctx.font = "700 20px Arial"; ctx.fillStyle = rgba("#ffffff", 0.28); ctx.textAlign = "center";
      ctx.fillText(s.label, sx, cy);
      ctx.font = "800 28px Arial"; ctx.fillStyle = s.color;
      ctx.fillText(s.value, sx, cy + 38);
      if (i < allStats.length - 1) {
        ctx.strokeStyle = rgba("#ffffff", 0.09); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(PAD + sW * (i + 1), cy - 10); ctx.lineTo(PAD + sW * (i + 1), cy + 48); ctx.stroke();
      }
    });
    cy += 84;
  }

  // ── Operator & total sunrays row ─────────────────────────────
  if (F("username") || F("totalSunrays")) {
    const opParts = [];
    if (F("username")) opParts.push(`OP/${(username || "ANON").toUpperCase().replace(/\s/g,"_")}`);
    if (F("totalSunrays")) opParts.push(`${totalSunrays} ☀ total`);
    ctx.font = "24px Arial"; ctx.fillStyle = rgba("#ffffff", 0.30); ctx.textAlign = "center";
    ctx.fillText(opParts.join("  ·  "), W/2, cy);
    cy += 52;
  }

  // ── Divider ──────────────────────────────────────────────────
  const divG2 = ctx.createLinearGradient(PAD + 40, 0, W - PAD - 40, 0);
  divG2.addColorStop(0, rgba(ACCENT, 0));
  divG2.addColorStop(0.5, rgba(ACCENT, 0.25));
  divG2.addColorStop(1, rgba(ACCENT, 0));
  ctx.strokeStyle = divG2;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD + 40, cy); ctx.lineTo(W - PAD - 40, cy); ctx.stroke();
  cy += 44;

  // ── Node Profile section ─────────────────────────────────────
  const showAnyNP = nodeProfile && (F("nodeType") || F("tagline") || F("strength") || F("weakness"));
  if (showAnyNP) {
    const NP = nodeProfile;
    const NPC = NP.color || "#60a5fa";

    ctx.font = "700 22px Arial"; ctx.fillStyle = rgba("#ffffff", 0.25);
    ctx.textAlign = "center"; ctx.letterSpacing = "5px";
    ctx.fillText("NODE PROFILE", W/2, cy);
    cy += 44;

    if (F("nodeType")) {
      const npIconX = W/2 - 180;
      const npIconY = cy + 28;
      ctx.beginPath(); ctx.arc(npIconX, npIconY, 34, 0, Math.PI * 2);
      const npG = ctx.createRadialGradient(npIconX, npIconY - 8, 0, npIconX, npIconY, 34);
      npG.addColorStop(0, rgba(NPC, 0.35)); npG.addColorStop(1, rgba(NPC, 0.08));
      ctx.fillStyle = npG; ctx.fill();
      ctx.strokeStyle = rgba(NPC, 0.45); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.font = "32px Arial"; ctx.textBaseline = "middle"; ctx.textAlign = "center";
      ctx.fillText(NP.icon, npIconX, npIconY + 2); ctx.textBaseline = "alphabetic";
      ctx.font = "800 34px Arial"; ctx.fillStyle = NPC; ctx.textAlign = "left";
      ctx.fillText(NP.type, npIconX + 52, cy + 22);
      if (F("tagline")) {
        ctx.font = "italic 22px Arial"; ctx.fillStyle = rgba("#ffffff", 0.38);
        ctx.fillText(`"${NP.tagline}"`, npIconX + 52, cy + 52);
      }
      cy += 88;
    } else if (F("tagline")) {
      ctx.font = "italic 26px Arial"; ctx.fillStyle = rgba("#ffffff", 0.38); ctx.textAlign = "center";
      ctx.fillText(`"${NP.tagline}"`, W/2, cy + 22);
      cy += 56;
    }

    const panItems = [];
    if (F("strength")) panItems.push({ label: "STRENGTH ↑", value: NP.strength, bg: "rgba(1,28,17,0.9)",  border: "rgba(52,211,153,0.3)",  text: "#34d399" });
    if (F("weakness")) panItems.push({ label: "WEAKNESS ↓", value: NP.weakness, bg: "rgba(28,5,5,0.9)",   border: "rgba(248,113,113,0.3)", text: "#f87171" });
    if (panItems.length > 0) {
      const panW = panItems.length === 1 ? IW : (IW - 20) / 2;
      const panH = 76;
      panItems.forEach((p, i) => {
        const px = PAD + i * (panW + 20);
        drawRoundRect(ctx, px, cy, panW, panH, 14);
        ctx.fillStyle = p.bg; ctx.fill(); ctx.strokeStyle = p.border; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.font = "700 18px Arial"; ctx.fillStyle = rgba("#9ca3af", 1); ctx.textAlign = "center";
        ctx.fillText(p.label, px + panW/2, cy + 28);
        ctx.font = "800 24px Arial"; ctx.fillStyle = p.text;
        ctx.fillText(p.value, px + panW/2, cy + 60);
      });
      cy += panH + 28;
    }
  }

  // ── Footer ───────────────────────────────────────────────────
  if (F("branding") || F("disclaimer")) {
    const footY = H - PAD - 36;
    const footG = ctx.createLinearGradient(PAD + 40, 0, W - PAD - 40, 0);
    footG.addColorStop(0, rgba(ACCENT, 0)); footG.addColorStop(0.5, rgba(ACCENT, 0.18)); footG.addColorStop(1, rgba(ACCENT, 0));
    ctx.strokeStyle = footG; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD + 40, footY - 16); ctx.lineTo(W - PAD - 40, footY - 16); ctx.stroke();
    ctx.font = "20px Arial"; ctx.fillStyle = rgba("#ffffff", 0.20);
    if (F("branding") && F("disclaimer")) {
      ctx.textAlign = "left"; ctx.fillText("dawnquiz.vercel.app", PAD + 12, footY + 10);
      ctx.textAlign = "right"; ctx.fillText("Not affiliated with Dawn Internet", W - PAD - 12, footY + 10);
    } else if (F("branding")) {
      ctx.textAlign = "center"; ctx.fillText("dawnquiz.vercel.app", W/2, footY + 10);
    } else {
      ctx.textAlign = "center"; ctx.fillText("Not affiliated with Dawn Internet", W/2, footY + 10);
    }
  }

  return new Promise(resolve => {
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      resolve(url);
    }, "image/png");
  });
}


// ─────────────────────────────────────────────────────────────
//  TIER NODE PROFILE MINI — combined card shown after each tier
//  with canvas PNG download
// ─────────────────────────────────────────────────────────────
function TierNodeProfileMini({ profile, tier, correct, total, sunraysEarned, totalSunrays, rank, username, lives }) {
  const [imgState,   setImgState]   = useState("idle");
  const [imgUrl,     setImgUrl]     = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [fields,     toggleField]   = useCardFields();
  const tm = TIER_META[tier] || TIER_META.beginner;

  async function handleDownload() {
    setImgState("generating");
    try {
      const url = await generateTierResultImage({ tier, correct, total, sunraysEarned, totalSunrays, rank, username, nodeProfile: profile, lives, fields });
      setImgUrl(url);
      setImgState("ready");
      const a = document.createElement("a");
      a.href = url;
      a.download = `dawnquiz-${tier}-${profile.id}.png`;
      a.click();
    } catch (e) {
      console.error("Tier card generation failed", e);
      setImgState("idle");
    }
  }

  return (
    <div style={{ maxWidth: 320, margin: "1rem auto 0" }}>
      {/* Mini profile strip */}
      <div style={{ background: T.surfaceHigh, border: `1.5px solid ${tm.color}44`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ background: `linear-gradient(135deg, ${profile.color}18, ${profile.color}06)`, borderBottom: `1px solid ${profile.color}22`, padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${profile.color}22`, border: `1px solid ${profile.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>
            {profile.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: T.textDim, fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em" }}>NODE PROFILE</div>
            <div style={{ color: profile.color, fontWeight: 900, fontSize: "0.9rem", lineHeight: 1.1 }}>{profile.type}</div>
            <div style={{ color: T.textMuted, fontSize: "0.65rem", fontStyle: "italic", marginTop: "0.1rem" }}>"{profile.tagline}"</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "0.6rem 0.75rem", gap: "0.4rem" }}>
          <div style={{ background: "#011c11", border: `1px solid ${T.green}22`, borderRadius: 8, padding: "0.4rem 0.6rem" }}>
            <div style={{ color: T.textDim, fontSize: "0.55rem", letterSpacing: "0.08em" }}>STRENGTH</div>
            <div style={{ color: T.green, fontWeight: 700, fontSize: "0.7rem" }}>↑ {profile.strength}</div>
          </div>
          <div style={{ background: "#1c0a0a", border: `1px solid ${T.red}22`, borderRadius: 8, padding: "0.4rem 0.6rem" }}>
            <div style={{ color: T.textDim, fontSize: "0.55rem", letterSpacing: "0.08em" }}>WEAKNESS</div>
            <div style={{ color: T.red, fontWeight: 700, fontSize: "0.7rem" }}>↓ {profile.weakness}</div>
          </div>
        </div>
      </div>

      {/* Privacy toggle */}
      <button
        onClick={() => setShowConfig(c => !c)}
        style={{ width: "100%", marginTop: "0.5rem", padding: "0.5rem", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, cursor: "pointer", fontFamily: "inherit", fontSize: "0.72rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
      >
        {showConfig ? "▲ Hide card options" : "🔒 Customise card before downloading"}
      </button>

      {showConfig && (
        <div style={{ marginTop: "0.4rem" }}>
          <CardPrivacyPanel fields={fields} onToggle={toggleField} accentColor={tm.color} />
        </div>
      )}

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={imgState === "generating"}
        style={{ width: "100%", marginTop: "0.4rem", padding: "0.7rem", borderRadius: 12, border: `1.5px solid ${tm.color}`, background: `${tm.color}11`, color: tm.color, cursor: imgState === "generating" ? "wait" : "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: "0.82rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem", opacity: imgState === "generating" ? 0.6 : 1 }}
      >
        {imgState === "generating"
          ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>◌</span> Generating…</>
          : imgState === "ready"
          ? "✓ Re-download with current settings"
          : `🖼 Download ${tm.label} Card (PNG)`}
      </button>

      {/* Thumbnail preview */}
      {imgUrl && (
        <div style={{ marginTop: "0.5rem", borderRadius: 10, overflow: "hidden", border: `1px solid ${tm.color}33`, opacity: 0.82 }}>
          <img src={imgUrl} alt={`${tier} tier card`} style={{ width: "100%", display: "block" }} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  NODE PROFILE CANVAS IMAGE GENERATOR
//  Renders a 1080×1080 shareable PNG entirely on a <canvas>
// ─────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0,2), 16),
    g: parseInt(h.slice(2,4), 16),
    b: parseInt(h.slice(4,6), 16),
  };
}
function rgba(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function generateNodeProfileImage({ profile, rank, username, sunrays, fields = {} }) {
  const F = key => fields[key] !== false;
  const S = 1080;         // canvas size (square)
  const PAD = 72;         // outer padding
  const W = S - PAD * 2;  // inner width
  const ACCENT = profile.color;

  const canvas = document.createElement("canvas");
  canvas.width = S; canvas.height = S;
  const ctx = canvas.getContext("2d");

  // ── Background ─────────────────────────────────────────────
  ctx.fillStyle = "#050d1a";
  ctx.fillRect(0, 0, S, S);

  // Radial glow from top
  const grd = ctx.createRadialGradient(S/2, 0, 0, S/2, 0, S * 0.75);
  grd.addColorStop(0, rgba(ACCENT, 0.18));
  grd.addColorStop(1, rgba("#07070f", 0));
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, S, S);

  // Subtle grid dots
  ctx.fillStyle = rgba("#ffffff", 0.035);
  for (let gx = PAD; gx < S - PAD; gx += 48) {
    for (let gy = PAD; gy < S - PAD; gy += 48) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Outer card border ──────────────────────────────────────
  drawRoundRect(ctx, PAD, PAD, W, S - PAD * 2, 32);
  ctx.strokeStyle = rgba(ACCENT, 0.35);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Top accent bar
  const barH = 6;
  drawRoundRect(ctx, PAD, PAD, W, barH, 3);
  const barGrd = ctx.createLinearGradient(PAD, 0, PAD + W, 0);
  barGrd.addColorStop(0, rgba(ACCENT, 0));
  barGrd.addColorStop(0.3, ACCENT);
  barGrd.addColorStop(0.7, ACCENT);
  barGrd.addColorStop(1, rgba(ACCENT, 0));
  ctx.fillStyle = barGrd;
  ctx.fill();

  let cy = PAD + barH + 68; // current Y cursor

  // ── "NODE PROFILE" label ───────────────────────────────────
  ctx.font = "700 26px Arial";
  ctx.fillStyle = rgba("#ffffff", 0.3);
  ctx.letterSpacing = "6px";
  ctx.textAlign = "center";
  ctx.fillText("NODE PROFILE", S / 2, cy);
  cy += 56;

  // ── DAWNQUIZ wordmark (top-right corner) ──────────────────
  ctx.font = "700 22px Arial";
  ctx.fillStyle = "#FF6B1A";
  ctx.textAlign = "right";
  ctx.fillText("☀ DAWNQUIZ", S - PAD - 12, PAD + 38);
  ctx.textAlign = "center"; // reset

  // ── Archetype icon circle ──────────────────────────────────
  const iconR = 72;
  const iconX = S / 2;
  const iconY = cy + iconR;

  // Circle background
  ctx.beginPath();
  ctx.arc(iconX, iconY, iconR, 0, Math.PI * 2);
  const circleGrd = ctx.createRadialGradient(iconX, iconY - 20, 0, iconX, iconY, iconR);
  circleGrd.addColorStop(0, rgba(ACCENT, 0.35));
  circleGrd.addColorStop(1, rgba(ACCENT, 0.08));
  ctx.fillStyle = circleGrd;
  ctx.fill();
  ctx.strokeStyle = rgba(ACCENT, 0.5);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Icon emoji
  ctx.font = "72px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(profile.icon, iconX, iconY + 4);
  ctx.textBaseline = "alphabetic";

  cy = iconY + iconR + 52;

  // ── Archetype name ────────────────────────────────────────
  ctx.font = "900 52px Arial";
  ctx.fillStyle = ACCENT;
  ctx.textAlign = "center";
  ctx.fillText(profile.type, S / 2, cy);
  cy += 52;

  // ── Tagline ───────────────────────────────────────────────
  if (F("tagline")) {
    ctx.font = "italic 28px Arial"; ctx.fillStyle = rgba("#ffffff", 0.45); ctx.textAlign = "center";
    ctx.fillText(`"${profile.tagline}"`, S / 2, cy);
    cy += 60;
  }

  // ── Divider ───────────────────────────────────────────────
  const divGrd = ctx.createLinearGradient(PAD + 40, 0, S - PAD - 40, 0);
  divGrd.addColorStop(0, rgba(ACCENT, 0));
  divGrd.addColorStop(0.5, rgba(ACCENT, 0.35));
  divGrd.addColorStop(1, rgba(ACCENT, 0));
  ctx.strokeStyle = divGrd;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD + 40, cy); ctx.lineTo(S - PAD - 40, cy);
  ctx.stroke();
  cy += 48;

  // ── Stats row: RANK | USERNAME | SUNRAYS (filtered) ───────────
  const statItems = [
    { key: "rank",     label: "RANK",     value: rank,           color: "#fbbf24" },
    { key: "username", label: "OPERATOR", value: username ? `OP/${username.toUpperCase().replace(/\s/g,"_")}` : "OP/ANON", color: ACCENT },
    { key: "sunrays",  label: "SUNRAYS",  value: `${sunrays} ☀`, color: "#34d399" },
  ].filter(s => F(s.key));
  if (statItems.length > 0) {
    const statW = W / statItems.length;
    statItems.forEach((s, i) => {
      const sx = PAD + statW * i + statW / 2;
      ctx.font = "700 22px Arial"; ctx.fillStyle = rgba("#ffffff", 0.3); ctx.textAlign = "center";
      ctx.fillText(s.label, sx, cy);
      ctx.font = "800 30px Arial"; ctx.fillStyle = s.color;
      ctx.fillText(s.value, sx, cy + 40);
      if (i < statItems.length - 1) {
        ctx.strokeStyle = rgba("#ffffff", 0.1); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(PAD + statW * (i + 1), cy - 12); ctx.lineTo(PAD + statW * (i + 1), cy + 52); ctx.stroke();
      }
    });
    cy += 96;
  }

  // ── Strength / Weakness panels (conditional) ──────────────────
  const npPanels = [];
  if (F("strength")) npPanels.push({ label: "STRENGTH ↑", value: profile.strength, bg: "rgba(1,28,17,0.9)", border: "rgba(52,211,153,0.35)", text: "#34d399" });
  if (F("weakness")) npPanels.push({ label: "WEAKNESS ↓", value: profile.weakness, bg: "rgba(28,5,5,0.9)",  border: "rgba(248,113,113,0.35)", text: "#f87171" });
  if (npPanels.length > 0) {
    const panelW = npPanels.length === 1 ? W : (W - 24) / 2;
    const panelH = 100;
    npPanels.forEach((p, i) => {
      const px = PAD + i * (panelW + 24);
      drawRoundRect(ctx, px, cy, panelW, panelH, 16);
      ctx.fillStyle = p.bg; ctx.fill(); ctx.strokeStyle = p.border; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.font = "700 20px Arial"; ctx.fillStyle = rgba("#9ca3af", 1); ctx.textAlign = "center";
      ctx.fillText(p.label, px + panelW / 2, cy + 34);
      ctx.font = "800 26px Arial"; ctx.fillStyle = p.text;
      ctx.fillText(p.value, px + panelW / 2, cy + 72);
    });
    cy += panelH + 48;
  }

  // ── Description (word-wrapped, only if nodeType shown) ────────
  if (F("nodeType")) {
    ctx.font = "26px Arial"; ctx.fillStyle = rgba("#ffffff", 0.5); ctx.textAlign = "center";
    const words = profile.desc.split(" ");
    const maxLineW = W - 60;
    let line = ""; const lines = [];
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxLineW) { lines.push(line); line = word; }
      else line = test;
    }
    if (line) lines.push(line);
    lines.forEach((l, i) => { ctx.fillText(l, S / 2, cy + i * 36); });
    cy += lines.length * 36 + 48;
  }

  // ── Bottom footer bar ──────────────────────────────────────
  if (F("branding") || F("disclaimer")) {
    const footerY = S - PAD - 52;
    const footGrd = ctx.createLinearGradient(PAD + 40, 0, S - PAD - 40, 0);
    footGrd.addColorStop(0, rgba(ACCENT, 0)); footGrd.addColorStop(0.5, rgba(ACCENT, 0.2)); footGrd.addColorStop(1, rgba(ACCENT, 0));
    ctx.strokeStyle = footGrd; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD + 40, footerY - 20); ctx.lineTo(S - PAD - 40, footerY - 20); ctx.stroke();
    ctx.font = "22px Arial"; ctx.fillStyle = rgba("#ffffff", 0.22);
    if (F("branding") && F("disclaimer")) {
      ctx.textAlign = "left"; ctx.fillText("dawnquiz.vercel.app", PAD + 12, footerY + 14);
      ctx.textAlign = "right"; ctx.fillText("Community project · Not affiliated with Dawn Internet", S - PAD - 12, footerY + 14);
    } else if (F("branding")) {
      ctx.textAlign = "center"; ctx.fillText("☀ dawnquiz.vercel.app", S/2, footerY + 14);
    } else {
      ctx.textAlign = "center"; ctx.fillText("Not affiliated with Dawn Internet", S/2, footerY + 14);
    }
  }

  // ── Export PNG ────────────────────────────────────────────
  return new Promise(resolve => {
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      resolve(url);
    }, "image/png");
  });
}

function NodeProfileCard({ profile, rank, username, earned, sunrays, shareText }) {
  const [copied,       setCopied]       = useState(false);
  const [imgState,     setImgState]     = useState("idle");
  const [imgUrl,       setImgUrl]       = useState(null);
  const [showConfig,   setShowConfig]   = useState(false);
  const [fields,       toggleField]     = useCardFields();

  async function handleDownloadImage() {
    setImgState("generating");
    try {
      const url = await generateNodeProfileImage({ profile, rank, username, sunrays: sunrays || 0, fields });
      setImgUrl(url);
      setImgState("ready");
      const a = document.createElement("a");
      a.href = url;
      a.download = `dawnquiz-node-profile-${profile.id}.png`;
      a.click();
    } catch (e) {
      console.error("Image generation failed", e);
      setImgState("idle");
    }
  }

  async function handleShareText() {
    const result = await shareContent(shareText);
    if (result === "copied" || result === "shared") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div style={{ maxWidth: 320, margin: "0 auto", position: "relative" }}>
      {/* Glow backdrop */}
      <div style={{ position: "absolute", inset: 0, borderRadius: 20, background: `radial-gradient(ellipse at 50% 0%, ${profile.color}22, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ background: T.surfaceHigh, border: `1.5px solid ${profile.color}55`, borderRadius: 20, overflow: "hidden", position: "relative" }}>
        {/* Header band */}
        <div style={{ background: `linear-gradient(135deg, ${profile.color}22, ${profile.color}08)`, borderBottom: `1px solid ${profile.color}33`, padding: "1.1rem 1.25rem 0.9rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${profile.color}22`, border: `1.5px solid ${profile.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", flexShrink: 0 }}>
              {profile.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.textDim, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", marginBottom: "0.1rem" }}>NODE PROFILE</div>
              <div style={{ color: profile.color, fontWeight: 900, fontSize: "1.05rem", lineHeight: 1.1 }}>{profile.type}</div>
              <div style={{ color: T.textMuted, fontSize: "0.7rem", marginTop: "0.15rem", fontStyle: "italic" }}>"{profile.tagline}"</div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${T.border}` }}>
          {[
            { label: "RANK",     value: rank,              color: T.gold   },
            { label: "TRAIT",    value: profile.trait.split(" & ")[0], color: profile.color },
            { label: "SUNRAYS",  value: `${sunrays || 0} ☀`, color: T.green },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding: "0.65rem 0.5rem", textAlign: "center", borderRight: `1px solid ${T.border}` }}>
              <div style={{ color: T.textDim, fontSize: "0.58rem", letterSpacing: "0.1em", marginBottom: "0.2rem" }}>{label}</div>
              <div style={{ color, fontWeight: 700, fontSize: "0.75rem", lineHeight: 1.2 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Strength / Weakness */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "0.75rem 1rem", gap: "0.5rem", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ background: "#011c11", border: `1px solid ${T.green}33`, borderRadius: 10, padding: "0.55rem 0.75rem" }}>
            <div style={{ color: T.textDim, fontSize: "0.6rem", letterSpacing: "0.1em", marginBottom: "0.2rem" }}>STRENGTH</div>
            <div style={{ color: T.green, fontWeight: 700, fontSize: "0.78rem" }}>↑ {profile.strength}</div>
          </div>
          <div style={{ background: "#1c0a0a", border: `1px solid ${T.red}33`, borderRadius: 10, padding: "0.55rem 0.75rem" }}>
            <div style={{ color: T.textDim, fontSize: "0.6rem", letterSpacing: "0.1em", marginBottom: "0.2rem" }}>WEAKNESS</div>
            <div style={{ color: T.red, fontWeight: 700, fontSize: "0.78rem" }}>↓ {profile.weakness}</div>
          </div>
        </div>

        {/* Description */}
        <div style={{ padding: "0.85rem 1.1rem" }}>
          <p style={{ color: T.textMuted, fontSize: "0.78rem", lineHeight: 1.65, margin: 0 }}>{profile.desc}</p>
        </div>

        {/* Footer — operator ID */}
        <div style={{ padding: "0.5rem 1.1rem 0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: T.textDim, fontSize: "0.65rem", fontFamily: "monospace" }}>
            OP/{username?.toUpperCase().replace(/\s/g, "_") || "ANON"}
          </div>
          <div style={{ color: T.textDim, fontSize: "0.65rem" }}>dawnquiz.vercel.app</div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
        {/* Privacy config toggle */}
        <button
          onClick={() => setShowConfig(c => !c)}
          style={{ width: "100%", padding: "0.5rem", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, cursor: "pointer", fontFamily: "inherit", fontSize: "0.72rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
        >
          {showConfig ? "▲ Hide card options" : "🔒 Customise card before downloading"}
        </button>

        {showConfig && (
          <CardPrivacyPanel fields={fields} onToggle={toggleField} accentColor={profile.color} />
        )}

        {/* Primary — Download image card */}
        <button
          onClick={handleDownloadImage}
          disabled={imgState === "generating"}
          style={{ width: "100%", padding: "0.85rem", borderRadius: 12, border: `1.5px solid ${profile.color}`, background: `linear-gradient(135deg, ${profile.color}22, ${profile.color}11)`, color: profile.color, cursor: imgState === "generating" ? "wait" : "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: "0.88rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.55rem", transition: "opacity 0.2s", opacity: imgState === "generating" ? 0.6 : 1 }}
        >
          {imgState === "generating"
            ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>◌</span> Generating image…</>
            : imgState === "ready"
            ? "✓ Re-download with current settings"
            : "🖼 Download Profile Card (PNG)"}
        </button>

        {/* Secondary — copy share text */}
        <button
          onClick={handleShareText}
          style={{ width: "100%", padding: "0.65rem", borderRadius: 12, border: `1px solid ${profile.color}44`, background: "transparent", color: T.textMuted, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: "0.78rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
        >
          {copied ? "✓ Text copied!" : "⬆ Copy share text"}
        </button>
      </div>

      {/* Preview thumbnail (shown after generation) */}
      {imgUrl && (
        <div style={{ marginTop: "0.75rem", borderRadius: 12, overflow: "hidden", border: `1px solid ${profile.color}33`, opacity: 0.85 }}>
          <img src={imgUrl} alt="Node Profile Card" style={{ width: "100%", display: "block" }} />
        </div>
      )}
    </div>
  );
}

function GameScreen({ player, dispatch, allQuestions, audio, onExit, challengeSeed = null }) {

  // Run difficulty config — seconds per question for each level
  const RUN_DIFFICULTIES = [
    { key: "relaxed",  label: "Relaxed",  icon: "🌿", secsPerQ: 45, color: T.green,  desc: "Plenty of time to think" },
    { key: "standard", label: "Standard", icon: "⚡", secsPerQ: 30, color: T.gold,   desc: "Balanced challenge" },
    { key: "pressure", label: "Pressure", icon: "🔴", secsPerQ: 15, color: T.red,    desc: "Fast — no hesitation" },
  ];
  // practiceMode: no timer, no ☀ earned
  // earnMode: run-level countdown, earns ☀

  // ── Tier state machine ────────────────────────────────────────
  // Tiers: "beginner" → "intermediate" → "expert"
  // Phase within a tier: "intro" | "playing" | "tier_result" | "run_complete" | "run_result"
  const TIERS = ["beginner", "intermediate", "expert"];
  const [startTier,    setStartTier]    = useState("beginner");
  const [tierLength,   setTierLength]   = useState(10);     // questions per tier: 5/10/15/20
  const [currentTier,  setCurrentTier]  = useState(null);   // null = at intro/picker
  const [tierQueue,    setTierQueue]    = useState([]);      // remaining tiers to play
  const [phase,        setPhase]        = useState("intro"); // intro | playing | tier_result | run_complete | run_result
  const [lives,        setLives]        = useState(3);

  // Per-tier playing state
  const poolRef       = useRef([]);
  const mySeedRef     = useRef(null);
  const [qi,           setQi]           = useState(0);
  const [selected,     setSelected]     = useState(null);
  const [answered,     setAnswered]     = useState(false);
  const [lifelines,    setLifelines]    = useState({ hint: true });
  const [tierSunrays,  setTierSunrays]  = useState(0);   // sunrays earned this tier
  const [totalRunSunrays, setTotalRunSunrays] = useState(0); // banked across all tiers
  const [correctCount, setCorrectCount] = useState(0);
  const [answerMeta,   setAnswerMeta]   = useState(null);
  const [correctStreak,setCorrectStreak]= useState(0);
  const [lastMultiplier,setLastMultiplier] = useState(null);
  const [runLog,       setRunLog]       = useState([]);
  const [tierResult,   setTierResult]   = useState(null);  // result data for current tier
  const [runResult,    setRunResult]    = useState(null);  // final run result
  const [practiceMode,    setPracticeMode]    = useState(false);  // toggle: false=Earn☀, true=Practice
  const [runDifficulty,   setRunDifficulty]   = useState("standard"); // relaxed|standard|pressure
  const [runTimeLeft,     setRunTimeLeft]     = useState(0);    // countdown in seconds for whole run
  const [runTimerActive,  setRunTimerActive]  = useState(false);
  const runTimerRef = useRef(null);
  const qStartTimeRef = useRef(null);  // timestamp when current question appeared
  const [timerKey,     setTimerKey]     = useState(0); // kept for QuestionCard reset
  const [completedTiers, setCompletedTiers] = useState([]); // [{tier, correct, total, sunrays, lives}]

  const pool  = poolRef.current;
  const TOTAL = pool.length || 10;
  const q     = pool[qi] || null;
  const TIER  = currentTier ? TIER_META[currentTier] : null;

  // Milestone checkpoints at ~33%, ~66%, and final question.
  // Value per checkpoint = checkpointSunrays(diff, length).
  // 5Q Beginner/Intermediate = 0, so those tiers award nothing.
  const MILESTONE_BONUS = (() => {
    const t = pool.length || tierLength;
    const val = checkpointSunrays(currentTier || "beginner", tierLength);
    const m = {};
    const a = Math.max(0, Math.floor(t * 0.33) - 1);
    const b = Math.max(0, Math.floor(t * 0.66) - 1);
    const c = t - 1;
    if (val > 0) {
      m[a] = val;
      if (b !== a) m[b] = val;
      if (c !== b && c !== a) m[c] = val;
    }
    return m;
  })();

  // ── Run timer helpers ────────────────────────────────────────
  // Total seconds for the whole run = Q_count × secsPerQ
  function runTotalSecs(length, diffKey) {
    const diff = RUN_DIFFICULTIES.find(d => d.key === diffKey) || RUN_DIFFICULTIES[1];
    return length * diff.secsPerQ;
  }
  function startRunTimer(totalSecs) {
    if (runTimerRef.current) clearInterval(runTimerRef.current);
    setRunTimeLeft(totalSecs);
    setRunTimerActive(true);
    runTimerRef.current = setInterval(() => {
      setRunTimeLeft(t => {
        if (t <= 1) {
          clearInterval(runTimerRef.current);
          setRunTimerActive(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }
  function clearRunTimer() {
    if (runTimerRef.current) clearInterval(runTimerRef.current);
    setRunTimerActive(false);
  }

  // ── Build pool for a tier ────────────────────────────────────
  function loadTier(diff, length) {
    const newPool = buildTierPool(allQuestions, diff, length);
    poolRef.current = newPool;
    setQi(0); setSelected(null); setAnswered(false);
    setLifelines({ hint: true });
    setTierSunrays(0); setCorrectCount(0);
    setAnswerMeta(null); setCorrectStreak(0); setLastMultiplier(null); setRunLog([]);
    setTimerKey(k => k + 1);
    qStartTimeRef.current = Date.now();
  }

  // ── Start a tier from the queue ──────────────────────────────
  function beginTier(diff, queue, length) {
    const len = length || tierLength;
    setCurrentTier(diff);
    setTierQueue(queue);
    setLives(livesForTier(diff, len));
    loadTier(diff, len);
    setPhase("playing");
    dispatch({ type: "UPDATE_STREAK" });
  }

  // ── Player clicks "Start" on intro ──────────────────────────
  function handleStartRun() {
    mySeedRef.current = challengeSeed || genChallengeSeed();
    const start = startTier;
    const queue = TIERS.slice(TIERS.indexOf(start) + 1); // remaining after start
    setCompletedTiers([]);
    setTotalRunSunrays(0);
    if (!practiceMode) {
      const totalSecs = runTotalSecs(tierLength, runDifficulty);
      startRunTimer(totalSecs);
    }
    beginTier(start, queue, tierLength);
  }

  // ── Run timer expire — whole run time up ────────────────────
  function handleRunTimerExpire() {
    if (answered) return;
    audio?.play("wrong");
    // Count current question as wrong, end the run
    setRunLog(log => [...log, { qi, diff: currentTier, correct: false, fast: false, hintUsed: false }]);
    bankAndEndRun(tierSunrays, qi + 1, correctCount, true);
  }

  // Watch runTimeLeft to fire expire when it hits 0 during a run
  useEffect(() => {
    if (!practiceMode && runTimeLeft === 0 && runTimerActive === false && phase === "playing") {
      handleRunTimerExpire();
    }
  // eslint-disable-next-line
  }, [runTimeLeft, runTimerActive]);

  // ── (kept for compat) per-question timer expire unused in new model
  function handleTimerExpire() { handleRunTimerExpire(); }

  // ── Answer selected ──────────────────────────────────────────
  function handleAnswer(idx, meta) {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    // Calculate per-question timing for graduated speed bonus
    const secsUsed = qStartTimeRef.current ? (Date.now() - qStartTimeRef.current) / 1000 : 0;
    const activeDiffCfg = RUN_DIFFICULTIES.find(d => d.key === runDifficulty);
    const secsPerQ = activeDiffCfg?.secsPerQ || 0;
    // hasReward: only tiers with sunray rewards count (5Q beginner/intermediate = 0 reward)
    const hasReward = !practiceMode && checkpointSunrays(currentTier || "beginner", tierLength) > 0;
    const enrichedMeta = { ...(meta || {}), secsUsed, secsPerQ, hasReward, hintUsed: meta?.hintUsed || false };
    setAnswerMeta(enrichedMeta);
    const isCorrect = idx === q.correct;
    setRunLog(log => [...log, { qi, diff: currentTier, correct: isCorrect, fast: secsUsed < secsPerQ * 0.5, hintUsed: enrichedMeta.hintUsed }]);
    if (isCorrect) {
      const bonus = MILESTONE_BONUS[qi] || 0;
      bonus > 0 ? audio?.play("milestone") : audio?.play("correct");
    } else {
      audio?.play("wrong");
    }
  }

  // ── Bank sunrays + end entire run ────────────────────────────
  function bankAndEndRun(tierEarned, reached, correct, outOfLives = false) {
    const total = totalRunSunrays + tierEarned;
    if (tierEarned > 0 && !practiceMode) dispatch({ type: "EARN_SUNRAYS", amount: tierEarned });
    dispatch({ type: "RECORD_RUN", perfect: lives === 3, answered: reached, correct });
    setTotalRunSunrays(total);
    setRunResult({ earned: total, outOfLives, reached });
    setPhase("run_result");
  }

  // ── Complete a tier ──────────────────────────────────────────
  function completeTier(finalTierSunrays, finalCorrect, finalLog, isPerfectTier) {
    if (!practiceMode) clearRunTimer();
    const perfExtra = isPerfectTier ? SUNRAY_PERFECT_FLAT : 0;  // flat +1 ☀ for perfect
    const tierTotal = finalTierSunrays + perfExtra;
    // Award a streak freeze for completing an Expert run (max 3 banked)
    if (currentTier === "expert" && (player.streakFreezes || 0) < 3) {
      dispatch({ type: "EARN_STREAK_FREEZE" });
    }
    const nodeProfile = calcNodeProfile(finalLog, pool);

    // Bank tier sunrays immediately
    if (tierTotal > 0 && !practiceMode) dispatch({ type: "EARN_SUNRAYS", amount: tierTotal });
    setTotalRunSunrays(prev => prev + tierTotal);

    const result = {
      tier: currentTier,
      correct: finalCorrect,
      total: TOTAL,
      sunraysEarned: tierTotal,
      perfExtra,
      isPerfect: isPerfectTier,
      nodeProfile,
      livesRemaining: lives,
    };
    const updated = [...completedTiers, result];
    setCompletedTiers(updated);
    setTierResult(result);
    audio?.play("levelComplete");
    setPhase("tier_result");

    // If this was the last tier in the queue, full run is complete
    if (tierQueue.length === 0) {
      dispatch({ type: "RECORD_RUN", perfect: lives === 3, answered: TOTAL, correct: finalCorrect });
      dispatch({ type: "SAVE_NODE_PROFILE", profile: nodeProfile });
    }
  }

  // ── Continue to next tier ────────────────────────────────────
  function handleContinueToNext() {
    if (tierQueue.length === 0) {
      setPhase("run_complete");
      return;
    }
    const [next, ...rest] = tierQueue;
    beginTier(next, rest, tierLength);
  }

  // ── Skip to Expert ───────────────────────────────────────────
  function handleSkipToExpert() {
    beginTier("expert", [], tierLength);
  }

  // ── Next question ────────────────────────────────────────────
  function handleNext() {
    if (!answered) return;
    const correct = selected === q.correct;

    if (!correct) {
      const newLives = lives - 1;
      setLives(newLives);
      setCorrectStreak(0);
      setLastMultiplier(null);
      newLives <= 0 ? audio?.play("wrong") : audio?.play("lifeLost");

      if (newLives <= 0) {
        bankAndEndRun(tierSunrays, qi + 1, correctCount, true);
        return;
      }

      if (qi >= TOTAL - 1) {
        // Last question but got it wrong and survived — still complete tier
        const finalLog = [...runLog, { qi, diff: currentTier, correct: false, fast: false, hintUsed: answerMeta?.hintUsed || false }];
        completeTier(tierSunrays, correctCount, finalLog, false);
        return;
      }

      setAnswered(false); setSelected(null); setAnswerMeta(null);
      setQi(i => i + 1); setTimerKey(k => k + 1);
      qStartTimeRef.current = Date.now();
      return;
    }

    // ── Correct ──────────────────────────────────────────────
    const newStreak = correctStreak + 1;
    const { bonuses, multiplier } = calcMultiplier(answerMeta, newStreak);
    const milestoneBase = MILESTONE_BONUS[qi] || 0;
    // Multiplier applies to checkpoint sunrays only; no per-question base earn
    const earned = milestoneBase > 0 ? Math.round(milestoneBase * multiplier) : 0;

    setLastMultiplier({ bonuses, multiplier, base: milestoneBase, total: earned });
    setCorrectStreak(newStreak);
    const newTierSunrays = tierSunrays + earned;
    const newCorrect = correctCount + 1;
    setTierSunrays(newTierSunrays);
    setCorrectCount(newCorrect);

    if (qi >= TOTAL - 1) {
      const isPerfect = lives === 3;
      const isFastFinal = answerMeta?.timerSecs > 0 && answerMeta?.timeLeft > answerMeta.timerSecs * 0.5;
      const finalLog = [...runLog, { qi, diff: currentTier, correct: true, fast: isFastFinal, hintUsed: answerMeta?.hintUsed || false }];
      completeTier(newTierSunrays, newCorrect, finalLog, isPerfect);
      return;
    }

    setAnswered(false); setSelected(null); setAnswerMeta(null);
    setQi(i => i + 1); setTimerKey(k => k + 1);
  }

  function useLifeline(type) { setLifelines(l => ({ ...l, [type]: false })); }

  // ════════════════════════════════════════════════════════════
  //  INTRO — Tier + Length picker
  // ════════════════════════════════════════════════════════════
  if (phase === "intro") {
    const previewLives = livesForTier(startTier, tierLength);
    const tm = TIER_META[startTier];
    const activeDiff = RUN_DIFFICULTIES.find(d => d.key === runDifficulty) || RUN_DIFFICULTIES[1];
    const previewRunSecs = runTotalSecs(tierLength, runDifficulty);
    const previewMins = Math.floor(previewRunSecs / 60);
    const previewSecs = previewRunSecs % 60;
    const previewTimeStr = previewMins > 0
      ? `${previewMins}m${previewSecs > 0 ? ` ${previewSecs}s` : ""}`
      : `${previewRunSecs}s`;
    return (
    <div style={css.screen}>
      <div style={{ padding: "1.5rem 1.25rem", textAlign: "center" }}>
        <SunIcon size={72} glow />
        <div style={{ color: T.gold, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.25em", marginTop: "1.5rem" }}>DAWNQUIZ</div>

        {/* ── Mode Toggle ─────────────────────────────────────────── */}
        <div style={{ display: "flex", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "0.2rem", maxWidth: 260, margin: "1rem auto 0" }}>
          {[
            { val: false, label: "☀ Earn",     active: !practiceMode },
            { val: true,  label: "🧪 Practice", active: practiceMode },
          ].map(opt => (
            <button key={String(opt.val)} onClick={() => setPracticeMode(opt.val)} style={{
              flex: 1, padding: "0.5rem 0", borderRadius: 9,
              border: "none", cursor: "pointer", fontFamily: "inherit",
              fontWeight: opt.active ? 800 : 500, fontSize: "0.85rem",
              background: opt.active ? (opt.val ? T.surfaceHigh : "#1c1200") : "transparent",
              color: opt.active ? (opt.val ? T.text : T.gold) : T.textMuted,
              boxShadow: opt.active ? `0 0 0 1.5px ${opt.val ? T.border : T.gold + "66"}` : "none",
              transition: "all 0.2s",
            }}>{opt.label}</button>
          ))}
        </div>
        <div style={{ color: T.textDim, fontSize: "0.72rem", marginTop: "0.45rem" }}>
          {practiceMode ? "No timer · No ☀ earned · All hints available" : "Timed run · Earn Sunrays · No hints"}
        </div>

        {/* ── Starting Tier ───────────────────────────────────── */}
        <div style={{ ...css.card, maxWidth: 340, margin: "1.25rem auto 0.6rem", textAlign: "left" }}>
          <div style={{ color: T.text, fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.65rem" }}>🎯 Starting Tier</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            {TIERS.map(diff => {
              const dtm = TIER_META[diff];
              const isActive = startTier === diff;
              return (
                <button key={diff} onClick={() => setStartTier(diff)} style={{
                  padding: "0.65rem 0.85rem", borderRadius: 12,
                  border: `1.5px solid ${isActive ? dtm.color : T.borderHigh}`,
                  background: isActive ? dtm.bg : T.surface,
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  display: "flex", alignItems: "center", gap: "0.65rem",
                }}>
                  <span style={{ fontSize: "1.25rem" }}>{dtm.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: isActive ? dtm.color : T.text, fontWeight: 800, fontSize: "0.88rem" }}>{dtm.label}</div>
                    <div style={{ color: T.textMuted, fontSize: "0.68rem", marginTop: "0.1rem" }}>
                      {diff === "beginner" ? "Core concepts · Protocol basics · DePIN" :
                       diff === "intermediate" ? "DeFi · Token economics · Node mechanics" :
                       "Attack vectors · ZK proofs · Advanced protocol"}
                    </div>
                  </div>
                  {isActive && <span style={{ color: dtm.color, fontSize: "0.9rem" }}>✓</span>}
                </button>
              );
            })}
          </div>
          <div style={{ color: T.textDim, fontSize: "0.68rem", marginTop: "0.6rem", textAlign: "center" }}>
            After each tier: Continue · Skip to Expert · or Go Home
          </div>
        </div>

        {/* ── Questions per Tier ──────────────────────────────── */}
        <div style={{ ...css.card, maxWidth: 340, margin: "0 auto 0.6rem", textAlign: "left" }}>
          <div style={{ color: T.text, fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.65rem" }}>📏 Questions per Tier</div>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {TIER_LENGTH_OPTIONS.map(len => {
              const lives = livesForTier(startTier, len);
              const isActive = tierLength === len;
              return (
                <button key={len} onClick={() => setTierLength(len)} style={{
                  flex: 1, padding: "0.55rem 0.2rem", borderRadius: 10,
                  border: `1.5px solid ${isActive ? tm.color : T.borderHigh}`,
                  background: isActive ? tm.bg : T.surface,
                  color: isActive ? tm.color : T.textMuted,
                  cursor: "pointer", fontFamily: "inherit", textAlign: "center",
                }}>
                  <div style={{ fontWeight: 900, fontSize: "1.05rem" }}>{len}</div>
                  <div style={{ fontSize: "0.58rem", marginTop: "0.15rem", opacity: 0.7 }}>
                    {lives === 0 ? "testing" : "☀".repeat(lives)}
                  </div>
                </button>
              );
            })}
          </div>
          {/* Lives preview banner — earn mode only */}
          {!practiceMode && <div style={{ marginTop: "0.65rem", padding: "0.5rem 0.75rem", borderRadius: 8, background: tm.bg, border: `1px solid ${tm.color}44`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ color: T.textMuted, fontSize: "0.72rem" }}>
              <span style={{ color: tm.color, fontWeight: 700 }}>{tierLength}Q</span> {TIER_META[startTier].label}
            </div>
            {previewLives === 0 ? (
              <div style={{ color: T.textDim, fontSize: "0.68rem", fontStyle: "italic" }}>Testing — no ☀ earned</div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: T.textDim, fontSize: "0.68rem" }}>Lives:</span>
                <div style={{ display: "flex", gap: "0.2rem" }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ fontSize: "0.95rem", opacity: i < previewLives ? 1 : 0.18 }}>☀</span>
                  ))}
                </div>
              </div>
            )}
          </div>}
          {!practiceMode && <div style={{ color: T.textDim, fontSize: "0.62rem", marginTop: "0.4rem", textAlign: "center" }}>
            More questions → more lives · Expert unlocks 3 lives at 15Q+
          </div>}
        </div>

        {/* ── How Sunrays are earned (earn mode) / practice info ── */}
        {practiceMode ? (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "0.65rem 0.9rem", maxWidth: 340, margin: "0 auto 0.6rem" }}>
            <div style={{ color: T.text, fontWeight: 700, fontSize: "0.72rem", marginBottom: "0.4rem" }}>🧪 Practice Mode</div>
            {[
              { icon: "✓", label: "All tiers & lengths available",  col: T.green },
              { icon: "✓", label: "Hints available on every question", col: T.green },
              { icon: "✓", label: "No time pressure — read at your pace", col: T.green },
              { icon: "✗", label: "No Sunrays earned",                col: T.red },
              { icon: "✗", label: "Does not count toward rank",        col: T.red },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", gap: "0.5rem", fontSize: "0.68rem", marginBottom: "0.2rem", alignItems: "center" }}>
                <span style={{ color: r.col, fontWeight: 700, width: "0.8rem" }}>{r.icon}</span>
                <span style={{ color: T.textMuted }}>{r.label}</span>
              </div>
            ))}
          </div>
        ) : (
        <div style={{ background: "#0d1a0d", border: `1px solid ${T.green}33`, borderRadius: 10, padding: "0.6rem 0.9rem", maxWidth: 340, margin: "0 auto 0.6rem" }}>
          <div style={{ color: T.green, fontWeight: 700, fontSize: "0.72rem", marginBottom: "0.4rem" }}>☀ Sunrays per checkpoint (×3 per tier)</div>
          {[
            { icon: "🌱", label: "Beginner  5Q",          value: "0 ☀ (testing)" },
            { icon: "🌱", label: "Beginner  10 / 15 / 20Q", value: "1 / 2 / 3 ☀" },
            { icon: "⚡", label: "Intermediate  5Q",       value: "0 ☀ (testing)" },
            { icon: "⚡", label: "Intermediate  10/15/20Q", value: "2 / 3 / 4 ☀" },
            { icon: "🔴", label: "Expert  5 / 10 / 15 / 20Q", value: "1/3/4/5 ☀" },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", marginBottom: "0.15rem" }}>
              <span style={{ color: T.textMuted }}>{r.icon} {r.label}</span>
              <span style={{ color: r.value.includes("testing") ? T.textDim : T.gold, fontWeight: 700 }}>{r.value}</span>
            </div>
          ))}
          <div style={{ marginTop: "0.5rem", borderTop: `1px solid ${T.border}`, paddingTop: "0.4rem" }}>
            {[
              { icon: "✦",  label: "Perfect tier (all lives)", value: "+1 ☀ flat" },
              { icon: "⚡", label: "Fast · Streak · No-hint",  value: "+5–10% each" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", marginBottom: "0.15rem" }}>
                <span style={{ color: T.textMuted }}>{r.icon} {r.label}</span>
                <span style={{ color: T.gold, fontWeight: 700 }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* ── Run Difficulty (Earn mode only) ──────────────────── */}
        {!practiceMode && (
          <div style={{ ...css.card, maxWidth: 340, margin: "0 auto 1.1rem", textAlign: "left" }}>
            <div style={{ color: T.text, fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.65rem" }}>⏱ Run Difficulty</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {RUN_DIFFICULTIES.map(d => {
                const isActive = runDifficulty === d.key;
                const totalS = runTotalSecs(tierLength, d.key);
                const mins = Math.floor(totalS / 60);
                const secs = totalS % 60;
                const timeStr = mins > 0 ? `${mins}m${secs > 0 ? ` ${secs}s` : ""}` : `${totalS}s`;
                return (
                  <button key={d.key} onClick={() => setRunDifficulty(d.key)} style={{
                    padding: "0.6rem 0.85rem", borderRadius: 10,
                    border: `1.5px solid ${isActive ? d.color : T.borderHigh}`,
                    background: isActive ? d.color + "18" : T.surface,
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: "0.65rem",
                  }}>
                    <span style={{ fontSize: "1.1rem" }}>{d.icon}</span>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ color: isActive ? d.color : T.text, fontWeight: 700, fontSize: "0.85rem" }}>{d.label}</div>
                      <div style={{ color: T.textMuted, fontSize: "0.67rem" }}>{d.desc} · {d.secsPerQ}s/Q</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: isActive ? d.color : T.textMuted, fontWeight: 800, fontSize: "0.82rem" }}>{timeStr}</div>
                      <div style={{ color: T.textDim, fontSize: "0.62rem" }}>total</div>
                    </div>
                    {isActive && <span style={{ color: d.color }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Btn onClick={handleStartRun}>
          {practiceMode
            ? `🧪 Practice · ${tm.label} · ${tierLength}Q ▶`
            : `${activeDiff.icon} ${activeDiff.label} · ${tm.label} · ${tierLength}Q · ${previewTimeStr} ▶`}
        </Btn>
        <Btn variant="ghost" onClick={onExit} style={{ marginTop: "0.75rem" }}>← Back to Home</Btn>
      </div>
    </div>
  );}

  // ════════════════════════════════════════════════════════════
  //  TIER RESULT — after each tier completes
  // ════════════════════════════════════════════════════════════
  if (phase === "tier_result" && tierResult) {
    const tm = TIER_META[tierResult.tier];
    const nextTier = tierQueue[0];
    const nextTm = nextTier ? TIER_META[nextTier] : null;
    const isLastTier = tierQueue.length === 0;
    const canSkipToExpert = !isLastTier && nextTier !== "expert" && tierQueue.includes("expert");

    return (
      <div style={css.screen}>
        <div style={{ padding: "2rem 1.25rem", textAlign: "center" }}>
          {/* Tier badge */}
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: tm.bg, border: `2px solid ${tm.color}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.4rem", margin: "0 auto 1rem" }}>{tm.icon}</div>
          <div style={{ color: tm.color, fontWeight: 900, fontSize: "1.65rem" }}>{tm.label} Complete</div>
          {tierResult.isPerfect && <div style={{ color: T.green, fontSize: "0.9rem", marginTop: "0.4rem", fontWeight: 600 }}>✦ Perfect Tier! +{Math.round(MULTIPLIERS.perfect.bonus * 100)}% on checkpoints</div>}

          {/* Score card */}
          <div style={{ ...css.card, maxWidth: 300, margin: "1.25rem auto 0.75rem", border: `1.5px solid ${tm.color}44` }}>
            <div style={{ color: tm.color, fontSize: "2.6rem", fontWeight: 900 }}>+{tierResult.sunraysEarned} ☀</div>
            <div style={{ color: T.textMuted, fontSize: "0.82rem" }}>Sunrays banked</div>
            <div style={{ display: "flex", justifyContent: "center", gap: "1.25rem", marginTop: "0.85rem" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: T.text, fontWeight: 700 }}>{tierResult.correct}/{tierResult.total}</div>
                <div style={{ color: T.textDim, fontSize: "0.68rem" }}>Correct</div>
              </div>
              <div style={{ width: 1, background: T.border }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ color: T.text, fontWeight: 700 }}>{Math.round(tierResult.correct/tierResult.total*100)}%</div>
                <div style={{ color: T.textDim, fontSize: "0.68rem" }}>Accuracy</div>
              </div>
              <div style={{ width: 1, background: T.border }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ color: lives === 3 ? T.green : lives === 2 ? T.gold : T.red, fontWeight: 700 }}>{"☀".repeat(lives)}{"○".repeat(3-lives)}</div>
                <div style={{ color: T.textDim, fontSize: "0.68rem" }}>Lives left</div>
              </div>
            </div>
            <div style={{ color: T.textDim, fontSize: "0.72rem", marginTop: "0.6rem" }}>
              Total banked this run: <span style={{ color: T.gold, fontWeight: 700 }}>{totalRunSunrays} ☀</span>
            </div>
          </div>

          {/* Node profile mini card */}
          {tierResult.nodeProfile && (
            <TierNodeProfileMini
              profile={tierResult.nodeProfile}
              tier={tierResult.tier}
              correct={tierResult.correct}
              total={tierResult.total}
              sunraysEarned={tierResult.sunraysEarned}
              totalSunrays={player.sunrays}
              rank={getRank(player.sunrays).name}
              username={player.username}
              lives={lives}
            />
          )}

          {/* Share tier result */}
          <div style={{ maxWidth: 300, margin: "0.75rem auto 0" }}>
            <ShareBtn
              text={`${tm.icon} ${tm.label} Complete — DawnQuiz\n\n${tierResult.correct}/${tierResult.total} correct · ${Math.round(tierResult.correct/tierResult.total*100)}% accuracy\n+${tierResult.sunraysEarned} ☀ banked${tierResult.isPerfect ? " · ✦ Perfect!" : ""}\nRank: ${getRank(player.sunrays).name}\n\nChallenge me → ${APP_URL}`}
              label="Share This Tier"
            />
          </div>

          {/* CTA buttons */}
          <div style={{ maxWidth: 300, margin: "0.75rem auto 0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {!isLastTier && nextTm && (
              <Btn onClick={handleContinueToNext} style={{ background: `linear-gradient(135deg, ${nextTm.bg}, ${nextTm.color}22)`, borderColor: nextTm.color, color: nextTm.color }}>
                {nextTm.icon} Continue to {nextTm.label} →
              </Btn>
            )}
            {canSkipToExpert && (
              <Btn variant="ghost" onClick={handleSkipToExpert} style={{ borderColor: TIER_META.expert.color + "66", color: TIER_META.expert.color }}>
                🔴 Skip to Expert →
              </Btn>
            )}
            {isLastTier && (
              <Btn onClick={() => setPhase("run_complete")} style={{ background: `linear-gradient(135deg, #1c1200, ${T.gold}22)`, borderColor: T.gold, color: T.gold }}>
                ☀ View Full Run Summary →
              </Btn>
            )}
            <Btn variant="ghost" onClick={onExit} style={{ marginTop: "0.25rem" }}>← Go Home (keep Sunrays)</Btn>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  //  RUN RESULT — out of lives
  // ════════════════════════════════════════════════════════════
  if (phase === "run_result") return (
    <div style={css.screen}>
      <div style={{ padding: "2.5rem 1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>☀</div>
        <div style={{ color: T.red, fontWeight: 900, fontSize: "1.75rem" }}>Out of Lives</div>
        <div style={{ color: T.textMuted, margin: "0.5rem 0 1.5rem", lineHeight: 1.6 }}>
          Run ended at Q{runResult?.reached}.<br />
          <span style={{ fontSize: "0.82rem" }}>All Sunrays earned so far have been banked.</span>
        </div>
        <div style={{ ...css.card, maxWidth: 280, margin: "0 auto 1.5rem" }}>
          <div style={{ color: T.gold, fontSize: "2.8rem", fontWeight: 900 }}>+{runResult?.earned}</div>
          <div style={{ color: T.textMuted, fontSize: "0.85rem" }}>Total Sunrays Banked</div>
        </div>
        <Btn onClick={() => { setPhase("intro"); setCompletedTiers([]); setTotalRunSunrays(0); }}>Try Again</Btn>
        <Btn variant="ghost" onClick={onExit} style={{ marginTop: "0.75rem" }}>← Home</Btn>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  //  RUN COMPLETE — all tiers done
  // ════════════════════════════════════════════════════════════
  if (phase === "run_complete") {
    const lastTierResult = completedTiers[completedTiers.length - 1];
    const finalNodeProfile = lastTierResult?.nodeProfile;
    const isFullRun = completedTiers.length === TIERS.length || (completedTiers.length > 0 && completedTiers[completedTiers.length - 1].tier === "expert");
    return (
      <div style={css.screen}>
        <div style={{ padding: "2.5rem 1.5rem", textAlign: "center" }}>
          <SunIcon size={88} glow />
          <div style={{ color: T.gold, fontWeight: 900, fontSize: "1.9rem", marginTop: "1.25rem" }}>
            {isFullRun ? "FULL RUN COMPLETE!" : "RUN COMPLETE!"}
          </div>
          <div style={{ color: T.textMuted, fontSize: "0.85rem", marginTop: "0.35rem" }}>
            {completedTiers.map(t => TIER_META[t.tier].icon).join(" → ")} complete
          </div>
          {lives === 3 && <div style={{ color: T.green, fontSize: "0.95rem", marginTop: "0.6rem", fontWeight: 600 }}>✦ Perfect Run! All 3 lives intact</div>}

          {/* Tier breakdown */}
          <div style={{ ...css.card, maxWidth: 320, margin: "1.5rem auto 0.75rem", textAlign: "left" }}>
            {completedTiers.map(t => {
              const tm = TIER_META[t.tier];
              return (
                <div key={t.tier} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: "1.2rem" }}>{tm.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: tm.color, fontWeight: 700, fontSize: "0.82rem" }}>{tm.label}</div>
                    <div style={{ color: T.textDim, fontSize: "0.7rem" }}>{t.correct}/{t.total} correct · {Math.round(t.correct/t.total*100)}%</div>
                  </div>
                  <div style={{ color: T.gold, fontWeight: 800, fontSize: "0.9rem" }}>+{t.sunraysEarned} ☀</div>
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0 0", alignItems: "center" }}>
              <div style={{ color: T.textMuted, fontWeight: 700, fontSize: "0.82rem" }}>Total Earned</div>
              <div style={{ color: T.gold, fontWeight: 900, fontSize: "1.5rem" }}>{totalRunSunrays} ☀</div>
            </div>
          </div>

          {/* Final node profile card */}
          {finalNodeProfile && (
            <div style={{ maxWidth: 320, margin: "1.5rem auto 0.5rem", width: "100%" }}>
              <NodeProfileCard
                profile={finalNodeProfile}
                rank={getRank(player.sunrays).name}
                username={player.username}
                earned={totalRunSunrays}
                sunrays={player.sunrays}
                shareText={`🌅 NODE PROFILE — DawnQuiz\n\nType: ${finalNodeProfile.type}\nStrength: ${finalNodeProfile.strength}\nWeakness: ${finalNodeProfile.weakness}\nRank: ${getRank(player.sunrays).name}\n\n"${finalNodeProfile.tagline}"\n\nFind your Node Profile → dawnquiz.vercel.app`}
              />
            </div>
          )}

          <div style={{ maxWidth: 280, margin: "1.25rem auto 0" }}>
            <ShareBtn
              text={(() => {
                const tierStr = completedTiers.map(t => `${TIER_META[t.tier].icon} ${TIER_META[t.tier].label} ${Math.round(t.correct/t.total*100)}%`).join(" · ");
                const challengeUrl = buildChallengeUrl(mySeedRef.current, tierLength);
                const rank = getRank(player.sunrays).name;
                const perfFlag = completedTiers.every(t => t.isPerfect) ? " ✦ Perfect" : "";
                return `🌅 DawnQuiz — ${tierLength}Q run${perfFlag}\n${tierStr}\n+${totalRunSunrays} ☀ · ${rank}\n\n⚔ Beat my score → ${challengeUrl}`;
              })()}
              label="Share Result"
              style={{ marginBottom: "0.75rem" }}
            />
            <Btn onClick={onExit}>← Return Home</Btn>
            <Btn variant="ghost" onClick={() => { setPhase("intro"); setCompletedTiers([]); setTotalRunSunrays(0); }} style={{ marginTop: "0.5rem", color: T.textMuted, borderColor: T.border }}>
              ↩ Change Mode
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  //  PLAYING
  // ════════════════════════════════════════════════════════════
  if (!q) return null;
  const tierLabel = TIER ? `${TIER.icon} ${TIER.label}` : "";
  return (
    <div style={css.screen}>
      {/* Header */}
      <div style={{ padding: "0.75rem 1.25rem 0.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onExit} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {TIER && <span style={{ color: TIER.color, fontSize: "0.7rem", fontWeight: 700, background: TIER.bg, border: `1px solid ${TIER.color}44`, borderRadius: 6, padding: "2px 8px" }}>{tierLabel}</span>}
          {practiceMode && <span style={{ color: T.textMuted, fontSize: "0.7rem", fontWeight: 700, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "2px 7px" }}>Practice</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ display: "flex", gap: "0.2rem" }}>
            {[0,1,2].map(i => <span key={i} style={{ fontSize: "0.9rem", opacity: i < lives ? 1 : 0.2, transition: "opacity 0.3s" }}>☀</span>)}
          </div>
          {!practiceMode ? (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 800, fontSize: "0.88rem",
                color: runTimeLeft > runTotalSecs(tierLength, runDifficulty) * 0.33 ? T.green
                     : runTimeLeft > runTotalSecs(tierLength, runDifficulty) * 0.15 ? T.gold : T.red }}>
                ⏱ {Math.floor(runTimeLeft / 60)}:{String(runTimeLeft % 60).padStart(2, "0")}
              </div>
            </div>
          ) : (
            <div key={tierSunrays} style={{ color: T.gold, fontWeight: 700, fontSize: "0.85rem" }}>
              {player.sunrays + totalRunSunrays + tierSunrays} ☀
            </div>
          )}
        </div>
      </div>
      {/* Run timer bar — earn mode only */}
      {!practiceMode && (() => {
        const total = runTotalSecs(tierLength, runDifficulty);
        const pct = total > 0 ? (runTimeLeft / total) * 100 : 0;
        const barColor = runTimeLeft > total * 0.33 ? T.green : runTimeLeft > total * 0.15 ? T.gold : T.red;
        return <ProgressBar value={runTimeLeft} max={total} color={barColor} height={4} />;
      })()}

      <QuestionCard
        key={timerKey}
        question={q}
        questionNumber={qi + 1}
        totalQuestions={TOTAL}
        onAnswer={handleAnswer}
        answered={answered}
        selectedIndex={selected}
        lifelines={practiceMode ? lifelines : { hint: false }}
        onLifeline={useLifeline}
        showTimer={false}
        timerSecs={0}
        timerActive={false}
        onTimerExpire={() => {}}
        mode="standard"
      />

      {answered && (
        <div style={{ padding: "1rem 1.25rem 0" }}>
          {selected !== q.correct && (
            <div style={{ marginBottom: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.45rem 0.75rem", background: lives - 1 <= 0 ? "#2d0505" : "#1c0a0a", border: `1px solid ${T.red}44`, borderRadius: "10px 10px 0 0" }}>
                <span style={{ fontSize: "0.95rem" }}>{selected === -1 ? "⏱" : "☀"}</span>
                <span style={{ color: T.red, fontSize: "0.78rem", fontWeight: 700 }}>
                  {selected === -1 ? "Time's up" : "Wrong"} — {lives - 1 <= 0 ? "Out of lives!" : `${lives - 1} life${lives - 1 !== 1 ? "s" : ""} remaining`}
                </span>
              </div>
              {q.explanation && (
                <div style={{ padding: "0.6rem 0.75rem", background: "#130707", border: `1px solid ${T.red}22`, borderTop: "none", borderRadius: "0 0 10px 10px", fontSize: "0.78rem", color: "#fca5a5", lineHeight: 1.6 }}>
                  <span style={{ color: T.textDim, fontWeight: 700, fontSize: "0.7rem", display: "block", marginBottom: "0.2rem" }}>CORRECT ANSWER: {q.options[q.correct]}</span>
                  {q.explanation}
                </div>
              )}
            </div>
          )}
          {selected === q.correct && (lastMultiplier?.total > 0 || lastMultiplier?.bonuses?.length > 0) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.6rem", alignItems: "center" }}>
              {lastMultiplier?.bonuses?.map(b => (
                <span key={b.label} style={{ background: "#1c1200", border: `1px solid ${T.gold}44`, borderRadius: 6, padding: "2px 7px", color: T.gold, fontSize: "0.68rem", fontWeight: 700 }}>
                  {b.icon} {b.label}
                </span>
              ))}
              {lastMultiplier?.total > 0 && (
                <span style={{ color: T.gold, fontWeight: 900, fontSize: "0.78rem", marginLeft: "auto" }}>+{lastMultiplier.total} ☀ checkpoint!</span>
              )}
            </div>
          )}
          <Btn onClick={handleNext} variant={selected !== q.correct ? "danger" : "primary"}>
            {selected === q.correct
              ? qi >= TOTAL - 1 ? `${TIER?.icon || "✓"} Tier Complete →` : "Next Question →"
              : lives - 1 <= 0 ? "End Run →" : "Continue →"}
          </Btn>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  BLACKBOX CHALLENGE MODE
// ─────────────────────────────────────────────────────────────

function BlackboxChallenge({ player, dispatch, audio, onExit }) {
  const [pool] = useState(() => shuffle(BLACKBOX_QS).slice(0, 10).map(shuffleOptions));
  const [phase, setPhase] = useState("intro"); // intro | playing | result
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [resultData, setResultData] = useState(null);

  const q = pool[qi];
  const PASS_SCORE = 8;
  const TOTAL = 10;

  function handleAnswer(idx) {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === q.correct) { audio?.play("correct"); setScore(s => s + 1); }
    else { audio?.play("wrong"); }
  }

  function handleNext() {
    if (!answered) return;
    if (qi >= TOTAL - 1) {
      const finalScore = selected === q.correct ? score + 1 : score;
      const passed = finalScore >= PASS_SCORE;
      if (passed) {
        dispatch({ type: "BLACKBOX_PASSED" });
        dispatch({ type: "EARN_SUNRAYS", amount: 10 });
      }
      setResultData({ score: finalScore, passed });
      setPhase("result");
      return;
    }
    setAnswered(false);
    setSelected(null);
    setQi(i => i + 1);
  }

  if (phase === "intro") return (
    <div style={css.screen}>
      <div style={{ padding: "1.5rem 1.25rem" }}>
        <BackBtn onClick={onExit} />
        <div style={{ textAlign: "center", margin: "2rem 0 1.5rem" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "0.75rem" }}>◼</div>
          <div style={{ color: T.purple, fontWeight: 900, fontSize: "1.75rem", letterSpacing: "-0.01em" }}>BLACKBOX CHALLENGE</div>
          <div style={{ color: T.textMuted, fontSize: "0.85rem", marginTop: "0.5rem" }}>Expert Deployment Scenarios</div>
        </div>
        <div style={{ ...css.card, marginBottom: "1.25rem", border: `1px solid ${T.purple}44` }}>
          <div style={{ color: "#c4b5fd", fontSize: "0.85rem", lineHeight: 1.75 }}>
            You've reached BlackBox Holder rank. Before advancing to Deployer, you must demonstrate expert-level understanding of real deployment scenarios.
          </div>
          <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[["Questions", "10 expert scenarios"], ["Pass requirement", "8 / 10 correct"], ["Reward (pass)", "+10 ☀ Sunrays"], ["Unlocks", "Deployer Final Run"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                <span style={{ color: T.textMuted }}>{k}</span>
                <span style={{ color: T.text, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        {player.blackboxPassed && (
          <div style={{ padding: "0.75rem 1rem", background: "#022c22", border: `1px solid ${T.green}44`, borderRadius: 12, color: T.green, fontSize: "0.82rem", marginBottom: "1rem", textAlign: "center" }}>
            ✓ Already completed — you can replay for practice
          </div>
        )}
        <Btn variant="purple" onClick={() => setPhase("playing")}>Begin BlackBox Challenge ◼</Btn>
        <Btn variant="ghost" onClick={onExit} style={{ marginTop: "0.75rem" }}>← Back</Btn>
      </div>
    </div>
  );

  if (phase === "result") return (
    <div style={css.screen}>
      <div style={{ padding: "2.5rem 1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "3.5rem" }}>{resultData.passed ? "🏆" : "📉"}</div>
        <div style={{ color: resultData.passed ? T.purple : T.red, fontWeight: 900, fontSize: "1.75rem", marginTop: "1rem" }}>
          {resultData.passed ? "CHALLENGE PASSED!" : "Challenge Failed"}
        </div>
        <div style={{ color: T.textMuted, marginTop: "0.5rem", marginBottom: "1.75rem" }}>
          {resultData.passed ? "Deployer Final Run is now unlocked." : `You scored ${resultData.score}/10. Need 8+ to pass.`}
        </div>
        <div style={{ ...css.card, maxWidth: 280, margin: "0 auto 2rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", fontWeight: 900, color: resultData.passed ? T.purple : T.red }}>{resultData.score}/10</div>
          <div style={{ color: T.textMuted, fontSize: "0.85rem" }}>Score</div>
          {resultData.passed && <div style={{ color: T.gold, fontSize: "0.85rem", marginTop: "0.5rem" }}>+10 ☀ Sunrays</div>}
        </div>
        {!resultData.passed && <Btn variant="purple" onClick={() => { setPhase("intro"); setQi(0); setScore(0); setSelected(null); setAnswered(false); }}>Try Again</Btn>}
        <Btn variant="ghost" onClick={onExit} style={{ marginTop: "0.75rem" }}>← Home</Btn>
      </div>
    </div>
  );

  return (
    <div style={css.screen}>
      <div style={{ padding: "1rem 1.25rem 0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: T.purple, fontWeight: 700, fontSize: "0.85rem" }}>◼ BLACKBOX</div>
        <div style={{ color: T.textMuted, fontSize: "0.8rem" }}>{score} correct</div>
        <div style={{ color: T.textMuted, fontSize: "0.8rem" }}>Q{qi + 1}/{TOTAL}</div>
      </div>
      <QuestionCard
        question={q}
        questionNumber={qi + 1}
        totalQuestions={TOTAL}
        onAnswer={handleAnswer}
        answered={answered}
        selectedIndex={selected}
        showTimer={false}
        mode="blackbox"
      />
      {answered && (
        <div style={{ padding: "1rem 1.25rem 0" }}>
          <Btn variant="purple" onClick={handleNext}>
            {qi >= TOTAL - 1 ? "View Results" : "Next →"}
          </Btn>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  DEPLOYER FINAL RUN
// ─────────────────────────────────────────────────────────────

function DeployerFinalRun({ player, dispatch, audio, onExit, onVictory }) {
  const [pool] = useState(() => shuffle(DEPLOYER_QS).map(shuffleOptions));
  const [phase, setPhase] = useState("intro"); // intro | playing | failed | victory
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeExpired, setTimeExpired] = useState(false);
  const [timerActive, setTimerActive] = useState(false);

  const TOTAL = 20;
  const TIMER_SECS = 15;
  const q = pool[qi];

  function handleTimerExpire() {
    if (answered) return;
    setSelected(-1);
    setAnswered(true);
    setTimeExpired(true);
  }

  function handleAnswer(idx) {
    if (answered) return;
    setTimerActive(false);
    setSelected(idx);
    setAnswered(true);
    if (idx === q.correct) { audio?.play("correct"); setScore(s => s + 1); }
    else { audio?.play("wrong"); }
  }

  function handleNext() {
    if (!answered) return;
    if (selected !== q.correct || timeExpired) {
      setPhase("failed");
      return;
    }
    if (qi >= TOTAL - 1) {
      dispatch({ type: "DEPLOYER_COMPLETED" });
      dispatch({ type: "EARN_SUNRAYS", amount: 20 });
      audio?.play("victory");
      setPhase("victory");
      return;
    }
    setAnswered(false);
    setSelected(null);
    setTimeExpired(false);
    setTimerActive(false);
    setTimeout(() => setTimerActive(true), 100);
    setQi(i => i + 1);
  }

  function startRun() {
    setPhase("playing");
    setTimerActive(true);
  }

  if (phase === "intro") return (
    <div style={css.screen}>
      <div style={{ padding: "1.5rem 1.25rem" }}>
        <BackBtn onClick={onExit} />
        <div style={{ textAlign: "center", margin: "2rem 0 1.5rem" }}>
          <SunIcon size={72} glow />
          <div style={{ color: T.gold, fontWeight: 900, fontSize: "1.8rem", letterSpacing: "-0.01em", marginTop: "1rem" }}>DEPLOYER FINAL RUN</div>
          <div style={{ color: T.textMuted, fontSize: "0.85rem", marginTop: "0.35rem" }}>The Ultimate Challenge</div>
        </div>
        <div style={{ ...css.card, marginBottom: "1.25rem", border: `1px solid ${T.gold}33` }}>
          <div style={{ color: "#fde68a", fontSize: "0.85rem", lineHeight: 1.75 }}>
            This is it. 20 of the hardest questions in the Dawn ecosystem. No lifelines. No second chances. 15 seconds per question.
          </div>
          <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[["Questions", "20 ultra-hard"], ["Timer", "15 seconds each"], ["Lifelines", "None allowed"], ["Wrong answer", "Run ends immediately"], ["Completion reward", "+20 ☀ Sunrays"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                <span style={{ color: T.textMuted }}>{k}</span>
                <span style={{ color: k === "Wrong answer" ? T.red : T.text, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        {player.deployerCompleted && (
          <div style={{ padding: "0.75rem 1rem", background: "#1c1200", border: `1px solid ${T.gold}44`, borderRadius: 12, color: T.gold, fontSize: "0.82rem", marginBottom: "1rem", textAlign: "center" }}>
            ☀ Already completed — legendary status
          </div>
        )}
        <Btn onClick={startRun} style={{ background: "linear-gradient(135deg,#1c1200,#b45309,#fbbf24)", boxShadow: "0 0 32px #fbbf2444" }}>Begin Final Run ☀</Btn>
        <Btn variant="ghost" onClick={onExit} style={{ marginTop: "0.75rem" }}>← Back</Btn>
      </div>
    </div>
  );

  if (phase === "failed") return (
    <div style={css.screen}>
      <div style={{ padding: "2.5rem 1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "3.5rem" }}>⚡</div>
        <div style={{ color: T.red, fontWeight: 900, fontSize: "1.75rem", marginTop: "1rem" }}>
          {timeExpired ? "Time Expired" : "Incorrect Answer"}
        </div>
        <div style={{ color: T.textMuted, marginTop: "0.5rem", marginBottom: "1.75rem" }}>
          You reached question {qi + 1} of {TOTAL}. The Deployer rank demands perfection.
        </div>
        <div style={{ ...css.card, maxWidth: 280, margin: "0 auto 2rem" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: 900, color: T.red }}>{qi}/{TOTAL}</div>
          <div style={{ color: T.textMuted, fontSize: "0.85rem" }}>Questions answered</div>
        </div>
        <Btn onClick={() => { setPhase("intro"); setQi(0); setScore(0); setSelected(null); setAnswered(false); setTimeExpired(false); setTimerActive(false); }}>Try Again</Btn>
        <Btn variant="ghost" onClick={onExit} style={{ marginTop: "0.75rem" }}>← Home</Btn>
      </div>
    </div>
  );

  if (phase === "victory") return <DeployerVictory onExit={onExit} />;

  // playing
  return (
    <div style={css.screen}>
      <div style={{ padding: "1rem 1.25rem 0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: T.gold, fontWeight: 700, fontSize: "0.88rem" }}>☀ DEPLOYER RUN</div>
        <div style={{ color: T.textMuted, fontSize: "0.8rem" }}>{score} correct</div>
      </div>
      <QuestionCard
        question={q}
        questionNumber={qi + 1}
        totalQuestions={TOTAL}
        onAnswer={handleAnswer}
        answered={answered}
        selectedIndex={selected}
        showTimer={true}
        timerSecs={TIMER_SECS}
        timerActive={timerActive}
        onTimerExpire={handleTimerExpire}
        mode="deployer"
      />
      {answered && (
        <div style={{ padding: "1rem 1.25rem 0" }}>
          <Btn onClick={handleNext} style={selected !== q.correct || timeExpired ? { background: "linear-gradient(135deg,#7f1d1d,#dc2626)", color: "#fff" } : {}}>
            {selected !== q.correct || timeExpired ? "End Run" : qi >= TOTAL - 1 ? "Complete Final Run ☀" : "Next Question →"}
          </Btn>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  RANK-UP TOAST NOTIFICATION
// ─────────────────────────────────────────────────────────────

function RankUpToast({ rank, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 80);
    const hide = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 500); }, 4000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [onDismiss]);

  return (
    <div style={{
      position: "fixed", bottom: "1.5rem", left: "50%", transform: `translateX(-50%) translateY(${visible ? 0 : 80}px)`,
      transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s",
      opacity: visible ? 1 : 0,
      zIndex: 999, maxWidth: 380, width: "calc(100% - 2rem)",
      background: `linear-gradient(135deg, ${rank.color}22, #1c1200)`,
      border: `1.5px solid ${rank.accent}`,
      borderRadius: 16, padding: "1rem 1.25rem",
      display: "flex", alignItems: "center", gap: "0.85rem",
      boxShadow: `0 8px 32px ${rank.color}55`,
      fontFamily: "'DM Sans','Syne',sans-serif",
    }}>
      <span style={{ fontSize: "2rem", lineHeight: 1 }}>{rank.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: rank.accent, fontWeight: 800, fontSize: "0.9rem" }}>Rank Up! 🎉</div>
        <div style={{ color: T.textMuted, fontSize: "0.78rem", marginTop: "0.1rem" }}>
          You are now a <strong style={{ color: rank.accent }}>{rank.name}</strong>
        </div>
      </div>
      <button onClick={() => { setVisible(false); setTimeout(onDismiss, 400); }}
        style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: "1rem", padding: 0 }}>✕</button>
    </div>
  );
}

function DeployerVictory({ onExit }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const delays = [300, 700, 1300, 1900, 2600, 3200];
    const timers = delays.map((d, i) =>
      setTimeout(() => setFrame(f => Math.max(f, i + 1)), d)
    );
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  // Spec-exact copy lines
  const lines = [
    { text: "You are now a Deployer.", bold: true,  color: T.text },
    { text: "You have mastered the knowledge required", bold: false, color: "#c4b5d0" },
    { text: "to deploy and support the Dawn network.", bold: false, color: "#c4b5d0" },
    { text: "The network grows stronger with you.", bold: true,  color: T.gold },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 55%, #241000 0%, #12080a 40%, #07070f 75%)",
      color: T.text,
      fontFamily: "'DM Sans','Syne',sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "2.5rem 1.5rem", textAlign: "center", overflowY: "auto",
    }}>

      {/* Animated pulsing sun */}
      <div style={{ marginBottom: "1.75rem", animation: "vPulse 2.2s ease-in-out infinite" }}>
        <SunIcon size={108} glow />
      </div>

      {/* ☀️ CONGRATULATIONS ☀️ */}
      <div style={{
        color: T.gold, fontSize: "0.95rem", fontWeight: 800, letterSpacing: "0.28em",
        marginBottom: "0.6rem",
        opacity: frame >= 1 ? 1 : 0, transform: frame >= 1 ? "none" : "translateY(8px)",
        transition: "opacity 0.7s, transform 0.7s",
      }}>
        ☀️ CONGRATULATIONS ☀️
      </div>

      {/* YOU ARE A DEPLOYER */}
      <div style={{
        fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1,
        marginBottom: "2rem",
        opacity: frame >= 1 ? 1 : 0, transform: frame >= 1 ? "none" : "translateY(10px)",
        transition: "opacity 0.7s 0.15s, transform 0.7s 0.15s",
      }}>
        YOU ARE A<br /><span style={{ color: T.gold }}>DEPLOYER</span>
      </div>

      {/* Spec copy lines (staggered) */}
      <div style={{ maxWidth: 320, marginBottom: "2rem" }}>
        {lines.map((line, i) => (
          <p key={i} style={{
            color: line.color,
            fontSize: i === 0 ? "1.05rem" : "0.9rem",
            fontWeight: line.bold ? 700 : 400,
            lineHeight: 1.7,
            margin: "0 0 0.3rem",
            opacity: frame >= i + 2 ? 1 : 0,
            transform: frame >= i + 2 ? "none" : "translateY(10px)",
            transition: "opacity 0.65s, transform 0.65s",
          }}>
            {line.text}
          </p>
        ))}
      </div>

      {/* Decorative rays bar */}
      <div style={{
        display: "flex", gap: "0.45rem", justifyContent: "center",
        marginBottom: "2rem",
        opacity: frame >= 5 ? 1 : 0, transition: "opacity 0.8s",
      }}>
        {[10, 16, 22, 32, 22, 16, 10].map((w, i) => (
          <div key={i} style={{ width: w, height: 3, borderRadius: 2, background: T.gold, opacity: 0.25 + i * 0.08 }} />
        ))}
      </div>

      {/* Reward card + CTA */}
      <div style={{
        width: "100%", maxWidth: 320,
        opacity: frame >= 6 ? 1 : 0, transition: "opacity 0.8s",
      }}>
        <div style={{ padding: "1.1rem", background: "#1c0d00", border: `1px solid ${T.gold}44`, borderRadius: 16, marginBottom: "1.25rem" }}>
          <div style={{ color: T.gold, fontSize: "2.25rem", fontWeight: 900 }}>+20 ☀</div>
          <div style={{ color: T.textMuted, fontSize: "0.8rem" }}>Sunrays Awarded</div>
        </div>
        <Btn onClick={onExit} style={{ background: "linear-gradient(135deg,#1c1200,#b45309,#fbbf24)", boxShadow: "0 0 48px #fbbf2466", fontSize: "1rem" }}>
          Return Home ☀
        </Btn>
      </div>

      <style>{`
        @keyframes vPulse {
          0%,100% { transform: scale(1);   filter: drop-shadow(0 0 18px #fbbf24aa); }
          50%     { transform: scale(1.07); filter: drop-shadow(0 0 42px #fbbf24ff); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  ADMIN AUTH — PIN-based multi-admin system
// ─────────────────────────────────────────────────────────────

// Admin list stored in localStorage as: [{ name, pin (hashed), role, addedAt }]
// Role: "master" (can manage admins) | "admin" (full panel access)
// PIN is stored as a simple hash — not cryptographic but prevents casual snooping

function hashPin(pin) {
  // Simple deterministic hash — good enough for a quiz app
  let h = 0x811c9dc5;
  for (let i = 0; i < pin.length; i++) {
    h ^= pin.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16);
}

function useAdmins() {
  const [admins, setAdmins] = useLocalStorage("dawn_admins", []);
  const hasMaster = admins.some(a => a.role === "master");

  function addAdmin(name, pin, role = "admin", canAcademy = false) {
    const entry = { id: "adm_" + Date.now(), name: name.trim(), pinHash: hashPin(pin), role, addedAt: new Date().toLocaleDateString() };
    setAdmins(prev => [...prev, entry]);
    return entry;
  }

  function removeAdmin(id) {
    setAdmins(prev => prev.filter(a => a.id !== id));
  }

  function verifyPin(pin) {
    const h = hashPin(pin);
    return admins.find(a => a.pinHash === h) || null;
  }

  return { admins, hasMaster, addAdmin, removeAdmin, verifyPin };
}

// ── PIN entry modal ──────────────────────────────────────────

function AdminPinModal({ onSuccess, onCancel, admins, hasMaster }) {
  const [pin,     setPin]     = useState("");
  const [name,    setName]    = useState("");
  const [confirm, setConfirm] = useState("");
  const [error,   setError]   = useState("");
  const [visible, setVisible] = useState(false);

  // All handler functions hoisted — no functions inside if blocks
  function createMaster() {
    if (!name.trim())                { setError("Enter your name."); return; }
    if (pin.length < 4)              { setError("PIN must be at least 4 digits."); return; }
    if (!/^[0-9]+$/.test(pin))      { setError("PIN must be numbers only."); return; }
    if (pin !== confirm)             { setError("PINs don't match."); return; }
    onSuccess("setup", { name, pin });
  }

  function submit() {
    if (!pin) { setError("Enter your PIN."); return; }
    const admin = admins.find(a => a.pinHash === hashPin(pin));
    if (!admin) { setError("Incorrect PIN. Try again."); setPin(""); return; }
    setError("");
    onSuccess("login", admin);
  }

  // First-time setup — no master yet
  if (!hasMaster) {
    return (
      <div style={modalOverlay}>
        <div style={modalBox}>
          <div style={{ color: T.gold, fontWeight: 800, fontSize: "1rem", marginBottom: "0.25rem" }}>⚙ Admin Setup</div>
          <div style={{ color: T.textMuted, fontSize: "0.78rem", lineHeight: 1.6, marginBottom: "1rem" }}>
            Create your master admin PIN. Keep it safe — only master admins can add or remove other admins.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            <div>
              <span style={css.lbl}>YOUR NAME</span>
              <input value={name} onChange={e => setName(e.target.value)} style={css.inp} placeholder="e.g. Dawn Admin" autoFocus />
            </div>
            <div>
              <span style={css.lbl}>CREATE PIN (numbers only)</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input value={pin} onChange={e => { setPin(e.target.value.replace(/[^0-9]/g,"")); setError(""); }} type={visible ? "text" : "password"} inputMode="numeric" maxLength={8} style={{ ...css.inp, flex: 1, letterSpacing: "0.2em", fontFamily: "monospace" }} placeholder="••••" />
                <button onClick={() => setVisible(v => !v)} style={visBtn}>{visible ? "Hide" : "Show"}</button>
              </div>
            </div>
            <div>
              <span style={css.lbl}>CONFIRM PIN</span>
              <input value={confirm} onChange={e => { setConfirm(e.target.value.replace(/[^0-9]/g,"")); setError(""); }} type={visible ? "text" : "password"} inputMode="numeric" maxLength={8} style={{ ...css.inp, letterSpacing: "0.2em", fontFamily: "monospace" }} placeholder="••••" />
            </div>
          </div>
          {error && <div style={{ color: T.red, fontSize: "0.75rem", marginTop: "0.6rem" }}>{error}</div>}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <Btn onClick={createMaster} style={{ flex: 1 }}>Create Master PIN</Btn>
            <Btn variant="ghost" onClick={onCancel} style={{ flex: 1 }}>Cancel</Btn>
          </div>
        </div>
      </div>
    );
  }

  // Normal PIN entry
  return (
    <div style={modalOverlay}>
      <div style={modalBox}>
        <div style={{ color: T.gold, fontWeight: 800, fontSize: "1rem", marginBottom: "0.5rem" }}>⚙ Admin Access</div>
        <div style={{ color: T.textMuted, fontSize: "0.78rem", marginBottom: "1rem" }}>Enter your admin PIN to continue.</div>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem" }}>
          <input
            value={pin}
            onChange={e => { setPin(e.target.value.replace(/[^0-9]/g,"")); setError(""); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            type={visible ? "text" : "password"}
            inputMode="numeric"
            maxLength={8}
            autoFocus
            style={{ ...css.inp, flex: 1, letterSpacing: "0.3em", fontFamily: "monospace", fontSize: "1.2rem", textAlign: "center" }}
            placeholder="••••"
          />
          <button onClick={() => setVisible(v => !v)} style={visBtn}>{visible ? "Hide" : "Show"}</button>
        </div>
        {error && <div style={{ color: T.red, fontSize: "0.75rem", marginBottom: "0.6rem" }}>{error}</div>}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Btn onClick={submit} style={{ flex: 1 }}>Enter</Btn>
          <Btn variant="ghost" onClick={onCancel} style={{ flex: 1 }}>Cancel</Btn>
        </div>
      </div>
    </div>
  );
}

const modalOverlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1.5rem",
};
const modalBox = {
  background: T.surfaceHigh, border: `1px solid ${T.borderHigh}`, borderRadius: 20,
  padding: "1.5rem", width: "100%", maxWidth: 360,
  boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
};
const visBtn = {
  padding: "0 0.7rem", background: T.surface, border: `1px solid ${T.borderHigh}`,
  borderRadius: 10, color: T.textMuted, cursor: "pointer", fontSize: "0.75rem",
  fontFamily: "inherit", flexShrink: 0,
};

// ── Feature Labels Editor ───────────────────────────────────

const LABEL_KEYS = [
  { k: "game",        icon: "🎯", name: "Play Game" },
  { k: "learn",       icon: "📚", name: "Dawn Academy" },
  { k: "study",       icon: "📖", name: "Study Materials" },
  { k: "archive",     icon: "📋", name: "Quiz Archive" },
  { k: "leaderboard", icon: "🏆", name: "Leaderboard" },
  { k: "profile",     icon: "👤", name: "Profile" },
];

function FeatureLabelsAdmin({ navLabels, setNavLabels, isMaster }) {
  const [editing, setEditing] = useState(null); // key being edited
  const [label,   setLabel]   = useState("");
  const [sub,     setSub]     = useState("");
  const [saved,   setSaved]   = useState(false);

  function startEdit(k) {
    setEditing(k);
    setLabel(navLabels[k]?.label || NAV_DEFAULTS[k]?.label || "");
    setSub(navLabels[k]?.sub    || NAV_DEFAULTS[k]?.sub    || "");
    setSaved(false);
  }

  function save() {
    setNavLabels(prev => ({ ...prev, [editing]: { label: label.trim() || NAV_DEFAULTS[editing].label, sub: sub.trim() || NAV_DEFAULTS[editing].sub } }));
    setSaved(true);
    setTimeout(() => { setSaved(false); setEditing(null); }, 1200);
  }

  function reset(k) {
    setNavLabels(prev => ({ ...prev, [k]: { label: NAV_DEFAULTS[k].label, sub: NAV_DEFAULTS[k].sub } }));
  }

  if (!isMaster) return (
    <div style={{ color: T.textDim, fontSize: "0.78rem", textAlign: "center", padding: "2rem 0", lineHeight: 1.6 }}>
      Only master admins can edit feature labels.
    </div>
  );

  if (editing) return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <span style={{ color: T.text, fontWeight: 700, fontSize: "0.9rem" }}>
          {LABEL_KEYS.find(x => x.k === editing)?.icon} Edit Label
        </span>
        <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: "0.82rem", fontFamily: "inherit" }}>← Back</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div>
          <span style={css.lbl}>TITLE</span>
          <input value={label} onChange={e => setLabel(e.target.value)} style={css.inp} placeholder={NAV_DEFAULTS[editing]?.label} />
        </div>
        <div>
          <span style={css.lbl}>SUBTITLE</span>
          <input value={sub} onChange={e => setSub(e.target.value)} style={css.inp} placeholder={NAV_DEFAULTS[editing]?.sub} />
        </div>
      </div>
      {saved && <div style={{ color: T.green, fontSize: "0.78rem", marginTop: "0.6rem" }}>✓ Saved!</div>}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        <Btn onClick={save} style={{ flex: 1 }}>Save ✓</Btn>
        <Btn variant="ghost" onClick={() => { reset(editing); setEditing(null); }} style={{ flex: 1 }}>Reset Default</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ color: T.textMuted, fontSize: "0.75rem", marginBottom: "1rem", lineHeight: 1.5 }}>
        Edit the title and subtitle shown on each home screen feature card.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
        {LABEL_KEYS.map(({ k, icon }) => {
          const lbl = navLabels[k]?.label || NAV_DEFAULTS[k]?.label;
          const sb  = navLabels[k]?.sub   || NAV_DEFAULTS[k]?.sub;
          const isCustom = navLabels[k]?.label && navLabels[k].label !== NAV_DEFAULTS[k].label;
          return (
            <div key={k} style={{ ...css.card, display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ fontSize: "1.4rem", flexShrink: 0 }}>{icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: T.text, fontWeight: 600, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  {lbl}
                  {isCustom && <span style={{ color: T.gold, fontSize: "0.65rem", background: "#1c1200", padding: "0.1rem 0.4rem", borderRadius: 6 }}>custom</span>}
                </div>
                <div style={{ color: T.textMuted, fontSize: "0.7rem", marginTop: "0.1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sb}</div>
              </div>
              <button onClick={() => startEdit(k)} style={{ background: T.surface, border: `1px solid ${T.borderHigh}`, borderRadius: 8, padding: "0.3rem 0.6rem", color: T.textMuted, cursor: "pointer", fontSize: "0.72rem", fontFamily: "inherit", flexShrink: 0 }}>Edit</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Admin Management tab ─────────────────────────────────────

function AdminManagement({ currentAdmin, adminsHook }) {
  const { admins, addAdmin, removeAdmin } = adminsHook;
  const [view,    setView]    = useState("list"); // list | add
  const [name,    setName]    = useState("");
  const [pin,     setPin]     = useState("");
  const [confirm, setConfirm] = useState("");
  const [role,    setRole]    = useState("admin");
  const [visible, setVisible] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const isMaster = currentAdmin?.role === "master";

  function submitAdd() {
    if (!name.trim())        { setError("Enter a name."); return; }
    if (pin.length < 4)      { setError("PIN must be at least 4 digits."); return; }
    if (!/^\d+$/.test(pin))  { setError("PIN must be numbers only."); return; }
    if (pin !== confirm)     { setError("PINs don't match."); return; }
    if (admins.some(a => a.name.toLowerCase() === name.trim().toLowerCase())) {
      setError("An admin with that name already exists."); return;
    }
    addAdmin(name, pin, role);
    setSuccess(`✓ ${name} added as ${role}`);
    setName(""); setPin(""); setConfirm(""); setError("");
    setTimeout(() => { setSuccess(""); setView("list"); }, 1800);
  }

  if (view === "add") return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <span style={{ color: T.text, fontWeight: 700, fontSize: "0.9rem" }}>Add Admin</span>
        <button onClick={() => { setView("list"); setError(""); }} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: "0.82rem", fontFamily: "inherit" }}>← Back</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        <div>
          <span style={css.lbl}>NAME</span>
          <input value={name} onChange={e => setName(e.target.value)} style={css.inp} placeholder="Admin's name…" />
        </div>
        <div>
          <span style={css.lbl}>ROLE</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {["admin","master"].map(r => (
              <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: "0.45rem", borderRadius: 8, border: `1px solid ${role === r ? T.gold : T.borderHigh}`, background: role === r ? "#1c1200" : T.surface, color: role === r ? T.gold : T.textMuted, cursor: "pointer", fontSize: "0.75rem", fontWeight: role === r ? 700 : 400, fontFamily: "inherit" }}>
                {r === "master" ? "👑 Master" : "🔧 Admin"}
              </button>
            ))}
          </div>
          <div style={{ color: T.textDim, fontSize: "0.7rem", marginTop: "0.35rem", lineHeight: 1.5 }}>
            {role === "master" ? "Master admins can add/remove other admins." : "Admins can manage questions, archive and modules."}
          </div>
        </div>
        <div>
          <span style={css.lbl}>PIN (numbers only)</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,""))} type={visible ? "text" : "password"} inputMode="numeric" maxLength={8} style={{ ...css.inp, flex: 1, letterSpacing: "0.2em", fontFamily: "monospace" }} placeholder="••••" />
            <button onClick={() => setVisible(v => !v)} style={visBtn}>{visible ? "Hide" : "Show"}</button>
          </div>
        </div>
        <div>
          <span style={css.lbl}>CONFIRM PIN</span>
          <input value={confirm} onChange={e => setConfirm(e.target.value.replace(/\D/g,""))} type={visible ? "text" : "password"} inputMode="numeric" maxLength={8} style={{ ...css.inp, letterSpacing: "0.2em", fontFamily: "monospace" }} placeholder="••••" />
        </div>
      </div>
      {error   && <div style={{ color: T.red,   fontSize: "0.75rem", marginTop: "0.65rem" }}>{error}</div>}
      {success && <div style={{ color: T.green, fontSize: "0.78rem", marginTop: "0.65rem" }}>{success}</div>}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        <Btn onClick={submitAdd} style={{ flex: 1 }}>Add Admin ✓</Btn>
        <Btn variant="ghost" onClick={() => { setView("list"); setError(""); }} style={{ flex: 1 }}>Cancel</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <span style={{ color: T.textMuted, fontSize: "0.78rem" }}>{admins.length} admin{admins.length !== 1 ? "s" : ""}</span>
        {isMaster && (
          <button onClick={() => setView("add")} style={{ background: "#1c1200", border: `1px solid ${T.gold}`, borderRadius: 8, padding: "0.4rem 0.85rem", color: T.gold, cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, fontFamily: "inherit" }}>+ Add Admin</button>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
        {admins.map(a => {
          const isYou = a.id === currentAdmin?.id;
          const isMasterEntry = a.role === "master";
          const canRemove = isMaster && !isYou && !(isMasterEntry && admins.filter(x => x.role === "master").length <= 1);
          return (
            <div key={a.id} style={{ ...css.card, display: "flex", alignItems: "center", gap: "0.75rem", borderLeft: `3px solid ${isMasterEntry ? T.gold : T.blue}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: T.text, fontWeight: 600, fontSize: "0.85rem" }}>
                  {isMasterEntry ? "👑 " : "🔧 "}{a.name}
                  {isYou && <span style={{ color: T.textDim, fontSize: "0.68rem", marginLeft: "0.4rem" }}>(you)</span>}
                </div>
                <div style={{ color: T.textMuted, fontSize: "0.7rem", marginTop: "0.1rem" }}>
                  {a.role} · added {a.addedAt}
                  {a.role !== "master" && isMaster && (
                    <span
                      onClick={e => { e.stopPropagation(); setAdmins(prev => prev.map(x => x.id === a.id ? { ...x, canAcademy: !x.canAcademy } : x)); }}
                      style={{ marginLeft: "0.5rem", cursor: "pointer", color: a.canAcademy ? T.gold : T.textDim, fontSize: "0.67rem", fontWeight: 700 }}
                      title="Toggle Academy access">
                      📚 {a.canAcademy ? "Academy ✓" : "Academy ✗"}
                    </span>
                  )}
                </div>
              </div>
              {canRemove && (
                <button onClick={() => removeAdmin(a.id)}
                  style={{ background: "none", border: `1px solid ${T.red}55`, borderRadius: 8, padding: "0.3rem 0.6rem", color: T.red, cursor: "pointer", fontSize: "0.72rem", fontFamily: "inherit" }}>Remove</button>
              )}
            </div>
          );
        })}
      </div>
      {!isMaster && (
        <div style={{ color: T.textDim, fontSize: "0.72rem", textAlign: "center", marginTop: "1rem", lineHeight: 1.5 }}>
          Only master admins can add or remove admins.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  ADMIN PANEL — with CSV Import + AI Generator
// ─────────────────────────────────────────────────────────────

const EMPTY_Q = { diff: "beginner", question: "", options: ["", "", "", ""], correct: 0, explanation: "", hint: "" };

// CSV template columns (order matters for parser)
const CSV_HEADERS = ["question","option_a","option_b","option_c","option_d","correct","difficulty","hint","explanation"];
const CSV_TEMPLATE_ROW = [
  "What is Dawn Internet?",
  "A social media platform",
  "A decentralized bandwidth-sharing ecosystem",
  "A cryptocurrency exchange",
  "A cloud gaming service",
  "B",
  "beginner",
  "Think about what problem Dawn solves",
  "Dawn enables users to share bandwidth and build a permissionless internet."
];

function downloadCSVTemplate() {
  const rows = [CSV_HEADERS, CSV_TEMPLATE_ROW];
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "dawn_quiz_questions.csv"; a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { questions: [], errors: ["CSV has no data rows."] };

  const errors = [];
  const questions = [];

  // Strip header row
  const dataRows = lines.slice(1);

  dataRows.forEach((line, idx) => {
    // Simple CSV parser: handle quoted fields
    const cells = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { cells.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    cells.push(cur.trim());

    const [question, a, b, c, d, correct, difficulty, hint, explanation] = cells;
    const rowNum = idx + 2;

    if (!question) { errors.push(`Row ${rowNum}: missing question`); return; }
    if (!a || !b || !c || !d) { errors.push(`Row ${rowNum}: need all 4 options`); return; }

    const correctMap = { A: 0, B: 1, C: 2, D: 3 };
    const correctIdx = correctMap[(correct || "").toUpperCase().trim()];
    if (correctIdx === undefined) { errors.push(`Row ${rowNum}: 'correct' must be A, B, C or D`); return; }

    const diff = (difficulty || "beginner").toLowerCase().trim();
    if (!["beginner","intermediate","expert"].includes(diff)) {
      errors.push(`Row ${rowNum}: difficulty must be beginner/intermediate/expert`); return;
    }
    if (!explanation) { errors.push(`Row ${rowNum}: missing explanation`); return; }

    questions.push({
      id: `csv_${Date.now()}_${idx}`,
      question: question.trim(),
      options: [a.trim(), b.trim(), c.trim(), d.trim()],
      correct: correctIdx,
      diff,
      hint: (hint || "").trim(),
      explanation: explanation.trim(),
    });
  });

  return { questions, errors };
}

// ── AI Provider Configuration ───────────────────────────────

const AI_PROVIDERS = {
  anthropic: {
    id:          "anthropic",
    name:        "Claude (Anthropic)",
    icon:        "✦",
    color:       "#8b5cf6",
    accent:      "#c4b5fd",
    placeholder: "sk-ant-api03-...",
    prefix:      "sk-ant-",
    storageKey:  "dawn_key_anthropic",
    free:        false,
    freeNote:    "$5 credit · ~1,000+ generations",
    docsUrl:     "console.anthropic.com",
  },
  gemini: {
    id:          "gemini",
    name:        "Gemini (Google)",
    icon:        "◈",
    color:       "#1a73e8",
    accent:      "#60a5fa",
    placeholder: "AIzaSy...",
    prefix:      "AIza",
    storageKey:  "dawn_key_gemini",
    free:        true,
    freeNote:    "Free forever · 1,500 req/day",
    docsUrl:     "aistudio.google.com",
    needsProxy:  true,
  },
  grok: {
    id:          "grok",
    name:        "Grok (xAI)",
    icon:        "⊕",
    color:       "#18181b",
    accent:      "#e2e8f0",
    placeholder: "xai-...",
    prefix:      "xai-",
    storageKey:  "dawn_key_grok",
    free:        true,
    freeNote:    "Free tier · 25 req/day",
    docsUrl:     "console.x.ai",
    needsProxy:  true,
  },
  groq: {
    id:          "groq",
    name:        "Groq (Llama 3.3)",
    icon:        "⚡",
    color:       "#f55036",
    accent:      "#fb923c",
    placeholder: "gsk_...",
    prefix:      "gsk_",
    storageKey:  "dawn_key_groq",
    free:        true,
    freeNote:    "Free forever · 14,400 req/day",
    docsUrl:     "console.groq.com",
    needsProxy:  true,
  },
  openai: {
    id:          "openai",
    name:        "GPT-4o (OpenAI)",
    icon:        "⬡",
    color:       "#10a37f",
    accent:      "#34d399",
    placeholder: "sk-...",
    prefix:      "sk-",
    storageKey:  "dawn_key_openai",
    free:        false,
    freeNote:    "$5 credit · expires 3 months",
    docsUrl:     "platform.openai.com",
    needsProxy:  true,
  },
};

// Detect if we're running on Vercel (proxy available) or in a preview/sandbox
const HAS_PROXY = (() => {
  try {
    const host = window.location.hostname;
    return host.includes("vercel.app") || host.includes("dawninternet") || host.includes("deployer");
  } catch { return false; }
})();

// Call proxy endpoint for providers that block direct browser CORS
async function callViaProxy(provider, apiKey, payload) {
  const res = await fetch("/api/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, apiKey, payload }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message || `${provider} error ${res.status}`);
  }
  return res.json();
}

// Route to correct API and return raw text response
async function callAI(provider, apiKey, prompt) {
  if (provider === "anthropic") {
    if (HAS_PROXY) {
      // On Vercel, route through proxy to avoid any iframe restrictions
      const data = await callViaProxy("anthropic", apiKey, {
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      });
      return data.content?.[0]?.text || "";
    }
    // Direct browser access (Claude.ai preview, local dev)
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error?.message || `Anthropic error ${res.status}`); }
    const data = await res.json();
    return data.content?.[0]?.text || "";
  }

  if (provider === "gemini") {
    if (HAS_PROXY) {
      const data = await callViaProxy("gemini", apiKey, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4000 },
      });
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
    // Direct fallback (works in some environments)
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4000 },
        }),
      }
    );
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      const msg = e?.error?.message || `Gemini error ${res.status}`;
      if (msg.includes("API_KEY_INVALID") || msg.includes("not enabled")) {
        throw new Error("Gemini: Make sure the Generative Language API is enabled in your Google Cloud project at console.cloud.google.com → APIs & Services.");
      }
      throw new Error(msg);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  if (provider === "grok") {
    if (HAS_PROXY) {
      const data = await callViaProxy("grok", apiKey, {
        model: "grok-3",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
        temperature: 0.7,
      });
      return data.choices?.[0]?.message?.content || "";
    }
    throw new Error("Grok requires the deployed version on Vercel (CORS restriction). Use Claude or deploy to Vercel first.");
  }

  if (provider === "groq") {
    if (HAS_PROXY) {
      const data = await callViaProxy("groq", apiKey, {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
        temperature: 0.7,
      });
      return data.choices?.[0]?.message?.content || "";
    }
    throw new Error("Groq requires the deployed version on Vercel (CORS restriction). Use Claude or deploy to Vercel first.");
  }

  if (provider === "openai") {
    if (HAS_PROXY) {
      const data = await callViaProxy("openai", apiKey, {
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
        temperature: 0.7,
      });
      return data.choices?.[0]?.message?.content || "";
    }
    throw new Error("OpenAI requires the deployed version on Vercel (CORS restriction). Use Claude or deploy to Vercel first.");
  }

  throw new Error("Unknown provider");
}

// ── AI Generator sub-component ──────────────────────────────

const STUDY_MATERIAL_CONTEXT = {
  1: {
    title: "Messari: State of DePIN 2025",
    context: `DePIN (Decentralized Physical Infrastructure Network) represents protocols that incentivize communities to build real-world infrastructure using blockchain rewards. Dawn is classified under connectivity/wireless infrastructure — protocols that decentralize internet access and bandwidth provision. Key themes: organic demand ratio as viability signal, geographic diversity of nodes, Sybil resistance, proof-of-bandwidth mechanisms, token emission sustainability, and the cold start problem for new node operators. Messari weights organic demand (real users paying for services) over reward-driven supply as the critical long-term viability metric.`
  },
  2: {
    title: "Blockmates Infrastructure Deep Dive",
    context: `Dawn's infrastructure layer differentiates itself through community-owned bandwidth contribution rather than corporate data centers. Key architectural concepts: node reputation systems, geographic load balancing, peer discovery optimization, data plane separation from control plane, watchtower nodes for independent monitoring, and challenge-response bandwidth verification protocols.`
  },
  3: {
    title: "Dawn Q1 2026 Roadmap",
    context: `Dawn's Q1 2026 roadmap prioritizes expanding the node network, scaling BlackBox hardware deployments, advancing decentralized internet infrastructure footprint, improving network economics, and growing the operator community. Key milestones include BlackBox rollout expansion and protocol improvements for bandwidth verification.`
  },
  4: {
    title: "The BlackBox — Introduction",
    context: `The BlackBox is Dawn's dedicated hardware node device engineered for optimal bandwidth contribution. Key concepts: minimum bandwidth requirements (100Mbps+), uptime SLA compliance, QoS router configuration, challenge-response verification, routing attack prevention, streak/uptime bonuses, the 160 Sunray threshold for BlackBox Holder rank, and the distinction between cold nodes (dormant) and warm nodes (actively routing traffic).`
  },
  5: {
    title: "A New Dawn for the Internet",
    context: `Dawn's foundational vision: decentralized internet removes single points of censorship and control that centralized ISPs represent. Core principles: permissionless participation, bandwidth contribution model, censorship resistance, no single entity controlling access, community ownership of infrastructure. Decentralization distributes control across many independent nodes rather than corporate servers. The network's strength comes from geographic and operator diversity.`
  },
  6: {
    title: "Dawn Research Articles",
    context: `Technical research on decentralized internet architecture: Byzantine Fault Tolerance (up to 1/3 malicious nodes tolerated), zero-knowledge proofs for bandwidth verification, VRF (Verifiable Random Function) for unbiased node selection, eclipse attacks and peer diversity defenses, routing table poisoning risks, economic finality of rewards, slashing mechanisms for node accountability, content-addressed vs location-addressed storage, and enterprise SLA requirements for last-mile connectivity.`
  },
};

function GeneratedList({ generated, selected, setSelected, toggleSelected, importSelected, prov }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div style={{ marginTop: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <button onClick={() => setExpanded(e => !e)} style={{ background: "none", border: "none", color: T.text, fontWeight: 700, fontSize: "0.85rem", fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "0.7rem" }}>{expanded ? "▼" : "▶"}</span>
          {generated.length} Questions Generated
        </button>
        <button onClick={() => setSelected(selected.size === generated.length ? new Set() : new Set(generated.map((_, i) => i)))}
          style={{ background: "none", border: "none", color: prov.accent, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}>
          {selected.size === generated.length ? "Deselect all" : "Select all"} ({selected.size}/{generated.length})
        </button>
      </div>
      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1rem" }}>
          {generated.map((q, i) => (
            <button key={i} onClick={() => toggleSelected(i)}
              style={{ textAlign: "left", padding: "0.85rem 1rem", borderRadius: 12,
                border: `1.5px solid ${selected.has(i) ? prov.accent : T.border}`,
                background: selected.has(i) ? "#0d0d1a" : T.surface,
                cursor: "pointer", fontFamily: "inherit",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.35rem" }}>
                <span style={{ color: selected.has(i) ? prov.accent : T.text, fontSize: "0.83rem", fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{q.question}</span>
                <span style={{ color: selected.has(i) ? prov.accent : T.textDim, fontSize: "1rem", flexShrink: 0 }}>{selected.has(i) ? "✓" : "○"}</span>
              </div>
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <span style={{ ...css.tag(DIFF_COLOR[q.diff] || T.gold) }}>{q.diff}</span>
                <span style={{ color: T.green, fontSize: "0.7rem" }}>✓ {q.options[q.correct]}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      <Btn onClick={importSelected} disabled={selected.size === 0}
        style={{ background: `linear-gradient(135deg, ${prov.color}cc, ${prov.accent})`, color: "#000", boxShadow: "none" }}>
        Import {selected.size} Question{selected.size !== 1 ? "s" : ""} →
      </Btn>
    </div>
  );
}

function AIGenerator({ dispatch, onClose }) {
  // Per-provider key state — each stored independently in localStorage
  const [anthropicKey, setAnthropicKey] = useLocalStorage("dawn_key_anthropic", "");
  const [geminiKey,    setGeminiKey]    = useLocalStorage("dawn_key_gemini",    "");
  const [grokKey,      setGrokKey]      = useLocalStorage("dawn_key_grok",      "");
  const [groqKey,      setGroqKey]      = useLocalStorage("dawn_key_groq",      "");
  const [openaiKey,    setOpenaiKey]    = useLocalStorage("dawn_key_openai",    "");

  const keySetters = { anthropic: setAnthropicKey, gemini: setGeminiKey, grok: setGrokKey, groq: setGroqKey, openai: setOpenaiKey };
  const keyValues  = { anthropic: anthropicKey,    gemini: geminiKey,    grok: grokKey,    groq: groqKey,    openai: openaiKey    };

  // Which provider is currently active
  const savedKeys   = Object.keys(AI_PROVIDERS).filter(id => keyValues[id]);
  const [activeProvider, setActiveProvider] = useLocalStorage(
    "dawn_active_provider",
    savedKeys[0] || "anthropic"
  );

  // Key management UI state
  const [keyScreen,  setKeyScreen]  = useState(false);
  const [editingProv,setEditingProv]= useState("anthropic");
  const [keyInput,   setKeyInput]   = useState("");
  const [keyVisible, setKeyVisible] = useState(false);
  const [keyError,   setKeyError]   = useState("");

  // Generation state
  const [selectedSources, setSelectedSources] = useState([1]);
  const [difficulty,       setDifficulty]      = useState("mixed");
  const [count,            setCount]           = useState(5);
  const [loading,          setLoading]         = useState(false);
  const [error,            setError]           = useState("");
  const [generated,        setGenerated]       = useState([]);
  const [selected,         setSelected]        = useState(new Set());

  const prov = AI_PROVIDERS[activeProvider] || AI_PROVIDERS.anthropic;
  const activeKey = keyValues[activeProvider] || "";
  const hasAnyKey = savedKeys.length > 0;

  function openKeyScreen(provId) {
    setEditingProv(provId);
    setKeyInput(keyValues[provId] || "");
    setKeyVisible(false);
    setKeyError("");
    setKeyScreen(true);
  }

  function saveProviderKey() {
    const k = keyInput.trim();
    const p = AI_PROVIDERS[editingProv];
    if (!k) { setKeyError("Enter an API key."); return; }
    if (!k.startsWith(p.prefix)) { setKeyError(`Key should start with "${p.prefix}"`); return; }
    keySetters[editingProv](k);
    setActiveProvider(editingProv);
    setKeyScreen(false);
    setKeyError("");
  }

  function removeKey(provId) {
    keySetters[provId]("");
    if (activeProvider === provId) {
      const next = Object.keys(AI_PROVIDERS).find(id => id !== provId && keyValues[id]);
      setActiveProvider(next || "anthropic");
    }
  }

  function toggleSource(id) {
    setSelectedSources(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }
  function toggleSelected(idx) {
    setSelected(s => { const n = new Set(s); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });
  }

  async function generate() {
    if (!activeKey) { setError("No API key saved for " + prov.name); return; }
    if (!selectedSources.length) { setError("Select at least one source material."); return; }
    setLoading(true); setError(""); setGenerated([]); setSelected(new Set());

    const sourceSummaries = selectedSources.map(id => {
      const m = STUDY_MATERIAL_CONTEXT[id];
      return `SOURCE: ${m.title}\n${m.context}`;
    }).join("\n\n---\n\n");

    const diffInstruction = difficulty === "mixed"
      ? "Generate a mix of beginner, intermediate, and expert questions."
      : `All questions should be ${difficulty} difficulty.`;

    const prompt = `You are creating quiz questions for the "DawnQuiz" educational game about the Dawn Internet decentralized bandwidth ecosystem.

Based ONLY on the following source material, generate exactly ${count} multiple-choice questions.

${diffInstruction}

Rules:
- Each question must have exactly 4 options (A, B, C, D)
- Only ONE option is correct
- Questions must be directly grounded in the source material provided
- Include a short hint (subtle clue, not the answer)
- Include a clear explanation of why the correct answer is right
- Vary question styles: definitions, scenario-based, cause-effect, comparisons

SOURCE MATERIAL:
${sourceSummaries}

Respond with ONLY a valid JSON array, no markdown, no preamble:
[
  {
    "question": "...",
    "options": ["option A", "option B", "option C", "option D"],
    "correct": 0,
    "difficulty": "beginner|intermediate|expert",
    "hint": "...",
    "explanation": "..."
  }
]`;

    try {
      const raw = await callAI(activeProvider, activeKey, prompt);
      const clean = raw.replace(/\`\`\`json|\`\`\`/g, "").trim();
      const parsed = JSON.parse(clean);
      if (!Array.isArray(parsed)) throw new Error("Unexpected response format.");
      const withIds = parsed.map((q, i) => ({
        ...q,
        id: `ai_${Date.now()}_${i}`,
        options: (q.options || []).slice(0, 4),
        correct: Math.min(3, Math.max(0, Number(q.correct))),
        diff: ["beginner","intermediate","expert"].includes(q.difficulty) ? q.difficulty : "intermediate",
        hint: q.hint || "",
        explanation: q.explanation || "",
      }));
      setGenerated(withIds);
      setSelected(new Set(withIds.map((_, i) => i)));
    } catch (e) {
      setError(e.message || "Generation failed. Check your API key and try again.");
    } finally {
      setLoading(false);
    }
  }

  function importSelected() {
    const toImport = generated.filter((_, i) => selected.has(i));
    toImport.forEach(q => dispatch({ type: "ADD_QUESTION", question: q }));
    onClose(`Imported ${toImport.length} question${toImport.length !== 1 ? "s" : ""} via ${prov.name} ✓`);
  }

  // ── Key management screen ──
  if (keyScreen) {
    const ep = AI_PROVIDERS[editingProv];
    return (
      <div style={{ ...css.card, border: `1px solid ${ep.accent}33`, marginTop: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div style={{ color: ep.accent, fontWeight: 700, fontSize: "0.88rem" }}>
            {ep.icon} {ep.name}
          </div>
          <button onClick={() => setKeyScreen(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: "0.82rem", fontFamily: "inherit" }}>← Back</button>
        </div>
        <div style={{ color: T.textMuted, fontSize: "0.75rem", lineHeight: 1.6, marginBottom: "0.85rem" }}>
          {ep.free
            ? <span style={{ color: T.green }}>✓ Free tier available</span>
            : <span style={{ color: T.gold }}>⚠ Paid ({ep.freeNote})</span>
          } · Get key at <strong style={{ color: ep.accent }}>{ep.docsUrl}</strong>
          {ep.needsProxy && !HAS_PROXY && (
            <div style={{ color: "#f97316", fontSize: "0.72rem", marginTop: "0.4rem", padding: "0.4rem 0.6rem", background: "#1c0d00", borderRadius: 8, border: "1px solid #f9741655" }}>
              ⚠ Requires deployed version on Vercel — won't work in preview
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem" }}>
          <input
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            type={keyVisible ? "text" : "password"}
            placeholder={ep.placeholder}
            style={{ ...css.inp, flex: 1, fontFamily: "monospace", fontSize: "0.75rem" }}
          />
          <button onClick={() => setKeyVisible(v => !v)}
            style={{ padding: "0 0.7rem", background: T.surfaceHigh, border: `1px solid ${T.borderHigh}`, borderRadius: 10, color: T.textMuted, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit", flexShrink: 0 }}>
            {keyVisible ? "Hide" : "Show"}
          </button>
        </div>
        {keyError && <div style={{ color: T.red, fontSize: "0.73rem", marginBottom: "0.6rem" }}>{keyError}</div>}
        <Btn onClick={saveProviderKey} disabled={!keyInput.trim()}
          style={{ background: `linear-gradient(135deg, ${ep.color}, ${ep.accent})`, color: "#000", boxShadow: "none" }}>
          Save Key for {ep.name}
        </Btn>
      </div>
    );
  }

  // ── No keys saved yet — prompt to add one ──
  if (!hasAnyKey) return (
    <div style={{ ...css.card, border: `1px solid ${T.borderHigh}`, marginTop: "1rem" }}>
      <div style={{ color: T.text, fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.4rem" }}>🤖 AI Question Generator</div>
      <div style={{ color: T.textMuted, fontSize: "0.78rem", lineHeight: 1.65, marginBottom: "1rem" }}>
        Add at least one AI provider key to start generating questions from Dawn's study materials.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {Object.values(AI_PROVIDERS).map(p => (
          <button key={p.id} onClick={() => openKeyScreen(p.id)}
            style={{ textAlign: "left", padding: "0.75rem 1rem", borderRadius: 12, border: `1px solid ${p.accent}44`, background: T.surface, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ color: p.accent, fontSize: "1.2rem", width: 24 }}>{p.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: p.accent, fontWeight: 700, fontSize: "0.82rem" }}>{p.name}</div>
              <div style={{ color: T.textDim, fontSize: "0.7rem", marginTop: "0.1rem" }}>
                {p.free ? "✓ Free tier" : "Paid"} · {p.freeNote}
              </div>
            </div>
            <span style={{ color: T.textMuted, fontSize: "0.8rem" }}>+ Add</span>
          </button>
        ))}
      </div>
    </div>
  );

  // ── Main Generator UI ──
  return (
    <div style={{ marginTop: "1rem" }}>

      {/* Provider selector row */}
      <div style={{ marginBottom: "1rem" }}>
        <span style={css.lbl}>AI PROVIDER</span>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {Object.values(AI_PROVIDERS).map(p => {
            const hasKey = !!keyValues[p.id];
            const isActive = activeProvider === p.id;
            return (
              <div key={p.id} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button onClick={() => hasKey && setActiveProvider(p.id)}
                  style={{ flex: 1, textAlign: "left", padding: "0.6rem 0.85rem", borderRadius: 10,
                    border: `1.5px solid ${isActive ? p.accent : hasKey ? p.accent + "44" : T.borderHigh}`,
                    background: isActive ? "#0d0d1a" : T.surface,
                    color: hasKey ? (isActive ? p.accent : T.textMuted) : T.textDim,
                    cursor: hasKey ? "pointer" : "default", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: "0.6rem", opacity: hasKey ? 1 : 0.5,
                  }}>
                  <span style={{ fontSize: "1rem" }}>{isActive ? "●" : hasKey ? "○" : "✕"}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: isActive ? 700 : 400 }}>{p.name}</span>
                    {p.free && <span style={{ color: T.green, fontSize: "0.65rem", marginLeft: "0.4rem" }}>FREE</span>}
                  </div>
                  {hasKey && <span style={{ color: T.green, fontSize: "0.68rem" }}>✓ Key saved</span>}
                  {!hasKey && <span style={{ color: T.textDim, fontSize: "0.68rem" }}>No key</span>}
                </button>
                <button onClick={() => hasKey ? removeKey(p.id) : openKeyScreen(p.id)}
                  style={{ padding: "0.55rem 0.7rem", borderRadius: 10,
                    border: `1px solid ${hasKey ? T.red + "55" : p.accent + "66"}`,
                    background: T.surface, color: hasKey ? T.red : p.accent,
                    cursor: "pointer", fontSize: "0.72rem", fontFamily: "inherit", flexShrink: 0,
                  }}>
                  {hasKey ? "✕" : "+ Add"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Source material selector */}
      <div style={{ marginBottom: "1rem" }}>
        <span style={css.lbl}>SOURCE MATERIALS</span>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {Object.entries(STUDY_MATERIAL_CONTEXT).map(([id, m]) => {
            const active = selectedSources.includes(Number(id));
            return (
              <button key={id} onClick={() => toggleSource(Number(id))}
                style={{ textAlign: "left", padding: "0.55rem 0.85rem", borderRadius: 10,
                  border: `1px solid ${active ? prov.accent : T.borderHigh}`,
                  background: active ? "#0d0d1a" : T.surface,
                  color: active ? prov.accent : T.textMuted,
                  cursor: "pointer", fontSize: "0.78rem", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: "0.6rem",
                }}>
                <span style={{ fontSize: "0.85rem" }}>{active ? "●" : "○"}</span>
                {m.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty + count */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <span style={css.lbl}>DIFFICULTY</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            {["mixed","beginner","intermediate","expert"].map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                style={{ padding: "0.4rem 0.6rem", borderRadius: 8,
                  border: `1px solid ${difficulty === d ? prov.accent : T.borderHigh}`,
                  background: difficulty === d ? "#0d0d1a" : T.surface,
                  color: difficulty === d ? prov.accent : T.textMuted,
                  cursor: "pointer", fontSize: "0.72rem", fontFamily: "inherit", textAlign: "left",
                }}>{d}</button>
            ))}
          </div>
        </div>
        <div>
          <span style={css.lbl}>HOW MANY</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
            {[5, 10, 15, 20, 25, 30].map(n => (
              <button key={n} onClick={() => setCount(n)}
                style={{ padding: "0.4rem 0.6rem", borderRadius: 8,
                  border: `1px solid ${count === n ? prov.accent : T.borderHigh}`,
                  background: count === n ? "#0d0d1a" : T.surface,
                  color: count === n ? prov.accent : T.textMuted,
                  cursor: "pointer", fontSize: "0.72rem", fontFamily: "inherit", textAlign: "left",
                }}>{n}</button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: "0.75rem", background: "#2d0a0a", border: `1px solid ${T.red}44`, borderRadius: 10, color: T.red, fontSize: "0.78rem", marginBottom: "0.75rem", lineHeight: 1.5 }}>
          {error}
        </div>
      )}

      <Btn onClick={generate} disabled={loading || !activeKey || !selectedSources.length}
        style={{ background: `linear-gradient(135deg, ${prov.color}cc, ${prov.accent})`, color: "#000", boxShadow: `0 4px 20px ${prov.accent}44` }}>
        {loading ? `Generating via ${prov.name}…` : `✨ Generate ${count} Questions`}
      </Btn>

      {/* Preview — collapsible */}
      {generated.length > 0 && (
        <GeneratedList
          generated={generated}
          selected={selected}
          setSelected={setSelected}
          toggleSelected={toggleSelected}
          importSelected={importSelected}
          prov={prov}
        />
      )}
    </div>
  );
}

// ── CSV Importer sub-component ──────────────────────────────

function CSVImporter({ dispatch, onClose }) {
  const [stage, setStage] = useState("idle"); // idle | preview | done
  const [parsed, setParsed] = useState({ questions: [], errors: [] });
  const [selected, setSelected] = useState(new Set());
  const fileRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = parseCSV(ev.target.result);
      setParsed(result);
      setSelected(new Set(result.questions.map((_, i) => i)));
      setStage("preview");
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function toggleSelected(idx) {
    setSelected(s => { const n = new Set(s); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });
  }

  function importSelected() {
    const toImport = parsed.questions.filter((_, i) => selected.has(i));
    toImport.forEach(q => dispatch({ type: "ADD_QUESTION", question: q }));
    onClose(`Imported ${toImport.length} question${toImport.length !== 1 ? "s" : ""} from CSV ✓`);
  }

  if (stage === "preview") return (
    <div style={{ marginTop: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <div style={{ color: T.blue, fontWeight: 700, fontSize: "0.88rem" }}>📊 CSV Preview</div>
        <button onClick={() => setStage("idle")} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: "0.78rem", fontFamily: "inherit" }}>← Upload different file</button>
      </div>

      {parsed.errors.length > 0 && (
        <div style={{ padding: "0.85rem", background: "#1c0505", border: `1px solid ${T.red}44`, borderRadius: 10, marginBottom: "0.85rem" }}>
          <div style={{ color: T.red, fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.4rem" }}>⚠ {parsed.errors.length} row{parsed.errors.length !== 1 ? "s" : ""} skipped:</div>
          {parsed.errors.map((e, i) => <div key={i} style={{ color: "#fca5a5", fontSize: "0.72rem", lineHeight: 1.5 }}>{e}</div>)}
        </div>
      )}

      {parsed.questions.length === 0 ? (
        <div style={{ ...css.card, textAlign: "center", color: T.textDim, fontSize: "0.85rem", padding: "2rem" }}>
          No valid questions found in the file.<br />Check the format matches the template.
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
            <span style={{ color: T.textMuted, fontSize: "0.8rem" }}>{selected.size} of {parsed.questions.length} selected</span>
            <button onClick={() => setSelected(selected.size === parsed.questions.length ? new Set() : new Set(parsed.questions.map((_, i) => i)))}
              style={{ background: "none", border: "none", color: T.blue, cursor: "pointer", fontSize: "0.78rem", fontFamily: "inherit" }}>
              {selected.size === parsed.questions.length ? "Deselect all" : "Select all"}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", marginBottom: "1rem" }}>
            {parsed.questions.map((q, i) => (
              <button key={i} onClick={() => toggleSelected(i)} style={{ textAlign: "left", padding: "0.85rem 1rem", borderRadius: 12, border: `1.5px solid ${selected.has(i) ? T.blue : T.border}`, background: selected.has(i) ? "#0a1220" : T.surface, cursor: "pointer", fontFamily: "inherit" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.35rem" }}>
                  <span style={{ color: selected.has(i) ? "#93c5fd" : T.text, fontSize: "0.83rem", fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{q.question}</span>
                  <span style={{ color: selected.has(i) ? T.blue : T.textDim, fontSize: "1rem", flexShrink: 0 }}>{selected.has(i) ? "✓" : "○"}</span>
                </div>
                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                  <span style={{ ...css.tag(DIFF_COLOR[q.diff] || T.gold) }}>{q.diff}</span>
                  <span style={{ color: T.green, fontSize: "0.7rem" }}>✓ {q.options[q.correct]}</span>
                </div>
              </button>
            ))}
          </div>
          <Btn onClick={importSelected} disabled={selected.size === 0}>
            Import {selected.size} Question{selected.size !== 1 ? "s" : ""} →
          </Btn>
        </>
      )}
    </div>
  );

  // idle
  return (
    <div style={{ marginTop: "1rem" }}>
      <div style={{ color: T.blue, fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.5rem" }}>📊 CSV Import</div>
      <div style={{ color: T.textMuted, fontSize: "0.78rem", lineHeight: 1.65, marginBottom: "1rem" }}>
        Fill the template in Google Sheets or Excel and upload it here. Your community can contribute questions using the same template.
      </div>

      <div style={{ ...css.card, border: `1px solid ${T.blue}33`, marginBottom: "1rem", fontSize: "0.75rem", color: T.textMuted, lineHeight: 1.7 }}>
        <div style={{ color: T.blue, fontWeight: 700, marginBottom: "0.35rem", fontSize: "0.78rem" }}>Required columns (in order):</div>
        {CSV_HEADERS.map(h => (
          <span key={h} style={{ display: "inline-block", background: T.surfaceHigh, border: `1px solid ${T.borderHigh}`, borderRadius: 4, padding: "1px 6px", marginRight: "0.3rem", marginBottom: "0.3rem", fontFamily: "monospace", fontSize: "0.7rem", color: T.text }}>{h}</span>
        ))}
        <div style={{ marginTop: "0.5rem", fontSize: "0.72rem", color: T.textDim }}>
          correct = A / B / C / D &nbsp;·&nbsp; difficulty = beginner / intermediate / expert
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.6rem" }}>
        <Btn onClick={downloadCSVTemplate} style={{ flex: 1, background: T.surfaceHigh, border: `1px solid ${T.borderHigh}`, color: T.text, boxShadow: "none" }}>
          ⬇ Download Template
        </Btn>
        <Btn onClick={() => fileRef.current?.click()} style={{ flex: 1 }}>
          ⬆ Upload CSV
        </Btn>
      </div>
      <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} style={{ display: "none" }} />
    </div>
  );
}

// ── Main AdminPanel ──────────────────────────────────────────

// ── Inline confirm widget (replaces window.confirm which is blocked in iframes) ──
function InlineConfirm({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#00000099",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: "1.5rem",
    }}>
      <div style={{
        background: T.surface, border: `1px solid ${T.red}88`,
        borderRadius: 16, padding: "1.5rem", maxWidth: 320, width: "100%",
        boxShadow: "0 16px 48px #000000cc",
      }}>
        <div style={{ fontSize: "1.6rem", textAlign: "center", marginBottom: "0.75rem" }}>⚠️</div>
        <div style={{ color: T.text, fontSize: "0.88rem", lineHeight: 1.6, textAlign: "center", marginBottom: "1.25rem" }}>
          {message}
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "0.75rem", borderRadius: 10,
            background: T.surfaceHigh, border: `1px solid ${T.borderHigh}`,
            color: T.textMuted, cursor: "pointer", fontFamily: "inherit",
            fontSize: "0.85rem", fontWeight: 600,
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "0.75rem", borderRadius: 10,
            background: "linear-gradient(135deg,#7f1d1d,#dc2626)",
            border: "none", color: "#fff", cursor: "pointer",
            fontFamily: "inherit", fontSize: "0.85rem", fontWeight: 700,
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function ClearAllQuestions({ count, isMaster, dispatch }) {
  const [step, setStep] = useState(0); // 0=idle 1=confirm1 2=confirm2

  if (!isMaster || count === 0) return (
    <div style={{ color: T.textMuted, fontSize: "0.78rem", marginBottom: "1rem" }}>
      {count} custom question{count !== 1 ? "s" : ""} in bank
    </div>
  );

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ color: T.textMuted, fontSize: "0.78rem" }}>
          {count} custom question{count !== 1 ? "s" : ""} in bank
        </div>
        <button onClick={() => setStep(1)} style={{
          background: "none", border: `1px solid ${T.red}66`,
          borderRadius: 8, padding: "0.3rem 0.7rem",
          color: T.red, cursor: "pointer", fontSize: "0.7rem",
          fontFamily: "inherit", fontWeight: 600,
        }}>🗑 Clear All</button>
      </div>

      {step === 1 && (
        <InlineConfirm
          message={`This will permanently delete all ${count} custom questions from the question bank. This cannot be undone.`}
          onCancel={() => setStep(0)}
          onConfirm={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <InlineConfirm
          message="Final confirmation — delete all custom questions?"
          onCancel={() => setStep(0)}
          onConfirm={() => { dispatch({ type: "CLEAR_ALL_QUESTIONS" }); setStep(0); }}
        />
      )}
    </>
  );
}

const DEFAULT_MODULES = [
  { id: 1, title: "Dawn Fundamentals",      icon: "☀", sunrays: 2, color: "#f59e0b", desc: "Core principles of the Dawn ecosystem and why decentralized internet matters.",       lessons: ["Introduction to Dawn", "Why Decentralization?", "The Bandwidth Economy", "Getting Started with Nodes"] },
  { id: 2, title: "Nodes & Deployment",     icon: "⬡", sunrays: 2, color: "#60a5fa", desc: "How nodes work, how to run one, and what deployment means in practice.",             lessons: ["What Is a Node?", "Node Requirements", "Setting Up", "Uptime & Reliability", "Monitoring Your Node"] },
  { id: 3, title: "BlackBox Deep Dive",     icon: "◼", sunrays: 1, color: "#8b5cf6", desc: "Everything about the BlackBox hardware node device.",                                 lessons: ["BlackBox Overview", "Hardware Specs", "Installation Guide"] },
  { id: 4, title: "Decentralized Internet", icon: "⊕", sunrays: 2, color: "#34d399", desc: "Architecture, benefits, and challenges of a fully decentralized web.",               lessons: ["How The Web Works", "Centralization Problems", "P2P Architecture", "Routing & DNS", "Privacy & Censorship Resistance", "The Future of Access"] },
  { id: 5, title: "Network Economics",      icon: "◈", sunrays: 1, color: "#f97316", desc: "Incentives, tokenomics, and the economic design powering Dawn.",                     lessons: ["Proof-of-Bandwidth", "Token Incentives", "Sustainable Emissions", "DePIN Market Landscape"] },
];

const BLANK_MODULE = { title: "", icon: "📘", color: "#60a5fa", desc: "", sunrays: 1, lessons: [{ title: "", content: "" }] };
function normLesson(l) { return typeof l === "string" ? { title: l, content: "" } : (l || { title: "", content: "" }); }
const MODULE_ICONS  = ["📘","☀","⬡","◼","⊕","◈","🌐","⚡","🔬","🗺","🧠","🛠","🔗","🌱","🏗"];
const CAT_COLORS    = ["#8b5cf6","#60a5fa","#34d399","#fbbf24","#f97316","#ec4899","#f87171","#a78bfa"];

const DEFAULT_MATERIALS = [
  { id: 1, cat: "Research",     color: "#8b5cf6", icon: "📊", title: "Messari: State of DePIN 2025",        desc: "Comprehensive annual report on the DePIN landscape, market trends, and Dawn's positioning.",        url: "https://messari.io/report/state-of-depin-2025",                                  tag: "Messari Report" },
  { id: 2, cat: "Deep Dive",    color: "#60a5fa", icon: "🔬", title: "Blockmates Infrastructure Deep Dive", desc: "Expert breakdown of Dawn's infrastructure layer, network design, and protocol differentiation.", url: "https://x.com/blocmates/status/2027005455869051389?s=20",                         tag: "X Thread" },
  { id: 3, cat: "Roadmap",      color: "#34d399", icon: "🗺", title: "Dawn Q1 2026 Roadmap",                desc: "Official roadmap covering milestones, deployments, and BlackBox rollout for Q1 2026.",            url: "https://www.dawninternet.com/blog-posts/dawn-q1-2026-roadmap",               tag: "Official Blog" },
  { id: 4, cat: "BlackBox",     color: "#fbbf24", icon: "◼", title: "The BlackBox — Introduction",         desc: "Official introduction to the BlackBox hardware node and its role in the deployment model.",       url: "https://www.dawninternet.com/blog-posts/black-box-introduction",             tag: "Official Blog" },
  { id: 5, cat: "Fundamentals", color: "#f97316", icon: "☀", title: "A New Dawn for the Internet",         desc: "The foundational explainer for the entire Dawn vision. Start here.",                             url: "https://www.dawninternet.com/blog-posts/a-new-dawn-for-the-internet",         tag: "Official Blog" },
  { id: 6, cat: "Research",     color: "#ec4899", icon: "🧪", title: "Dawn Research Articles",              desc: "Technical research papers on decentralised internet architecture and protocol design.",          url: "https://www.dawninternet.com/research",                                      tag: "Dawn Research" },
];

function AcademyAIKeySetup() {
  const [prov, setProv] = useState("gemini");
  const [key, setKey] = useState("");
  const [vis, setVis] = useState(false);
  const [saved, setSaved] = useState(false);

  const providers = [
    { id: "gemini",    name: "Gemini",    note: "Free · 1,500 req/day", accent: "#60a5fa" },
    { id: "groq",      name: "Groq",      note: "Free · 25 req/day",    accent: "#a78bfa" },
    { id: "anthropic", name: "Claude",    note: "$5 credit",            accent: "#c4b5fd" },
    { id: "openai",    name: "OpenAI",    note: "Pay-per-use",          accent: "#34d399" },
    { id: "grok",      name: "Grok",      note: "Free tier",            accent: "#e2e8f0" },
  ];
  const cur = providers.find(p => p.id === prov) || providers[0];

  function save() {
    if (!key.trim()) return;
    try {
      localStorage.setItem(`dawn_key_${prov}`, JSON.stringify(key.trim()));
      localStorage.setItem("dawn_active_provider", JSON.stringify(prov));
    } catch {}
    setSaved(true);
    setTimeout(() => window.location.reload(), 700);
  }

  return (
    <div style={{ ...css.card, border: `1px solid ${T.borderHigh}` }}>
      <div style={{ color: T.text, fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.75rem" }}>🔑 Configure AI Provider</div>
      <div style={{ color: T.textMuted, fontSize: "0.75rem", marginBottom: "0.85rem", lineHeight: 1.5 }}>
        Add a free API key to enable AI module generation. Gemini and Groq are free.
      </div>
      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        {providers.map(p => (
          <button key={p.id} onClick={() => { setProv(p.id); setSaved(false); setKey(""); }} style={{ padding: "0.35rem 0.65rem", borderRadius: 8, border: `1px solid ${prov === p.id ? p.accent : T.borderHigh}`, background: prov === p.id ? "#0d0d1a" : T.surface, color: prov === p.id ? p.accent : T.textMuted, cursor: "pointer", fontSize: "0.7rem", fontFamily: "inherit" }}>
            {p.name} <span style={{ opacity: 0.7 }}>({p.note})</span>
          </button>
        ))}
      </div>
      <div style={{ position: "relative", marginBottom: "0.6rem" }}>
        <input
          type={vis ? "text" : "password"}
          value={key}
          onChange={e => { setKey(e.target.value); setSaved(false); }}
          placeholder={`Paste your ${cur.name} API key`}
          style={{ ...css.inp, paddingRight: "3rem" }}
        />
        <button onClick={() => setVis(v => !v)} style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}>{vis ? "Hide" : "Show"}</button>
      </div>
      <Btn onClick={save} disabled={!key.trim() || saved} style={{ background: cur.accent, color: "#000" }}>
        {saved ? "✓ Saved — reloading…" : `Save ${cur.name} Key`}
      </Btn>
    </div>
  );
}

function AcademyAdmin({ player, dispatch }) {
  const [modules,   setModules]   = useLocalStorage("dawn_modules",        DEFAULT_MODULES);
  const [materials, setMaterials] = useLocalStorage("dawn_study_materials", DEFAULT_MATERIALS);

  // sub-tabs: modules | resources
  const [subTab, setSubTab] = useState("modules");

  // module view: list | manual | ai
  const [moduleView, setModuleView] = useState("list");
  const [editTarget, setEditTarget] = useState(null); // module being edited

  // manual form state
  const [mForm, setMForm] = useState(BLANK_MODULE);
  const [mErr,  setMErr]  = useState("");

  // AI generator state
  const [aiView,         setAiView]        = useState("main"); // main | keyscreen
  const [aiTopic,        setAiTopic]       = useState("");
  const [aiCount,        setAiCount]       = useState(5);
  const [aiLoading,      setAiLoading]     = useState(false);
  const [aiError,        setAiError]       = useState("");
  const [aiGenerated,    setAiGenerated]   = useState(null); // single generated module
  const [aiSelected,     setAiSelected]    = useState(true);
  const [editingProv,    setEditingProv]   = useState("anthropic");
  const [keyInput,       setKeyInput]      = useState("");
  const [keyVisible,     setKeyVisible]    = useState(false);
  const [keyError,       setKeyError]      = useState("");

  const [anthropicKey] = useLocalStorage("dawn_key_anthropic", "");
  const [geminiKey]    = useLocalStorage("dawn_key_gemini",    "");
  const [grokKey]      = useLocalStorage("dawn_key_grok",      "");
  const [groqKey]      = useLocalStorage("dawn_key_groq",      "");
  const [openaiKey]    = useLocalStorage("dawn_key_openai",    "");
  const keyValues = { anthropic: anthropicKey, gemini: geminiKey, grok: grokKey, groq: groqKey, openai: openaiKey };
  const [activeProvider, setActiveProvider] = useLocalStorage("dawn_active_provider", "anthropic");
  const savedKeys  = Object.keys(AI_PROVIDERS).filter(id => keyValues[id]);
  const hasAnyKey  = savedKeys.length > 0;
  const prov       = AI_PROVIDERS[activeProvider] || AI_PROVIDERS.anthropic;
  const activeKey  = keyValues[activeProvider] || "";

  // resource form
  const [rAdding, setRAdding] = useState(false);
  const [rForm,   setRForm]   = useState({ title: "", url: "", desc: "", cat: "Official Blog", tag: "", icon: "📄", color: "#60a5fa" });
  const [rErr,    setRErr]    = useState("");

  // ── helpers ──
  function openNew()      { setMForm(BLANK_MODULE); setEditTarget(null); setMErr(""); setModuleView("manual"); }
  function openEdit(m)    { setMForm({ ...m, lessons: m.lessons.map(normLesson) }); setEditTarget(m); setMErr(""); setModuleView("manual"); }

  function saveModule() {
    if (!mForm.title.trim()) { setMErr("Title is required."); return; }
    const normLessons = mForm.lessons.map(normLesson);
    if (!normLessons.some(l => l.title.trim())) { setMErr("Add at least one lesson title."); return; }
    const cleaned = { ...mForm, title: mForm.title.trim(), desc: mForm.desc.trim(), lessons: normLessons.filter(l => l.title.trim()), id: editTarget ? editTarget.id : Date.now() };
    if (editTarget) {
      setModules(ms => ms.map(m => m.id === editTarget.id ? cleaned : m));
    } else {
      setModules(ms => [...ms, cleaned]);
    }
    setModuleView("list"); setMErr(""); setEditTarget(null);
  }

  function deleteModule(id) {
    setModules(ms => ms.filter(m => m.id !== id));
  }

  function addLesson()              { setMForm(f => ({ ...f, lessons: [...f.lessons, { title: "", content: "" }] })); }
  function removeLesson(i)          { setMForm(f => ({ ...f, lessons: f.lessons.filter((_, j) => j !== i) })); }
  function updateLessonTitle(i,v)   { setMForm(f => { const ls = f.lessons.map(normLesson); ls[i] = { ...ls[i], title: v }; return { ...f, lessons: ls }; }); }
  function moveLesson(i, dir) {
    setMForm(f => {
      const ls = [...f.lessons.map(normLesson)];
      const target = i + dir;
      if (target < 0 || target >= ls.length) return f;
      [ls[i], ls[target]] = [ls[target], ls[i]];
      return { ...f, lessons: ls };
    });
  }
  function updateLessonContent(i,v) { setMForm(f => { const ls = f.lessons.map(normLesson); ls[i] = { ...ls[i], content: v }; return { ...f, lessons: ls }; }); }

  async function generateModule() {
    if (!activeKey) { setAiError("No API key saved. Click ✨ AI then configure a provider."); return; }
    if (!aiTopic.trim()) { setAiError("Enter a topic for the module."); return; }
    setAiLoading(true); setAiError(""); setAiGenerated(null);

    const prompt = `You are creating an Academy learning module for the "DawnQuiz" quiz app about the Dawn Internet decentralised bandwidth network.

CRITICAL Dawn-specific definitions you MUST use — do not contradict these:
- A "node" in Dawn is a device or software instance that shares its unused internet bandwidth with the network and earns Sunray rewards for doing so. It is NOT a blockchain validator or consensus participant.
- "Bandwidth contribution" is the core mechanic — users share spare upload capacity.
- The "BlackBox" is Dawn's dedicated hardware node device requiring 100Mbps+ connection.
- Sunrays are the in-app reward points earned for bandwidth contribution and learning.
- Dawn is a DePIN (Decentralized Physical Infrastructure Network) for internet connectivity.
- Dawn nodes are verified via challenge-response bandwidth proofs, not proof-of-work or proof-of-stake.

Generate ONE learning module about: "${aiTopic.trim()}"

The module should have exactly ${aiCount} lessons. Each lesson has a short progressive title AND 2-4 paragraphs of body content that clearly explains the concept using the Dawn-specific definitions above.

Respond with ONLY a valid JSON object — no markdown, no preamble:
{
  "title": "Module title (concise)",
  "icon": "single relevant emoji",
  "desc": "One sentence description of what the learner will understand after completing this module.",
  "sunrays": <integer 1-3 based on complexity>,
  "color": "<one of: #f59e0b #60a5fa #8b5cf6 #34d399 #f97316 #ec4899 #f87171>",
  "lessons": [
    {"title": "Lesson 1 title", "content": "3-5 sentences explaining this lesson clearly."},
    {"title": "Lesson 2 title", "content": "3-5 sentences explaining this lesson clearly."}
  ]
}`;

    try {
      const raw  = await callAI(activeProvider, activeKey, prompt);
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (!parsed.title || !Array.isArray(parsed.lessons)) throw new Error("Unexpected response format.");
      const normalizedLessons = parsed.lessons.slice(0, 30).map(l => typeof l === "string" ? { title: l, content: "" } : { title: l.title || "", content: l.content || "" });
      setAiGenerated({ ...parsed, id: Date.now(), lessons: normalizedLessons, sunrays: Math.min(3, Math.max(1, Number(parsed.sunrays) || 1)) });
      setAiSelected(true);
    } catch (e) {
      setAiError(e.message || "Generation failed. Check your API key and try again.");
    } finally {
      setAiLoading(false);
    }
  }

  function importGenerated() {
    if (!aiGenerated) return;
    setModules(ms => [...ms, { ...aiGenerated, id: Date.now() }]);
    setAiGenerated(null); setAiTopic(""); setModuleView("list");
  }

  function saveResource() {
    if (!rForm.title.trim()) { setRErr("Title required."); return; }
    if (!rForm.url.trim())   { setRErr("URL required."); return; }
    setMaterials(m => [...m, { ...rForm, id: Date.now(), title: rForm.title.trim(), url: rForm.url.trim(), desc: rForm.desc.trim(), cat: rForm.cat.trim() || "General", tag: rForm.tag.trim() || rForm.cat }]);
    setRAdding(false); setRForm({ title: "", url: "", desc: "", cat: "Official Blog", tag: "", icon: "📄", color: "#60a5fa" }); setRErr("");
  }

  // ─── sub-tab bar ───
  return (
    <div style={{ marginTop: "0.75rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {[["modules","📚 Modules"],["resources","📖 Resources"]].map(([k,l]) => (
          <button key={k} onClick={() => { setSubTab(k); setModuleView("list"); }} style={{ flex: 1, padding: "0.45rem", borderRadius: 8, border: `1px solid ${subTab === k ? T.gold : T.borderHigh}`, background: subTab === k ? "#1c1200" : T.surface, color: subTab === k ? T.gold : T.textMuted, cursor: "pointer", fontSize: "0.72rem", fontFamily: "inherit", fontWeight: subTab === k ? 700 : 400 }}>{l}</button>
        ))}
      </div>

      {/* ═══════════════ MODULES SUB-TAB ═══════════════ */}
      {subTab === "modules" && (
        <>
          {/* ── list view ── */}
          {moduleView === "list" && (
            <>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <button onClick={openNew} style={{ flex: 1, background: "#1c1200", border: `1px solid ${T.gold}`, borderRadius: 8, padding: "0.5rem", color: T.gold, cursor: "pointer", fontSize: "0.72rem", fontWeight: 700, fontFamily: "inherit" }}>➕ Manual</button>
                <button onClick={() => setModuleView("ai")} style={{ flex: 1, background: moduleView === "ai" ? "#1a0e3a" : T.surface, border: `1px solid ${T.purple}`, borderRadius: 8, padding: "0.5rem", color: "#c4b5fd", cursor: "pointer", fontSize: "0.72rem", fontWeight: 700, fontFamily: "inherit" }}>✨ AI Generate</button>
              </div>

              {modules.length === 0 && (
                <div style={{ ...css.card, textAlign: "center", padding: "2rem", color: T.textDim, fontSize: "0.85rem", lineHeight: 1.7 }}>
                  No modules yet.<br />Add manually or generate with AI ✨
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {modules.map(m => (
                  <div key={m.id} style={{ ...css.card, borderLeft: `3px solid ${m.color}`, display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "1.8rem", flexShrink: 0, paddingTop: "0.1rem" }}>{m.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: T.text, fontWeight: 700, fontSize: "0.88rem" }}>{m.title}</div>
                      <div style={{ color: T.textMuted, fontSize: "0.72rem", marginTop: "0.15rem" }}>{m.lessons.length} lessons · +{m.sunrays} ☀</div>
                      {m.desc && <div style={{ color: T.textDim, fontSize: "0.7rem", marginTop: "0.2rem", lineHeight: 1.45 }}>{m.desc}</div>}
                      <div style={{ marginTop: "0.4rem", display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                        {m.lessons.map((l, i) => (
                          <span key={i} style={{ background: T.surfaceHigh, color: T.textMuted, fontSize: "0.65rem", padding: "2px 6px", borderRadius: 5 }}>{normLesson(l).title}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flexShrink: 0 }}>
                      <button onClick={() => openEdit(m)} style={{ background: "none", border: `1px solid ${T.borderHigh}`, borderRadius: 7, padding: "0.3rem 0.55rem", color: T.textMuted, cursor: "pointer", fontSize: "0.7rem", fontFamily: "inherit" }}>Edit</button>
                      <button onClick={() => deleteModule(m.id)} style={{ background: "none", border: `1px solid ${T.red}55`, borderRadius: 7, padding: "0.3rem 0.55rem", color: T.red, cursor: "pointer", fontSize: "0.7rem", fontFamily: "inherit" }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── manual add/edit form ── */}
          {moduleView === "manual" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                <span style={{ color: T.text, fontWeight: 700, fontSize: "0.9rem" }}>{editTarget ? "Edit Module" : "New Module"}</span>
                <button onClick={() => setModuleView("list")} style={{ background: "none", border: "none", color: T.textMuted, fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {/* Title + icon row */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input value={mForm.title} onChange={e => setMForm(f => ({...f, title: e.target.value}))} placeholder="Module title *" style={{ ...css.inp, flex: 1 }} />
                  <input value={mForm.icon}  onChange={e => setMForm(f => ({...f, icon: e.target.value}))}  placeholder="Icon" style={{ ...css.inp, width: 52, textAlign: "center", fontSize: "1.2rem" }} maxLength={2} />
                </div>

                {/* Description */}
                <textarea value={mForm.desc} onChange={e => setMForm(f => ({...f, desc: e.target.value}))} placeholder="Short description of what this module covers" rows={2} style={{ ...css.inp, resize: "vertical" }} />

                {/* Sunrays + color */}
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <div>
                    <span style={{ ...css.lbl }}>SUNRAY REWARD</span>
                    <div style={{ display: "flex", gap: "0.3rem" }}>
                      {[1,2,3].map(n => (
                        <button key={n} onClick={() => setMForm(f => ({...f, sunrays: n}))} style={{ padding: "0.35rem 0.65rem", borderRadius: 8, border: `1px solid ${mForm.sunrays === n ? T.gold : T.border}`, background: mForm.sunrays === n ? "#1c1200" : T.surface, color: mForm.sunrays === n ? T.gold : T.textMuted, cursor: "pointer", fontSize: "0.78rem", fontFamily: "inherit" }}>+{n} ☀</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span style={{ ...css.lbl }}>COLOUR</span>
                    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                      {CAT_COLORS.map(c => (
                        <div key={c} onClick={() => setMForm(f => ({...f, color: c}))} style={{ width: 20, height: 20, borderRadius: "50%", background: c, cursor: "pointer", border: mForm.color === c ? "2.5px solid #fff" : "2px solid transparent", flexShrink: 0 }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Lessons */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <span style={css.lbl}>LESSONS ({mForm.lessons.length})</span>
                    <button onClick={addLesson} style={{ background: "none", border: "none", color: T.gold, fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}>+ Add lesson</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {mForm.lessons.map(normLesson).map((l, i) => (
                      <div key={i} style={{ background: T.surfaceHigh, borderRadius: 10, padding: "0.5rem 0.6rem" }}>
                        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginBottom: "0.35rem" }}>
                          {/* Reorder arrows */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "1px", flexShrink: 0 }}>
                            <button onClick={() => moveLesson(i, -1)} disabled={i === 0} style={{ background: "none", border: "none", color: i === 0 ? T.textDim : T.textMuted, cursor: i === 0 ? "default" : "pointer", fontSize: "0.6rem", padding: "1px 3px", lineHeight: 1, fontFamily: "inherit" }}>▲</button>
                            <button onClick={() => moveLesson(i, 1)} disabled={i === mForm.lessons.length - 1} style={{ background: "none", border: "none", color: i === mForm.lessons.length - 1 ? T.textDim : T.textMuted, cursor: i === mForm.lessons.length - 1 ? "default" : "pointer", fontSize: "0.6rem", padding: "1px 3px", lineHeight: 1, fontFamily: "inherit" }}>▼</button>
                          </div>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: T.textMuted, flexShrink: 0 }}>{i + 1}</div>
                          <input value={l.title} onChange={e => updateLessonTitle(i, e.target.value)} placeholder={`Lesson ${i + 1} title *`} style={{ ...css.inp, flex: 1, marginBottom: 0 }} />
                          {mForm.lessons.length > 1 && (
                            <button onClick={() => removeLesson(i)} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: "1rem", padding: "0 0.2rem", flexShrink: 0 }}>×</button>
                          )}
                        </div>
                        <textarea value={l.content} onChange={e => updateLessonContent(i, e.target.value)} placeholder="Lesson body — explain the concept clearly (2-5 sentences)" rows={3} style={{ ...css.inp, resize: "vertical", marginBottom: 0, fontSize: "0.78rem" }} />
                      </div>
                    ))}
                  </div>
                </div>

                {mErr && <div style={{ color: T.red, fontSize: "0.75rem" }}>{mErr}</div>}
                <Btn onClick={saveModule}>{editTarget ? "Save Changes" : "Add Module"}</Btn>
              </div>
            </div>
          )}

          {/* ── AI generator ── */}
          {moduleView === "ai" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                <span style={{ color: T.text, fontWeight: 700, fontSize: "0.9rem" }}>✨ AI Module Generator</span>
                <button onClick={() => { setModuleView("list"); setAiGenerated(null); setAiError(""); }} style={{ background: "none", border: "none", color: T.textMuted, fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}>← Back</button>
              </div>

              {!hasAnyKey ? (
                <AcademyAIKeySetup />
              ) : (
                <>
                  {/* Active provider badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", background: T.surfaceHigh, borderRadius: 10, marginBottom: "0.85rem", border: `1px solid ${prov.accent}44` }}>
                    <span style={{ color: prov.accent, fontSize: "1rem" }}>{prov.icon}</span>
                    <span style={{ color: prov.accent, fontWeight: 700, fontSize: "0.8rem" }}>{prov.name}</span>
                    {prov.free && <span style={{ color: T.green, fontSize: "0.65rem", marginLeft: "0.2rem" }}>FREE</span>}
                    <span style={{ color: T.green, fontSize: "0.7rem", marginLeft: "auto" }}>✓ Key saved</span>
                  </div>

                  {/* Topic input */}
                  <div style={{ marginBottom: "0.75rem" }}>
                    <span style={css.lbl}>MODULE TOPIC</span>
                    <input
                      value={aiTopic}
                      onChange={e => setAiTopic(e.target.value)}
                      placeholder="e.g. Dawn bandwidth proofs, BlackBox setup, DePIN economics…"
                      style={css.inp}
                    />
                  </div>

                  {/* Lesson count */}
                  <div style={{ marginBottom: "1rem" }}>
                    <span style={css.lbl}>NUMBER OF LESSONS</span>
                    <div style={{ display: "flex", gap: "0.35rem" }}>
                      {[3, 5, 7, 10].map(n => (
                        <button key={n} onClick={() => setAiCount(n)} style={{ flex: 1, padding: "0.4rem 0.3rem", borderRadius: 8, border: `1px solid ${aiCount === n ? prov.accent : T.borderHigh}`, background: aiCount === n ? "#0d0d1a" : T.surface, color: aiCount === n ? prov.accent : T.textMuted, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}>{n}</button>
                      ))}
                    </div>
                  </div>

                  {aiError && (
                    <div style={{ padding: "0.75rem", background: "#2d0a0a", border: `1px solid ${T.red}44`, borderRadius: 10, color: T.red, fontSize: "0.78rem", marginBottom: "0.75rem" }}>{aiError}</div>
                  )}

                  <Btn onClick={generateModule} disabled={aiLoading || !aiTopic.trim()}
                    style={{ background: `linear-gradient(135deg, ${prov.color}cc, ${prov.accent})`, color: "#000", boxShadow: `0 4px 20px ${prov.accent}44` }}>
                    {aiLoading ? `Generating via ${prov.name}…` : `✨ Generate Module`}
                  </Btn>

                  {/* Preview generated module */}
                  {aiGenerated && (
                    <div style={{ marginTop: "1.25rem" }}>
                      <div style={{ color: T.textMuted, fontSize: "0.78rem", marginBottom: "0.6rem" }}>Generated module — review before importing:</div>
                      <div style={{ ...css.card, borderLeft: `3px solid ${aiGenerated.color}`, marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.65rem" }}>
                          <span style={{ fontSize: "2rem" }}>{aiGenerated.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: T.text, fontWeight: 700, fontSize: "0.95rem" }}>{aiGenerated.title}</div>
                            <div style={{ color: T.textMuted, fontSize: "0.73rem", marginTop: "0.15rem" }}>{aiGenerated.lessons.length} lessons · +{aiGenerated.sunrays} ☀</div>
                            {aiGenerated.desc && <div style={{ color: T.textDim, fontSize: "0.75rem", marginTop: "0.3rem", lineHeight: 1.5 }}>{aiGenerated.desc}</div>}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          {aiGenerated.lessons.map((l, i) => {
                            const lesson = normLesson(l);
                            return (
                              <div key={i} style={{ padding: "0.4rem 0.5rem", background: T.surfaceHigh, borderRadius: 7 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: T.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: T.textMuted, flexShrink: 0 }}>{i + 1}</span>
                                  <span style={{ fontSize: "0.8rem", color: T.text, fontWeight: 600 }}>{lesson.title}</span>
                                </div>
                                {lesson.content && <div style={{ marginTop: "0.35rem", paddingLeft: "1.6rem" }}>{renderLessonBody(lesson.content)}</div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Btn onClick={importGenerated} style={{ flex: 1 }}>Import Module →</Btn>
                        <button onClick={() => { setAiGenerated(null); setAiTopic(""); }} style={{ padding: "0.6rem 0.85rem", borderRadius: 10, border: `1px solid ${T.border}`, background: "none", color: T.textMuted, cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem" }}>Discard</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══════════════ RESOURCES SUB-TAB ═══════════════ */}
      {subTab === "resources" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ color: T.textMuted, fontSize: "0.78rem" }}>{materials.length} resources</span>
            <button onClick={() => setRAdding(a => !a)} style={{ background: rAdding ? T.surface : T.gold, border: `1px solid ${T.gold}`, borderRadius: 8, padding: "0.4rem 0.85rem", color: rAdding ? T.gold : "#000", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700, fontFamily: "inherit" }}>
              {rAdding ? "Cancel" : "+ Add Resource"}
            </button>
          </div>

          {rAdding && (
            <div style={{ ...css.card, marginBottom: "1rem", border: `1px solid ${T.gold}44` }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <input value={rForm.title} onChange={e => setRForm(f => ({...f, title: e.target.value}))} placeholder="Title *" style={css.inp} />
                <input value={rForm.url}   onChange={e => setRForm(f => ({...f, url:   e.target.value}))} placeholder="URL * (https://...)" style={css.inp} />
                <input value={rForm.desc}  onChange={e => setRForm(f => ({...f, desc:  e.target.value}))} placeholder="Short description" style={css.inp} />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input value={rForm.cat} onChange={e => setRForm(f => ({...f, cat: e.target.value}))} placeholder="Category" style={{ ...css.inp, flex: 1 }} />
                  <input value={rForm.tag} onChange={e => setRForm(f => ({...f, tag: e.target.value}))} placeholder="Tag label" style={{ ...css.inp, flex: 1 }} />
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input value={rForm.icon} onChange={e => setRForm(f => ({...f, icon: e.target.value}))} placeholder="Icon" style={{ ...css.inp, width: 52, textAlign: "center" }} maxLength={2} />
                  <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                    {CAT_COLORS.map(c => (
                      <div key={c} onClick={() => setRForm(f => ({...f, color: c}))} style={{ width: 20, height: 20, borderRadius: "50%", background: c, cursor: "pointer", border: rForm.color === c ? "2px solid #fff" : "2px solid transparent" }} />
                    ))}
                  </div>
                </div>
                {rErr && <div style={{ color: T.red, fontSize: "0.73rem" }}>{rErr}</div>}
                <Btn onClick={saveResource}>Save Resource</Btn>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {materials.map(m => (
              <div key={m.id} style={{ ...css.card, borderLeft: `3px solid ${m.color}`, display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{m.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: T.text, fontWeight: 600, fontSize: "0.82rem", marginBottom: "0.2rem" }}>{m.title}</div>
                  <div style={{ color: T.textMuted, fontSize: "0.7rem" }}>{m.cat} · {m.tag}</div>
                </div>
                <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
                  <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "0.3rem 0.5rem", color: T.textMuted, fontSize: "0.68rem", textDecoration: "none" }}>↗</a>
                  {!DEFAULT_MATERIALS.find(d => d.id === m.id) && (
                    <button onClick={() => setMaterials(ms => ms.filter(r => r.id !== m.id))} style={{ background: T.red + "22", border: `1px solid ${T.red}44`, borderRadius: 7, padding: "0.3rem 0.5rem", color: T.red, cursor: "pointer", fontSize: "0.68rem", fontFamily: "inherit" }}>✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportsAdmin({ player, dispatch }) {
  const [reports, setReports] = useLocalStorage("dawn_question_reports", []);

  const ISSUE_LABELS = {
    wrong_answer: "Correct answer is wrong",
    misleading:   "Question is misleading",
    wrong_info:   "Explanation is incorrect",
    outdated:     "Information is outdated",
    other:        "Other issue",
  };

  if (!reports.length) return (
    <div style={{ padding: "2rem 0", textAlign: "center" }}>
      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚑</div>
      <div style={{ color: T.textMuted, fontSize: "0.85rem" }}>No reports yet.</div>
      <div style={{ color: T.textDim, fontSize: "0.75rem", marginTop: "0.3rem" }}>Players can report questions after answering them.</div>
    </div>
  );

  return (
    <div style={{ marginTop: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <span style={{ color: T.textMuted, fontSize: "0.78rem" }}>
          {reports.length} report{reports.length !== 1 ? "s" : ""} from players
        </span>
        <button onClick={() => setReports([])} style={{ background: "none", border: "none", color: T.red, fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}>
          Clear all
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {reports.map((r, i) => {
          const allQs = [...BEGINNER_QS, ...INTERMEDIATE_QS, ...EXPERT_QS, ...(player.customQuestions || [])];
          const liveQ = allQs.find(x => x.id === r.questionId);
          // Use stored question text if live question no longer exists
          const qText = r.question || (liveQ?.question) || "Unknown question";
          const correctAnswer = r.correctAnswer || (liveQ ? liveQ.options[liveQ.correct] : "—");

          return (
            <div key={i} style={{ ...css.card, border: `1px solid ${T.red}44`, padding: "1rem" }}>
              {/* Header row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.65rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem" }}>
                    <span style={{ background: T.red + "22", color: "#fca5a5", fontSize: "0.68rem", fontWeight: 700, padding: "2px 7px", borderRadius: 6 }}>
                      {ISSUE_LABELS[r.issue] || r.issue || "Flagged"}
                    </span>
                    <span style={{ color: T.textDim, fontSize: "0.67rem" }}>{new Date(r.ts).toLocaleString()}</span>
                  </div>
                  <div style={{ color: T.text, fontSize: "0.83rem", fontWeight: 600, lineHeight: 1.45 }}>{qText}</div>
                </div>
                <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
                  {liveQ && (
                    <button onClick={() => { dispatch({ type: "DELETE_QUESTION", id: liveQ.id }); setReports(rs => rs.filter((_, j) => j !== i)); }}
                      style={{ background: T.red + "22", border: `1px solid ${T.red}55`, borderRadius: 8, padding: "0.3rem 0.55rem", color: T.red, cursor: "pointer", fontSize: "0.68rem", fontFamily: "inherit" }}>
                      Delete Q
                    </button>
                  )}
                  <button onClick={() => setReports(rs => rs.filter((_, j) => j !== i))}
                    style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "0.3rem 0.55rem", color: T.textMuted, cursor: "pointer", fontSize: "0.68rem", fontFamily: "inherit" }}>
                    Dismiss
                  </button>
                </div>
              </div>

              {/* Answer options */}
              {r.options && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "0.6rem" }}>
                  {r.options.map((opt, oi) => (
                    <div key={oi} style={{
                      fontSize: "0.75rem", padding: "0.3rem 0.65rem", borderRadius: 7,
                      background: oi === r.correct ? "#022c22" : T.surfaceHigh,
                      color: oi === r.correct ? T.green : T.textMuted,
                      border: `1px solid ${oi === r.correct ? T.green + "55" : T.border}`,
                      display: "flex", gap: "0.4rem",
                    }}>
                      <span style={{ fontWeight: 700 }}>{"ABCD"[oi]}.</span>
                      <span style={{ flex: 1 }}>{opt}</span>
                      {oi === r.correct && <span style={{ color: T.green, fontWeight: 700 }}>✓ marked correct</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Player's suggestion */}
              {r.suggestion && (
                <div style={{ background: "#0d1a0d", border: `1px solid ${T.green}33`, borderRadius: 8, padding: "0.55rem 0.75rem", fontSize: "0.78rem", color: "#86efac", lineHeight: 1.55 }}>
                  💬 Player note: <em>{r.suggestion}</em>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
//  FEEDBACK ADMIN (read-only view of user-submitted feedback)
// ─────────────────────────────────────────────────────────────
const FEEDBACK_TYPE_META = {
  bug:     { icon: "🐛", color: "#f87171", label: "Bug Report" },
  feature: { icon: "💡", color: "#fbbf24", label: "Feature Request" },
  opinion: { icon: "💬", color: "#60a5fa", label: "Opinion" },
  content: { icon: "📝", color: "#a78bfa", label: "Content Issue" },
};

function FeedbackAdmin() {
  const [feedbacks, setFeedbacks] = useLocalStorage("dawn_feedback", []);
  const [filter, setFilter] = useState("all");
  const [dismissed, setDismissed] = useLocalStorage("dawn_feedback_dismissed", []);

  const visible = (feedbacks || []).filter(f =>
    !dismissed.includes(f.id) && (filter === "all" || f.type === filter)
  );

  function dismiss(id) {
    setDismissed(prev => [...(prev || []), id]);
  }
  function dismissAll() {
    setDismissed(prev => [...(prev || []), ...(feedbacks || []).map(f => f.id)]);
  }

  const counts = ["bug","feature","opinion","content"].reduce((acc, t) => {
    acc[t] = (feedbacks || []).filter(f => !dismissed.includes(f.id) && f.type === t).length;
    return acc;
  }, {});
  const totalActive = (feedbacks || []).filter(f => !dismissed.includes(f.id)).length;

  return (
    <div style={{ padding: "0 0 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
        <div style={{ color: T.textMuted, fontSize: "0.72rem" }}>{totalActive} submission{totalActive !== 1 ? "s" : ""}</div>
        {totalActive > 0 && (
          <button onClick={dismissAll} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "0.3rem 0.75rem", color: T.textMuted, cursor: "pointer", fontSize: "0.72rem", fontFamily: "inherit" }}>Dismiss all</button>
        )}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {[["all", "All", totalActive], ["bug","🐛",counts.bug], ["feature","💡",counts.feature], ["opinion","💬",counts.opinion], ["content","📝",counts.content]].map(([k, l, n]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ padding: "0.3rem 0.65rem", borderRadius: 20, border: `1px solid ${filter === k ? T.gold : T.border}`, background: filter === k ? "#1c1200" : T.surface, color: filter === k ? T.gold : T.textMuted, cursor: "pointer", fontSize: "0.7rem", fontFamily: "inherit", fontWeight: filter === k ? 700 : 400 }}>
            {l} {n > 0 && <span style={{ opacity: 0.7 }}>({n})</span>}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: T.textDim, fontSize: "0.82rem" }}>No feedback yet{filter !== "all" ? " in this category" : ""}.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {visible.map(f => {
            const meta = FEEDBACK_TYPE_META[f.type] || { icon: "💬", color: T.textMuted, label: f.type };
            return (
              <div key={f.id} style={{ ...css.card, borderLeft: `3px solid ${meta.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontSize: "0.9rem" }}>{meta.icon}</span>
                    <span style={{ color: meta.color, fontWeight: 700, fontSize: "0.75rem" }}>{meta.label}</span>
                    {f.username && <span style={{ color: T.textDim, fontSize: "0.68rem" }}>· {f.username} · {f.rank}</span>}
                  </div>
                  <button onClick={() => dismiss(f.id)} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: "0.75rem", padding: "0 0.2rem" }}>✕</button>
                </div>
                <div style={{ color: T.text, fontSize: "0.82rem", lineHeight: 1.6, marginBottom: f.contact ? "0.4rem" : 0 }}>
                  {f.text}
                </div>
                {f.contact && (
                  <div style={{ color: T.textMuted, fontSize: "0.7rem", marginTop: "0.3rem" }}>📩 {f.contact}</div>
                )}
                <div style={{ color: T.textDim, fontSize: "0.65rem", marginTop: "0.4rem" }}>
                  {new Date(f.ts).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ── Announcements Admin ──────────────────────────────────────
function AnnouncementsAdmin({ announcements, saveAnnouncements }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  function addAnnouncement() {
    if (!text.trim()) { setError("Enter announcement text."); return; }
    const item = { id: Date.now().toString(), text: text.trim(), active: true };
    saveAnnouncements([item, ...announcements]);
    setText(""); setError("");
  }
  function toggle(id) {
    saveAnnouncements(announcements.map(a => a.id === id ? { ...a, active: !a.active } : a));
  }
  function remove(id) {
    saveAnnouncements(announcements.filter(a => a.id !== id));
  }

  return (
    <div>
      <div style={{ color: T.text, fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.75rem" }}>📢 Announcements</div>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setError(""); }}
        placeholder="Type an announcement for the Home screen…"
        rows={3}
        style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: 10, background: T.surface, border: `1.5px solid ${T.border}`, color: T.text, fontFamily: "inherit", fontSize: "0.82rem", resize: "vertical", outline: "none", boxSizing: "border-box" }}
      />
      {error && <div style={{ color: T.red, fontSize: "0.72rem", margin: "0.25rem 0" }}>{error}</div>}
      <button onClick={addAnnouncement} style={{ marginTop: "0.5rem", padding: "0.55rem 1.1rem", borderRadius: 10, background: T.green + "22", border: `1px solid ${T.green}66`, color: T.green, fontFamily: "inherit", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
        + Post Announcement
      </button>
      {announcements.length > 0 && (
        <div style={{ marginTop: "0.85rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {announcements.map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.55rem 0.75rem", background: T.surface, border: `1px solid ${a.active ? T.green + "55" : T.border}`, borderRadius: 10 }}>
              <div style={{ flex: 1, color: a.active ? T.text : T.textMuted, fontSize: "0.78rem", lineHeight: 1.5 }}>{a.text}</div>
              <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
                <button onClick={() => toggle(a.id)} style={{ padding: "0.25rem 0.5rem", borderRadius: 6, border: `1px solid ${a.active ? T.green + "66" : T.border}`, background: "none", color: a.active ? T.green : T.textMuted, fontSize: "0.68rem", cursor: "pointer", fontFamily: "inherit" }}>
                  {a.active ? "Live" : "Off"}
                </button>
                <button onClick={() => remove(a.id)} style={{ padding: "0.25rem 0.5rem", borderRadius: 6, border: `1px solid ${T.red}44`, background: "none", color: T.red, fontSize: "0.68rem", cursor: "pointer", fontFamily: "inherit" }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminPanel({ player, dispatch, onExit, currentAdmin, adminsHook, navLabels, setNavLabels, announcements = [], saveAnnouncements, initialTab = "questions" }) {
  const [tab, setTab] = useState(initialTab);
  const [view, setView] = useState("list"); // list | form | ai | csv
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_Q });
  const [importMsg, setImportMsg] = useState("");

  function openNew() { setForm({ ...EMPTY_Q, options: ["","","",""] }); setEditing(null); setView("form"); }
  function openEdit(q) { setForm({ ...q, options: [...q.options] }); setEditing(q.id); setView("form"); }
  function setOpt(i, v) { const o = [...form.options]; o[i] = v; setForm(f => ({ ...f, options: o })); }

  function saveForm() {
    const valid = form.question.trim() && form.options.every(o => o.trim()) && form.explanation.trim();
    if (!valid) return;
    const cid = editing || `custom_${Date.now()}`;
    if (editing) dispatch({ type: "EDIT_QUESTION", question: { ...form, id: cid } });
    else dispatch({ type: "ADD_QUESTION", question: { ...form, id: cid } });
    setView("list");
  }

  function handleImportDone(msg) {
    setImportMsg(msg);
    setView("list");
    setTimeout(() => setImportMsg(""), 4000);
  }

  const allCustom = player.customQuestions;
  const byDiff = d => allCustom.filter(q => q.diff === d);

  // ── Question form view ──
  if (view === "form") return (
    <div style={css.screen}>
      <div style={{ padding: "1.25rem" }}>
        <BackBtn onClick={() => setView("list")} />
        <div style={{ margin: "1.25rem 0" }}>
          <SectionTitle>{editing ? "Edit Question" : "New Question"}</SectionTitle>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <span style={css.lbl}>DIFFICULTY</span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {["beginner","intermediate","expert"].map(d => (
                <button key={d} onClick={() => setForm(f => ({ ...f, diff: d }))} style={{ flex: 1, padding: "0.45rem", borderRadius: 8, border: `1px solid ${form.diff === d ? DIFF_COLOR[d] : T.borderHigh}`, background: form.diff === d ? T.surfaceHigh : T.surface, color: form.diff === d ? DIFF_COLOR[d] : T.textMuted, cursor: "pointer", fontSize: "0.72rem", fontWeight: form.diff === d ? 700 : 400, fontFamily: "inherit" }}>{d}</button>
              ))}
            </div>
          </div>
          <div>
            <span style={css.lbl}>QUESTION TEXT</span>
            <textarea value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} rows={3} style={{ ...css.inp, resize: "vertical" }} placeholder="Enter the question…" />
          </div>
          {["A","B","C","D"].map((L, i) => (
            <div key={i}>
              <span style={css.lbl}>OPTION {L} {form.correct === i && <span style={{ color: T.green }}>✓ CORRECT</span>}</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input value={form.options[i]} onChange={e => setOpt(i, e.target.value)} style={{ ...css.inp, flex: 1 }} placeholder={`Option ${L}…`} />
                <button onClick={() => setForm(f => ({ ...f, correct: i }))} style={{ padding: "0 0.85rem", borderRadius: 10, border: `1px solid ${form.correct === i ? T.green : T.borderHigh}`, background: form.correct === i ? "#022c22" : T.surface, color: form.correct === i ? T.green : T.textMuted, cursor: "pointer", fontSize: "0.8rem", fontFamily: "inherit", flexShrink: 0 }}>✓</button>
              </div>
            </div>
          ))}
          <div>
            <span style={css.lbl}>HINT (shown via Docs lifeline)</span>
            <input value={form.hint} onChange={e => setForm(f => ({ ...f, hint: e.target.value }))} style={css.inp} placeholder="A subtle clue…" />
          </div>
          <div>
            <span style={css.lbl}>EXPLANATION (shown after answer)</span>
            <textarea value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} rows={3} style={{ ...css.inp, resize: "vertical" }} placeholder="Explain the correct answer…" />
          </div>
          <Btn onClick={saveForm} disabled={!form.question.trim() || !form.options.every(o => o.trim()) || !form.explanation.trim()}>
            {editing ? "Save Changes ✓" : "Add Question ✓"}
          </Btn>
          <Btn variant="ghost" onClick={() => setView("list")}>Cancel</Btn>
        </div>
      </div>
    </div>
  );

  // ── AI / CSV sub-views (rendered inline below tab content) ──
  return (
    <div style={css.screen}>
      <div style={{ padding: "1.25rem" }}>
        <BackBtn onClick={onExit} />
        <div style={{ margin: "1.25rem 0 1rem" }}>
          <SectionTitle>Admin Panel</SectionTitle>
        </div>

        {/* Import success message */}
        {importMsg && (
          <div style={{ padding: "0.75rem 1rem", background: "#011c11", border: `1px solid ${T.green}44`, borderRadius: 10, color: T.green, fontSize: "0.82rem", marginBottom: "1rem" }}>
            ✓ {importMsg}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.25rem" }}>
          {([["questions","❓ Questions"],["announcements","📢 Announce"],["archive","📋 Archive"],
            ...(currentAdmin?.role === "master" || currentAdmin?.canAcademy ? [["modules","📚 Modules"]] : []),
            ["labels","✏️ Labels"],["reports","⚑ Reports"],["feedback","💬 Feedback"],["admins","👥 Admins"]]).map(([k, l]) => (
            <button key={k} onClick={() => { setTab(k); setView("list"); }} style={{ flex: 1, padding: "0.5rem 0.15rem", borderRadius: 8, border: `1px solid ${tab === k ? T.gold : T.borderHigh}`, background: tab === k ? "#1c1200" : T.surface, color: tab === k ? T.gold : T.textMuted, cursor: "pointer", fontSize: "0.68rem", fontWeight: tab === k ? 700 : 400, fontFamily: "inherit" }}>{l}</button>
          ))}
        </div>

        {/* ── Questions tab ── */}
        {tab === "questions" && (
          <>
            {/* Action buttons row */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              <button onClick={openNew} style={{ flex: 1, background: "#1c1200", border: `1px solid ${T.gold}`, borderRadius: 8, padding: "0.5rem 0.5rem", color: T.gold, cursor: "pointer", fontSize: "0.72rem", fontWeight: 700, fontFamily: "inherit" }}>➕ Manual</button>
              <button onClick={() => setView(view === "csv" ? "list" : "csv")} style={{ flex: 1, background: view === "csv" ? "#0a1220" : T.surface, border: `1px solid ${view === "csv" ? T.blue : T.borderHigh}`, borderRadius: 8, padding: "0.5rem 0.5rem", color: view === "csv" ? T.blue : T.textMuted, cursor: "pointer", fontSize: "0.72rem", fontWeight: view === "csv" ? 700 : 400, fontFamily: "inherit" }}>📊 CSV</button>
              <button onClick={() => setView(view === "ai" ? "list" : "ai")} style={{ flex: 1, background: view === "ai" ? "#1a0e3a" : T.surface, border: `1px solid ${view === "ai" ? T.purple : T.borderHigh}`, borderRadius: 8, padding: "0.5rem 0.5rem", color: view === "ai" ? "#c4b5fd" : T.textMuted, cursor: "pointer", fontSize: "0.72rem", fontWeight: view === "ai" ? 700 : 400, fontFamily: "inherit" }}>✨ AI</button>
            </div>

            {/* Inline AI generator */}
            {view === "ai" && <AIGenerator dispatch={dispatch} onClose={handleImportDone} />}

            {/* Inline CSV importer */}
            {view === "csv" && <CSVImporter dispatch={dispatch} onClose={handleImportDone} />}

            {/* Question list */}
            {view === "list" && (
              <>
                <ClearAllQuestions count={allCustom.length} isMaster={currentAdmin?.role === "master"} dispatch={dispatch} />
                {allCustom.length === 0 && (
                  <div style={{ ...css.card, textAlign: "center", padding: "2rem", color: T.textDim, fontSize: "0.85rem", lineHeight: 1.7 }}>
                    No custom questions yet.<br />
                    Add manually, import a CSV, or<br />generate with AI ✨
                  </div>
                )}
                {["beginner","intermediate","expert"].map(d => {
                  const list = byDiff(d);
                  if (!list.length) return null;
                  return (
                    <div key={d} style={{ marginBottom: "1.25rem" }}>
                      <div style={{ ...css.tag(DIFF_COLOR[d]), marginBottom: "0.6rem" }}>{d.toUpperCase()} ({list.length})</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {list.map(q => (
                          <div key={q.id} style={{ ...css.card, display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ color: T.text, fontSize: "0.84rem", lineHeight: 1.4, marginBottom: "0.3rem" }}>{q.question}</div>
                              <div style={{ color: T.green, fontSize: "0.72rem" }}>✓ {q.options[q.correct]}</div>
                            </div>
                            <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                              <button style={{ background: "none", border: `1px solid ${T.borderHigh}66`, borderRadius: 8, padding: "0.3rem 0.6rem", color: T.textMuted, cursor: "pointer", fontSize: "0.72rem", fontFamily: "inherit" }} onClick={() => openEdit(q)}>Edit</button>
                              <button style={{ background: "none", border: `1px solid ${T.red}55`, borderRadius: 8, padding: "0.3rem 0.6rem", color: T.red, cursor: "pointer", fontSize: "0.72rem", fontFamily: "inherit" }} onClick={() => dispatch({ type: "DELETE_QUESTION", id: q.id })}>✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* ── Archive tab ── */}
        {tab === "announcements" && <AnnouncementsAdmin announcements={announcements} saveAnnouncements={saveAnnouncements} />}
        {tab === "archive" && <ArchiveAdmin player={player} dispatch={dispatch} />}

        {/* ── Modules tab ── */}
        {tab === "modules" && (
          <AcademyAdmin player={player} dispatch={dispatch} />
        )}

        {/* ── Labels tab ── */}
        {tab === "labels" && (
          <FeatureLabelsAdmin navLabels={navLabels} setNavLabels={setNavLabels} isMaster={currentAdmin?.role === "master"} />
        )}

        {/* ── Admins tab ── */}
        {tab === "reports" && <ReportsAdmin player={player} dispatch={dispatch} />}

        {/* ── Feedback tab ── */}
        {tab === "feedback" && <FeedbackAdmin />}

        {tab === "admins" && (
          <AdminManagement currentAdmin={currentAdmin} adminsHook={adminsHook} />
        )}

      </div>
    </div>
  );
}

// ── Archive Admin sub-component ─────────────────────────────

const SOURCES = ["Discord", "X (Twitter)", "Telegram", "Special Event", "Dawn Academy", "Other"];
const EMPTY_ARCHIVE = { title: "", source: "Discord", date: "", sunrays: 2, desc: "", questionList: [] };

function ArchiveAdmin({ player, dispatch }) {
  const quizzes = player.archiveQuizzes || DEFAULT_ARCHIVE;
  const [view, setView] = useState("list"); // list | form
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_ARCHIVE });

  function openNew() { setForm({ ...EMPTY_ARCHIVE }); setEditing(null); setView("form"); }
  function openEdit(q) { setForm({ ...q }); setEditing(q.id); setView("form"); }

  function saveForm() {
    if (!form.title.trim()) return;
    const quiz = {
      ...form,
      id: editing || `arc_${Date.now()}`,
      sunrays: Math.max(1, Number(form.sunrays) || 2),
      questionList: form.questionList || [],
    };
    if (editing) dispatch({ type: "EDIT_ARCHIVE", quiz });
    else dispatch({ type: "ADD_ARCHIVE", quiz });
    setView("list");
  }

  function handleJsonUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        let parsed = JSON.parse(ev.target.result);
        // Accept array of questions or { questions: [...] }
        if (!Array.isArray(parsed)) parsed = parsed.questions || parsed.questionList || [];
        const cleaned = parsed.map((q, i) => ({
          id: q.id || `uq_${Date.now()}_${i}`,
          question: q.question || q.q || "",
          options: q.options || q.answers || [],
          correct: typeof q.correct === "number" ? q.correct : 0,
          explanation: q.explanation || q.exp || "",
        })).filter(q => q.question && q.options.length >= 2);
        setForm(f => ({ ...f, questionList: cleaned }));
      } catch { alert("Invalid JSON file. Please check the format."); }
    };
    reader.readAsText(file);
  }

  if (view === "form") return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: T.text, fontWeight: 700, fontSize: "0.9rem" }}>{editing ? "Edit Quiz" : "Add Quiz"}</span>
        <button onClick={() => setView("list")} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: "0.82rem", fontFamily: "inherit" }}>← Back</button>
      </div>

      <div>
        <span style={css.lbl}>TITLE</span>
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={css.inp} placeholder="e.g. Dawn Discord AMA #4" />
      </div>

      <div>
        <span style={css.lbl}>SOURCE</span>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {SOURCES.map(s => (
            <button key={s} onClick={() => setForm(f => ({ ...f, source: s }))}
              style={{ padding: "0.35rem 0.7rem", borderRadius: 20, border: `1px solid ${form.source === s ? SRC_COLOR[s] || T.gold : T.borderHigh}`, background: form.source === s ? T.surfaceHigh : T.surface, color: form.source === s ? SRC_COLOR[s] || T.gold : T.textMuted, cursor: "pointer", fontSize: "0.7rem", fontFamily: "inherit", fontWeight: form.source === s ? 700 : 400 }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
        <div>
          <span style={css.lbl}>DATE</span>
          <input value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={css.inp} placeholder="e.g. Mar 10" />
        </div>
        <div>
          <span style={css.lbl}>SUNRAYS</span>
          <input type="number" min="1" max="50" value={form.sunrays} onChange={e => setForm(f => ({ ...f, sunrays: e.target.value }))} style={css.inp} />
        </div>
      </div>

      {/* JSON Question Upload */}
      <div>
        <span style={css.lbl}>QUESTIONS (upload JSON file)</span>
        <div style={{ ...css.card, padding: "0.85rem", border: `1px dashed ${(form.questionList?.length > 0) ? T.green : T.borderHigh}` }}>
          {form.questionList?.length > 0 ? (
            <div>
              <div style={{ color: T.green, fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                ✓ {form.questionList.length} questions loaded
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.6rem" }}>
                {form.questionList.slice(0, 3).map((q, i) => (
                  <div key={i} style={{ color: T.textMuted, fontSize: "0.72rem", lineHeight: 1.4 }}>Q{i+1}. {q.question.slice(0, 60)}{q.question.length > 60 ? "…" : ""}</div>
                ))}
                {form.questionList.length > 3 && <div style={{ color: T.textDim, fontSize: "0.7rem" }}>…and {form.questionList.length - 3} more</div>}
              </div>
              <button onClick={() => setForm(f => ({ ...f, questionList: [] }))} style={{ background: "none", border: `1px solid ${T.red}55`, borderRadius: 8, padding: "0.25rem 0.6rem", color: T.red, cursor: "pointer", fontSize: "0.7rem", fontFamily: "inherit" }}>✕ Remove</button>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ color: T.textMuted, fontSize: "0.78rem", marginBottom: "0.6rem", lineHeight: 1.5 }}>
                Upload a JSON file with your quiz questions.<br />
                <span style={{ color: T.textDim, fontSize: "0.7rem" }}>Format: array of {`{ question, options[], correct, explanation }`}</span>
              </div>
              <label style={{ display: "inline-block", padding: "0.45rem 1rem", borderRadius: 10, background: T.surfaceHigh, border: `1px solid ${T.borderHigh}`, color: T.textMuted, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
                📂 Choose JSON File
                <input type="file" accept=".json" onChange={handleJsonUpload} style={{ display: "none" }} />
              </label>
            </div>
          )}
        </div>
        <div style={{ color: T.textDim, fontSize: "0.68rem", marginTop: "0.35rem" }}>
          Tip: You can also add questions later by editing this quiz entry.
        </div>
      </div>

      <div>
        <span style={css.lbl}>DESCRIPTION (optional)</span>
        <textarea value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} rows={3} style={{ ...css.inp, resize: "vertical" }} placeholder="Brief summary of this quiz…" />
      </div>

      <Btn onClick={saveForm} disabled={!form.title.trim()}>
        {editing ? "Save Changes ✓" : "Add to Archive ✓"}
      </Btn>
      <Btn variant="ghost" onClick={() => setView("list")}>Cancel</Btn>
    </div>
  );

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <span style={{ color: T.textMuted, fontSize: "0.8rem" }}>{quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""}</span>
        <button onClick={openNew} style={{ background: "#1c1200", border: `1px solid ${T.gold}`, borderRadius: 8, padding: "0.4rem 0.85rem", color: T.gold, cursor: "pointer", fontSize: "0.78rem", fontWeight: 700, fontFamily: "inherit" }}>➕ Add Quiz</button>
      </div>

      {quizzes.length === 0 && (
        <div style={{ ...css.card, textAlign: "center", padding: "2rem", color: T.textDim, fontSize: "0.85rem", lineHeight: 1.7 }}>
          No archive quizzes yet.<br />Add your Discord quizzes here.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {quizzes.map(q => {
          const srcColor = SRC_COLOR[q.source] || T.textMuted;
          const done = (player.completedArchive || []).includes(q.id);
          return (
            <div key={q.id} style={{ ...css.card, borderLeft: `3px solid ${srcColor}55`, display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: T.text, fontWeight: 600, fontSize: "0.84rem", marginBottom: "0.25rem", lineHeight: 1.4 }}>{q.title}</div>
                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ ...css.tag(srcColor) }}>{q.source}</span>
                  <span style={{ color: T.textMuted, fontSize: "0.7rem" }}>{q.date} · {q.questionList?.length || 0}Q · +{q.sunrays}☀</span>
                  {done && <span style={{ color: T.green, fontSize: "0.68rem" }}>✓</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                <button style={{ background: "none", border: `1px solid ${T.borderHigh}66`, borderRadius: 8, padding: "0.3rem 0.6rem", color: T.textMuted, cursor: "pointer", fontSize: "0.72rem", fontFamily: "inherit" }} onClick={() => openEdit(q)}>Edit</button>
                <button style={{ background: "none", border: `1px solid ${T.red}55`, borderRadius: 8, padding: "0.3rem 0.6rem", color: T.red, cursor: "pointer", fontSize: "0.72rem", fontFamily: "inherit" }} onClick={() => dispatch({ type: "DELETE_ARCHIVE", id: q.id })}>✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  LEARNING HUB
// ─────────────────────────────────────────────────────────────



// ── Markdown-lite lesson body renderer ───────────────────────
// Supports: ## Heading, # Heading, **bold**, - bullet, blank line = new para
function renderLessonBody(body) {
  if (!body) return null;
  const lines = body.split(/\n/);
  const elements = [];
  let paraLines = [];

  function flushPara() {
    if (!paraLines.length) return;
    const text = paraLines.join(" ").trim();
    if (!text) { paraLines = []; return; }
    const parts = text.split(/\*\*(.*?)\*\*/g);
    const rendered = parts.map((p, i) =>
      i % 2 === 1 ? <strong key={i} style={{ color: T.text, fontWeight: 700 }}>{p}</strong> : p
    );
    elements.push(
      <p key={elements.length} style={{ margin: "0 0 0.7rem", lineHeight: 1.75, color: T.text }}>{rendered}</p>
    );
    paraLines = [];
  }

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) { flushPara(); return; }
    if (trimmed.startsWith("## ")) {
      flushPara();
      elements.push(<div key={elements.length} style={{ color: T.gold, fontWeight: 800, fontSize: "0.9rem", margin: "0.85rem 0 0.3rem", borderBottom: `1px solid ${T.border}`, paddingBottom: "0.2rem" }}>{trimmed.slice(3)}</div>);
      return;
    }
    if (trimmed.startsWith("# ")) {
      flushPara();
      elements.push(<div key={elements.length} style={{ color: T.text, fontWeight: 900, fontSize: "0.95rem", margin: "0.85rem 0 0.35rem" }}>{trimmed.slice(2)}</div>);
      return;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      flushPara();
      const txt = trimmed.slice(2);
      const parts = txt.split(/\*\*(.*?)\*\*/g);
      const rendered = parts.map((p, i) => i % 2 === 1 ? <strong key={i} style={{ fontWeight: 700, color: T.text }}>{p}</strong> : p);
      elements.push(
        <div key={elements.length} style={{ display: "flex", gap: "0.45rem", margin: "0.2rem 0" }}>
          <span style={{ color: T.orange || "#FF6B1A", flexShrink: 0 }}>•</span>
          <span style={{ color: T.text, lineHeight: 1.65 }}>{rendered}</span>
        </div>
      );
      return;
    }
    paraLines.push(trimmed);
  });
  flushPara();
  return elements.length ? <div style={{ fontSize: "0.83rem" }}>{elements}</div> : null;
}

function LessonList({ lessons }) {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      {lessons.map((l, i) => {
        const lesson = normLesson(l);
        const isOpen = open === i;
        return (
          <div key={i} style={{ borderRadius: 9, overflow: "hidden", border: `1px solid ${T.border}` }}>
            <button onClick={() => setOpen(isOpen ? null : i)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.55rem 0.6rem", background: T.surfaceHigh, border: "none", cursor: lesson.content ? "pointer" : "default", fontFamily: "inherit", textAlign: "left" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: T.textMuted, flexShrink: 0 }}>{i + 1}</div>
              <span style={{ fontSize: "0.83rem", color: T.text, flex: 1 }}>{lesson.title}</span>
              {lesson.content && <span style={{ color: T.textDim, fontSize: "0.7rem" }}>{isOpen ? "▲" : "▼"}</span>}
            </button>
            {isOpen && lesson.content && (
              <div style={{ padding: "0.75rem 0.9rem", background: "#0d0e20", borderTop: `1px solid ${T.border}` }}>
                {renderLessonBody(lesson.content)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LearningHub({ player, dispatch, onExit, onAdmin }) {
  const [modules] = useLocalStorage("dawn_modules", DEFAULT_MODULES);
  const [active, setActive] = useState(null);

  if (active) {
    const done = player.completedModules.includes(active.id);
    return (
      <div style={css.screen}>
        <div style={{ padding: "1rem 1.25rem" }}>
          <BackBtn onClick={() => setActive(null)} />
          <div style={{ textAlign: "center", margin: "1.5rem 0 1.25rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>{active.icon}</div>
            <div style={{ color: T.text, fontWeight: 900, fontSize: "1.4rem" }}>{active.title}</div>
            <div style={{ color: T.textMuted, fontSize: "0.82rem", marginTop: "0.3rem", lineHeight: 1.5 }}>{active.desc}</div>
          </div>
          <div style={{ ...css.card, marginBottom: "1.25rem" }}>
            <div style={{ color: T.textMuted, fontSize: "0.82rem", marginBottom: "0.85rem" }}>
              <strong style={{ color: T.gold }}>{active.lessons.length} lessons</strong> · Complete to earn <strong style={{ color: T.gold }}>+{active.sunrays} ☀</strong>
            </div>
            <LessonList lessons={active.lessons} />
          </div>
          {done ? (
            <div style={{ textAlign: "center", color: T.green, padding: "1rem", background: "#011c11", border: `1px solid ${T.green}44`, borderRadius: 12 }}>✓ Module Completed</div>
          ) : (
            <Btn onClick={() => { dispatch({ type: "COMPLETE_MODULE", id: active.id }); dispatch({ type: "EARN_SUNRAYS", amount: active.sunrays }); setActive(null); }}>
              Complete Module → +{active.sunrays} ☀
            </Btn>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={css.screen}>
      <div style={{ padding: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "0.25rem" }}>
          <div style={{ flex: 1 }}><BackBtn onClick={onExit} /></div>
          {onAdmin && (
            <button onClick={() => onAdmin("modules")} style={{ background: "none", border: `1px solid ${T.borderHigh}`, borderRadius: 8, padding: "0.3rem 0.65rem", color: T.textMuted, cursor: "pointer", fontSize: "0.7rem", fontFamily: "inherit" }}>
              ⚙ Manage Modules
            </button>
          )}
        </div>
        <div style={{ margin: "1rem 0 1rem" }}>
          <SectionTitle sub="Master the ecosystem. Earn Sunrays.">Dawn Academy</SectionTitle>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {modules.map(m => {
            const done = player.completedModules.includes(m.id);
            return (
              <button key={m.id} onClick={() => setActive(m)} style={{ ...css.card, textAlign: "left", cursor: "pointer", display: "flex", gap: "1rem", alignItems: "center", position: "relative", overflow: "hidden", borderLeft: `3px solid ${m.color}`, background: T.surface }}>
                <div style={{ fontSize: "2rem", flexShrink: 0 }}>{m.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: T.text, fontWeight: 600, fontSize: "0.9rem" }}>{m.title}</div>
                  <div style={{ color: T.textMuted, fontSize: "0.73rem", marginTop: "0.2rem" }}>{m.lessons.length} lessons</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ color: T.gold, fontSize: "0.82rem", fontWeight: 700 }}>+{m.sunrays} ☀</div>
                  {done && <div style={{ color: T.green, fontSize: "0.7rem", marginTop: "0.2rem" }}>✓</div>}
                </div>
              </button>
            );
          })}
        </div>
        {onAdmin && (
          <div style={{ marginTop: "1.5rem", padding: "0.75rem 1rem", background: "#0d1020", border: `1px solid ${T.border}`, borderRadius: 12, fontSize: "0.75rem", color: T.textDim, lineHeight: 1.5 }}>
            💡 To add, edit or remove modules, tap <strong style={{ color: T.textMuted }}>⚙ Manage Modules</strong> above. You'll need your admin PIN.
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  STUDY MATERIALS
// ─────────────────────────────────────────────────────────────

function StudyMaterials({ onExit }) {
  const [materials] = useLocalStorage("dawn_study_materials", DEFAULT_MATERIALS);
  const [cat, setCat] = useState("All");
  const cats = ["All", ...Array.from(new Set(materials.map(m => m.cat)))];
  const filtered = cat === "All" ? materials : materials.filter(m => m.cat === cat);

  return (
    <div style={css.screen}>
      <div style={{ padding: "1.25rem" }}>
        <BackBtn onClick={onExit} />
        <div style={{ margin: "1.25rem 0 0.5rem" }}>
          <SectionTitle sub="Official resources to master the Dawn ecosystem">Study Materials</SectionTitle>
        </div>

        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.25rem", overflowX: "auto", paddingBottom: "0.2rem" }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ whiteSpace: "nowrap", padding: "0.3rem 0.75rem", borderRadius: 20, border: `1px solid ${cat === c ? T.gold : T.borderHigh}`, background: cat === c ? "#1c1200" : T.surface, color: cat === c ? T.gold : T.textMuted, cursor: "pointer", fontSize: "0.72rem", fontWeight: cat === c ? 700 : 400, fontFamily: "inherit" }}>{c}</button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {filtered.map(m => (
            <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer"
              style={{ textDecoration: "none", display: "block", ...css.card, borderLeft: `3px solid ${m.color}` }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <div style={{ fontSize: "1.8rem", flexShrink: 0 }}>{m.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.35rem", alignItems: "flex-start" }}>
                    <span style={{ color: T.text, fontWeight: 700, fontSize: "0.88rem", lineHeight: 1.3 }}>{m.title}</span>
                    <span style={{ ...css.tag(m.color), whiteSpace: "nowrap", flexShrink: 0 }}>{m.tag}</span>
                  </div>
                  <div style={{ color: T.textMuted, fontSize: "0.77rem", lineHeight: 1.55 }}>{m.desc}</div>
                  <div style={{ color: m.color, fontSize: "0.72rem", fontWeight: 700, marginTop: "0.6rem" }}>Read →</div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
//  TOURNAMENT SCREEN
// ─────────────────────────────────────────────────────────────

// Score formula: accuracy points + time bonus per question
// accuracy pts = (correct / total) * 1000 (max 1000)
// time bonus   = sum of (timeLeft / timerSecs * 50) per correct answer (max 50/Q)
function calcTournamentScore(correct, total, timeBonus) {
  const accuracy = total > 0 ? Math.round((correct / total) * 1000) : 0;
  return accuracy + timeBonus;
}

function TournamentScreen({ player, dispatch, onExit, initialCode = null, onCodeConsumed }) {
  const [tab,          setTab]          = useState(initialCode ? "join" : "browse");
  const [joinCode,     setJoinCode]     = useState(initialCode || "");
  const [activeTour,   setActiveTour]   = useState(null);  // tournament object in focus
  const [leaderboard,  setLeaderboard]  = useState([]);
  const [myBest,       setMyBest]       = useState(null);
  const [browseList,   setBrowseList]   = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [phase,        setPhase]        = useState("lobby"); // lobby | playing | result
  const [runResult,    setRunResult]    = useState(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);

  // Create form state
  const [createTitle, setCreateTitle]   = useState("");
  const [createDesc,  setCreateDesc]    = useState("");
  const [createTier,  setCreateTier]    = useState("expert");
  const [createLen,   setCreateLen]     = useState(10);
  const [createDiff,  setCreateDiff]    = useState("standard");
  const [createHours, setCreateHours]   = useState(48);
  const [creating,    setCreating]      = useState(false);
  const [created,     setCreated]       = useState(null); // newly created tournament

  const username = formatUsername(player.username);

  // Auto-join if URL had a code
  useEffect(() => {
    if (initialCode) {
      handleJoin(initialCode);
      onCodeConsumed?.();
    } else if (supabaseEnabled) {
      loadBrowse();
    }
  // eslint-disable-next-line
  }, []);

  async function loadBrowse() {
    setLoading(true); setError("");
    try {
      const list = await getAllTournaments();
      setBrowseList(list);
    } catch(e) { setError("Could not load tournaments."); }
    finally { setLoading(false); }
  }

  async function handleJoin(code = joinCode) {
    const cleaned = (code || "").trim().toUpperCase();
    if (!cleaned) return;
    setLoading(true); setError(""); setActiveTour(null);
    try {
      const t = await getTournamentByCode(cleaned);
      if (!t) { setError("Tournament not found. Check the code and try again."); setLoading(false); return; }
      setActiveTour(t);
      setTab("lobby");
      const [lb, mb] = await Promise.all([
        getLeaderboard(t.id),
        getMyBest(t.id, username),
      ]);
      setLeaderboard(lb);
      setMyBest(mb);
    } catch(e) { setError("Could not load tournament."); }
    finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!createTitle.trim()) { setError("Please enter a tournament title."); return; }
    setCreating(true); setError("");
    try {
      const seed = Math.floor(Math.random() * 999983).toString(36).toUpperCase().padStart(5, "0");
      const now   = new Date();
      const ends  = new Date(now.getTime() + createHours * 3600 * 1000);
      const t = await createTournament({
        title: createTitle.trim(),
        description: createDesc.trim(),
        tier: createTier,
        tierLength: createLen,
        difficulty: createDiff,
        seed,
        createdBy: username,
        startsAt: now.toISOString(),
        endsAt:   ends.toISOString(),
      });
      setCreated(t);
      setActiveTour(t);
      setLeaderboard([]);
      setMyBest(null);
      // Stay on "create" tab — success card renders; user taps "View Lobby" to proceed
    } catch(e) { setError("Could not create tournament: " + e.message); }
    finally { setCreating(false); }
  }

  function exportLeaderboardCSV() {
    if (!leaderboard.length) return;
    const headers = ["Rank","Username","Score","Accuracy","Correct","Total","Time Bonus"];
    const rows = leaderboard.map((e, i) => [
      i + 1,
      e.username || "",
      e.score || 0,
      e.accuracy != null ? e.accuracy + "%" : "",
      e.correct || 0,
      e.total || 0,
      e.time_bonus || e.timeBonus || 0,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `${activeTour?.title || "tournament"}_leaderboard.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleRunComplete(result) {
    setRunResult(result);
    setPhase("result");
    const accuracy = result.total > 0 ? result.correct / result.total : 0;
    if (accuracy >= 0.7) {
      if (_sfxEnabled) SFX.victory();
    } else {
      if (_sfxEnabled) SFX.wrong();
    }
  }

  async function handleSubmitScore() {
    if (!activeTour || !runResult) return;
    setSubmitting(true); setError("");
    const score = calcTournamentScore(runResult.correct, runResult.total, runResult.timeBonusTotal);
    const accuracy = Math.round((runResult.correct / runResult.total) * 100);
    try {
      await submitEntry({
        tournamentId: activeTour.id,
        username,
        score,
        accuracy,
        correct: runResult.correct,
        total:   runResult.total,
        timeBonus: runResult.timeBonusTotal,
      });
      setSubmitted(true);
      if (_sfxEnabled) SFX.tournamentSubmit();
      // Refresh leaderboard & my best
      const [lb, mb] = await Promise.all([
        getLeaderboard(activeTour.id),
        getMyBest(activeTour.id, username),
      ]);
      setLeaderboard(lb);
      setMyBest(mb);
    } catch(e) { setError("Could not submit score: " + e.message); }
    finally { setSubmitting(false); }
  }

  const isLive = activeTour
    ? new Date() >= new Date(activeTour.starts_at) && new Date() <= new Date(activeTour.ends_at)
    : false;
  const isEnded = activeTour ? new Date() > new Date(activeTour.ends_at) : false;

  function fmtTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  function timeLeft(iso) {
    const ms = new Date(iso) - Date.now();
    if (ms <= 0) return "Ended";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
  }

  // ── Not enabled ───────────────────────────────────────────────
  if (!supabaseEnabled) {
    return (
      <div style={css.screen}>
        <div style={{ padding: "1.5rem 1.25rem" }}>
          <button onClick={onExit} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: "0.85rem", marginBottom: "1.25rem", fontFamily: "inherit" }}>← Back</button>
          <SunIcon size={52} />
          <div style={{ color: T.gold, fontWeight: 900, fontSize: "1.4rem", marginTop: "1rem" }}>Tournament Mode</div>
          <div style={{ color: T.textMuted, fontSize: "0.85rem", marginTop: "0.5rem", lineHeight: 1.7 }}>
            Tournaments require Supabase to be configured.
          </div>
          <div style={{ ...css.card, marginTop: "1.5rem", textAlign: "left" }}>
            <div style={{ color: T.text, fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.75rem" }}>⚙ Setup (2 minutes)</div>
            {[
              "Create a free project at supabase.com",
              "Run the SQL from src/supabase.js in the SQL editor",
              "Copy your Project URL + anon key into src/supabase.js",
              "Redeploy — Tournaments will appear automatically",
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: "0.65rem", marginBottom: "0.55rem", fontSize: "0.8rem" }}>
                <span style={{ color: T.gold, fontWeight: 800, minWidth: "1.1rem" }}>{i + 1}.</span>
                <span style={{ color: T.textMuted, lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Playing tournament run ────────────────────────────────────
  if (phase === "playing" && activeTour) {
    return (
      <TournamentRun
        tournament={activeTour}
        player={player}
        onComplete={handleRunComplete}
        onExit={() => setPhase("lobby")}
      />
    );
  }

  // ── Result screen after run ───────────────────────────────────
  if (phase === "result" && runResult) {
    const score = calcTournamentScore(runResult.correct, runResult.total, runResult.timeBonusTotal);
    const accuracy = Math.round((runResult.correct / runResult.total) * 100);
    return (
      <div style={css.screen}>
        <div style={{ padding: "2rem 1.25rem", textAlign: "center" }}>
          <SunIcon size={72} glow />
          <div style={{ color: T.gold, fontWeight: 900, fontSize: "1.8rem", marginTop: "1rem" }}>Run Complete!</div>
          <div style={{ color: T.textMuted, fontSize: "0.85rem", marginTop: "0.3rem" }}>{activeTour?.title}</div>

          <div style={{ ...css.card, maxWidth: 300, margin: "1.5rem auto", border: `1.5px solid ${T.gold}44` }}>
            <div style={{ color: T.gold, fontWeight: 900, fontSize: "2.5rem" }}>{score}</div>
            <div style={{ color: T.textMuted, fontSize: "0.75rem", marginBottom: "1rem" }}>Tournament Score</div>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: T.text, fontWeight: 700, fontSize: "1.1rem" }}>{runResult.correct}/{runResult.total}</div>
                <div style={{ color: T.textDim, fontSize: "0.65rem" }}>Correct</div>
              </div>
              <div style={{ width: 1, background: T.border }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ color: T.text, fontWeight: 700, fontSize: "1.1rem" }}>{accuracy}%</div>
                <div style={{ color: T.textDim, fontSize: "0.65rem" }}>Accuracy</div>
              </div>
              <div style={{ width: 1, background: T.border }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ color: T.blue, fontWeight: 700, fontSize: "1.1rem" }}>+{runResult.timeBonusTotal}</div>
                <div style={{ color: T.textDim, fontSize: "0.65rem" }}>Speed Bonus</div>
              </div>
            </div>
          </div>

          {myBest && myBest.score >= score && (
            <div style={{ color: T.textMuted, fontSize: "0.78rem", marginBottom: "0.75rem" }}>
              Your current best: <span style={{ color: T.gold, fontWeight: 700 }}>{myBest.score}</span> — this run won't replace it.
            </div>
          )}

          {!submitted ? (
            <Btn onClick={handleSubmitScore} disabled={submitting} style={{ maxWidth: 260, margin: "0 auto" }}>
              {submitting ? "Submitting…" : "⚔ Submit to Leaderboard"}
            </Btn>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <div style={{ color: T.green, fontWeight: 700, fontSize: "0.9rem" }}>✅ Score submitted!</div>
              {leaderboard.length > 0 && (
                <button onClick={exportLeaderboardCSV} style={{ background: "none", border: `1px solid ${T.blue}55`, borderRadius: 8, padding: "0.35rem 0.85rem", color: T.blue, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}>
                  ⬇ Export Leaderboard CSV
                </button>
              )}
            </div>
          )}

          {error && <div style={{ color: T.red, fontSize: "0.75rem", margin: "0.5rem 0" }}>{error}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 260, margin: "1rem auto 0" }}>
            <Btn onClick={() => { setPhase("playing"); setRunResult(null); setSubmitted(false); }}>
              ↩ Play Again
            </Btn>
            <Btn variant="ghost" onClick={() => { setPhase("lobby"); setRunResult(null); setSubmitted(false); }}>
              📋 View Leaderboard
            </Btn>
            <Btn variant="ghost" onClick={() => { setActiveTour(null); setPhase("lobby"); setRunResult(null); setSubmitted(false); setTab("create"); }}>
              ➕ Create New Tournament
            </Btn>
          </div>
        </div>
      </div>
    );
  }

  // ── Main lobby ────────────────────────────────────────────────
  return (
    <div style={css.screen}>
      {/* Header */}
      <div style={{ padding: "1rem 1.25rem 0.75rem", display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: `1px solid ${T.border}` }}>
        <button onClick={onExit} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: "1.1rem" }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: T.text, fontWeight: 800, fontSize: "1rem" }}>⚔ Tournaments</div>
          <div style={{ color: T.textMuted, fontSize: "0.68rem" }}>Compete · Score · Rank up</div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, background: T.surface }}>
        {[
          { k: "browse", label: "Browse" },
          { k: "join",   label: "Join" },
          { k: "create", label: "Create" },
        ].map(t => (
          <button key={t.k} onClick={() => { setTab(t.k); setError(""); }} style={{
            flex: 1, padding: "0.65rem 0.5rem", border: "none", cursor: "pointer",
            fontFamily: "inherit", fontSize: "0.8rem", fontWeight: tab === t.k ? 800 : 500,
            background: "transparent",
            color: tab === t.k ? T.gold : T.textMuted,
            borderBottom: tab === t.k ? `2px solid ${T.gold}` : "2px solid transparent",
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: "1rem 1.25rem", overflowY: "auto" }}>
        {error && <div style={{ color: T.red, fontSize: "0.78rem", marginBottom: "0.75rem", padding: "0.5rem 0.75rem", background: "#2d0505", borderRadius: 8, border: `1px solid ${T.red}44` }}>{error}</div>}

        {/* ── BROWSE tab ─────────────────────────────────────── */}
        {tab === "browse" && (
          <div>
            {activeTour && (
              <TournamentLobbyCard
                tournament={activeTour}
                leaderboard={leaderboard}
                myBest={myBest}
                isLive={isLive}
                isEnded={isEnded}
                username={username}
                onPlay={() => setPhase("playing")}
                onRefresh={async () => {
                  const [lb, mb] = await Promise.all([getLeaderboard(activeTour.id), getMyBest(activeTour.id, username)]);
                  setLeaderboard(lb); setMyBest(mb);
                }}
                fmtTime={fmtTime}
                timeLeft={timeLeft}
              />
            )}
            {!activeTour && (
              <>
                <div style={{ color: T.textMuted, fontSize: "0.8rem", marginBottom: "0.75rem" }}>
                  {loading ? "Loading…" : browseList.length === 0 ? "No tournaments yet — create one!" : "Active & recent tournaments"}
                </div>
                {(() => {
                  const now = new Date();
                  const live    = browseList.filter(t => now >= new Date(t.starts_at) && now <= new Date(t.ends_at));
                  const ended   = browseList.filter(t => now > new Date(t.ends_at));
                  const renderCard = (t) => {
                    const isLiveCard = now >= new Date(t.starts_at) && now <= new Date(t.ends_at);
                    const isEndedCard = now > new Date(t.ends_at);
                    return (
                      <button key={t.id} onClick={() => handleJoin(t.code)} style={{
                        width: "100%", ...css.card, marginBottom: "0.5rem", textAlign: "left",
                        cursor: "pointer", fontFamily: "inherit",
                        border: `1px solid ${isLiveCard ? T.gold + "66" : T.border}`,
                        background: isLiveCard ? "linear-gradient(135deg,#0d1200,#1a1e00)" : T.surface,
                        opacity: isEndedCard ? 0.7 : 1,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <span style={{ fontSize: "1rem" }}>{isLiveCard ? "🟢" : isEndedCard ? "⬛" : "🕐"}</span>
                          <div style={{ color: isLiveCard ? T.gold : T.text, fontWeight: 700, fontSize: "0.85rem", flex: 1 }}>{t.title}</div>
                          <div style={{ color: isLiveCard ? T.gold : T.textDim, fontSize: "0.68rem", fontWeight: 700 }}>{isLiveCard ? timeLeft(t.ends_at) : isEndedCard ? "Ended" : "Soon"}</div>
                        </div>
                        <div style={{ color: T.textMuted, fontSize: "0.68rem" }}>
                          {TIER_META[t.tier]?.icon} {TIER_META[t.tier]?.label} · {t.tier_length}Q · <span style={{ color: T.blue, fontWeight: 700 }}>{t.code}</span>
                        </div>
                      </button>
                    );
                  };
                  return (
                    <>
                      {live.length > 0 && (
                        <>
                          <div style={{ color: T.green, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.4rem" }}>🟢 LIVE NOW</div>
                          {live.map(renderCard)}
                        </>
                      )}
                      {ended.length > 0 && (
                        <>
                          <div style={{ color: T.textDim, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", margin: `${live.length > 0 ? "0.85rem" : 0} 0 0.4rem` }}>⬛ ENDED</div>
                          {ended.map(renderCard)}
                        </>
                      )}
                      {live.length === 0 && ended.length === 0 && browseList.length > 0 && browseList.map(renderCard)}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* ── JOIN tab ───────────────────────────────────────── */}
        {tab === "join" && !activeTour && (
          <div>
            <div style={{ color: T.textMuted, fontSize: "0.8rem", marginBottom: "0.75rem" }}>Enter a tournament code to join</div>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="DAWN-XXXX"
                style={{
                  flex: 1, padding: "0.65rem 0.9rem", borderRadius: 10,
                  background: T.surface, border: `1.5px solid ${T.borderHigh}`,
                  color: T.text, fontFamily: "inherit", fontSize: "0.95rem",
                  fontWeight: 700, letterSpacing: "0.05em",
                  outline: "none",
                }}
              />
              <Btn onClick={() => handleJoin()} style={{ width: "auto", padding: "0 1.1rem" }} disabled={loading}>
                {loading ? "…" : "Join"}
              </Btn>
            </div>
          </div>
        )}

        {tab === "join" && activeTour && (
          <TournamentLobbyCard
            tournament={activeTour}
            leaderboard={leaderboard}
            myBest={myBest}
            isLive={isLive}
            isEnded={isEnded}
            username={username}
            onPlay={() => setPhase("playing")}
            onRefresh={async () => {
              const [lb, mb] = await Promise.all([getLeaderboard(activeTour.id), getMyBest(activeTour.id, username)]);
              setLeaderboard(lb); setMyBest(mb);
            }}
            fmtTime={fmtTime}
            timeLeft={timeLeft}
          />
        )}

        {/* ── CREATE tab ─────────────────────────────────────── */}
        {tab === "create" && !created && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <div style={{ color: T.textMuted, fontSize: "0.72rem", marginBottom: "0.3rem" }}>Tournament Title *</div>
              <input value={createTitle} onChange={e => setCreateTitle(e.target.value)}
                placeholder="e.g. Dawn Community Week 1"
                style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: 10, background: T.surface, border: `1.5px solid ${T.borderHigh}`, color: T.text, fontFamily: "inherit", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <div style={{ color: T.textMuted, fontSize: "0.72rem", marginBottom: "0.3rem" }}>Description (optional)</div>
              <input value={createDesc} onChange={e => setCreateDesc(e.target.value)}
                placeholder="e.g. Weekly community quiz challenge"
                style={{ width: "100%", padding: "0.65rem 0.9rem", borderRadius: 10, background: T.surface, border: `1.5px solid ${T.borderHigh}`, color: T.text, fontFamily: "inherit", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <div style={{ color: T.textMuted, fontSize: "0.72rem", marginBottom: "0.4rem" }}>Starting Tier</div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                {["beginner","intermediate","expert"].map(d => {
                  const tm = TIER_META[d];
                  return (
                    <button key={d} onClick={() => setCreateTier(d)} style={{
                      flex: 1, padding: "0.5rem 0.25rem", borderRadius: 10, fontFamily: "inherit", cursor: "pointer",
                      border: `1.5px solid ${createTier === d ? tm.color : T.borderHigh}`,
                      background: createTier === d ? tm.bg : T.surface,
                      color: createTier === d ? tm.color : T.textMuted,
                      fontSize: "0.78rem", fontWeight: createTier === d ? 800 : 500,
                    }}>{tm.icon} {tm.label}</button>
                  );
                })}
              </div>
            </div>
            <div>
              <div style={{ color: T.textMuted, fontSize: "0.72rem", marginBottom: "0.4rem" }}>Questions</div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                {[5, 10, 15, 20].map(n => (
                  <button key={n} onClick={() => setCreateLen(n)} style={{
                    flex: 1, padding: "0.5rem", borderRadius: 10, fontFamily: "inherit", cursor: "pointer",
                    border: `1.5px solid ${createLen === n ? T.gold : T.borderHigh}`,
                    background: createLen === n ? "#1c1200" : T.surface,
                    color: createLen === n ? T.gold : T.textMuted,
                    fontWeight: createLen === n ? 800 : 500,
                  }}>{n}Q</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ color: T.textMuted, fontSize: "0.72rem", marginBottom: "0.4rem" }}>Run Difficulty</div>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                {[{k:"relaxed",l:"🌿 Relaxed"},{k:"standard",l:"⚡ Standard"},{k:"pressure",l:"🔴 Pressure"}].map(d => (
                  <button key={d.k} onClick={() => setCreateDiff(d.k)} style={{
                    flex: 1, padding: "0.5rem 0.25rem", borderRadius: 10, fontFamily: "inherit", cursor: "pointer",
                    border: `1.5px solid ${createDiff === d.k ? T.blue : T.borderHigh}`,
                    background: createDiff === d.k ? "#0a1929" : T.surface,
                    color: createDiff === d.k ? T.blue : T.textMuted,
                    fontSize: "0.75rem", fontWeight: createDiff === d.k ? 800 : 500,
                  }}>{d.l}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ color: T.textMuted, fontSize: "0.72rem", marginBottom: "0.4rem" }}>Duration</div>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {[{v:0.083,l:"5m 🧪"},{v:6,l:"6h"},{v:12,l:"12h"},{v:24,l:"24h"},{v:48,l:"48h"},{v:72,l:"3 days"},{v:168,l:"1 week"}].map(d => (
                  <button key={d.v} onClick={() => setCreateHours(d.v)} style={{
                    padding: "0.5rem 0.6rem", borderRadius: 10, fontFamily: "inherit", cursor: "pointer",
                    border: `1.5px solid ${createHours === d.v ? (d.v === 0.083 ? T.green : T.purple) : T.borderHigh}`,
                    background: createHours === d.v ? (d.v === 0.083 ? "#071a07" : "#1a0e3a") : T.surface,
                    color: createHours === d.v ? (d.v === 0.083 ? T.green : "#c4b5fd") : T.textMuted,
                    fontSize: "0.78rem", fontWeight: createHours === d.v ? 800 : 500,
                  }}>{d.l}</button>
                ))}
              </div>
              {createHours === 0.083 && (
                <div style={{ marginTop: "0.4rem", color: T.green, fontSize: "0.67rem", fontStyle: "italic" }}>
                  🧪 Test mode — tournament expires in 5 minutes. Use for testing only.
                </div>
              )}
            </div>
            <Btn onClick={handleCreate} disabled={creating} style={{ marginTop: "0.25rem" }}>
              {creating ? "Creating…" : "⚔ Create Tournament"}
            </Btn>
          </div>
        )}

        {tab === "create" && created && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🎉</div>
            <div style={{ color: T.green, fontWeight: 900, fontSize: "1.2rem" }}>Tournament Created!</div>
            <div style={{ color: T.textMuted, fontSize: "0.85rem", marginTop: "0.3rem", marginBottom: "1.25rem" }}>{created.title}</div>
            <div style={{ ...css.card, marginBottom: "1rem" }}>
              <div style={{ color: T.textMuted, fontSize: "0.72rem", marginBottom: "0.3rem" }}>Tournament Code</div>
              <div style={{ color: T.gold, fontWeight: 900, fontSize: "2rem", letterSpacing: "0.08em" }}>{created.code}</div>
              <div style={{ color: T.textDim, fontSize: "0.68rem", marginTop: "0.3rem" }}>Share this code with players</div>
            </div>
            <ShareBtn
              text={`⚔ Join my DawnQuiz Tournament!

Code: ${created.code}
Link: ${buildTournamentUrl(created.code)}

${created.title}`}
              label="Share Tournament Link"
              style={{ marginBottom: "0.75rem" }}
            />
            <Btn onClick={() => { setCreated(null); setTab("browse"); setActiveTour(created); }} variant="ghost">
              View Lobby →
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tournament Lobby Card ──────────────────────────────────────
function TournamentLobbyCard({ tournament: t, leaderboard, myBest, isLive, isEnded, username, onPlay, onRefresh, fmtTime, timeLeft }) {
  const [refreshing, setRefreshing] = useState(false);
  const myRank = myBest ? leaderboard.findIndex(e => e.username === username) + 1 : null;

  async function doRefresh() {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }

  return (
    <div>
      {/* Tournament header */}
      <div style={{ ...css.card, marginBottom: "0.75rem", border: `1.5px solid ${isLive ? T.gold + "66" : T.border}`, background: isLive ? "linear-gradient(135deg,#1c1200,#2d1e00)" : T.surface }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.5rem" }}>{isLive ? "🟢" : isEnded ? "⬛" : "🕐"}</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: isLive ? T.gold : T.text, fontWeight: 800, fontSize: "0.95rem" }}>{t.title}</div>
            {t.description && <div style={{ color: T.textMuted, fontSize: "0.73rem", marginTop: "0.2rem" }}>{t.description}</div>}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
              <span style={{ ...css.tag(TIER_META[t.tier]?.color || T.textMuted) }}>{TIER_META[t.tier]?.icon} {TIER_META[t.tier]?.label}</span>
              <span style={{ ...css.tag(T.textMuted) }}>{t.tier_length}Q</span>
              <span style={{ ...css.tag(T.blue) }}>{t.code}</span>
              {isLive && <span style={{ ...css.tag(T.green) }}>{timeLeft(t.ends_at)}</span>}
              {isEnded && <span style={{ ...css.tag(T.red) }}>Ended {fmtTime(t.ends_at)}</span>}
            </div>
          </div>
        </div>
        {myBest && (
          <div style={{ marginTop: "0.75rem", padding: "0.5rem 0.75rem", background: T.surfaceHigh, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: T.textMuted, fontSize: "0.72rem" }}>Your best score</div>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <span style={{ color: T.gold, fontWeight: 800, fontSize: "1rem" }}>{myBest.score}</span>
              <span style={{ color: T.textMuted, fontSize: "0.7rem" }}>{myBest.accuracy}% · #{myRank || "?"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Play button */}
      {isLive && (
        <Btn onClick={onPlay} style={{ marginBottom: "1rem" }}>
          ⚔ {myBest ? "Play Again" : "Enter Tournament"}
        </Btn>
      )}

      {/* Leaderboard */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <div>
          <div style={{ color: T.text, fontWeight: 700, fontSize: "0.85rem" }}>🏆 Leaderboard</div>
          <div style={{ color: T.textDim, fontSize: "0.62rem" }}>Ranked by points · accuracy + speed bonus</div>
        </div>
        <button onClick={doRefresh} style={{ background: "none", border: "none", color: T.textMuted, fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" }}>
          {refreshing ? "…" : "↻ Refresh"}
        </button>
      </div>
      {leaderboard.length === 0 ? (
        <div style={{ color: T.textDim, fontSize: "0.78rem", textAlign: "center", padding: "1.5rem 0" }}>
          No entries yet — be the first!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {leaderboard.map((e, i) => {
            const isMe = e.username === username;
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            return (
              <div key={e.id} style={{
                display: "flex", alignItems: "center", gap: "0.6rem",
                padding: "0.5rem 0.75rem", borderRadius: 10,
                background: isMe ? "linear-gradient(135deg,#1c1200,#2d1e00)" : T.surface,
                border: `1px solid ${isMe ? T.gold + "66" : T.border}`,
              }}>
                <div style={{ color: medal ? T.gold : T.textDim, fontSize: "0.85rem", minWidth: "1.5rem", textAlign: "center", fontWeight: 700 }}>
                  {medal || `#${i + 1}`}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: isMe ? T.gold : T.text, fontWeight: isMe ? 800 : 500, fontSize: "0.82rem" }}>
                    {e.username}{isMe ? " (you)" : ""}
                  </div>
                  <div style={{ color: T.textDim, fontSize: "0.65rem" }}>{e.accuracy}% · {e.correct}/{e.total}</div>
                </div>
                <div style={{ color: isMe ? T.gold : T.text, fontWeight: 800, fontSize: "0.9rem" }}>{e.score}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tournament Run (uses seeded questions for everyone) ────────
function TournamentRun({ tournament: t, player, onComplete, onExit }) {
  const allCustomQs = [];  // tournaments use built-in questions only
  const numSeed = t.seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  // Build seeded pool ONCE — useState initializer runs only on mount.
  // If this were a plain const, every setState (timer tick, answer) would
  // re-run shuffleOptions, shifting q.correct and causing wrong-answer bugs.
  const [pool] = useState(() => {
    const all = [...BEGINNER_QS, ...INTERMEDIATE_QS, ...EXPERT_QS].map(normaliseDiff);
    const byDiff = seededShuffle(all.filter(q => q.diff === t.tier), numSeed);
    return byDiff.slice(0, t.tier_length).map(shuffleOptions);
  });

  const RUN_DIFFICULTIES_T = [
    { key: "relaxed",  secsPerQ: 45 },
    { key: "standard", secsPerQ: 30 },
    { key: "pressure", secsPerQ: 15 },
  ];
  const diffCfg   = RUN_DIFFICULTIES_T.find(d => d.key === t.difficulty) || RUN_DIFFICULTIES_T[1];
  const totalSecs = pool.length * diffCfg.secsPerQ;

  const [qi,           setQi]           = useState(0);
  const [selected,     setSelected]     = useState(null);
  const [answered,     setAnswered]     = useState(false);
  const [correct,      setCorrect]      = useState(0);
  const [timeBonusTotal, setTimeBonusTotal] = useState(0);
  const [runTimeLeft,  setRunTimeLeft]  = useState(totalSecs);
  const timerRef = useRef(null);
  const [timerKey] = useState(0);

  const q = pool[qi] || null;

  // Track whether timer warn has fired (only once per run)
  const warnFiredRef = useRef(false);

  useEffect(() => {
    // Play start fanfare on mount
    if (_sfxEnabled) SFX.tournamentStart();
    timerRef.current = setInterval(() => {
      setRunTimeLeft(t => {
        const newT = t <= 1 ? 0 : t - 1;
        // Fire timer warning once when crossing below 20% remaining
        if (!warnFiredRef.current && newT > 0 && newT / totalSecs < 0.2) {
          warnFiredRef.current = true;
          if (_sfxEnabled) SFX.tournamentTimerWarn();
        }
        if (newT === 0) clearInterval(timerRef.current);
        return newT;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Auto-end when timer runs out
  useEffect(() => {
    if (runTimeLeft === 0 && !answered) {
      clearInterval(timerRef.current);
      onComplete({ correct, total: pool.length, timeBonusTotal });
    }
  // eslint-disable-next-line
  }, [runTimeLeft]);

  function handleAnswer(i) {
    if (answered) return;
    const isCorrect = i === q.correct;
    const secsUsed  = totalSecs - runTimeLeft;
    const secsForQ  = diffCfg.secsPerQ;
    const timeLeft  = Math.max(0, secsForQ - (secsUsed % secsForQ));
    const bonus     = isCorrect ? Math.round((timeLeft / secsForQ) * 50) : 0;
    setSelected(i);
    setAnswered(true);
    if (isCorrect) {
      setCorrect(c => c + 1);
      setTimeBonusTotal(tb => tb + bonus);
      if (_sfxEnabled) SFX.tournamentCorrect();
    } else {
      if (_sfxEnabled) SFX.wrong();
    }
  }

  function handleNext() {
    if (qi + 1 >= pool.length) {
      clearInterval(timerRef.current);
      onComplete({ correct, total: pool.length, timeBonusTotal });
    } else {
      setQi(qi + 1);
      setSelected(null);
      setAnswered(false);
    }
  }

  if (!q) return null;

  const pct = totalSecs > 0 ? (runTimeLeft / totalSecs) * 100 : 0;
  const barColor = runTimeLeft > totalSecs * 0.33 ? T.green : runTimeLeft > totalSecs * 0.15 ? T.gold : T.red;
  const diffColor = q.diff === "beginner" ? T.green : q.diff === "intermediate" ? T.gold : T.red;

  return (
    <div style={css.screen}>
      {/* Header */}
      <div style={{ padding: "0.75rem 1.25rem 0.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onExit} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
        <span style={{ color: T.purple, fontSize: "0.72rem", fontWeight: 700, background: "#1a0e3a", border: `1px solid ${T.purple}44`, borderRadius: 6, padding: "2px 8px" }}>⚔ Tournament</span>
        <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 800, fontSize: "0.88rem", color: barColor }}>
          ⏱ {Math.floor(runTimeLeft / 60)}:{String(runTimeLeft % 60).padStart(2, "0")}
        </div>
      </div>
      <ProgressBar value={runTimeLeft} max={totalSecs} color={barColor} height={4} />

      {/* Question */}
      <div style={{ padding: "0.75rem 1.25rem 0.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
          <span style={{ ...css.tag(diffColor) }}>{q.diff.toUpperCase()}</span>
          <span style={{ color: T.textMuted, fontSize: "0.8rem" }}>Q{qi + 1} / {pool.length}</span>
        </div>
        <ProgressBar value={qi} max={pool.length} />
      </div>

      <div style={{ ...css.card, margin: "0 1.25rem 0.75rem", borderLeft: `3px solid ${diffColor}` }}>
        <p style={{ color: T.text, fontSize: "1rem", fontWeight: 600, lineHeight: 1.55, margin: 0 }}>{q.question}</p>
      </div>

      <div style={{ padding: "0 1.25rem", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
        {["A","B","C","D"].map((letter, i) => (
          <AnswerOption
            key={i} letter={letter} text={q.options[i]}
            state={answered ? (i === q.correct ? "correct" : i === selected ? "wrong" : null) : null}
            onClick={() => handleAnswer(i)}
            disabled={answered}
          />
        ))}
      </div>

      {answered && (
        <div style={{ padding: "1rem 1.25rem 0" }}>
          {selected !== q.correct && (
            <div style={{ padding: "0.45rem 0.75rem", background: "#1c0a0a", border: `1px solid ${T.red}44`, borderRadius: 10, marginBottom: "0.6rem" }}>
              <span style={{ color: T.red, fontSize: "0.78rem", fontWeight: 700 }}>✗ Wrong — no time bonus</span>
            </div>
          )}
          {selected === q.correct && (
            <div style={{ padding: "0.45rem 0.75rem", background: "#071a07", border: `1px solid ${T.green}44`, borderRadius: 10, marginBottom: "0.6rem" }}>
              <span style={{ color: T.green, fontSize: "0.78rem", fontWeight: 700 }}>✓ Correct</span>
            </div>
          )}
          <Btn onClick={handleNext}>
            {qi + 1 >= pool.length ? "See Results →" : "Next Question →"}
          </Btn>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  LEADERBOARD
// ─────────────────────────────────────────────────────────────

function Leaderboard({ player, onExit }) {
  const [tab, setTab] = useState("sunrays");

  const you = {
    name: formatUsername(player.username) || "You",
    sunrays: player.sunrays,
    rank: getRank(player.sunrays).name,
    perfectRuns: player.perfectRuns || 0,
    streak: player.currentStreak || 0,
    isYou: true,
  };
  const sorted = [you]; // Real leaderboard — no mock data
  const shareText = `🏆 I'm ranked on DawnQuiz! ${you.sunrays} ☀ as a ${you.rank}\nCan you beat me? Join DawnQuiz 🌅`;

  return (
    <div style={css.screen}>
      <div style={{ padding: "1.25rem" }}>
        <BackBtn onClick={onExit} />
        <div style={{ margin: "1.25rem 0 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <SectionTitle>Leaderboard</SectionTitle>
          <ShareBtn text={shareText} label="Share" style={{ width: "auto", padding: "0.5rem 1rem", fontSize: "0.78rem" }} />
        </div>

        {/* Coming soon notice */}
        <div style={{ background: "#0d0d1f", border: `1px solid ${T.purple}44`, borderRadius: 12, padding: "0.85rem 1rem", marginBottom: "1.25rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>🏆</span>
          <div>
            <div style={{ color: T.purple, fontWeight: 700, fontSize: "0.82rem", marginBottom: "0.2rem" }}>Global leaderboard coming soon</div>
            <div style={{ color: T.textMuted, fontSize: "0.75rem", lineHeight: 1.5 }}>Cross-player rankings will go live with the tournament update. For now, your stats are shown below.</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {[["sunrays", "☀ Sunrays"], ["perfect", "⭐ Perfect"], ["streak", "🔥 Streaks"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: "0.5rem", borderRadius: 8, border: `1px solid ${tab === k ? T.gold : T.borderHigh}`, background: tab === k ? "#1c1200" : T.surface, color: tab === k ? T.gold : T.textMuted, cursor: "pointer", fontSize: "0.72rem", fontWeight: tab === k ? 700 : 400, fontFamily: "inherit" }}>{l}</button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {sorted.map((p, i) => {
            const r = RANKS.find(x => x.name === p.rank) || RANKS[0];
            return (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#001a0e", border: `1px solid ${T.green}88`, borderRadius: 12, padding: "0.85rem 1rem" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.green + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 900, color: T.green, flexShrink: 0 }}>—</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: T.green, fontWeight: 600, fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {p.name}
                    <span style={{ background: T.green + "22", color: T.green, fontSize: "0.62rem", fontWeight: 800, padding: "1px 6px", borderRadius: 6, letterSpacing: "0.05em" }}>YOU</span>
                  </div>
                  <div style={{ color: r.accent, fontSize: "0.7rem" }}>{p.rank}</div>
                </div>
                <div style={{ color: T.gold, fontWeight: 700, fontSize: "0.9rem" }}>
                  {tab === "sunrays" ? `${p.sunrays} ☀` : tab === "perfect" ? `${p.perfectRuns} ⭐` : `${p.streak} 🔥`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  PROFILE
// ─────────────────────────────────────────────────────────────

function Profile({ player, dispatch, onExit }) {
  const rank = getRank(player.sunrays);
  const next = getNextRank(player.sunrays);
  const prog = next ? ((player.sunrays - rank.threshold) / (next.threshold - rank.threshold)) * 100 : 100;
  const acc = player.questionsAnswered > 0 ? Math.round((player.correctAnswers / player.questionsAnswered) * 100) : 0;
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(player.username || "");
  const mult = player.streakMultiplier || 1;
  const lastNP = player.lastNodeProfile
    ? (NODE_PROFILES.find(p => p.id === player.lastNodeProfile.id) || player.lastNodeProfile)
    : null;

  function saveName() {
    const n = nameInput.trim();
    if (n.length >= 2 && n.length <= 20) {
      dispatch({ type: "SET_USERNAME", username: n });
      setEditingName(false);
    }
  }

  return (
    <div style={css.screen}>
      <div style={{ padding: "1.25rem" }}>
        <BackBtn onClick={onExit} />

        <div style={{ textAlign: "center", margin: "1.5rem 0 1.25rem" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle,${rank.color}33,${T.surface})`, border: `2px solid ${rank.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", margin: "0 auto 0.75rem" }}>{rank.icon}</div>
          {editingName ? (
            <div style={{ display: "flex", gap: "0.4rem", maxWidth: 220, margin: "0 auto 0.4rem" }}>
              <input value={nameInput} onChange={e => setNameInput(e.target.value)} maxLength={20}
                onKeyDown={e => e.key === "Enter" && saveName()}
                style={{ flex: 1, background: T.surface, border: `1px solid ${T.borderHigh}`, borderRadius: 8, padding: "0.4rem 0.6rem", color: T.text, fontFamily: "inherit", fontSize: "0.88rem" }} autoFocus />
              <button onClick={saveName} style={{ background: T.green, border: "none", borderRadius: 8, padding: "0 0.75rem", color: "#000", fontWeight: 700, fontSize: "0.8rem" }}>✓</button>
              <button onClick={() => setEditingName(false)} style={{ background: T.border, border: "none", borderRadius: 8, padding: "0 0.75rem", color: T.textMuted, fontSize: "0.8rem" }}>✕</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
              <span style={{ color: T.text, fontWeight: 800, fontSize: "1.1rem" }}>{player.username || "Anonymous"}</span>
              <button onClick={() => setEditingName(true)} style={{ background: "none", border: "none", color: T.textMuted, fontSize: "0.75rem", padding: "2px 4px" }}>✏️</button>
            </div>
          )}
          <div style={{ color: rank.accent, fontWeight: 800, fontSize: "1.3rem" }}>{rank.name}</div>
          <div style={{ color: T.textMuted, fontSize: "0.8rem" }}>Level {rank.level}</div>
          {mult > 1 && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", background: "#1c0a00", border: "1px solid #f9741644", borderRadius: 20, padding: "0.25rem 0.75rem", marginTop: "0.5rem" }}>
              <span>🔥</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
                <span style={{ color: "#f97316", fontWeight: 700, fontSize: "0.75rem" }}>{mult}× Streak Multiplier · Day {player.currentStreak}</span>
                {(player.streakFreezes || 0) > 0 && (
                  <span style={{ color: "#60a5fa", fontSize: "0.7rem", fontWeight: 700, background: "#0a1929", border: "1px solid #60a5fa44", borderRadius: 6, padding: "1px 7px" }}>
                    🧊 {player.streakFreezes} freeze{player.streakFreezes !== 1 ? "s" : ""} banked
                  </span>
                )}
                {player.streakAtRisk && (
                  <span style={{ color: "#fbbf24", fontSize: "0.7rem", fontWeight: 700, background: "#1c1200", border: "1px solid #fbbf2444", borderRadius: 6, padding: "1px 7px" }}>
                    ⚠ Streak at risk — play today!
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
          {[
            { label: "Sunrays", value: player.sunrays, icon: "☀", color: T.gold },
            { label: "Accuracy", value: `${acc}%`, icon: "🎯", color: T.green },
            { label: "Total Runs", value: player.totalRuns, icon: "🎮", color: T.blue },
            { label: "Streak", value: `${player.currentStreak}d`, icon: "🔥", color: "#f97316" },
            { label: "Perfect Runs", value: player.perfectRuns, icon: "⭐", color: T.gold },
            { label: "Questions", value: player.questionsAnswered, icon: "❓", color: T.purple },
          ].map(s => (
            <div key={s.label} style={{ ...css.card, textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem" }}>{s.icon}</div>
              <div style={{ color: s.color, fontWeight: 800, fontSize: "1.4rem" }}>{s.value}</div>
              <div style={{ color: T.textMuted, fontSize: "0.7rem" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {next && (
          <div style={{ ...css.card, marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <span style={{ color: T.textMuted, fontSize: "0.8rem" }}>→ {next.name}</span>
              <span style={{ color: T.gold, fontSize: "0.8rem" }}>{player.sunrays}/{next.threshold} ☀</span>
            </div>
            <ProgressBar value={player.sunrays - rank.threshold} max={next.threshold - rank.threshold} />
          </div>
        )}

        {/* Last Node Profile */}
        {lastNP && (
          <div style={{ ...css.card, marginBottom: "1.25rem", border: `1px solid ${lastNP.color}44`, background: `${lastNP.color}08` }}>
            <div style={{ color: T.textDim, fontSize: "0.68rem", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>LAST NODE PROFILE</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${lastNP.color}22`, border: `1px solid ${lastNP.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>{lastNP.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: lastNP.color, fontWeight: 800, fontSize: "0.92rem" }}>{lastNP.type}</div>
                <div style={{ color: T.textMuted, fontSize: "0.72rem", marginTop: "0.1rem", fontStyle: "italic" }}>"{lastNP.tagline}"</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.65rem" }}>
              <div style={{ background: "#011c11", border: `1px solid ${T.green}33`, borderRadius: 8, padding: "0.4rem 0.65rem" }}>
                <div style={{ color: T.textDim, fontSize: "0.58rem", letterSpacing: "0.08em" }}>STRENGTH</div>
                <div style={{ color: T.green, fontWeight: 700, fontSize: "0.75rem", marginTop: "0.1rem" }}>↑ {lastNP.strength}</div>
              </div>
              <div style={{ background: "#1c0a0a", border: `1px solid ${T.red}33`, borderRadius: 8, padding: "0.4rem 0.65rem" }}>
                <div style={{ color: T.textDim, fontSize: "0.58rem", letterSpacing: "0.08em" }}>WEAKNESS</div>
                <div style={{ color: T.red, fontWeight: 700, fontSize: "0.75rem", marginTop: "0.1rem" }}>↓ {lastNP.weakness}</div>
              </div>
            </div>
          </div>
        )}

        {/* Special modes */}
        {(player.blackboxUnlocked || player.deployerUnlocked) && (
          <div style={{ ...css.card, marginBottom: "1.25rem", border: `1px solid ${T.purple}44` }}>
            <div style={{ color: T.textMuted, fontSize: "0.72rem", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>SPECIAL MODES</div>
            {player.blackboxUnlocked && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.5rem" }}>
                <span style={{ color: "#c4b5fd" }}>◼ BlackBox Challenge</span>
                <span style={{ color: player.blackboxPassed ? T.green : T.gold }}>{player.blackboxPassed ? "✓ Passed" : "Unlocked"}</span>
              </div>
            )}
            {player.deployerUnlocked && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                <span style={{ color: T.gold }}>☀ Deployer Final Run</span>
                <span style={{ color: player.deployerCompleted ? T.green : T.gold }}>{player.deployerCompleted ? "✓ Completed" : "Unlocked"}</span>
              </div>
            )}
          </div>
        )}

        {/* Rank ladder */}
        <div style={{ color: T.textMuted, fontSize: "0.72rem", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>RANK LADDER</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {RANKS.map(r => (
            <div key={r.level} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.85rem", background: r.level === rank.level ? "#1c1200" : T.surface, borderRadius: 8, border: `1px solid ${r.level === rank.level ? T.gold + "55" : "transparent"}` }}>
              <span style={{ color: r.accent, fontSize: "1rem", width: 20 }}>{r.icon}</span>
              <span style={{ flex: 1, color: player.sunrays >= r.threshold ? T.text : T.textDim, fontSize: "0.8rem" }}>{r.name}</span>
              <span style={{ color: T.textMuted, fontSize: "0.7rem" }}>{r.threshold}☀</span>
              {player.sunrays >= r.threshold && <span style={{ color: T.green, fontSize: "0.68rem" }}>✓</span>}
            </div>
          ))}
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <Btn variant="danger" onClick={() => dispatch({ type: "RESET_PROGRESS" })}>
            Reset Progress
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  DAILY QUESTION
// ─────────────────────────────────────────────────────────────

function DailyQuestion({ player, dispatch, audio, onExit }) {
  const DAILY_SECS = 30;

  const allQs = [
    ...BEGINNER_QS, ...INTERMEDIATE_QS, ...EXPERT_QS,
    ...player.customQuestions.map(normaliseDiff),
  ].filter((q, i, arr) => arr.findIndex(x => x.id === q.id) === i);

  const dayIndex = Math.floor(Date.now() / 86400000);
  const todayStr = new Date().toDateString();
  const alreadyDone = (player.dailyHistory || []).includes(todayStr);

  // Stable question — memoized per day so re-renders never re-shuffle options
  const dq = useMemo(() => {
    if (!allQs.length) return null;
    const shuffled = seededShuffle(allQs, 0xDA1A);
    const bank = shuffled.slice(0, Math.min(100, shuffled.length));
    const pool = seededShuffle(bank, dayIndex * 31337);
    return shuffleOptions(pool[dayIndex % pool.length]);
  }, [dayIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const bonus = player.currentStreak >= 30 ? 5 : player.currentStreak >= 7 ? 2 : player.currentStreak >= 3 ? 1 : 0;

  const [sel,      setSel]      = useState(null);
  const [answered, setAnswered] = useState(false);
  const [timeUp,   setTimeUp]   = useState(false);

  // 30s countdown — fires only when question is unanswered and not already done today
  const timerActive = !answered && !alreadyDone;
  const onExpire = useCallback(() => {
    if (!answered) { setAnswered(true); setTimeUp(true); audio?.play("wrong"); }
  }, [answered, audio]);
  const dailyTimeLeft = useCountdown(DAILY_SECS, timerActive, onExpire);

  // Next-day countdown — seconds until next midnight (local)
  const [nextDaySecs, setNextDaySecs] = useState(() => {
    const now = Date.now();
    return Math.max(0, Math.floor(((Math.floor(now / 86400000) + 1) * 86400000 - now) / 1000));
  });
  useEffect(() => {
    if (!alreadyDone && !answered) return;
    const id = setInterval(() => {
      const now = Date.now();
      setNextDaySecs(Math.max(0, Math.floor(((Math.floor(now / 86400000) + 1) * 86400000 - now) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [alreadyDone, answered]);

  function fmtCountdown(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }

  function handleAnswer(i) {
    if (answered || alreadyDone) return;
    setSel(i);
    setAnswered(true);
    if (i === dq.correct) {
      audio?.play("correct");
      dispatch({ type: "EARN_SUNRAYS", amount: 1 + bonus });
      dispatch({ type: "UPDATE_STREAK" });
      dispatch({ type: "DAILY_DONE" });
    } else {
      audio?.play("wrong");
    }
  }

  // Streak calendar data
  const todayMs = Math.floor(Date.now() / 86400000) * 86400000;
  const history = new Set(player.dailyHistory || []);
  const calDays = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(todayMs - (34 - i) * 86400000);
    const ds = d.toDateString();
    return { ds, done: history.has(ds), isToday: i === 34 };
  });

  const StreakCalendar = () => (
    <div style={{ ...css.card, marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
        <span style={{ color: T.textDim, fontSize: "0.68rem", letterSpacing: "0.1em" }}>ACTIVITY — LAST 35 DAYS</span>
        <span style={{ color: "#f97316", fontWeight: 700, fontSize: "0.75rem" }}>🔥 {player.currentStreak}d streak</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
        {calDays.map((d, i) => (
          <div key={i} title={d.ds} style={{
            aspectRatio: "1", borderRadius: 3,
            background: d.done ? T.gold : d.isToday ? T.borderHigh : T.surface,
            border: d.isToday ? `1px solid ${T.borderHigh}` : "none",
            opacity: d.done ? 1 : 0.5,
            boxShadow: d.done ? `0 0 4px ${T.gold}55` : "none",
          }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: T.gold }} />
          <span style={{ color: T.textDim, fontSize: "0.65rem" }}>Completed</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: T.surface, border: `1px solid ${T.borderHigh}` }} />
          <span style={{ color: T.textDim, fontSize: "0.65rem" }}>Today</span>
        </div>
      </div>
    </div>
  );

  // ── Guard: no questions ───────────────────────────────────────
  if (!allQs.length || !dq) return (
    <div style={css.screen}>
      <div style={{ padding: "1.25rem" }}>
        <BackBtn onClick={onExit} />
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: T.textDim }}>No questions available.</div>
      </div>
    </div>
  );

  // ── Already answered today — locked screen with next-day countdown ──
  if (alreadyDone) {
    return (
      <div style={css.screen}>
        <div style={{ padding: "1.25rem" }}>
          <BackBtn onClick={onExit} />
          <div style={{ textAlign: "center", margin: "1.25rem 0" }}>
            <div style={{ fontSize: "2rem" }}>🌅</div>
            <SectionTitle sub={"Day " + player.currentStreak + " streak 🔥"}>Daily Question</SectionTitle>
          </div>
          <StreakCalendar />
          <div style={{ ...css.card, textAlign: "center", padding: "2rem 1rem", border: `1.5px solid ${T.gold}44`, background: "linear-gradient(135deg,#0d0e1a,#111200)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</div>
            <div style={{ color: T.gold, fontWeight: 900, fontSize: "1.1rem", marginBottom: "0.35rem" }}>Completed today!</div>
            <div style={{ color: T.textMuted, fontSize: "0.8rem", marginBottom: "1.5rem" }}>Come back tomorrow for a new question.</div>
            <div style={{ color: T.textDim, fontSize: "0.68rem", marginBottom: "0.3rem" }}>Next question in</div>
            <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 900, fontSize: "2.2rem", color: T.text, letterSpacing: "0.05em" }}>
              {fmtCountdown(nextDaySecs)}
            </div>
            <div style={{ color: T.textDim, fontSize: "0.6rem", marginTop: "0.2rem", letterSpacing: "0.15em" }}>HH : MM : SS</div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <Btn variant="ghost" onClick={onExit}>← Back to Home</Btn>
          </div>
        </div>
      </div>
    );
  }

  // ── Active question ───────────────────────────────────────────
  const correct = !timeUp && sel === dq.correct;

  const shareText = correct
    ? `🌅 I got today's Dawn daily question!

"${dq.question}"

✓ Correct! +${1 + bonus} ☀
I'm a ${getRank(player.sunrays).name} with ${player.sunrays} Sunrays

Can you get it right? → ${APP_URL}`
    : `🌅 Today's Dawn daily question got me!

"${dq.question}"

${timeUp ? "⏱ Time ran out!" : "✗ I got it wrong"} · I'm a ${getRank(player.sunrays).name} · ${player.sunrays} ☀

Can you do better? → ${APP_URL}`;

  return (
    <div style={css.screen}>
      <div style={{ padding: "1.25rem" }}>
        <BackBtn onClick={onExit} />
        <div style={{ textAlign: "center", margin: "1.25rem 0" }}>
          <div style={{ fontSize: "2rem" }}>🌅</div>
          <SectionTitle sub={"+1 ☀ · Day " + player.currentStreak + " streak" + (bonus > 0 ? " (+" + bonus + " bonus!)" : "")}>Daily Question</SectionTitle>
        </div>

        <StreakCalendar />

        {/* 30s countdown bar — always visible, freezes when answered */}
        <div style={{ marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "0.3rem" }}>
            <span style={{ color: T.textMuted }}>⏱ {answered ? "Time used" : "Time remaining"}</span>
            <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums",
              color: answered ? T.textMuted : dailyTimeLeft > 10 ? T.green : dailyTimeLeft > 5 ? T.gold : T.red }}>
              {answered ? "—" : `${dailyTimeLeft}s`}
            </span>
          </div>
          <ProgressBar
            value={answered ? 0 : dailyTimeLeft}
            max={DAILY_SECS}
            color={answered ? T.border : dailyTimeLeft > 10 ? T.green : dailyTimeLeft > 5 ? T.gold : T.red}
            height={4}
          />
        </div>

        {/* Question card */}
        <div style={{ ...css.card, marginBottom: "1rem", fontWeight: 600, fontSize: "0.95rem", lineHeight: 1.55, borderLeft: `3px solid ${T.gold}` }}>
          {dq.question}
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {dq.options.map((opt, i) => (
            <AnswerOption key={i} letter={["A","B","C","D"][i]} text={opt}
              state={answered ? (i === dq.correct ? "correct" : i === sel ? "wrong" : null) : sel === i ? "selected" : null}
              disabled={answered} onClick={() => handleAnswer(i)} />
          ))}
        </div>

        {/* Result + explanation */}
        {answered && (
          <div style={{ marginTop: "0.75rem", borderRadius: 12, overflow: "hidden", fontSize: "0.82rem", lineHeight: 1.6 }}>
            <div style={{ padding: "0.5rem 1rem", background: correct ? "#022b14" : "#2b0808", borderBottom: `1px solid ${correct ? T.green + "33" : T.red + "33"}`, color: correct ? T.green : T.red, fontWeight: 700 }}>
              {timeUp
                ? `⏱ Time's up! — correct answer: ${dq.options[dq.correct]}`
                : correct
                  ? `✓ Correct! +${1 + bonus} ☀`
                  : `✗ Wrong — correct answer: ${dq.options[dq.correct]}`}
            </div>
            <div style={{ padding: "0.75rem 1rem", background: correct ? "#011a0d" : "#180404", color: correct ? "#a7f3d0" : T.textMuted, border: `1px solid ${correct ? T.green + "22" : T.red + "22"}`, borderTop: "none" }}>
              {dq.explanation}
            </div>
          </div>
        )}

        {/* Next-day countdown after answering */}
        {answered && (
          <div style={{ ...css.card, marginTop: "0.85rem", textAlign: "center", padding: "0.75rem", background: "linear-gradient(135deg,#0d0e1a,#111200)" }}>
            <div style={{ color: T.textDim, fontSize: "0.68rem", marginBottom: "0.2rem" }}>Next question in</div>
            <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 900, fontSize: "1.5rem", color: T.text, letterSpacing: "0.04em" }}>
              {fmtCountdown(nextDaySecs)}
            </div>
          </div>
        )}

        {/* Share + back */}
        {answered && (
          <div style={{ marginTop: "0.85rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            <ShareBtn text={shareText} label="Share" />
            <Btn onClick={onExit}>← Back to Home</Btn>
          </div>
        )}
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────
//  HOME SCREEN
// ─────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
//  FEEDBACK SCREEN
// ─────────────────────────────────────────────────────────────
const FEEDBACK_TYPES = [
  { id: "bug",     icon: "🐛", label: "Report a bug",         desc: "Something is broken or not working as expected" },
  { id: "feature", icon: "💡", label: "Suggest a feature",    desc: "An idea that would improve the experience" },
  { id: "opinion", icon: "💬", label: "Share an opinion",     desc: "General thoughts or community feedback" },
  { id: "content", icon: "📝", label: "Question / content",   desc: "Wrong answer, misleading question, outdated info" },
];

function FeedbackScreen({ player, onExit }) {
  const [feedbacks, setFeedbacks] = useLocalStorage("dawn_feedback", []);
  const [type, setType] = useState(null);
  const [text, setText] = useState("");
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (!type || !text.trim()) return;
    const entry = {
      id: Date.now().toString(36),
      type,
      text: text.trim(),
      contact: contact.trim() || null,
      username: player.username || null,
      rank: getRank(player.sunrays).name,
      sunrays: player.sunrays,
      ts: new Date().toISOString(),
    };
    setFeedbacks(prev => [entry, ...(prev || [])]);
    setSubmitted(true);
  }

  if (submitted) return (
    <div style={css.screen}>
      <div style={{ padding: "1.25rem" }}>
        <BackBtn onClick={onExit} />
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
          <div style={{ color: T.text, fontWeight: 800, fontSize: "1.2rem", marginBottom: "0.5rem" }}>Thanks for the feedback!</div>
          <div style={{ color: T.textMuted, fontSize: "0.85rem", lineHeight: 1.6 }}>Your submission has been saved locally and can be reviewed by admins in the Admin Panel.</div>
          <div style={{ marginTop: "1.5rem" }}>
            <Btn onClick={onExit}>← Back to Home</Btn>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={css.screen}>
      <div style={{ padding: "1.25rem" }}>
        <BackBtn onClick={onExit} />
        <div style={{ margin: "1.25rem 0 1rem" }}>
          <SectionTitle sub="Help us improve — all feedback is read">Report · Suggest · Opine</SectionTitle>
        </div>

        {/* Type selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {FEEDBACK_TYPES.map(ft => (
            <button key={ft.id} onClick={() => setType(ft.id)} style={{ display: "flex", alignItems: "center", gap: "0.85rem", padding: "0.75rem 1rem", background: type === ft.id ? `${T.gold}11` : T.surface, border: `1.5px solid ${type === ft.id ? T.gold : T.border}`, borderRadius: 12, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.15s" }}>
              <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{ft.icon}</span>
              <div>
                <div style={{ color: type === ft.id ? T.gold : T.text, fontWeight: 700, fontSize: "0.85rem" }}>{ft.label}</div>
                <div style={{ color: T.textMuted, fontSize: "0.72rem", marginTop: "0.1rem" }}>{ft.desc}</div>
              </div>
              {type === ft.id && <span style={{ marginLeft: "auto", color: T.gold, fontSize: "1rem" }}>✓</span>}
            </button>
          ))}
        </div>

        {/* Message */}
        <div style={{ marginBottom: "0.85rem" }}>
          <div style={{ color: T.textMuted, fontSize: "0.72rem", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>YOUR MESSAGE {!text.trim() && type && <span style={{ color: T.red }}>*</span>}</div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={
              type === "bug"     ? "Describe what happened and how to reproduce it..." :
              type === "feature" ? "What would you like to see? How would it work?" :
              type === "opinion" ? "What do you think about the quiz, content or experience?" :
              type === "content" ? "Which question has an issue, and what is wrong with it?" :
              "Select a category above, then describe your feedback here..."
            }
            maxLength={1000}
            rows={5}
            style={{ width: "100%", boxSizing: "border-box", background: T.surface, border: `1px solid ${T.borderHigh}`, borderRadius: 10, padding: "0.65rem 0.85rem", color: T.text, fontFamily: "inherit", fontSize: "0.85rem", lineHeight: 1.6, resize: "vertical" }}
          />
          <div style={{ color: T.textDim, fontSize: "0.65rem", textAlign: "right", marginTop: "0.2rem" }}>{text.length}/1000</div>
        </div>

        {/* Optional contact */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ color: T.textMuted, fontSize: "0.72rem", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>CONTACT (optional — Discord / X / email)</div>
          <input
            value={contact}
            onChange={e => setContact(e.target.value)}
            placeholder="e.g. @yourhandle — only if you want a reply"
            maxLength={80}
            style={{ width: "100%", boxSizing: "border-box", background: T.surface, border: `1px solid ${T.borderHigh}`, borderRadius: 10, padding: "0.6rem 0.85rem", color: T.text, fontFamily: "inherit", fontSize: "0.85rem" }}
          />
        </div>

        <Btn onClick={handleSubmit} disabled={!type || !text.trim()} style={{ opacity: (!type || !text.trim()) ? 0.45 : 1 }}>
          Submit Feedback
        </Btn>

        {/* Disclaimer */}
        <div style={{ marginTop: "1.5rem", padding: "0.75rem 0.9rem", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: "0.68rem", color: T.textDim, lineHeight: 1.65 }}>
          <span style={{ color: T.textMuted, fontWeight: 700 }}>Note:</span> Feedback is stored locally on this device and accessible to admins via the Admin Panel. This is a community project with no official affiliation to Dawn Internet.
        </div>
      </div>
    </div>
  );
}

function Home({ player, onNav, onAdminClick, navLabels, setNavLabels, announcements = [], onShowWelcome }) {
  const rank = getRank(player.sunrays);
  const next = getNextRank(player.sunrays);
  const prog = next ? ((player.sunrays - rank.threshold) / (next.threshold - rank.threshold)) * 100 : 100;

  const navItems = [
    { k: "game",        i: "🎯", label: navLabels.game?.label        || NAV_DEFAULTS.game.label,        sub: navLabels.game?.sub        || NAV_DEFAULTS.game.sub,        hi: true },

    { k: "learn",       i: "📚", label: navLabels.learn?.label       || NAV_DEFAULTS.learn.label,       sub: navLabels.learn?.sub       || NAV_DEFAULTS.learn.sub },
    { k: "study",       i: "📖", label: navLabels.study?.label       || NAV_DEFAULTS.study.label,       sub: navLabels.study?.sub       || NAV_DEFAULTS.study.sub },
    { k: "archive",     i: "📋", label: navLabels.archive?.label     || NAV_DEFAULTS.archive.label,     sub: navLabels.archive?.sub     || NAV_DEFAULTS.archive.sub },
    { k: "leaderboard", i: "🏆", label: navLabels.leaderboard?.label || NAV_DEFAULTS.leaderboard.label, sub: navLabels.leaderboard?.sub || NAV_DEFAULTS.leaderboard.sub },
    { k: "profile",     i: "👤", label: navLabels.profile?.label     || NAV_DEFAULTS.profile.label,     sub: navLabels.profile?.sub     || NAV_DEFAULTS.profile.sub },
    { k: "tournament", i: "⚔", label: "Tournaments", sub: "Compete · Leaderboard · Win", accent: "#8b5cf6" },
  ];

  // Progress towards special mode unlocks
  const bbProgress = Math.min(100, Math.round((player.sunrays / 160) * 100));
  const dpProgress = Math.min(100, Math.round((player.sunrays / 200) * 100));

  return (
    <div style={css.screen}>
      {/* ── Hero header ── */}
      <div style={{
        background: `radial-gradient(ellipse at 50% 130%, #f97316 0%, #fbbf2444 30%, transparent 65%), linear-gradient(180deg, #050810 0%, #0d0e1e 30%, #1a0d02 60%, #2d1800 85%, #3d2000 100%)`,
        padding: "1.75rem 1.5rem 1.5rem", textAlign: "center",
        borderBottom: `1px solid #f9731622`, position: "relative",
      }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "1rem", position: "relative" }}>
          <DawnLogo height={26} />
          {onShowWelcome && (
            <button onClick={onShowWelcome} title="View welcome guide" style={{ position: "absolute", right: 0, background: "none", border: `1px solid #f9731633`, borderRadius: 20, padding: "0.2rem 0.55rem", color: "#f97316aa", fontSize: "0.68rem", cursor: "pointer", fontFamily: "inherit" }}>
              About
            </button>
          )}
        </div>
        {player.username && (
          <div style={{ color: T.textMuted, fontSize: "0.72rem", marginBottom: "0.5rem" }}>
            Welcome back, <span style={{ color: T.text, fontWeight: 700 }}>{formatUsername(player.username)}</span> 👋
          </div>
        )}
        <SunIcon size={60} glow />
        <div style={{ color: T.gold, fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.26em", marginTop: "0.75rem" }}>DAWNQUIZ</div>

        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center" }}>
          <RankBadge rank={rank} size="md" />
        </div>

        <div style={{ marginTop: "1rem", maxWidth: 240, margin: "1rem auto 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.67rem", color: T.textMuted, marginBottom: "0.3rem" }}>
            <span>{player.sunrays} ☀</span>
            {next && <span>{next.threshold} ☀</span>}
          </div>
          <ProgressBar value={player.sunrays - rank.threshold} max={next ? next.threshold - rank.threshold : 1} />
          {next && <div style={{ color: T.textDim, fontSize: "0.62rem", marginTop: "0.3rem", textAlign: "center" }}>→ {next.name}</div>}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "1rem" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: T.gold, fontWeight: 800, fontSize: "1.25rem" }}>{player.sunrays}</div>
            <div style={{ color: T.textMuted, fontSize: "0.6rem" }}>SUNRAYS</div>
          </div>
          <div style={{ width: 1, background: T.border }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#f97316", fontWeight: 800, fontSize: "1.25rem" }}>{player.currentStreak}</div>
            <div style={{ color: T.textMuted, fontSize: "0.6rem" }}>DAY STREAK</div>
          </div>
          <div style={{ width: 1, background: T.border }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ color: T.text, fontWeight: 800, fontSize: "1.25rem" }}>{player.perfectRuns}</div>
            <div style={{ color: T.textMuted, fontSize: "0.6rem" }}>PERFECT RUNS</div>
          </div>
        </div>

        {/* Streak multiplier banner */}
        {(player.streakMultiplier || 1) > 1 && (
          <div style={{ margin: "1rem auto 0", maxWidth: 260, background: "linear-gradient(135deg, #1c0a00, #2a1200)", border: "1px solid #f9741655", borderRadius: 12, padding: "0.6rem 1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.1rem" }}>🔥</span>
            <span style={{ color: "#f97316", fontWeight: 800, fontSize: "0.88rem" }}>{player.streakMultiplier}× Streak Multiplier Active!</span>
          </div>
        )}

      </div>{/* end hero header */}

      {/* ── Daily question banner ── */}
      <div style={{ padding: "1rem 1.25rem 0" }}>
        <button onClick={() => onNav("daily")} style={{ width: "100%", background: "linear-gradient(135deg,#1c0d00,#2d1500)", border: `1px solid #f97316`, borderRadius: 14, padding: "0.9rem 1.1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem", textAlign: "left", fontFamily: "inherit" }}>
          <span style={{ fontSize: "1.8rem" }}>🌅</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#f97316", fontWeight: 700, fontSize: "0.88rem" }}>Daily Question</div>
            <div style={{ color: T.textMuted, fontSize: "0.73rem" }}>+1 ☀ · Streak: {player.currentStreak} days 🔥</div>
          </div>
          <span style={{ color: "#f97316", fontSize: "1.1rem" }}>→</span>
        </button>
      </div>

      {/* ── Announcements ── */}
      {announcements.length > 0 && (
        <div style={{ padding: "0.75rem 1.25rem 0" }}>
          {announcements.map(a => (
            <div key={a.id} style={{
              display: "flex", alignItems: "flex-start", gap: "0.65rem",
              background: "linear-gradient(135deg,#0d1f10,#091a0d)",
              border: `1px solid ${T.green}44`, borderRadius: 12,
              padding: "0.75rem 1rem", marginBottom: "0.5rem",
            }}>
              <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>📢</span>
              <div style={{ color: T.text, fontSize: "0.8rem", lineHeight: 1.55 }}>{a.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Nav grid ── */}
      <div style={{ padding: "0.75rem 1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {navItems.map(btn => (
          <button key={btn.k} onClick={() => onNav(btn.k)} style={{
            background: btn.hi ? "linear-gradient(135deg,#1c1200,#2d1e00)" : btn.accent ? "linear-gradient(135deg,#1c0800,#2a1000)" : T.surface,
            border: `1px solid ${btn.hi ? T.gold + "88" : btn.accent ? btn.accent + "66" : T.border}`,
            borderRadius: 14, padding: "1rem", cursor: "pointer", textAlign: "left",
            display: "flex", flexDirection: "column", gap: "0.5rem",
            boxShadow: btn.hi ? `0 0 20px ${T.gold}22` : btn.accent ? `0 0 16px ${btn.accent}18` : "none",
            fontFamily: "inherit"
          }}>
            <span style={{ fontSize: "1.6rem" }}>{btn.i}</span>
            <div>
              <div style={{ color: btn.hi ? T.gold : btn.accent || T.text, fontWeight: 700, fontSize: "0.84rem" }}>{btn.label}</div>
              <div style={{ color: T.textMuted, fontSize: "0.69rem", marginTop: "0.2rem" }}>{btn.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Special mode unlock cards ── */}
      <div style={{ padding: "0 1.25rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>

        {/* BlackBox Challenge */}
        {player.blackboxUnlocked ? (
          <button onClick={() => onNav("blackbox")} style={{ width: "100%", background: "linear-gradient(135deg,#1a0e3a,#2d1554)", border: `1.5px solid ${T.purple}88`, borderRadius: 14, padding: "0.9rem 1.1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem", textAlign: "left", fontFamily: "inherit" }}>
            <span style={{ fontSize: "1.8rem" }}>◼</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#c4b5fd", fontWeight: 700, fontSize: "0.88rem" }}>BlackBox Challenge</div>
              <div style={{ color: T.textMuted, fontSize: "0.73rem" }}>{player.blackboxPassed ? "✓ Passed — replay for practice" : "10 scenarios · Must score 8/10 · Unlocks Deployer"}</div>
            </div>
            <span style={{ color: "#c4b5fd", fontSize: "1.1rem" }}>→</span>
          </button>
        ) : (
          <div style={{ ...css.card, border: `1px solid ${T.purple}44`, background: "linear-gradient(135deg,#0e0a1f,#160d2e)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>◼</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#c4b5fd", fontWeight: 700, fontSize: "0.84rem" }}>BlackBox Challenge</div>
                <div style={{ color: T.textMuted, fontSize: "0.72rem" }}>10 expert scenarios · Unlocks the Deployer path</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#c4b5fd", fontSize: "0.82rem", fontWeight: 800 }}>{bbProgress}%</div>
                <div style={{ color: T.textDim, fontSize: "0.62rem" }}>{Math.max(0, 160 - player.sunrays)} ☀ to go</div>
              </div>
            </div>
            <ProgressBar value={Math.min(player.sunrays, 160)} max={160} color={T.purple} height={6} />
            <div style={{ marginTop: "0.5rem", color: T.textDim, fontSize: "0.66rem" }}>
              🎯 Keep earning ☀ through Expert runs to unlock
            </div>
          </div>
        )}

        {/* Deployer Final Run */}
        {player.deployerUnlocked ? (
          <button onClick={() => onNav("deployer")} style={{ width: "100%", background: "linear-gradient(135deg,#1c1200,#3d2000)", border: `1.5px solid ${T.gold}`, borderRadius: 14, padding: "0.9rem 1.1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem", textAlign: "left", fontFamily: "inherit", boxShadow: `0 0 24px ${T.gold}33` }}>
            <span style={{ fontSize: "1.8rem" }}>☀</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.gold, fontWeight: 700, fontSize: "0.88rem" }}>Deployer Final Run</div>
              <div style={{ color: T.textMuted, fontSize: "0.73rem" }}>{player.deployerCompleted ? "✓ Legendary — replay anytime" : "20 questions · 15s timer · No lifelines"}</div>
            </div>
            <span style={{ color: T.gold, fontSize: "1.1rem" }}>→</span>
          </button>
        ) : player.blackboxPassed ? (
          <div style={{ ...css.card, border: `1px solid ${T.gold}55`, background: "linear-gradient(135deg,#1c1200,#2d1e00)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>☀</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: T.gold, fontWeight: 700, fontSize: "0.84rem" }}>Deployer Final Run</div>
                <div style={{ color: T.textMuted, fontSize: "0.72rem" }}>20Q · 15s timer · No lifelines · Legend status</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: T.gold, fontSize: "0.82rem", fontWeight: 800 }}>{dpProgress}%</div>
                <div style={{ color: T.textDim, fontSize: "0.62rem" }}>{Math.max(0, 200 - player.sunrays)} ☀ to go</div>
              </div>
            </div>
            <ProgressBar value={Math.min(player.sunrays, 200)} max={200} color={T.gold} height={6} />
            <div style={{ marginTop: "0.5rem", color: T.textDim, fontSize: "0.66rem" }}>
              ⚡ BlackBox passed — keep grinding to reach Deployer status
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Admin button ── */}
      <div style={{ padding: "0.75rem 1.25rem 0" }}>
        <button onClick={onAdminClick} style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "0.6rem", cursor: "pointer", color: T.textMuted, fontSize: "0.75rem", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
          ⚙ Admin Panel
        </button>
      </div>

      {/* ── Feedback button ── */}
      <div style={{ padding: "0.5rem 1.25rem 0" }}>
        <button onClick={() => onNav("feedback")} style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "0.6rem", cursor: "pointer", color: T.textMuted, fontSize: "0.75rem", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
          💬 Report · Suggest · Share Opinion
        </button>
      </div>

      {/* ── Disclaimer footer ── */}
      <div style={{ padding: "1rem 1.25rem 2rem", textAlign: "center" }}>
        <div style={{ fontSize: "0.65rem", color: T.textDim, lineHeight: 1.7, padding: "0.75rem 1rem", background: T.surface, borderRadius: 10, border: `1px solid ${T.border}` }}>
          <span style={{ color: T.textMuted, fontWeight: 700 }}>Not affiliated with Dawn Internet.</span>
          {" "}This is an independent community project created to support learning about the Dawn protocol and DePIN. It is not an official product, endorsement, or communication of Dawn Internet or any associated entity.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  QUIZ ARCHIVE
// ─────────────────────────────────────────────────────────────

const SRC_COLOR = {
  "Discord":       "#5865f2",
  "X (Twitter)":   "#e2e8f0",
  "Telegram":      "#2ba5e0",
  "Special Event": "#ef4444",
  "Dawn Academy":  "#f59e0b",
  "Other":         "#6b7280",
};

// ── Archive Quiz Player ───────────────────────────────────────
function ArchiveQuizPlayer({ quiz, onComplete, onBack }) {
  const pool = useState(() => (quiz.questionList || []).map(shuffleOptions))[0];
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState("playing"); // playing | result

  const q = pool[qi];
  const total = pool.length;

  function handleAnswer(i) {
    if (selected !== null) return;
    setSelected(i);
    const correct = i === q.correct;
    if (correct) { SFX.correct(); setScore(s => s + 1); } else SFX.wrong();
  }

  function next() {
    if (qi + 1 >= total) { SFX.levelComplete(); setPhase("result"); }
    else { setQi(qi + 1); setSelected(null); }
  }

  if (phase === "result") {
    const pct = Math.round((score / total) * 100);
    const passed = score >= Math.ceil(total * 0.6);
    return (
      <div style={css.screen}>
        <div style={{ padding: "2rem 1.25rem", textAlign: "center" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "0.75rem" }}>{passed ? "🎉" : "📋"}</div>
          <div style={{ color: T.text, fontWeight: 800, fontSize: "1.4rem", marginBottom: "0.5rem" }}>
            {passed ? "Quiz Complete!" : "Nice Try!"}
          </div>
          <div style={{ color: T.textMuted, fontSize: "0.88rem", marginBottom: "1.5rem" }}>{quiz.title}</div>
          <div style={{ ...css.card, border: `1px solid ${T.gold}33`, marginBottom: "1.25rem" }}>
            <div style={{ color: T.gold, fontSize: "2.5rem", fontWeight: 900 }}>{score}/{total}</div>
            <div style={{ color: T.textMuted, fontSize: "0.8rem", marginTop: "0.25rem" }}>{pct}% correct</div>
          </div>
          <Btn onClick={() => onComplete(score, total)} style={{ marginBottom: "0.6rem" }}>
            Claim +{quiz.sunrays} ☀ Sunrays
          </Btn>
          <Btn variant="ghost" onClick={onBack}>Back to Archive</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={css.screen}>
      <div style={{ padding: "1.25rem 1.25rem 2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <BackBtn onClick={onBack} />
          <span style={{ color: T.textMuted, fontSize: "0.75rem" }}>{qi + 1} / {total}</span>
        </div>
        {/* Progress bar */}
        <div style={{ height: 4, background: T.surface, borderRadius: 4, marginBottom: "1.5rem", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${((qi + (selected !== null ? 1 : 0)) / total) * 100}%`, background: "linear-gradient(90deg,#92400e,#fbbf24)", borderRadius: 4, transition: "width 0.4s" }} />
        </div>
        <QuestionCard q={q} qi={qi} total={total} />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", margin: "1.25rem 0 1rem" }}>
          {q.options.map((opt, i) => {
            let state = "default";
            if (selected !== null) {
              if (i === q.correct) state = "correct";
              else if (i === selected) state = "wrong";
            }
            return <AnswerOption key={i} letter={"ABCD"[i]} text={opt} state={state} disabled={selected !== null} onClick={() => handleAnswer(i)} />;
          })}
        </div>
        {selected !== null && (
          <div style={{ animation: "fadeUp 0.25s ease" }}>
            {q.explanation && (
              <div style={{ ...css.card, background: "#0a1020", border: `1px solid ${T.borderHigh}`, marginBottom: "0.75rem", color: T.textMuted, fontSize: "0.8rem", lineHeight: 1.6 }}>
                💡 {q.explanation}
              </div>
            )}
            <Btn onClick={next}>{qi + 1 >= total ? "See Results →" : "Next →"}</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

function QuizArchive({ player, dispatch, onExit }) {
  const quizzes = player.archiveQuizzes || DEFAULT_ARCHIVE;
  const completedIds = player.completedArchive || [];
  const [active, setActive] = useState(null);   // quiz object being previewed
  const [playing, setPlaying] = useState(null); // quiz object being played
  const [filterSrc, setFilterSrc] = useState("All");

  const sources = ["All", ...Array.from(new Set(quizzes.map(q => q.source)))];
  const visible = filterSrc === "All" ? quizzes : quizzes.filter(q => q.source === filterSrc);

  // Playing a quiz
  if (playing) {
    return (
      <ArchiveQuizPlayer
        quiz={playing}
        onBack={() => setPlaying(null)}
        onComplete={(score, total) => {
          dispatch({ type: "COMPLETE_ARCHIVE", id: playing.id });
          dispatch({ type: "EARN_SUNRAYS", amount: playing.sunrays });
          setPlaying(null);
          setActive(null);
        }}
      />
    );
  }

  // Quiz detail / folder view
  if (active) {
    const isDone = completedIds.includes(active.id);
    const srcColor = SRC_COLOR[active.source] || T.textMuted;
    const hasQuestions = active.questionList && active.questionList.length > 0;
    return (
      <div style={css.screen}>
        <div style={{ padding: "1.5rem 1.25rem" }}>
          <BackBtn onClick={() => setActive(null)} />
          <div style={{ textAlign: "center", margin: "1.5rem 0 1.25rem" }}>
            <div style={{ fontSize: "3rem" }}>📁</div>
            <div style={{ color: T.text, fontWeight: 800, fontSize: "1.3rem", marginTop: "0.75rem", lineHeight: 1.3 }}>{active.title}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
              <span style={{ ...css.tag(srcColor) }}>{active.source}</span>
              <span style={{ color: T.textMuted, fontSize: "0.72rem", alignSelf: "center" }}>
                {active.date} · {hasQuestions ? active.questionList.length : 0} questions
              </span>
            </div>
          </div>

          {active.desc && (
            <div style={{ ...css.card, marginBottom: "1.25rem", color: T.textMuted, fontSize: "0.83rem", lineHeight: 1.6 }}>
              {active.desc}
            </div>
          )}

          <div style={{ ...css.card, textAlign: "center", marginBottom: "1.25rem", border: `1px solid ${T.gold}33` }}>
            <div style={{ color: T.gold, fontSize: "2rem", fontWeight: 900 }}>+{active.sunrays} ☀</div>
            <div style={{ color: T.textMuted, fontSize: "0.8rem" }}>Sunrays on completion</div>
          </div>

          {/* Questions preview */}
          {hasQuestions ? (
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ color: T.textMuted, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                QUESTIONS IN THIS QUIZ
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {active.questionList.map((q, i) => (
                  <div key={q.id || i} style={{ ...css.card, padding: "0.65rem 0.85rem", fontSize: "0.78rem", color: T.textMuted, lineHeight: 1.4 }}>
                    <span style={{ color: T.textDim, marginRight: "0.5rem" }}>Q{i + 1}.</span>
                    {q.question}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ ...css.card, marginBottom: "1.25rem", textAlign: "center", color: T.textDim, fontSize: "0.8rem", lineHeight: 1.7, padding: "1.25rem" }}>
              📭 No questions uploaded yet.<br />
              <span style={{ fontSize: "0.72rem" }}>Admin can add questions via the Archive tab in Admin Panel.</span>
            </div>
          )}

          {isDone ? (
            <div style={{ textAlign: "center", color: T.green, padding: "0.85rem", background: "#011c11", border: `1px solid ${T.green}44`, borderRadius: 12, fontSize: "0.88rem", marginBottom: "0.75rem" }}>
              ✓ Completed — you can still replay this quiz
            </div>
          ) : null}

          {hasQuestions ? (
            <Btn onClick={() => setPlaying(active)} style={{ marginBottom: "0.6rem" }}>
              {isDone ? "▶ Replay Quiz" : "▶ Start Quiz"}
            </Btn>
          ) : null}
          <Btn variant="ghost" onClick={() => setActive(null)}>← Back</Btn>
        </div>
      </div>
    );
  }

  // Folder list view
  return (
    <div style={css.screen}>
      <div style={{ padding: "1.25rem" }}>
        <BackBtn onClick={onExit} />
        <div style={{ margin: "1.25rem 0 0.75rem" }}>
          <SectionTitle sub="Tap a quiz to open it and play">Quiz Archive</SectionTitle>
        </div>

        {/* Source filter */}
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.1rem", overflowX: "auto", paddingBottom: "0.2rem" }}>
          {sources.map(s => (
            <button key={s} onClick={() => setFilterSrc(s)} style={{ whiteSpace: "nowrap", padding: "0.3rem 0.75rem", borderRadius: 20, border: `1px solid ${filterSrc === s ? T.gold : T.borderHigh}`, background: filterSrc === s ? "#1c1200" : T.surface, color: filterSrc === s ? T.gold : T.textMuted, cursor: "pointer", fontSize: "0.72rem", fontWeight: filterSrc === s ? 700 : 400, fontFamily: "inherit" }}>{s}</button>
          ))}
        </div>

        {visible.length === 0 && (
          <div style={{ ...css.card, textAlign: "center", padding: "2.5rem 1rem", color: T.textDim, fontSize: "0.85rem" }}>
            No quizzes yet.<br />Add some from the Admin Panel ⚙
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {visible.map(q => {
            const done = completedIds.includes(q.id);
            const srcColor = SRC_COLOR[q.source] || T.textMuted;
            const qCount = q.questionList?.length || 0;
            const hasQs = qCount > 0;
            return (
              <button key={q.id} onClick={() => setActive(q)} style={{ ...css.card, textAlign: "left", cursor: "pointer", display: "flex", gap: "0.75rem", alignItems: "center", borderLeft: `3px solid ${srcColor}44`, background: T.surface }}>
                <div style={{ fontSize: "1.6rem", flexShrink: 0 }}>{hasQs ? "📁" : "📂"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: T.text, fontWeight: 600, fontSize: "0.88rem", marginBottom: "0.3rem" }}>{q.title}</div>
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ ...css.tag(srcColor) }}>{q.source}</span>
                    <span style={{ color: T.textMuted, fontSize: "0.72rem" }}>{q.date} · {hasQs ? `${qCount}Q` : "no questions"}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ color: T.gold, fontSize: "0.82rem", fontWeight: 700 }}>+{q.sunrays} ☀</div>
                  {done && <div style={{ color: T.green, fontSize: "0.68rem", marginTop: "0.2rem" }}>✓ Done</div>}
                  {hasQs && !done && <div style={{ color: T.blue, fontSize: "0.68rem", marginTop: "0.2rem" }}>▶ Play</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  ROOT APPLICATION
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
//  ONBOARDING
// ─────────────────────────────────────────────────────────────

function Onboarding({ onComplete, viewOnly = false }) {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const allSlides = [
    {
      icon: "🌅",
      title: "Welcome to\nDawnQuiz",
      body: "A community-made quiz about decentralized internet, DePIN, and the Dawn protocol. Test your knowledge and climb the ranks.",
      accent: T.gold,
    },
    {
      icon: "☀",
      title: "Earn Sunrays.\nClimb the Ranks.",
      body: "Answer questions correctly to earn Sunrays ☀. Hit milestones to unlock the BlackBox Challenge and ultimately become a Deployer.",
      accent: "#fb923c",
      extra: (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", margin: "1rem 0" }}>
          {[
            { ray: "0 ☀", rank: "Beginner", color: "#94a3b8" },
            { ray: "50 ☀", rank: "Luminary", color: "#fbbf24" },
            { ray: "160 ☀", rank: "BlackBox Holder", color: "#8b5cf6" },
            { ray: "200 ☀", rank: "⚡ Deployer", color: "#f97316" },
          ].map(r => (
            <div key={r.rank} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "0.6rem 0.85rem" }}>
              <span style={{ color: r.color, fontWeight: 700, fontSize: "0.82rem" }}>{r.rank}</span>
              <span style={{ color: T.textMuted, fontSize: "0.75rem" }}>{r.ray}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: "🔥",
      title: "Daily Streaks\nMultiply Your Rewards",
      body: "Play every day to build your streak. The longer your streak, the more Sunrays you earn per correct answer.",
      accent: "#f97316",
      extra: (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", margin: "1rem 0" }}>
          {[
            { days: "3 days",  mult: "1.1×", color: "#fbbf24" },
            { days: "7 days",  mult: "1.25×", color: "#fb923c" },
            { days: "14 days", mult: "1.5×", color: "#f97316" },
            { days: "30 days", mult: "2×",   color: "#ef4444" },
          ].map(r => (
            <div key={r.days} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "0.6rem 0.85rem" }}>
              <span style={{ color: T.text, fontSize: "0.82rem" }}>🔥 {r.days} streak</span>
              <span style={{ color: r.color, fontWeight: 800, fontSize: "0.88rem" }}>{r.mult} Sunrays</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: "🌐",
      title: "Why Dawn\nInternet Exists",
      body: "Today, 4 internet companies control 80% of global traffic. They can throttle speeds, censor content, or cut you off entirely. Dawn changes this.",
      accent: T.blue,
      extra: (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", margin: "1rem 0", textAlign: "left" }}>
          {[
            { icon: "📡", label: "Community bandwidth", desc: "Contributors share unused capacity — no corporate gatekeepers" },
            { icon: "🛡", label: "Censorship resistant", desc: "No single entity can block or throttle your access" },
            { icon: "💰", label: "Contributors get paid", desc: "Proof-of-Bandwidth rewards real infrastructure work" },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", background: T.surface, borderRadius: 10, padding: "0.7rem 0.85rem", border: `1px solid ${T.border}` }}>
              <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{item.icon}</span>
              <div>
                <div style={{ color: T.text, fontWeight: 700, fontSize: "0.82rem" }}>{item.label}</div>
                <div style={{ color: T.textMuted, fontSize: "0.75rem", marginTop: "0.1rem" }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: "👤",
      title: "Set Your\nDisplay Name",
      body: "Choose a name to appear on the leaderboard. You can change it later in your Profile.",
      accent: T.green,
      isUsernameStep: true,
    },
  ];

  const slides = viewOnly ? allSlides.filter(s => !s.isUsernameStep) : allSlides;

  const slide = slides[step];
  const isLast = step === slides.length - 1;

  function handleNext() {
    if (isLast) {
      if (viewOnly) { onComplete(); return; }
      const name = username.trim();
      if (!name) { setError("Please enter a display name to continue."); return; }
      if (name.length < 2) { setError("Must be at least 2 characters."); return; }
      if (name.length > 20) { setError("Max 20 characters."); return; }
      onComplete(name);
    } else {
      setStep(s => s + 1);
    }
  }

  return (
    <div style={{ ...css.screen, display: "flex", flexDirection: "column", justifyContent: "center", padding: "2rem 1.5rem" }}>
      {/* Progress dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", marginBottom: "2.5rem" }}>
        {slides.map((_, i) => (
          <div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 3, background: i === step ? slide.accent : T.border, transition: "all 0.3s" }} />
        ))}
      </div>

      <div style={{ textAlign: "center", animation: "fadeUp 0.4s ease" }} key={step}>
        <div style={{ fontSize: "3.5rem", marginBottom: "1.25rem" }}>{slide.icon}</div>
        <div style={{ color: T.text, fontSize: "1.6rem", fontWeight: 900, lineHeight: 1.2, marginBottom: "1rem", whiteSpace: "pre-line", fontFamily: "'Syne', sans-serif" }}>
          {slide.title}
        </div>
        <div style={{ color: T.textMuted, fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "0.5rem" }}>
          {slide.body}
        </div>

        {slide.extra}

        {slide.isUsernameStep && (
          <div style={{ margin: "1.25rem 0" }}>
            <input
              value={username}
              onChange={e => { setUsername(e.target.value); setError(""); }}
              placeholder="e.g. SolarNode_99"
              maxLength={20}
              onKeyDown={e => e.key === "Enter" && handleNext()}
              style={{
                width: "100%", padding: "0.85rem 1rem",
                background: T.surface, border: `1.5px solid ${error ? T.red : T.borderHigh}`,
                borderRadius: 12, color: T.text, fontSize: "1rem",
                fontFamily: "inherit", outline: "none",
              }}
              autoFocus
            />
            {error && <div style={{ color: T.red, fontSize: "0.78rem", marginTop: "0.4rem" }}>{error}</div>}
          </div>
        )}
      </div>

      <div style={{ marginTop: "auto", paddingTop: "2rem" }}>
        <Btn onClick={handleNext} style={{ background: slide.accent, border: "none", color: "#000", fontWeight: 800 }}>
          {isLast ? (viewOnly ? "Done ✓" : "Let's Go ☀") : "Next →"}
        </Btn>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} style={{ background: "none", border: "none", color: T.textMuted, width: "100%", padding: "0.75rem", marginTop: "0.5rem", fontFamily: "inherit", fontSize: "0.85rem" }}>
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [player, dispatch] = useReducer(playerReducer, null, () => {
    try {
      const stored = window.localStorage.getItem("deployer_player_v3");
      if (stored) return { ...PLAYER_DEFAULT, ...JSON.parse(stored) };
    } catch {}
    return { ...PLAYER_DEFAULT };
  });

  useEffect(() => {
    try { window.localStorage.setItem("deployer_player_v3", JSON.stringify(player)); } catch {}
  }, [player]);

  const [screen,       setScreen]       = useState("home");
  const [showOnboarding, setShowOnboarding] = useState(false);

  // ── Announcements (admin-editable, localStorage) ────────────
  const [announcements, setAnnouncements] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dawn_announcements") || "[]"); } catch { return []; }
  });
  function saveAnnouncements(list) {
    setAnnouncements(list);
    try { localStorage.setItem("dawn_announcements", JSON.stringify(list)); } catch {}
  }
  const activeAnnouncements = announcements.filter(a => a.active);
  const [tournamentCodeFromUrl, setTournamentCodeFromUrl] = useState(() => getTournamentCodeFromUrl());
  const [rankUpToast,  setRankUpToast]  = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const prevRankRef = useRef(player.lastRankLevel || 1);

  // Challenge URL detection — ?challenge=SEED&ql=LENGTH
  const [challengeFromUrlSeed,   setChallengeFromUrlSeed]   = useState(() => getChallengeFromUrl());
  const [challengeFromUrlLength, setChallengeFromUrlLength] = useState(() => {
    try { return parseInt(new URLSearchParams(window.location.search).get("ql") || "30", 10); } catch { return 30; }
  });
  useEffect(() => {
    if (challengeFromUrlSeed && player.onboarded) setScreen("game");
    if (tournamentCodeFromUrl && player.onboarded) setScreen("tournament");
  }, [challengeFromUrlSeed, player.onboarded]);

  const audio        = useAudio();
  const adminsHook   = useAdmins();
  const [navLabels, setNavLabels] = useLocalStorage("dawn_nav_labels", NAV_DEFAULTS);

  // Detect rank-up and fire sound
  useEffect(() => {
    const currentRankLevel = getRank(player.sunrays).level;
    if (currentRankLevel > prevRankRef.current) {
      setRankUpToast(getRank(player.sunrays));
      audio.play("rankUp");
    }
    prevRankRef.current = currentRankLevel;
  }, [player.sunrays]);

  const [adminInitialTab, setAdminInitialTab] = useState("questions");

  function handleAdminClick(tab = "questions") {
    setAdminInitialTab(tab);
    if (!adminsHook.hasMaster) { setShowPinModal(true); return; }
    setShowPinModal(true);
  }

  function handlePinSuccess(mode, data) {
    setShowPinModal(false);
    if (mode === "setup") {
      // addAdmin returns the entry synchronously — use it directly
      const entry = adminsHook.addAdmin(data.name, data.pin, "master");
      setCurrentAdmin(entry || { name: data.name, role: "master" });
    } else {
      setCurrentAdmin(data);
    }
    setScreen("admin");
  }

  const allCustomQs = player.customQuestions || [];

  // Show onboarding for first-time users
  if (!player.onboarded) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=Syne:wght@700;800;900&display=swap');
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { background: #050d1a; }
          button { cursor: pointer; font-family: inherit; }
          button:active { transform: scale(0.97); }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
        <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
          <Onboarding onComplete={(name) => dispatch({ type: "COMPLETE_ONBOARDING", username: name })} />
        </div>
      </>
    );
  }

  const views = {
    home:        <Home player={player} onNav={setScreen} onAdminClick={handleAdminClick} navLabels={navLabels} setNavLabels={setNavLabels} announcements={activeAnnouncements} onShowWelcome={() => setShowOnboarding(true)} />,
    game:        <GameScreen player={player} dispatch={dispatch} allQuestions={allCustomQs} audio={audio} onExit={() => { setScreen("home"); setChallengeFromUrlSeed(null); }} challengeSeed={challengeFromUrlSeed} defaultRunLength={challengeFromUrlLength} />,

    learn:       <LearningHub player={player} dispatch={dispatch} onExit={() => setScreen("home")} onAdmin={handleAdminClick} />,
    study:       <StudyMaterials onExit={() => setScreen("home")} />,
    archive:     <QuizArchive player={player} dispatch={dispatch} onExit={() => setScreen("home")} />,
    leaderboard: <Leaderboard player={player} onExit={() => setScreen("home")} />,
    feedback:    <FeedbackScreen player={player} onExit={() => setScreen("home")} />,
    tournament:  <TournamentScreen player={player} dispatch={dispatch} onExit={() => setScreen("home")} initialCode={tournamentCodeFromUrl} onCodeConsumed={() => setTournamentCodeFromUrl(null)} />,
    profile:     <Profile player={player} dispatch={dispatch} onExit={() => setScreen("home")} />,
    daily:       <DailyQuestion player={player} dispatch={dispatch} audio={audio} onExit={() => setScreen("home")} />,
    blackbox:    <BlackboxChallenge player={player} dispatch={dispatch} audio={audio} onExit={() => setScreen("home")} />,
    deployer:    <DeployerFinalRun player={player} dispatch={dispatch} audio={audio} onExit={() => setScreen("home")} onVictory={() => setScreen("home")} />,
    admin:       <AdminPanel player={player} dispatch={dispatch} onExit={() => { setScreen("home"); setCurrentAdmin(null); }} currentAdmin={currentAdmin} adminsHook={adminsHook} navLabels={navLabels} setNavLabels={setNavLabels} announcements={announcements} saveAnnouncements={saveAnnouncements} initialTab={adminInitialTab} />,
  };

  if (showOnboarding) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=Syne:wght@700;800;900&display=swap');
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { background: #050d1a; }
          button { cursor: pointer; font-family: inherit; }
          button:active { transform: scale(0.97); }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
        <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", position: "relative" }}>
          <button onClick={() => setShowOnboarding(false)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "#9ca3af", fontSize: "1.2rem", cursor: "pointer", zIndex: 10 }}>✕</button>
          <Onboarding viewOnly onComplete={() => setShowOnboarding(false)} />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=Syne:wght@700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #07070f; overscroll-behavior: none; }
        button { cursor: pointer; font-family: inherit; }
        button:active { transform: scale(0.97); }
        textarea { font-family: inherit; }
        select option { background: #1f2937; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #07070f; }
        ::-webkit-scrollbar-thumb { background: #2a2a48; border-radius: 2px; }
        a:hover { opacity: 0.82; }
      `}</style>
      <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh" }}>
        {views[screen] || views.home}
        {rankUpToast && <RankUpToast rank={rankUpToast} onDismiss={() => setRankUpToast(null)} />}
        {showPinModal && (
          <AdminPinModal
            admins={adminsHook.admins}
            hasMaster={adminsHook.hasMaster}
            onSuccess={handlePinSuccess}
            onCancel={() => setShowPinModal(false)}
          />
        )}
        <AudioToggle audio={audio} />
      </div>
    </>
  );
}
