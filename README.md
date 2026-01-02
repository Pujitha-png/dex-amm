# dex-amm
A comprehensive Decentralized Exchange (DEX) implementation using Automated Market Maker (AMM) model with Solidity smart contracts, comprehensive test suite, and Docker support.

## Overview

This repository contains a complete implementation of a Decentralized Exchange (DEX) with Automated Market Maker (AMM) protocol using Solidity smart contracts. The DEX enables peer-to-peer cryptocurrency trading using liquidity pools and constant product formula (x * y = k).

## Features

- ✅ Initial and subsequent liquidity provision
- ✅ Liquidity removal with proportional share calculation
- ✅ Token swaps using constant product formula (x * y = k)
- ✅ 0.3% trading fee for liquidity providers
- ✅ LP token minting and burning
- ✅ Price discovery and price updates
- ✅ Comprehensive test suite with 25+ test cases
- ✅ Docker support for easy deployment
- ✅ Full Hardhat integration with automated testing

## Architecture

### Smart Contracts

**DEX.sol**: Main decentralized exchange contract implementing AMM
- Manages liquidity pools for token pairs
- Implements constant product formula
- Handles token swaps with fee deduction
- Emits events for all state changes
- Uses ReentrancyGuard for security

**MockERC20.sol**: Mock ERC-20 token for testing
- Implements standard ERC-20 interface
- Allows minting tokens for testing

### Mathematical Implementation

**Constant Product Formula**: x * y = k
- Where x and y are token reserves
- k remains constant before and after trades (with fee adjustment)

**Fee Calculation**: 0.3% trading fee
- amountInWithFee = amountIn * 997 / 1000
- Output calculated using: (amountInWithFee * reserveOut) / ((reserveIn * 1000) + amountInWithFee)

**LP Token Minting**:
- First provider: sqrt(amountA * amountB)
- Subsequent providers: proportional to their contribution

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker and Docker Compose (for Docker setup)
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Pujitha-png/dex-amm.git
cd dex-amm
```

2. Install dependencies:
```bash
npm install
```

3. Compile contracts:
```bash
npm run compile
```

4. Run tests:
```bash
npm test
```

### Docker Setup

1. Build and start the Docker container:
```bash
docker-compose up -d
```

2. Compile contracts:
```bash
docker-compose exec app npm run compile
```

3. Run tests:
```bash
docker-compose exec app npm test
```

4. Check coverage:
```bash
docker-compose exec app npm run coverage
```

5. Stop the container:
```bash
docker-compose down
```

## Contract Functions

### Liquidity Management
- `addLiquidity(amountA, amountB)`: Add liquidity to the pool
- `removeLiquidity(liquidityAmount)`: Remove liquidity and receive tokens

### Token Swaps
- `swapAForB(amountAIn)`: Swap token A for token B
- `swapBForA(amountBIn)`: Swap token B for token A

### View Functions
- `getPrice()`: Get current price of token A in terms of token B
- `getReserves()`: Get current pool reserves
- `getAmountOut()`: Calculate output amount for given input

## Test Suite

The project includes 25+ comprehensive test cases covering:

- **Liquidity Management** (8 tests)
  - Initial liquidity provision
  - LP token minting
  - Subsequent liquidity additions
  - Price ratio maintenance
  - Liquidity removal
  - Edge cases and error conditions

- **Token Swaps** (8 tests)
  - Swap functionality
  - Fee calculations
  - Reserve updates
  - Price impact
  - Error handling

- **Price Calculations** (3 tests)
  - Price queries
  - Price updates after swaps
  - Edge case handling

- **Fee Distribution** (2 tests)
  - Fee accumulation
  - Proportional distribution

- **Edge Cases** (3 tests)
  - Small and large amounts
  - Access control

- **Events** (3 tests)
  - Proper event emission
  - Event parameters

## Known Limitations

- Single trading pair per contract (can be extended for multiple pairs)
- No slippage protection in base implementation
- No flash loan protection
- Simplified security model (real production should have audits)

## Security Considerations

- ✅ ReentrancyGuard to prevent reentrancy attacks
- ✅ Input validation for all amounts
- ✅ SafeMath operations (built-in with Solidity 0.8+)
- ✅ Proper access control
- ✅ Event logging for all operations

## File Structure

```
dex-amm/
├── contracts/
│   ├── DEX.sol           # Main AMM implementation
│   └── MockERC20.sol     # Test ERC-20 token
├── test/
│   └── DEX.test.js       # Test suite
├── scripts/
│   └── deploy.js         # Deployment script
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose config
├── .gitignore            # Git ignore patterns
├── hardhat.config.js     # Hardhat configuration
├── package.json          # Project dependencies
└── README.md             # This file
```

## Future Enhancements

- Multi-pair support
- Slippage protection with minimum output
- Flash swaps
- Governance token
- Multiple fee tiers
- Cross-chain functionality

## Resources

- [Uniswap V2 Documentation](https://uniswap.org/docs/v2/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/)

## License

MIT License - see LICENSE file for details

## Author

Pujitha Nagalakshmi Kotha

## Support

For issues or questions, please open a GitHub issue or contact the maintainer.
