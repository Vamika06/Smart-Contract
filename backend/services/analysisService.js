import { v4 as uuidv4 } from 'uuid';

const VULNERABILITY_PATTERNS = [
  {
    id: 'reentrancy',
    name: 'Reentrancy Attack',
    severity: 'critical',
    category: 'Reentrancy',
    cwe: 'CWE-841',
    owasp: 'OWASP SC-01',
    tool: 'static',
    patterns: [
      /\.call\{value:/gi,
      /\.transfer\(/gi,
      /\.send\(/gi,
    ],
    stateChangeAfterCall: /\.(call|transfer|send)\(.*\)[\s\S]{0,200}(balances|balance|mapping|storage)\s*[\[\=]/i,
    description: 'External calls made before state updates allow attackers to re-enter the function and drain funds.',
    recommendation: 'Use the Checks-Effects-Interactions pattern. Update state before making external calls. Consider using ReentrancyGuard from OpenZeppelin.',
  },
  {
    id: 'integer_overflow',
    name: 'Integer Overflow/Underflow',
    severity: 'high',
    category: 'Arithmetic',
    cwe: 'CWE-190',
    owasp: 'OWASP SC-02',
    tool: 'static',
    patterns: [/pragma solidity\s+[^;]*0\.[0-7]\./i],
    checkUnsafe: true,
    description: 'Arithmetic operations can overflow or underflow in Solidity versions < 0.8.0 without SafeMath.',
    recommendation: 'Use Solidity 0.8.0+ which has built-in overflow checks. For older versions, use OpenZeppelin SafeMath library.',
  },
  {
    id: 'tx_origin',
    name: 'tx.origin Authentication',
    severity: 'high',
    category: 'Access Control',
    cwe: 'CWE-284',
    owasp: 'OWASP SC-03',
    tool: 'static',
    patterns: [/tx\.origin/gi],
    description: 'Using tx.origin for authentication is dangerous as it can be manipulated by intermediate contracts in phishing attacks.',
    recommendation: 'Replace tx.origin with msg.sender for authorization checks.',
  },
  {
    id: 'timestamp_dependency',
    name: 'Timestamp Dependency',
    severity: 'medium',
    category: 'Time Manipulation',
    cwe: 'CWE-330',
    owasp: 'OWASP SC-04',
    tool: 'static',
    patterns: [/block\.timestamp/gi, /now\b/gi],
    description: 'Miners can manipulate block.timestamp by up to 900 seconds, making time-dependent logic exploitable.',
    recommendation: 'Avoid using block.timestamp for critical decisions. If required, use a tolerance range and consider Chainlink oracle for trusted time.',
  },
  {
    id: 'delegatecall',
    name: 'Delegatecall Misuse',
    severity: 'critical',
    category: 'Code Injection',
    cwe: 'CWE-829',
    owasp: 'OWASP SC-05',
    tool: 'static',
    patterns: [/\.delegatecall\(/gi],
    description: 'Uncontrolled delegatecall allows untrusted contracts to execute arbitrary code in the context of the calling contract, potentially hijacking storage.',
    recommendation: 'Avoid delegatecall to untrusted contracts. If needed, use it with whitelisted contracts only. Validate the target address.',
  },
  {
    id: 'selfdestruct',
    name: 'Selfdestruct Misuse',
    severity: 'high',
    category: 'Denial of Service',
    cwe: 'CWE-693',
    owasp: 'OWASP SC-06',
    tool: 'static',
    patterns: [/selfdestruct\(/gi, /suicide\(/gi],
    description: 'selfdestruct can permanently destroy the contract and forcibly send Ether to any address, bypassing receive() and fallback() functions.',
    recommendation: 'Restrict selfdestruct to authorized owner-only access with multi-sig or timelock. Consider removing it entirely.',
  },
  {
    id: 'unchecked_call',
    name: 'Unchecked External Call',
    severity: 'high',
    category: 'Error Handling',
    cwe: 'CWE-252',
    owasp: 'OWASP SC-07',
    tool: 'static',
    patterns: [/(?<!require\()(?<!if\s*\()\.send\(|(?<!require\()(?<!if\s*\()\.call\{/gi],
    description: 'The return value of external calls (send, call, transfer) is not checked, allowing silent failures.',
    recommendation: 'Always check return values of external calls. Use require() to validate success. Prefer transfer() which reverts on failure.',
  },
  {
    id: 'weak_randomness',
    name: 'Weak Randomness',
    severity: 'high',
    category: 'Randomness',
    cwe: 'CWE-338',
    owasp: 'OWASP SC-08',
    tool: 'static',
    patterns: [/blockhash\(/gi, /block\.difficulty/gi, /block\.number.*%/gi, /keccak256.*block\./gi],
    description: 'Using blockchain parameters (blockhash, block.difficulty) as randomness sources is predictable and manipulable by miners.',
    recommendation: 'Use Chainlink VRF (Verifiable Random Function) for secure on-chain randomness. Avoid block variables for randomness.',
  },
  {
    id: 'access_control',
    name: 'Missing Access Control',
    severity: 'high',
    category: 'Access Control',
    cwe: 'CWE-284',
    owasp: 'OWASP SC-09',
    tool: 'static',
    patterns: [
      /function\s+\w+\s*\([^)]*\)\s*public\s*(?!.*(?:onlyOwner|require|modifier|view|pure))/gi,
    ],
    description: 'Sensitive functions lack proper access controls, allowing unauthorized users to call critical operations.',
    recommendation: 'Implement role-based access control using OpenZeppelin Ownable or AccessControl. Add onlyOwner or role modifiers to sensitive functions.',
  },
  {
    id: 'front_running',
    name: 'Front-Running Vulnerability',
    severity: 'medium',
    category: 'Transaction Ordering',
    cwe: 'CWE-362',
    owasp: 'OWASP SC-10',
    tool: 'static',
    patterns: [/approve\s*\(/gi],
    description: 'The approve() function in ERC-20 tokens is susceptible to front-running attacks where an attacker can spend both old and new allowances.',
    recommendation: 'Use increaseAllowance/decreaseAllowance instead of approve(). Implement commit-reveal schemes or use EIP-712 permit pattern.',
  },
  {
    id: 'dos',
    name: 'Denial of Service',
    severity: 'medium',
    category: 'Denial of Service',
    cwe: 'CWE-400',
    owasp: 'OWASP SC-11',
    tool: 'static',
    patterns: [/for\s*\([^)]*\+\+[^)]*\)\s*\{[\s\S]{0,500}\.transfer\(/gi, /for\s*\([^)]*\)\s*\{[\s\S]{0,200}\.call\(/gi],
    description: 'Loops that call external contracts can run out of gas if the array grows too large, permanently blocking contract execution.',
    recommendation: 'Avoid unbounded loops with external calls. Use pull payment patterns (withdrawal pattern) instead of push payments.',
  },
  {
    id: 'uninitialized_storage',
    name: 'Uninitialized Storage Variable',
    severity: 'high',
    category: 'Uninitialized Variables',
    cwe: 'CWE-824',
    owasp: 'OWASP SC-12',
    tool: 'static',
    patterns: [/\bstorage\b[^;]{0,50}=[^=]/gi],
    description: 'Uninitialized local storage variables point to slot 0 of storage, potentially corrupting contract state.',
    recommendation: 'Always initialize storage variables. Use memory keyword for local variables. Avoid storage references to uninitialized data.',
  },
  {
    id: 'gas_optimization',
    name: 'Gas Optimization Issues',
    severity: 'informational',
    category: 'Gas Optimization',
    cwe: 'CWE-405',
    owasp: 'OWASP SC-13',
    tool: 'static',
    patterns: [
      /string\s+public/gi,
      /uint256\[\]/gi,
    ],
    description: 'Contract contains patterns that could lead to excessive gas consumption, increasing transaction costs.',
    recommendation: 'Use uint256 instead of smaller uints. Use bytes32 instead of string where possible. Pack struct variables. Use events instead of storage for historical data.',
  },
];

function getLineNumber(code, index) {
  return code.substring(0, index).split('\n').length;
}

function extractCodeSnippet(lines, lineNumber, context = 2) {
  const start = Math.max(0, lineNumber - context - 1);
  const end = Math.min(lines.length, lineNumber + context);
  return lines.slice(start, end).map((l, i) => `${start + i + 1}: ${l}`).join('\n');
}

export function analyzeContract(sourceCode) {
  const vulnerabilities = [];
  const lines = sourceCode.split('\n');

  const pragmaMatch = sourceCode.match(/pragma solidity\s+([^;]+);/i);
  const compilerVersion = pragmaMatch ? pragmaMatch[1].trim() : 'unknown';
  const linesOfCode = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;

  for (const vuln of VULNERABILITY_PATTERNS) {
    const foundLines = new Set();

    for (const pattern of vuln.patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(sourceCode)) !== null) {
        const lineNum = getLineNumber(sourceCode, match.index);
        if (!foundLines.has(lineNum)) {
          foundLines.add(lineNum);
        }
      }
    }

    if (vuln.id === 'reentrancy') {
      const hasExternalCall = /\.call\{value:/gi.test(sourceCode);
      const stateAfterCall = /\.call\{value:[^}]+\}[^;]+;[\s\S]{0,500}(balances|balance\[|_balances|userBalance)/i.test(sourceCode);
      if (!hasExternalCall && !stateAfterCall) foundLines.clear();
    }

    if (vuln.id === 'integer_overflow') {
      const isOldVersion = /pragma solidity\s+[^;]*0\.[0-7]\./i.test(sourceCode);
      const usesSafeMath = /SafeMath/i.test(sourceCode) || /using SafeMath/i.test(sourceCode);
      if (!isOldVersion || usesSafeMath) foundLines.clear();
    }

    if (vuln.id === 'access_control') {
      const funcs = [];
      const funcRegex = /function\s+(\w+)\s*\([^)]*\)\s*public(?!\s*(?:view|pure))/gi;
      let fMatch;
      while ((fMatch = funcRegex.exec(sourceCode)) !== null) {
        const funcBody = sourceCode.substring(fMatch.index, fMatch.index + 300);
        const hasModifier = /onlyOwner|onlyAdmin|require\s*\(|modifier\s+\w+/i.test(funcBody);
        const isSetter = /set|update|mint|burn|withdraw|transfer|pause|upgrade/i.test(fMatch[1]);
        if (!hasModifier && isSetter) {
          funcs.push(getLineNumber(sourceCode, fMatch.index));
        }
      }
      foundLines.clear();
      funcs.forEach(l => foundLines.add(l));
    }

    if (foundLines.size > 0) {
      const firstLine = Math.min(...foundLines);
      vulnerabilities.push({
        id: uuidv4(),
        ...vuln,
        lineNumber: firstLine,
        lineNumbers: [...foundLines].sort((a, b) => a - b),
        codeSnippet: extractCodeSnippet(lines, firstLine),
        patterns: undefined,
        stateChangeAfterCall: undefined,
        checkUnsafe: undefined,
      });
    }
  }

  const summary = {
    critical: vulnerabilities.filter(v => v.severity === 'critical').length,
    high: vulnerabilities.filter(v => v.severity === 'high').length,
    medium: vulnerabilities.filter(v => v.severity === 'medium').length,
    low: vulnerabilities.filter(v => v.severity === 'low').length,
    informational: vulnerabilities.filter(v => v.severity === 'informational').length,
    total: vulnerabilities.length,
  };

  let score = 100;
  score -= summary.critical * 20;
  score -= summary.high * 12;
  score -= summary.medium * 6;
  score -= summary.low * 2;
  score -= summary.informational * 0.5;
  score = Math.max(0, Math.round(score));

  let riskLevel;
  if (score >= 90) riskLevel = 'excellent';
  else if (score >= 75) riskLevel = 'good';
  else if (score >= 60) riskLevel = 'moderate';
  else if (score >= 40) riskLevel = 'high';
  else riskLevel = 'critical';

  return { vulnerabilities, summary, securityScore: score, riskLevel, compilerVersion, linesOfCode };
}
