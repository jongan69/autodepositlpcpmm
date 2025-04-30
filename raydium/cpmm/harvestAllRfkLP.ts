import {
  ApiV3PoolInfoStandardItemCpmm,
  CpmmKeys,
} from '@raydium-io/raydium-sdk-v2'
import { initSdk, txVersion, fetchRaydiumLockedNft } from '../config'
import { isValidCpmm } from './utils'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { RAYDIUM_CPMM_POOL_ID } from '../../constants'

export const harvestAllRfkLP = async () => {
  try {
    const raydium = await initSdk()
    const poolId = RAYDIUM_CPMM_POOL_ID

    let poolInfo: ApiV3PoolInfoStandardItemCpmm
    let poolKeys: CpmmKeys | undefined

    try {
      if (raydium.cluster === 'mainnet') {
        const data = await raydium.api.fetchPoolById({ ids: poolId })
        if (!data || data.length === 0) {
          throw new Error(`No pool found with ID: ${poolId}`)
        }
        poolInfo = data[0] as ApiV3PoolInfoStandardItemCpmm
        if (!isValidCpmm(poolInfo.programId)) {
          throw new Error('Target pool is not a CPMM pool')
        }
      } else {
        const data = await raydium.cpmm.getPoolInfoFromRpc(poolId)
        poolInfo = data.poolInfo
        poolKeys = data.poolKeys
      }
    } catch (error) {
      throw new Error(`Failed to fetch pool info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    const mintAddresses = await fetchRaydiumLockedNft()
    if (!mintAddresses || mintAddresses.length === 0) {
      console.log('No locked NFTs found to harvest')
      return
    }

    console.log('Found NFTs to harvest:', mintAddresses)
    
    for (const mintAddress of mintAddresses) {
      try {
        const { execute, transaction } = await raydium.cpmm.harvestLockLp({
          poolInfo,
          nftMint: new PublicKey(mintAddress),
          lpFeeAmount: new BN(99999999),
          txVersion,
        })

        const { txId } = await execute({ sendAndConfirm: true })
        console.log('Successfully harvested LP for NFT:', {
          mintAddress,
          txId: `https://explorer.solana.com/tx/${txId}`
        })
      } catch (error) {
        console.error(`Failed to harvest LP for NFT ${mintAddress}:`, error instanceof Error ? error.message : 'Unknown error')
        // Continue with next NFT instead of stopping the entire process
        continue
      }
    }
  } catch (error) {
    console.error('Fatal error in harvestAllRfkLP:', error instanceof Error ? error.message : 'Unknown error')
    throw error // Re-throw to allow caller to handle if needed
  }
}

/** uncomment code below to execute */
harvestAllRfkLP()