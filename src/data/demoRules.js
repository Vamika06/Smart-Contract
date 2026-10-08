// Lightweight client-side rules for the landing-page live demo only.
// The real scanner (backend + AI) goes much deeper.
export const DEMO_SAMPLE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

contract VulnerableBank {
    mapping(address => uint256) public balances;
    address public owner;

    constructor() {
        owner = tx.origin;
    }

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount);
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok);
        balances[msg.sender] -= amount;
    }

    function luckyNumber() public view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty)));
    }

    function kill() public {
        selfdestruct(payable(msg.sender));
    }
}`;

export const DEMO_SAFE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SafeBank is ReentrancyGuard, Ownable {
    mapping(address => uint256) public balances;

    constructor() Ownable(msg.sender) {}

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient");
        balances[msg.sender] -= amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");
    }
}`;

const W = { critical: 25, high: 15, medium: 8, low: 3 };

export function runDemoScan(code) {
  const lines = code.split('\n');
  const findings = [];
  const add = (line, severity, title, fix) => findings.push({ line, severity, title, fix });

  const hasGuard = /nonReentrant|ReentrancyGuard/.test(code);
  const hasAccess = /onlyOwner|Ownable|AccessControl|require\s*\(\s*msg\.sender\s*==/.test(code);
  const pragma = code.match(/pragma\s+solidity\s+[\^~>=<\s]*0\.(\d+)\./);
  const oldSolidity = pragma && parseInt(pragma[1], 10) < 8;

  lines.forEach((raw, i) => {
    const n = i + 1;
    const l = raw.trim();
    if (l.startsWith('//')) return;

    if (/\.call\s*\{\s*value|\.call\.value\s*\(/.test(l) && !hasGuard) {
      const after = lines.slice(i + 1, i + 8).join('\n');
      if (/(-=|=\s*0)\s*;?/.test(after) && /balances?\[/.test(after)) {
        add(n, 'critical', 'Reentrancy: state updated after external call', 'Update balances before calling out, or add nonReentrant.');
      }
    }
    if (/tx\.origin/.test(l)) add(n, 'high', 'tx.origin used for authorization', 'Use msg.sender instead.');
    if (/selfdestruct\s*\(|suicide\s*\(/.test(l)) {
      add(n, hasAccess ? 'medium' : 'critical', hasAccess ? 'selfdestruct is deprecated' : 'Unprotected selfdestruct', 'Remove selfdestruct, or restrict it with onlyOwner.');
    }
    if (/delegatecall/.test(l)) add(n, 'high', 'delegatecall can overwrite your storage', 'Only delegatecall to trusted, immutable addresses.');
    if (/keccak256|blockhash/.test(l) && /block\.(timestamp|difficulty|number|prevrandao)|blockhash/.test(l)) {
      add(n, 'medium', 'Weak randomness from block data', 'Use Chainlink VRF.');
    } else if (/block\.timestamp|\bnow\b/.test(l)) {
      add(n, 'low', 'Timestamp dependence', 'Avoid exact time comparisons.');
    }
    if (/\.send\s*\(|\.transfer\s*\(/.test(l) && !/require|if\s*\(/.test(l)) {
      add(n, 'medium', 'Unchecked / gas-limited transfer', 'Use call and check the result.');
    }
    if (/\.call\s*\(/.test(l) && !/\(\s*bool|require|if\s*\(/.test(l)) {
      add(n, 'medium', 'Return value of low-level call ignored', 'Capture the bool and require() it.');
    }
  });

  if (oldSolidity) {
    const pl = lines.findIndex((x) => /pragma\s+solidity/.test(x)) + 1;
    add(pl, 'high', 'Solidity < 0.8: no built-in overflow checks', 'Upgrade to ^0.8.20.');
  }

  findings.sort((a, b) => a.line - b.line);
  const penalty = findings.reduce((s, f) => s + W[f.severity], 0);
  const score = Math.max(0, 100 - penalty);
  const counts = findings.reduce((a, f) => ({ ...a, [f.severity]: (a[f.severity] || 0) + 1 }), {});
  return { findings, score, counts };
}
