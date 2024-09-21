import { ethers } from "hardhat";

async function main() {
    const LockedWallet = await ethers.getContractAt("LockedWallet", "0x6eD381069DbFE527345983ebf78Ec0d595F39819");
    const owner = await ethers.provider.getSigner(0);
    const beneficiary = await ethers.provider.getSigner(1);

    try {
        // Get initial balances
        const initialOwnerBalance = await ethers.provider.getBalance(await owner.getAddress());
        const initialBeneficiaryBalance = await ethers.provider.getBalance(await beneficiary.getAddress());
        console.log("Initial Owner Balance:", ethers.formatEther(initialOwnerBalance));
        console.log("Initial Beneficiary Balance:", ethers.formatEther(initialBeneficiaryBalance));

        // Deposit funds
        const depositAmount = ethers.parseEther("0.0000001");
        const oneHour = 60 * 60;
        const unlockTime = Math.floor(Date.now() / 1000) + oneHour;
        let tx = await LockedWallet.connect(owner).deposit(unlockTime, { value: ethers.parseEther("0.000001")  });
        let receipt = await tx.wait();
        logEvent(LockedWallet, receipt, "NewDeposit");

        // Get contract balance
        const contractBalance = await ethers.provider.getBalance(LockedWallet);
        console.log("Contract Balance:", ethers.formatEther(contractBalance));

        // Try to withdraw before unlock time (should fail)
        try {
            await LockedWallet.connect(beneficiary).withdraw(0);
        } catch (error) {
            console.log("Withdrawal before unlock time failed as expected");
        }

     

        // Withdraw funds
        // tx = await LockedWallet.connect(owner).withdraw(0);
        // receipt = await tx.wait();
        // logEvent(LockedWallet, receipt, "Withdraw");

        // Get final balances
        const finalOwnerBalance = await ethers.provider.getBalance(await owner.getAddress());
        const finalBeneficiaryBalance = await ethers.provider.getBalance(await beneficiary.getAddress());
        console.log("Final Owner Balance:", ethers.formatEther(finalOwnerBalance));
        console.log("Final Beneficiary Balance:", ethers.formatEther(finalBeneficiaryBalance));

    } catch (error) {
        console.error("Error:", error);
    }
    function logEvent(contract: any, receipt: any, eventName: string) {
        if (receipt && receipt.logs) {
            for (const log of receipt.logs) {
                const parsedLog = contract.interface.parseLog(log);
                if (parsedLog && parsedLog.name === eventName) {
                    console.log("Event:", parsedLog.name, "Args:", parsedLog.args);
                }
            }
        }
    }
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});