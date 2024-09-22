// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract LockedWallet {
    address public owner;
    uint256 public constant REWARD_RATE = 5; // 5% annual reward rate

    struct Deposit {
        uint256 amount;
        uint256 unlockTime;
        uint256 depositTime;
        bool withdrawn;
    }

    mapping(uint256 => Deposit) public deposits;
    uint256[] public depositIndexes;

    event NewDeposit(address indexed from, uint256 indexed depositId, uint256 amount, uint256 unlockTime);
    event Withdrawal(address indexed to, uint256 indexed depositId, uint256 amount, uint256 reward);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    function deposit(uint256 _unlockTime) external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        require(_unlockTime > block.timestamp, "Unlock time must be in the future");
        
        uint256 depositId = depositIndexes.length;
        deposits[depositId] = Deposit({
            amount: msg.value,
            unlockTime: _unlockTime,
            depositTime: block.timestamp,
            withdrawn: false
        });
        depositIndexes.push(depositId);

        emit NewDeposit(msg.sender, depositId, msg.value, _unlockTime);
    }

    function withdraw(uint256 _depositId) external onlyOwner {
        require(_depositId < depositIndexes.length, "Invalid deposit ID");
        Deposit storage dep = deposits[_depositId];
        require(!dep.withdrawn, "Deposit already withdrawn");
        require(block.timestamp >= dep.unlockTime, "Funds are still locked");

        uint256 reward = calculateReward(_depositId);
        uint256 totalAmount = dep.amount + reward;
        
        // Mark as withdrawn before transferring to prevent reentrancy
        dep.withdrawn = true;
        
        (bool success, ) = payable(owner).call{value: totalAmount}("");
        require(success, "Transfer failed");
        
        emit Withdrawal(owner, _depositId, dep.amount, reward);
    }

    function calculateReward(uint256 _depositId) public view returns (uint256) {
        Deposit storage dep = deposits[_depositId];
        require(!dep.withdrawn, "Deposit already withdrawn");
        uint256 lockDuration = block.timestamp - dep.depositTime;
        return (dep.amount * REWARD_RATE * lockDuration) / (365 days * 100);
    }

    function getTotalBalance() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < depositIndexes.length; i++) {
            Deposit storage dep = deposits[depositIndexes[i]];
            if (!dep.withdrawn) {
                total += dep.amount + calculateReward(depositIndexes[i]);
            }
        }
        return total;
    }

    function getDepositsCount() external view returns (uint256) {
        return depositIndexes.length;
    }

    function getActiveDepositsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < depositIndexes.length; i++) {
            if (!deposits[depositIndexes[i]].withdrawn) {
                count++;
            }
        }
        return count;
    }
}

