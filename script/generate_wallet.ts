import { ethers } from "ethers";
const wallet = ethers.Wallet.createRandom();
console.log(`PRIVATE_KEY=${wallet.privateKey}`);
console.log(`ADDRESS=${wallet.address}`);
