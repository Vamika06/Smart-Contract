export const CHECKLIST = [
  { group: 'Access Control', color: 'from-violet-500 to-fuchsia-500', items: [
    'Every privileged function has an explicit permission check',
    'Ownership transfer is two-step (propose, then accept)',
    'No use of tx.origin for authorization',
    'Admin keys are held by a multisig, not a single EOA',
  ]},
  { group: 'External Calls', color: 'from-cyan-500 to-blue-500', items: [
    'State changes happen before external calls (CEI)',
    'ReentrancyGuard on every function that sends value',
    'Return values of low-level calls are checked',
    'No delegatecall to user-supplied addresses',
  ]},
  { group: 'Math & Logic', color: 'from-emerald-500 to-teal-500', items: [
    'Compiler is Solidity 0.8.x or newer',
    'unchecked blocks are minimal and reviewed',
    'Division happens after multiplication to avoid rounding loss',
    'Loops over user-controlled arrays are bounded',
  ]},
  { group: 'Randomness & Time', color: 'from-amber-500 to-orange-500', items: [
    'No block.timestamp / blockhash used as randomness',
    'Time logic uses ranges (>=) rather than equality',
    'Oracles have staleness and sanity checks',
  ]},
  { group: 'Testing & Deployment', color: 'from-pink-500 to-rose-500', items: [
    'Unit tests cover every public function incl. failure paths',
    'Fuzz / invariant tests written (Foundry or Echidna)',
    'Contract scanned with SmartAudit and critical findings fixed',
    'Deployed and verified on testnet before mainnet',
    'Events emitted for all state-changing actions',
    'An emergency pause or circuit-breaker exists',
  ]},
];
export const CHECKLIST_TOTAL = CHECKLIST.reduce((s, g) => s + g.items.length, 0);
