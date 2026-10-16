// Speaker notes, written to be read aloud while presenting. Light Hinglish flavor,
// mostly English. Indexed by slideIndex (0-based); each array entry is one step's script.
export const SPEAKER_NOTES: Record<number, string[]> = {
  0: [
    "Good morning everyone! Today we're talking about distributed consensus, how thousands of computers, with no boss in charge, agree on one single truth. Keep it simple in your head: nobody's commanding them, yet they all land on the same answer. That's the whole mystery we're unpacking today, step by step. Let's begin.",
  ],
  1: [
    "Here's the roadmap. Part A is the basics, key words, what a blockchain actually is, types of networks, and why agreement matters at all. Zero assumptions, so don't worry if these terms are new to you.",
    "Part B covers the actual methods, Proof of Work, Proof of Stake, and a quick look at the others, the real rules computers use to agree. It'll get a little technical, but I'll ground it with real examples: Bitcoin, Ethereum.",
    "And Part C is the real world, forks, attacks, who actually uses what, and what's coming next. By the end you'll be able to say confidently which consensus method fits which situation, and why.",
  ],
  2: [
    "Let's lock down six words we'll use all day. Node is just one computer in the network, think of everyone in this room as a node. Block is a box holding a list of transactions. Ledger is the shared record book every node keeps a full copy of, no exceptions.",
    "Three more. Hash, a unique fingerprint of data, and you can try it live below with real SHA-256 running right in your browser. Validator, checks and adds new blocks. And consensus, today's whole point, all honest computers agreeing on one single truth. Type anything in that box and change one letter, watch the entire fingerprint flip. That's the real power of a hash.",
  ],
  3: [
    "This is our first block, the genesis block. It records Ravi paying Simran ₹100. Every block carries its own hash, a fingerprint, here A7F3. Real hashes run 64 characters; we've shortened it so it fits on screen.",
    "Block 2 arrives, Simran pays Aman ₹40. Notice its 'prev' field matches Block 1's hash exactly, A7F3. That's the link that chains one block to the next.",
    "Block 3, Aman pays Neha ₹25, prev 9B2C. Now we have a full chain, three blocks, linked through their hashes.",
    "So a blockchain is basically a notebook everyone has a copy of. You can add pages, but you can't tear one out quietly. Change a page and its fingerprint changes, everyone notices instantly, because they all have a copy to compare against.",
    "Once validated, a transaction becomes a permanent part of this chronological sequence, every block pointing back to the one before it. That's what makes the record resistant to tampering and independently verifiable by anyone, not just one central party.",
    "So why is tampering actually hard? Because that 'pointing back' is the previous block's hash. Change anything in a block and its hash changes, instantly breaking the link the next block is holding. To hide it, you'd have to rebuild every block after it, on a majority of thousands of independent copies, before anyone notices. Watch what happens next. Block 1 gets tampered, its amount changes from ₹100 to ₹1000, and Blocks 2 and 3 instantly go invalid, since their prevHash no longer matches.",
  ],
  4: [
    "First type: centralized. One bank holds everything. Simple to build, but one big weakness, a single point of failure. If that one server goes down, everything stops, for everyone.",
    "Second: decentralized. Control is now shared across a few big branches instead of one entity. More resilient, but power still concentrates in a handful of hubs.",
    "And third, the one that matters most to us: distributed. Every node keeps its own full copy, like a group chat where everyone has the same messages. Any node can drop out and the network keeps running. This is where blockchain actually lives, remember this badge, we'll come back to it.",
  ],
  5: [
    "Computer science has a famous story for this, the Byzantine Generals Problem, 1982, Lamport, Shostak and Pease. Picture four generals surrounding a city, each commanding their own army.",
    "Their rule: attack together or lose separately. If everyone attacks at once, they win. Messengers are the only way they can communicate, they're too far apart to talk directly.",
    "Now the problem: a messenger could get intercepted, or a general himself, this red one, could be a traitor, telling one ally '6am' and another '9am', purely to cause chaos.",
    "This story is exactly the blockchain problem. Generals = computers, messengers = network messages, traitor = a hacked or faulty computer. Ek baat yaad rakhiye, the one-third rule: if traitors are fewer than N/3, honest generals can always agree. Try the slider yourself.",
  ],
  6: [
    "Consensus means all honest computers agree on the same record, in the same order. Order matters, with ₹100 in hand, 'receive 50, then spend 150' is fine, but 'spend 150, then receive 50' has to be rejected.",
    "Here's an example, imagine 30 students given the same maths problem.",
    "Each one solves it and checks their own answer. Nobody copies anybody.",
    "A few make silly mistakes, but most land on 42.",
    "So 42 goes on the board, from now on, everyone uses 42. Notice: no teacher told them the answer, the group reached it on its own. That's consensus.",
  ],
  7: [
    "Ravi has ₹100 in a digital wallet.",
    "Ravi tries something clever, he sends that exact same ₹100 to Simran and to Aman, at the exact same moment. With physical cash this is impossible; digital data can be copied.",
    "Without consensus, some nodes hear about Simran's payment first, some hear about Aman's first, because messages travel at different speeds. Both go through, ₹200 spent from ₹100!",
    "With consensus, the whole network agrees on one order. Whichever payment lands first is accepted, the other rejected, because the money is already spent. This is exactly what Satoshi Nakamoto solved in the 2008 Bitcoin whitepaper.",
  ],
  8: [
    "Safety, never agree on a wrong answer. Two honest computers should never show different balances.",
    "Liveness, keep moving, never get permanently stuck. New payments keep getting added.",
    "Fault tolerance, keep working even if some computers crash or lie.",
    "Finality, once confirmed, it can't be undone. Ab thoda technical: in 1985, Fischer, Lynch and Paterson proved that with arbitrarily delayed messages, no deterministic method can always guarantee both safety and liveness if even one node might crash, the FLP impossibility result. That's why real systems lean on timeouts or randomness.",
  ],
  9: [
    "Crash fault, the computer simply stops, goes silent. Like a friend whose phone dies mid-call.",
    "Byzantine fault, the computer keeps running but lies, or tells different people different things. Like a friend telling A 'yes' and B 'no'. Much more dangerous.",
    "Methods that only handle crashes, Raft, Paxos, are simpler and faster. Methods that handle Byzantine faults too, PBFT, PoW, PoS, are what public networks need, where anyone can join. Try injecting a fault yourself below.",
  ],
  10: [
    "Every blockchain wants three things, Security, Decentralization, and Speed. The term was popularized by Ethereum's Vitalik Buterin.",
    "Bitcoin picked security and decentralization, very secure, anyone can run a node, but handles only ~7 transactions per second, far slower than UPI.",
    "Private company chains picked security and speed, very fast, since only a few known companies run the nodes, but you can't just join them, so they're not decentralized.",
    "Rule of thumb: pick any two. Getting all three at once is very hard. Try the triangle yourself, drag the point and watch the third corner dim as you approach two others.",
  ],
  11: [
    "Welcome to Part B, where we open up the actual methods. Every consensus method belongs to one big family.",
    "Two branches: proof-based, where you earn the right to add the next block by proving work or putting up stake; and voting-based, where a fixed group of nodes exchanges messages in rounds until enough of them agree.",
    "On the proof-based side: PoW, PoS, DPoS, and PoA.",
    "On the voting-based side: PBFT, and Raft, along with its older cousin Paxos. Let's open each box.",
  ],
  12: [
    "The oldest method, Proof of Work. Bitcoin introduced it in 2009 and still runs on it today. Step one: miners collect waiting transactions into a candidate block.",
    "Step two: solve a puzzle. Block data plus a random nonce gets hashed; the rule says the hash must start with a certain number of zeros. No shortcuts, just try different nonces, billions of times a second.",
    "Step three: whoever finds a valid nonce first broadcasts it to everyone, basically shouting 'Done!'",
    "Step four: every other node checks it. Finding it is hard; checking is one hash calculation, under a millisecond.",
    "Step five: the block gets added, and the winning miner earns a reward, new bitcoins plus fees.",
    "The simplest way to picture it: a lottery. More computing power means more tickets. Hard to win, easy to verify the winning ticket. Try the real SHA-256 miner below, it runs in a Web Worker so your browser never freezes.",
  ],
  13: [
    "Bitcoin creates a new block roughly every 10 minutes on average. Every 2,016 blocks, about two weeks, the difficulty adjusts automatically to keep that rhythm steady.",
    "6 blocks ≈ 1 hour, and after that a payment feels safe, reversing it gets expensive fast.",
    "Every 210,000 blocks, about four years, the mining reward gets cut in half. That's the halving.",
    "Look at the chart, 2009: 50, 2012: 25, 2016: 12.5, 2020: 6.25, and since April 2024, 3.125 BTC per block. That's why the total supply will never cross 21 million.",
  ],
  14: [
    "The second major method, Proof of Stake. Instead of burning electricity, you put your own money at risk. Step one: validators lock up coins as a deposit, on Ethereum, 32 ETH per validator.",
    "Step two: the system picks a validator to propose the next block, random, but weighted, so more stake means more chance. On Ethereum, a new proposer every 12 seconds, called a slot.",
    "Step three: the chosen validator builds a block and shares it.",
    "Step four: other validators check and vote, attestations. Once over two-thirds of staked ether has voted, across two rounds, the block finalizes, around 13 minutes.",
    "Step five: honest validators earn rewards. A cheater, say, signing two blocks for the same slot, gets part of their deposit destroyed. That's slashing.",
    "Think of it like a rent deposit: behave and you earn, break the rules and you lose it. On September 15, 2022, Ethereum switched from PoW to PoS, 'The Merge', like swapping a plane's engine mid-flight. Try the stake wheel below.",
  ],
  15: [
    "Proof of Authority, a few known, approved signers create blocks. Like attendance only approved teachers can sign. VeChain and private chains use this.",
    "Proof of History, used by Solana, a built-in clock stamps the order of events. Like a timestamp on every photo.",
    "Proof of Elapsed Time, built by Intel, used in Hyperledger Sawtooth. Everyone waits a random time; shortest wait wins, like a race with random timers.",
  ],
  16: [
    "Welcome to Part C, the real world. Normal chain: blocks 1, 2, 3, everyone agrees.",
    "Sometimes in PoW, two miners find a valid block at almost the same instant. Half the network sees 4A first, half sees 4B, the chain briefly splits, a fork.",
    "The longest-chain rule kicks in. 5A then 6A extend one branch, everyone switches to it, and 4B gets dropped, its transactions go back into the waiting pool.",
    "Soft fork: rules tighten, but old nodes still accept the new blocks, like a skippable app update (SegWit, 2017). Hard fork: old nodes reject the new blocks, splitting the chain permanently if not everyone upgrades (Bitcoin Cash, 2017; Ethereum Classic, 2016, after the DAO hack).",
  ],
  17: [
    "51% Attack, one group controls most of the power and can secretly rewrite recent history. Like 16 of 30 students teaming up to fake a class vote. They can't steal your coins directly, that needs your private key, but they can reverse their own payments. This isn't theoretical: Bitcoin Gold lost about $18M this way in 2018, Ethereum Classic twice in 2019 and 2020. Links are right there if you want to read the full reports.",
    "Sybil Attack, one person creates many fake identities to gain influence, like voting 50 times with fake accounts. Blockchains defeat this by tying power to something real, compute in PoW, locked coins in PoS, so fake identities buy zero extra power.",
    "Smart Contract Exploit, this is the big one financially. The code does exactly what it says, just not what the authors meant. The DAO hack in 2016 lost 3.6 million ETH to a reentrancy bug; the Ronin Network bridge lost $620 million in 2022. These are the largest-dollar incidents in the whole industry.",
    "DDoS Attack, flood nodes or exchanges with junk traffic to slow them down. Like 1,000 fake calls jamming a helpline. Transaction fees make spamming the chain itself expensive, most real DDoS damage actually lands on exchanges and websites, not the protocol.",
    "And there's more, eclipse attacks, flash loan attacks, rug pulls, phishing, dusting, time-jacking. Quick rundown on screen.",
    "To close this out, the real risks of blockchain in general: irreversibility, losing your own private key, smart contract bugs, energy cost, regulatory uncertainty, and power quietly re-concentrating in big mining pools or staking providers.",
  ],
  18: [
    "Bitcoin: PoW. Ethereum: PoS. Cardano: PoS, called Ouroboros. Solana: PoS plus PoH. Hyperledger Fabric: Raft.",
    "Block-time chart, on a log scale, because Bitcoin takes ~600 seconds and Solana takes ~0.4, too big a gap for a linear chart to even show Solana's bar. Faster doesn't mean better, Solana needs powerful hardware, so fewer people can run a node.",
  ],
  19: [
    "Hybrid methods, mixing two approaches to get the best of both. Ethereum's Gasper combines PoS fork-choice with Casper voting for quick finality.",
    "Sharding, splitting the work into parallel lanes, like opening more billing counters. NEAR uses this.",
    "Layer 2, settling many small payments off-chain, then recording the final result on the main chain, like a running tab. Lightning Network, Arbitrum, Optimism.",
    "Greener chains, the industry keeps moving away from energy-hungry mining.",
  ],
  20: [
    "Everything in one picture, Consensus means agreeing on one truth, without a boss.",
    "WHY, to stop double spending and lying computers.",
    "HOW, PoW, PoS, DPoS, PBFT, Raft, PoA.",
    "TRADE-OFF, security vs speed vs openness.",
    "RISKS, 51% attacks, Sybil, forks. One more checkpoint quiz before we wrap.",
  ],
  21: [
    "That's everything from my side. Thank you so much for listening — happy to take any questions now.",
  ],
};

export function getStepNotes(slideIndex: number, stepIndex: number): string {
  const steps = SPEAKER_NOTES[slideIndex];
  if (!steps) return 'Notes for this slide are coming soon.';
  return steps[Math.min(stepIndex, steps.length - 1)] ?? '';
}