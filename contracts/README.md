# X4PN VPN Smart Contracts

Smart contracts for the X4PN decentralized VPN network.

## Contracts

### X4PNToken.sol
ERC20 token used for rewards in the VPN network.
- Maximum supply: 1 billion tokens
- Initial mint: 100 million tokens to deployer
- Authorized minters can mint rewards for VPN usage

### X4PNVpnSessions.sol
Manages VPN sessions with micropayment streaming.
- Users deposit USDC to pay for VPN usage
- Real-time payment streaming to node operators
- X4PN token rewards for usage (10x multiplier)
- 5% platform fee on all payments

## Setup

1. Install dependencies:
```bash
cd contracts
npm install
```


2. Create `.env` file:
```env
DEPLOYER_PRIVATE_KEY=your_private_key_here
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_api_key_here
USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

3. Compile contracts:
```bash
npm run compile
```

## Deployment

### Local Testing
```bash
npm run node  # Start local node in one terminal
npm run deploy:local  # Deploy in another terminal
```

### Base Sepolia Testnet
```bash
npx hardhat run scripts/deploy.js --network base_sepolia
```

### Base Mainnet
```bash
npx hardhat run scripts/deploy.js --network base
```

## Contract Addresses

After deployment, save these addresses:

| Contract | Network | Address |
|----------|---------|---------|
| X4PNToken | Base | TBD |
| X4PNVpnSessions | Base | TBD |


## Usage Flow

1. **User deposits USDC**:
   - Approve USDC spending
   - Call `deposit(amount)`

2. **Start VPN session**:
   - Node operator must be registered
   - Call `startSession(nodeOperator, ratePerSecond)`

3. **Stream payments**:
   - Call `settleSession()` periodically
   - Pays node operator and mints X4PN rewards

4. **End session**:
   - Call `endSession()`
   - Settles remaining payment

5. **Withdraw unused USDC**:
   - Call `withdraw(amount)`

## Testing

```bash
npm run test
```

## Security Notes

- All contracts use OpenZeppelin's battle-tested implementations
- ReentrancyGuard protects against reentrancy attacks
- SafeERC20 prevents common token transfer issues
- Platform fees capped at 10%
- Owner functions are limited and well-documented
