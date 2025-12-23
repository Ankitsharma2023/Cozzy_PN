const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // USDC address on Base Sepolia testnet
  // For mainnet, use the actual USDC contract address
  // Determine USDC address based on network
  let USDC_ADDRESS = process.env.USDC_ADDRESS;

  if (!USDC_ADDRESS) {
    const network = hre.network.name;
    if (network === "base") {
      USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base Mainnet USDC
    } else {
      USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC
    }
  }

  console.log("Using USDC Address:", USDC_ADDRESS);

  // Deploy X4PNToken
  console.log("\nDeploying X4PNToken...");
  const X4PNToken = await ethers.getContractFactory("X4PNToken");
  const x4pnToken = await X4PNToken.deploy();
  await x4pnToken.waitForDeployment();
  const x4pnTokenAddress = await x4pnToken.getAddress();
  console.log("X4PNToken deployed to:", x4pnTokenAddress);

  // Deploy X4PNVpnSessions
  console.log("\nDeploying X4PNVpnSessions...");
  const X4PNVpnSessions = await ethers.getContractFactory("X4PNVpnSessions");
  const vpnSessions = await X4PNVpnSessions.deploy(
    USDC_ADDRESS,
    x4pnTokenAddress,
    deployer.address // Fee recipient
  );
  await vpnSessions.waitForDeployment();
  const vpnSessionsAddress = await vpnSessions.getAddress();
  console.log("X4PNVpnSessions deployed to:", vpnSessionsAddress);

  // Add VpnSessions contract as minter for X4PN token
  console.log("\nAdding VpnSessions as minter...");
  try {
    const addMinterTx = await x4pnToken.addMinter(vpnSessionsAddress);
    await addMinterTx.wait();
    console.log("VpnSessions added as minter");
  } catch (error) {
    console.warn("Failed to add minter (are you owner?):", error.message);
  }

  console.log("\n========================================");
  console.log("DEPLOYMENT COMPLETE");
  console.log("========================================");
  console.log("Network:", hre.network.name);
  console.log("X4PNToken:", x4pnTokenAddress);
  console.log("X4PNVpnSessions:", vpnSessionsAddress);
  console.log("USDC:", USDC_ADDRESS);
  console.log("Fee Recipient:", deployer.address);
  console.log("========================================");

  // Verification instructions
  console.log("\nTo verify locally (example):");
  console.log(`npx hardhat verify --network ${hre.network.name} ${x4pnTokenAddress}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${vpnSessionsAddress} "${USDC_ADDRESS}" "${x4pnTokenAddress}" "${deployer.address}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
