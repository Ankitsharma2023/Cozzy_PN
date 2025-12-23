const hre = require("hardhat");

async function main() {
    console.log("🚀 Starting Production Deployment...");

    // 1. Safety Checks
    const network = hre.network.name;
    console.log(`Network: ${network}`);

    if (network === "hardhat" || network === "localhost") {
        console.warn("⚠️  Warning: Deploying to local network. For production, use --network base");
    } else {
        // Check for real funds and keys
        if (!process.env.DEPLOYER_PRIVATE_KEY) {
            throw new Error("❌ DEPLOYER_PRIVATE_KEY is missing in .env");
        }
        const [deployer] = await hre.ethers.getSigners();
        const balance = await deployer.provider.getBalance(deployer.address);
        console.log(`Deployer: ${deployer.address}`);
        console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH`);

        if (balance.toString() === "0") {
            throw new Error("❌ Insufficient funds for deployment");
        }
    }

    // 2. Deploy X4PN Token
    console.log("\nDeploying X4PN Token...");
    const X4PNToken = await hre.ethers.getContractFactory("X4PNToken");
    const token = await X4PNToken.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log(`✅ X4PNToken deployed to: ${tokenAddress}`);

    // 3. Deploy Sessions Contract
    console.log("\nDeploying VPN Sessions Contract...");
    // Production Config
    const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base USDC
    const FEE_RECIPIENT = process.env.FEE_RECIPIENT || (await hre.ethers.getSigners())[0].address;

    const Sessions = await hre.ethers.getContractFactory("X4PNVpnSessions");
    const sessions = await Sessions.deploy(USDC_ADDRESS, tokenAddress, FEE_RECIPIENT);
    await sessions.waitForDeployment();
    const sessionsAddress = await sessions.getAddress();
    console.log(`✅ X4PNVpnSessions deployed to: ${sessionsAddress}`);

    // 4. Post-Deployment Setup
    console.log("\nConfiguring Contracts...");
    // Grant Minter Role to Sessions Contract
    const tx = await token.addMinter(sessionsAddress);
    await tx.wait();
    console.log("✅ Sessions contract authorized as Minter");

    // 5. Verification (Basescan)
    if (network !== "hardhat" && network !== "localhost" && process.env.BASESCAN_API_KEY) {
        console.log("\nWaiting for block confirmations before verification...");
        // Wait ~6 blocks
        await sessions.deploymentTransaction().wait(6);

        console.log("Verifying Token...");
        try {
            await hre.run("verify:verify", {
                address: tokenAddress,
                constructorArguments: [],
            });
        } catch (e) {
            console.log("Verification checks failed (already verified?):", e.message);
        }

        console.log("Verifying Sessions...");
        try {
            await hre.run("verify:verify", {
                address: sessionsAddress,
                constructorArguments: [USDC_ADDRESS, tokenAddress, FEE_RECIPIENT],
            });
        } catch (e) {
            console.log("Verification checks failed:", e.message);
        }
    }

    console.log("\n🎉 Deployment Complete!");
    console.log("----------------------------------------------------");
    console.log(`X4PN_TOKEN_ADDRESS=${tokenAddress}`);
    console.log(`VPN_SESSIONS_ADDRESS=${sessionsAddress}`);
    console.log("----------------------------------------------------");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
