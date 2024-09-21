import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LockedWalletModule = buildModule("LockedWalletModule", (m) => {
  const lockedWallet = m.contract("LockedWallet", []);

  return { lockedWallet };
});

export default LockedWalletModule;
