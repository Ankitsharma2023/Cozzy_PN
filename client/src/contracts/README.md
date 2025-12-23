# X4PN Contract Artifacts

This directory contains the compiled artifacts and deployment information for the X4PN smart contracts.

## Deployed Contracts

### X4PN Token
- **Network**: Base Mainnet
- **Address**: 0xd84612a360359cF85E991A01dEAbB3dc8ab121F8
- **ABI**: Included in X4PNToken.json

### X4PN VPN Sessions
- **Network**: Base Mainnet
- **Address**: 0xDFcb0654919A4AE22eCfF196cd015F156053fd6D
- **ABI**: Included in X4PNVpnSessions.json
## Usage

To use these artifacts in your frontend or backend code:

```javascript
import { x4pnToken, x4pnVpnSessions } from './artifacts';

// Access the ABI
const tokenAbi = x4pnToken.abi;
const sessionsAbi = x4pnVpnSessions.abi;

// Access the contract addresses
const tokenAddress = "0xd84612a360359cF85E991A01dEAbB3dc8ab121F8"; // Base Address
const sessionsAddress = "0xDFcb0654919A4AE22eCfF196cd015F156053fd6D"; // Base Address
```

### Frontend Integration

The frontend can interact with the contracts directly using ethers.js:

```typescript
import { ethers } from 'ethers';
import { x4pnToken, x4pnVpnSessions } from './artifacts';

// Get contract instances
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const tokenContract = new ethers.Contract(
  "0xd84612a360359cF85E991A01dEAbB3dc8ab121F8",
  x4pnToken, // ABI
  signer
);

const sessionsContract = new ethers.Contract(
  "0xDFcb0654919A4AE22eCfF196cd015F156053fd6D",
  x4pnVpnSessions, // ABI
  signer
);

// Example: Get user's X4PN balance
const balance = await tokenContract.balanceOf(userAddress);

// Example: Deposit USDC
const tx = await sessionsContract.deposit(amount);
await tx.wait(); // Wait for transaction confirmation
```

## Directory Structure

- `X4PNToken.json` - Contains ABI and deployment address for the X4PN Token contract
- `X4PNVpnSessions.json` - Contains ABI and deployment address for the VPN Sessions contract
- `index.js` - Export file for easy importing of all contracts