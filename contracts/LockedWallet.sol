// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract LockedWallet {
    address public owner;
    uint256 public constant REWARD_RATE = 5; // 5% annual reward rate

    struct Deposit {
        uint256 amount;
        uint256 unlockTime;
        uint256 depositTime;
    }

    Deposit[] public deposits;

    event NewDeposit(address indexed from, uint256 amount, uint256 unlockTime);
    event Withdrawal(address indexed to, uint256 amount, uint256 reward);

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
        
        deposits.push(Deposit({
            amount: msg.value,
            unlockTime: _unlockTime,
            depositTime: block.timestamp
        }));

        emit NewDeposit(msg.sender, msg.value, _unlockTime);
    }

    function withdraw(uint256 _index) external onlyOwner {
        require(_index < deposits.length, "Invalid deposit index");
        Deposit storage dep = deposits[_index];
        require(block.timestamp >= dep.unlockTime, "Funds are still locked");

        uint256 reward = calculateReward(_index);
        uint256 totalAmount = dep.amount + reward;
        
        // Remove the deposit before transferring to prevent reentrancy
        deposits[_index] = deposits[deposits.length - 1];
        deposits.pop();
        
        (bool success, ) = payable(owner).call{value: totalAmount}("");
        require(success, "Transfer failed");
        
        emit Withdrawal(owner, dep.amount, reward);
    }

    function calculateReward(uint256 _index) public view returns (uint256) {
        Deposit storage dep = deposits[_index];
        uint256 lockDuration = block.timestamp - dep.depositTime;
        return (dep.amount * REWARD_RATE * lockDuration) / (365 days * 100);
    }

    function getTotalBalance() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < deposits.length; i++) {
            total += deposits[i].amount + calculateReward(i);
        }
        return total;
    }

    function getDepositsCount() external view returns (uint256) {
        return deposits.length;
    }
}

