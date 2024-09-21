# LockedWallet Smart Contract

## Overview

LockedWallet is a Solidity smart contract that allows users to deposit Ether, lock it for a specified period, and earn rewards based on the lock duration. The contract owner can manage deposits and withdrawals.

## Features

- Deposit Ether with a custom lock period
- Automatic reward calculation based on deposit amount and lock duration
- Withdrawal functionality for the owner
- View functions for total balance and number of deposits

## Contract Details

- SPDX-License-Identifier: UNLICENSED
- Solidity Version: ^0.8.24
- Annual Reward Rate: 5%

## Functions

### deposit(uint256 _unlockTime)
Allows users to deposit Ether and set an unlock time.

### withdraw(uint256 _index)
Enables the owner to withdraw a specific deposit along with its reward.

### calculateReward(uint256 _index)
Calculates the reward for a given deposit.

### getTotalBalance()
Returns the total balance of all deposits including rewards.

### getDepositsCount()
Returns the total number of deposits.

## Events

- NewDeposit(address indexed from, uint256 amount, uint256 unlockTime)
- Withdrawal(address indexed to, uint256 amount, uint256 reward)

## Usage

1. Deploy the contract
2. Users can deposit Ether using the `deposit` function
3. The owner can withdraw matured deposits using the `withdraw` function
4. Anyone can view the total balance and number of deposits

## Security Considerations

- Only the owner can withdraw funds
- Deposits are locked until their specified unlock time
- Reentrancy protection implemented in the withdrawal process

## License

This project is licensed under the UNLICENSED license.
