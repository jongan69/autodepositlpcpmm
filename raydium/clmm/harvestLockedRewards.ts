import {
  getPdaLockClPositionIdV2,
  CLMM_LOCK_PROGRAM_ID,
  LockClPositionLayoutV2,
} from '@raydium-io/raydium-sdk-v2'
import { PublicKey } from '@solana/web3.js'
import { initSdk, txVersion } from '../config'
import BN from 'bn.js'

export const harvestLockedClmmRewards = async () => {
  try {
    const raydium = await initSdk({ loadToken: true })

    // Fetch all wallet token accounts to find locked CLMM positions
    await raydium.account.fetchWalletTokenAccounts()
    const possibleLockMints = raydium.account.tokenAccountRawInfos
      .filter((a) => a.accountInfo.amount.eq(new BN(1)) && !raydium.token.tokenMap.has(a.accountInfo.mint.toBase58()))
      .map((a) => a.accountInfo.mint)

    const possibleLockPositionId = possibleLockMints.map(
      (m) => getPdaLockClPositionIdV2(CLMM_LOCK_PROGRAM_ID, m).publicKey
    )

    if (possibleLockPositionId.length === 0) {
      console.log('No locked CLMM positions found')
      return
    }

    const res = await raydium.connection.getMultipleAccountsInfo(possibleLockPositionId)
    const allLockPositions = res
      .map((r, idx) =>
        r
          ? {
              ...LockClPositionLayoutV2.decode(r.data),
              lockPositionId: possibleLockPositionId[idx],
              mint: possibleLockMints[idx],
            }
          : undefined
      )
      .filter(Boolean) as (ReturnType<typeof LockClPositionLayoutV2.decode> & { 
        lockPositionId: PublicKey
        mint: PublicKey 
      })[]

    if (!allLockPositions.length) {
      console.log('No valid locked CLMM positions found')
      return
    }

    console.log(`Found ${allLockPositions.length} locked CLMM positions to harvest`)

    for (const lockPosition of allLockPositions) {
      try {
        const { execute, transaction } = await raydium.clmm.harvestLockPosition({
          lockData: lockPosition,
          txVersion,
          computeBudgetConfig: {
            units: 600000,
            microLamports: 100000,
          },
        })

        const { txId } = await execute({ sendAndConfirm: true })
        console.log('Successfully harvested locked CLMM position:', {
          mint: lockPosition.mint.toBase58(),
          txId: `https://explorer.solana.com/tx/${txId}`
        })
      } catch (error) {
        console.error(`Failed to harvest locked CLMM position ${lockPosition.mint.toBase58()}:`, 
          error instanceof Error ? error.message : 'Unknown error')
        // Continue with next position instead of stopping the entire process
        continue
      }
    }
  } catch (error) {
    console.error('Fatal error in harvestLockedClmmRewards:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

/** uncomment code below to execute */
harvestLockedClmmRewards()