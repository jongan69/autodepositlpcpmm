# autodepositlpcpmm

A TypeScript/Node.js toolkit for automating liquidity management and reward harvesting on Raydium's CPMM and CLMM pools on Solana.

## Features
- **Deposit and lock liquidity** into Raydium CPMM pools
- **Harvest all rewards** from CLMM and CPMM pools, including locked positions
- **Automated batch operations** for efficient DeFi workflows

## Project Structure

- `raydium/clmm/`
  - `harvestAllRewards.ts`: Harvests all available CLMM rewards for non-zero positions.
  - `harvestLockedRewards.ts`: Harvests rewards from all locked CLMM positions (NFT-based).
- `raydium/cpmm/`
  - `depositAndLockLiquidity.ts`: Deposits 1% of your JAIL token balance into a CPMM pool and locks the resulting LP tokens.
  - `harvestAllRfkLP.ts`: Harvests all CPMM rewards for locked LP NFTs (Raydium Fee Key - RFK).
- `raydium/config.ts`: SDK and connection setup, environment variable management, and helper functions for fetching locked NFTs.
- `raydium/utils.ts`: Utility for validating CPMM pool program IDs.
- `constants.ts`: Pool and mint addresses.
- `index.ts`: Example usage and entrypoint (uncomment desired function to run).

## Setup

1. **Clone the repository**

```bash
git clone <repo-url>
cd autodepositlpcpmm
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Variables**

Create a `.env` file in the project root with the following variables:

```
PRIVATE_KEY=<base58-encoded-solana-private-key>
RPC_URL=<your-solana-rpc-url>
HELIUS_API_KEY=<your-helius-api-key>
GRPC_URL=<optional-grpc-url>
GRPC_TOKEN=<optional-grpc-token>
```

- `PRIVATE_KEY`: Your Solana wallet's private key (base58 encoded)
- `RPC_URL`: Solana RPC endpoint (mainnet recommended)
- `HELIUS_API_KEY`: For NFT lookups (used in locked position scripts)

**Note:** Never commit your `.env` file or private key to version control.

## Usage

All scripts are TypeScript files. You can run them using `npm start` after uncommenting the desired function call in `index.ts`, or by running individual files with `tsx`:

```bash
npx tsx raydium/clmm/harvestAllRewards.ts
```

Or, to run the main entrypoint (edit `index.ts` to select the function):

```bash
npm start
```

### Script Details

#### 1. `raydium/clmm/harvestAllRewards.ts`
- **Purpose:** Harvests all available CLMM rewards for your wallet's non-zero positions.
- **How it works:**
  - Fetches all CLMM positions for the wallet.
  - Filters out positions with zero liquidity.
  - Fetches pool info for each position.
  - Calls the Raydium SDK to harvest all rewards in batch.
- **Usage:**
  - Ensure your `.env` is set up.
  - Uncomment the last line or call `harvestAllRewards()` in your script.

#### 2. `raydium/clmm/harvestLockedRewards.ts`
- **Purpose:** Harvests rewards from all locked CLMM positions (NFT-based).
- **How it works:**
  - Scans wallet for NFTs representing locked CLMM positions.
  - For each, calls the Raydium SDK to harvest rewards.
  - Handles errors gracefully and continues with remaining positions.
- **Usage:**
  - Ensure your `.env` is set up.
  - Uncomment the last line or call `harvestLockedClmmRewards()` in your script.

#### 3. `raydium/cpmm/depositAndLockLiquidity.ts`
- **Purpose:** Deposits 1% of your JAIL token balance into a CPMM pool and locks the resulting LP tokens.
- **How it works:**
  - Fetches pool info and your JAIL token balance.
  - Calculates 1% of your balance and deposits it as liquidity.
  - Locks the received LP tokens.
- **Usage:**
  - Ensure your `.env` is set up and you have JAIL tokens.
  - Uncomment the last line or call `depositAndLockLiquidity()` in your script.

#### 4. `raydium/cpmm/harvestAllRfkLP.ts`
- **Purpose:** Harvests all CPMM rewards for locked LP NFTs (Raydium Fee Key - RFK).
- **How it works:**
  - Uses the Helius API to find all RFK NFTs in your wallet.
  - For each, calls the Raydium SDK to harvest rewards.
  - Handles errors gracefully and continues with remaining NFTs.
- **Usage:**
  - Ensure your `.env` is set up and you have locked LP NFTs.
  - Uncomment the last line or call `harvestAllRfkLP()` in your script.

## Customization
- **Pool IDs and Mint Addresses:**
  - Edit `constants.ts` to change the target pool or mint addresses.
- **Transaction Version:**
  - Change `txVersion` in `config.ts` if you need to use legacy transactions.
- **Priority Fees:**
  - Uncomment and adjust `computeBudgetConfig` in scripts for custom priority fees.

## Dependencies
- [@raydium-io/raydium-sdk-v2](https://www.npmjs.com/package/@raydium-io/raydium-sdk-v2)
- [@solana/web3.js](https://www.npmjs.com/package/@solana/web3.js)
- [@solana/spl-token](https://www.npmjs.com/package/@solana/spl-token)
- [bn.js](https://www.npmjs.com/package/bn.js)
- [bs58](https://www.npmjs.com/package/bs58)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [decimal.js](https://www.npmjs.com/package/decimal.js)
- [tsx](https://www.npmjs.com/package/tsx) (for running TypeScript files directly)

## Security Warning
**Never share or commit your private key.** Use a dedicated wallet for DeFi automation and keep your funds safe.

## License
ISC
