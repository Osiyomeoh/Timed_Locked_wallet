import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("LockedWallet", function () {
  async function deployLockedWalletFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const LockedWallet = await ethers.getContractFactory("LockedWallet");
    const lockedWallet = await LockedWallet.deploy();

    return { lockedWallet, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { lockedWallet, owner } = await loadFixture(deployLockedWalletFixture);
      expect(await lockedWallet.owner()).to.equal(owner.address);
    });

    it("Should start with no deposits", async function () {
      const { lockedWallet } = await loadFixture(deployLockedWalletFixture);
      expect(await lockedWallet.getDepositsCount()).to.equal(0);
    });
  });

  describe("Deposits", function () {
    it("Should allow deposits", async function () {
      const { lockedWallet, owner } = await loadFixture(deployLockedWalletFixture);
      const depositAmount = ethers.parseEther("1");
      const unlockTime = (await time.latest()) + 365 * 24 * 60 * 60; // 1 year from now

      await expect(lockedWallet.deposit(unlockTime, { value: depositAmount }))
        .to.emit(lockedWallet, "NewDeposit")
        .withArgs(owner.address, depositAmount, unlockTime);

      expect(await lockedWallet.getDepositsCount()).to.equal(1);
    });

    it("Should not allow deposits with zero amount", async function () {
      const { lockedWallet } = await loadFixture(deployLockedWalletFixture);
      const unlockTime = (await time.latest()) + 365 * 24 * 60 * 60;

      await expect(lockedWallet.deposit(unlockTime, { value: 0 }))
        .to.be.revertedWith("Deposit amount must be greater than 0");
    });

    it("Should not allow deposits with past unlock time", async function () {
      const { lockedWallet } = await loadFixture(deployLockedWalletFixture);
      const depositAmount = ethers.parseEther("1");
      const pastUnlockTime = await time.latest() - 1;

      await expect(lockedWallet.deposit(pastUnlockTime, { value: depositAmount }))
        .to.be.revertedWith("Unlock time must be in the future");
    });
  });

  describe("Withdrawals", function () {
    it("Should not allow withdrawals before unlock time", async function () {
      const { lockedWallet } = await loadFixture(deployLockedWalletFixture);
      const depositAmount = ethers.parseEther("1");
      const unlockTime = (await time.latest()) + 365 * 24 * 60 * 60;

      await lockedWallet.deposit(unlockTime, { value: depositAmount });

      await expect(lockedWallet.withdraw(0)).to.be.revertedWith("Funds are still locked");
    });

    // it("Should allow withdrawals after unlock time", async function () {
    //   const { lockedWallet, owner } = await loadFixture(deployLockedWalletFixture);
    //   const depositAmount = ethers.parseEther("1");
    //   const unlockTime = (await time.latest()) + 365 * 24 * 60 * 60; // 1 year from now

    //   await lockedWallet.deposit(unlockTime, { value: depositAmount });
      
    //   // Increase time to just after the unlock time
    //   await time.increaseTo(unlockTime + 1);

    //   const initialBalance = await ethers.provider.getBalance(owner.address);

    //   const tx = await lockedWallet.withdraw(0);
    //   const receipt = await tx.wait();

    //   // Calculate gas cost
    //   const gasCost = (receipt?.gasUsed ?? 0n) * (receipt?.gasPrice ?? 0n);

    //   const finalBalance = await ethers.provider.getBalance(owner.address);

    //   // Check that the balance has increased by approximately the deposit amount
    //   // (accounting for gas costs and potential small discrepancies due to reward calculation)
    //   expect(finalBalance).to.be.closeTo(
    //     initialBalance + depositAmount,
    //     ethers.parseEther("0.01") // Allow for a small discrepancy
    //   );

    //   // Check that the deposit has been removed
    //   expect(await lockedWallet.getDepositsCount()).to.equal(0);
    // });

    it("Should not allow non-owners to withdraw", async function () {
      const { lockedWallet, otherAccount } = await loadFixture(deployLockedWalletFixture);
      const depositAmount = ethers.parseEther("1");
      const unlockTime = (await time.latest()) + 365 * 24 * 60 * 60;

      await lockedWallet.deposit(unlockTime, { value: depositAmount });
      await time.increaseTo(unlockTime);

      await expect(lockedWallet.connect(otherAccount).withdraw(0))
        .to.be.revertedWith("Not the owner");
    });
  });

  describe("Rewards", function () {
    it("Should calculate rewards correctly", async function () {
      const { lockedWallet } = await loadFixture(deployLockedWalletFixture);
      const depositAmount = ethers.parseEther("1");
      const unlockTime = (await time.latest()) + 365 * 24 * 60 * 60;

      await lockedWallet.deposit(unlockTime, { value: depositAmount });
      
      // Increase time by 6 months
      await time.increase(365 * 24 * 60 * 60 / 2);

      const expectedReward = depositAmount * BigInt(5) * BigInt(365 * 24 * 60 * 60 / 2) / (BigInt(365) * BigInt(24) * BigInt(60) * BigInt(60) * BigInt(100));
      expect(await lockedWallet.calculateReward(0)).to.be.closeTo(expectedReward, ethers.parseEther("0.0001"));
    });

    it("Should include rewards in total balance", async function () {
      const { lockedWallet } = await loadFixture(deployLockedWalletFixture);
      const depositAmount = ethers.parseEther("1");
      const unlockTime = (await time.latest()) + 365 * 24 * 60 * 60;

      await lockedWallet.deposit(unlockTime, { value: depositAmount });
      await time.increaseTo(unlockTime);

      const totalBalance = await lockedWallet.getTotalBalance();
      expect(totalBalance).to.be.gt(depositAmount);
    });
  });

  describe("Utility Functions", function () {
    it("Should return correct deposits count", async function () {
      const { lockedWallet } = await loadFixture(deployLockedWalletFixture);
      const depositAmount = ethers.parseEther("1");
      const unlockTime = (await time.latest()) + 365 * 24 * 60 * 60;

      expect(await lockedWallet.getDepositsCount()).to.equal(0);

      await lockedWallet.deposit(unlockTime, { value: depositAmount });
      expect(await lockedWallet.getDepositsCount()).to.equal(1);

      await lockedWallet.deposit(unlockTime, { value: depositAmount });
      expect(await lockedWallet.getDepositsCount()).to.equal(2);
    });
  });
});