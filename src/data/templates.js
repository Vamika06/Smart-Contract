export const TEMPLATES = [
  {
    id: 'erc20',
    name: 'Secure ERC-20 Token',
    category: 'Token',
    gradient: 'from-violet-500 to-fuchsia-500',
    emoji: '🪙',
    description: 'Capped-supply fungible token with owner-only minting and burn support.',
    badges: ['OpenZeppelin', 'Ownable', 'Capped'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SecureToken is ERC20, ERC20Burnable, Ownable {
    uint256 public immutable MAX_SUPPLY;

    constructor(string memory name_, string memory symbol_, uint256 maxSupply_)
        ERC20(name_, symbol_)
        Ownable(msg.sender)
    {
        require(maxSupply_ > 0, "Max supply is zero");
        MAX_SUPPLY = maxSupply_;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Cap exceeded");
        _mint(to, amount);
    }
}`,
  },
  {
    id: 'vault',
    name: 'Reentrancy-Safe Vault',
    category: 'DeFi',
    gradient: 'from-cyan-500 to-blue-500',
    emoji: '🏦',
    description: 'ETH vault using checks-effects-interactions and a reentrancy guard.',
    badges: ['ReentrancyGuard', 'CEI', 'Pausable'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SafeVault is ReentrancyGuard, Pausable, Ownable {
    mapping(address => uint256) public balances;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function deposit() external payable whenNotPaused {
        require(msg.value > 0, "Zero deposit");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}`,
  },
  {
    id: 'multisig',
    name: 'Minimal Multisig Wallet',
    category: 'Wallet',
    gradient: 'from-emerald-500 to-teal-500',
    emoji: '🔐',
    description: 'M-of-N approval wallet. Transactions execute only after enough owners confirm.',
    badges: ['M-of-N', 'Events', 'No tx.origin'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MiniMultisig {
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public immutable required;

    struct Tx { address to; uint256 value; bytes data; bool executed; uint256 confirms; }
    Tx[] public txs;
    mapping(uint256 => mapping(address => bool)) public confirmed;

    event Submitted(uint256 indexed id);
    event Executed(uint256 indexed id);

    modifier onlyOwner() { require(isOwner[msg.sender], "Not owner"); _; }

    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 0 && _required > 0 && _required <= _owners.length, "Bad config");
        for (uint256 i = 0; i < _owners.length; i++) {
            address o = _owners[i];
            require(o != address(0) && !isOwner[o], "Bad owner");
            isOwner[o] = true;
            owners.push(o);
        }
        required = _required;
    }

    receive() external payable {}

    function submit(address to, uint256 value, bytes calldata data) external onlyOwner {
        txs.push(Tx(to, value, data, false, 0));
        emit Submitted(txs.length - 1);
    }

    function confirm(uint256 id) external onlyOwner {
        require(!confirmed[id][msg.sender], "Already confirmed");
        confirmed[id][msg.sender] = true;
        txs[id].confirms += 1;
    }

    function execute(uint256 id) external onlyOwner {
        Tx storage t = txs[id];
        require(!t.executed && t.confirms >= required, "Not ready");
        t.executed = true;
        (bool ok, ) = t.to.call{value: t.value}(t.data);
        require(ok, "Call failed");
        emit Executed(id);
    }
}`,
  },
  {
    id: 'vesting',
    name: 'Token Vesting Schedule',
    category: 'Token',
    gradient: 'from-amber-500 to-orange-500',
    emoji: '⏳',
    description: 'Linear vesting with a cliff. Beneficiaries claim unlocked tokens over time.',
    badges: ['Cliff', 'Linear', 'SafeERC20'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract LinearVesting {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public immutable beneficiary;
    uint64 public immutable start;
    uint64 public immutable cliff;
    uint64 public immutable duration;
    uint256 public released;

    constructor(IERC20 t, address b, uint64 cliffSec, uint64 durationSec) {
        require(b != address(0) && durationSec >= cliffSec && durationSec > 0, "Bad params");
        token = t; beneficiary = b;
        start = uint64(block.timestamp);
        cliff = start + cliffSec;
        duration = durationSec;
    }

    function vested() public view returns (uint256) {
        uint256 total = token.balanceOf(address(this)) + released;
        if (block.timestamp < cliff) return 0;
        if (block.timestamp >= start + duration) return total;
        return (total * (block.timestamp - start)) / duration;
    }

    function release() external {
        uint256 amount = vested() - released;
        require(amount > 0, "Nothing to release");
        released += amount;
        token.safeTransfer(beneficiary, amount);
    }
}`,
  },
  {
    id: 'nft',
    name: 'ERC-721 NFT Collection',
    category: 'NFT',
    gradient: 'from-pink-500 to-rose-500',
    emoji: '🖼️',
    description: 'Fixed-supply NFT with a per-wallet mint limit and withdrawable proceeds.',
    badges: ['ERC-721', 'Mint cap', 'Withdraw'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SafeNFT is ERC721, Ownable, ReentrancyGuard {
    uint256 public constant MAX_SUPPLY = 1000;
    uint256 public constant MAX_PER_WALLET = 5;
    uint256 public constant PRICE = 0.05 ether;
    uint256 public nextId;
    mapping(address => uint256) public minted;

    constructor() ERC721("SafeNFT", "SNFT") Ownable(msg.sender) {}

    function mint(uint256 qty) external payable nonReentrant {
        require(qty > 0 && nextId + qty <= MAX_SUPPLY, "Supply");
        require(minted[msg.sender] + qty <= MAX_PER_WALLET, "Wallet limit");
        require(msg.value == PRICE * qty, "Wrong payment");
        minted[msg.sender] += qty;
        for (uint256 i = 0; i < qty; i++) _safeMint(msg.sender, nextId++);
    }

    function withdraw() external onlyOwner {
        (bool ok, ) = owner().call{value: address(this).balance}("");
        require(ok, "Withdraw failed");
    }
}`,
  },
  {
    id: 'timelock',
    name: 'Governance Timelock',
    category: 'Governance',
    gradient: 'from-indigo-500 to-purple-500',
    emoji: '🗳️',
    description: 'Queue admin actions with a mandatory delay so users can react before execution.',
    badges: ['Delay', 'Queue/Execute', 'Cancel'],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleTimelock {
    address public admin;
    uint256 public constant DELAY = 2 days;
    mapping(bytes32 => uint256) public queuedAt;

    event Queued(bytes32 indexed id, uint256 eta);
    event Executed(bytes32 indexed id);
    event Cancelled(bytes32 indexed id);

    modifier onlyAdmin() { require(msg.sender == admin, "Not admin"); _; }

    constructor() { admin = msg.sender; }

    function queue(address target, uint256 value, bytes calldata data) external onlyAdmin returns (bytes32 id) {
        id = keccak256(abi.encode(target, value, data));
        require(queuedAt[id] == 0, "Already queued");
        queuedAt[id] = block.timestamp;
        emit Queued(id, block.timestamp + DELAY);
    }

    function execute(address target, uint256 value, bytes calldata data) external onlyAdmin {
        bytes32 id = keccak256(abi.encode(target, value, data));
        require(queuedAt[id] != 0 && block.timestamp >= queuedAt[id] + DELAY, "Too early");
        delete queuedAt[id];
        (bool ok, ) = target.call{value: value}(data);
        require(ok, "Failed");
        emit Executed(id);
    }

    function cancel(bytes32 id) external onlyAdmin {
        delete queuedAt[id];
        emit Cancelled(id);
    }
}`,
  },
];
