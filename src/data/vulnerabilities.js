export const VULNS = [
  {
    id: 'reentrancy',
    title: 'Reentrancy',
    severity: 'critical',
    emoji: '🔁',
    summary: 'An external call lets an attacker call back into your function before state is updated, draining funds repeatedly.',
    impact: 'Total loss of contract funds (The DAO hack, $60M).',
    vulnerable: `function withdraw(uint256 amount) public {
    require(balances[msg.sender] >= amount);
    (bool ok, ) = msg.sender.call{value: amount}("");
    require(ok);
    balances[msg.sender] -= amount; // too late!
}`,
    fixed: `function withdraw(uint256 amount) public nonReentrant {
    require(balances[msg.sender] >= amount);
    balances[msg.sender] -= amount; // effects first
    (bool ok, ) = msg.sender.call{value: amount}("");
    require(ok);
}`,
    tips: ['Follow checks → effects → interactions', 'Use OpenZeppelin ReentrancyGuard', 'Prefer pull-payments over push-payments'],
  },
  {
    id: 'tx-origin',
    title: 'tx.origin Authentication',
    severity: 'high',
    emoji: '🎭',
    summary: 'tx.origin is the original sender of the transaction, so a malicious contract can trick the owner into authorizing it.',
    impact: 'Phishing-style takeover of privileged functions.',
    vulnerable: `function transferOwnership(address to) public {
    require(tx.origin == owner);
    owner = to;
}`,
    fixed: `function transferOwnership(address to) public {
    require(msg.sender == owner);
    owner = to;
}`,
    tips: ['Always authenticate with msg.sender', 'Use Ownable / AccessControl'],
  },
  {
    id: 'access-control',
    title: 'Missing Access Control',
    severity: 'critical',
    emoji: '🚪',
    summary: 'Sensitive functions are public with no permission check, so anyone can call them.',
    impact: 'Anyone can mint, pause, upgrade or destroy the contract.',
    vulnerable: `function emergencyWithdraw() public {
    selfdestruct(payable(msg.sender));
}`,
    fixed: `function emergencyWithdraw() public onlyOwner {
    (bool ok, ) = owner.call{value: address(this).balance}("");
    require(ok);
}`,
    tips: ['Default to least privilege', 'Use role-based AccessControl', 'Avoid selfdestruct entirely'],
  },
  {
    id: 'overflow',
    title: 'Integer Overflow / Underflow',
    severity: 'high',
    emoji: '🔢',
    summary: 'In Solidity < 0.8, arithmetic wraps silently. A balance of 0 minus 1 becomes the largest possible number.',
    impact: 'Minted-from-nothing balances, bypassed limits.',
    vulnerable: `pragma solidity ^0.7.6;
function burn(uint256 amt) public {
    balances[msg.sender] -= amt; // wraps!
}`,
    fixed: `pragma solidity ^0.8.20;
function burn(uint256 amt) public {
    balances[msg.sender] -= amt; // reverts on underflow
}`,
    tips: ['Use Solidity 0.8+', 'Use SafeMath on older compilers', 'Be careful inside unchecked blocks'],
  },
  {
    id: 'randomness',
    title: 'Weak Randomness',
    severity: 'medium',
    emoji: '🎲',
    summary: 'block.timestamp, difficulty and blockhash are predictable or manipulable by miners/validators.',
    impact: 'Lotteries and games get rigged.',
    vulnerable: `function random() public view returns (uint256) {
    return uint256(keccak256(abi.encodePacked(
        block.timestamp, block.difficulty)));
}`,
    fixed: `// Use a verifiable randomness oracle
uint256 requestId = COORDINATOR.requestRandomWords(
    keyHash, subId, 3, 100000, 1);`,
    tips: ['Use Chainlink VRF', 'Never use block data as a secret'],
  },
  {
    id: 'unchecked-call',
    title: 'Unchecked Low-Level Calls',
    severity: 'medium',
    emoji: '📞',
    summary: 'call(), send() and delegatecall return false on failure instead of reverting. Ignoring that return value hides errors.',
    impact: 'Silent failures and inconsistent accounting.',
    vulnerable: `payable(user).send(amount); // result ignored`,
    fixed: `(bool ok, ) = payable(user).call{value: amount}("");
require(ok, "Transfer failed");`,
    tips: ['Always check return values', 'Use SafeERC20 for tokens'],
  },
  {
    id: 'delegatecall',
    title: 'Dangerous delegatecall',
    severity: 'high',
    emoji: '🧬',
    summary: 'delegatecall runs foreign code in YOUR contract\'s storage. A user-controlled target means full takeover.',
    impact: 'Storage overwrite, ownership theft (Parity wallet hack).',
    vulnerable: `function run(address target, bytes memory data) public {
    target.delegatecall(data);
}`,
    fixed: `address public immutable trustedLib;
function run(bytes memory data) public onlyOwner {
    (bool ok, ) = trustedLib.delegatecall(data);
    require(ok);
}`,
    tips: ['Never delegatecall to user-supplied addresses', 'Keep storage layouts aligned'],
  },
  {
    id: 'frontrunning',
    title: 'Front-Running',
    severity: 'medium',
    emoji: '🏃',
    summary: 'Pending transactions are public. Bots can copy and outbid you in the mempool.',
    impact: 'Sandwich attacks, stolen rewards, approval races.',
    vulnerable: `function approve(address s, uint256 amt) public {
    allowance[msg.sender][s] = amt;
}`,
    fixed: `function increaseAllowance(address s, uint256 add) public {
    allowance[msg.sender][s] += add;
}`,
    tips: ['Use commit-reveal schemes', 'Add slippage limits and deadlines'],
  },
  {
    id: 'timestamp',
    title: 'Timestamp Dependence',
    severity: 'low',
    emoji: '⏱️',
    summary: 'Validators can nudge block.timestamp by several seconds, so exact-time logic is unsafe.',
    impact: 'Minor manipulation of time-based payouts.',
    vulnerable: `require(block.timestamp == unlockTime);`,
    fixed: `require(block.timestamp >= unlockTime);`,
    tips: ['Use ranges, not equality', 'Tolerate ~15s drift'],
  },
];

export const SEV_STYLE = {
  critical: { badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300', dot: 'bg-red-500', ring: 'ring-red-500/40', line: 'bg-red-500/15 border-red-500' },
  high: { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300', dot: 'bg-orange-500', ring: 'ring-orange-500/40', line: 'bg-orange-500/15 border-orange-500' },
  medium: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300', dot: 'bg-amber-500', ring: 'ring-amber-500/40', line: 'bg-amber-500/15 border-amber-500' },
  low: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300', dot: 'bg-emerald-500', ring: 'ring-emerald-500/40', line: 'bg-emerald-500/15 border-emerald-500' },
};
