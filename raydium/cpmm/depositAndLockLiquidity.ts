import {
  ApiV3PoolInfoStandardItemCpmm,
  CpmmKeys,
  Percent} from '@raydium-io/raydium-sdk-v2'
import BN from 'bn.js'
import { initSdk, txVersion } from '../config'
import Decimal from 'decimal.js'
import { isValidCpmm } from './utils'
import { RAYDIUM_CPMM_POOL_ID } from '../../constants'

export const depositAndLockLiquidity = async () => {
  const raydium = await initSdk()

  // JAIL - SOL pool
  const poolId = RAYDIUM_CPMM_POOL_ID
  let poolInfo: ApiV3PoolInfoStandardItemCpmm
  let poolKeys: CpmmKeys | undefined

  if (raydium.cluster === 'mainnet') {
    const data = await raydium.api.fetchPoolById({ ids: poolId })
    poolInfo = data[0] as ApiV3PoolInfoStandardItemCpmm
    if (!isValidCpmm(poolInfo.programId)) throw new Error('target pool is not CPMM pool')
  } else {
    const data = await raydium.cpmm.getPoolInfoFromRpc(poolId)
    poolInfo = data.poolInfo
    poolKeys = data.poolKeys
  }

  // Step 1: Deposit Liquidity
  const uiInputAmount = '10000' // JAIL amount
  console.log('Pool Info:', {
    mintA: poolInfo.mintA,
    mintB: poolInfo.mintB,
    decimals: poolInfo.mintB.decimals
  })
  const decimalAmount = new Decimal(uiInputAmount).mul(10 ** poolInfo.mintB.decimals)
  const inputAmount = new BN(decimalAmount.toFixed(0))
  const slippage = new Percent(1, 100)
  const baseIn = false

  try {
    console.log('Executing deposit transaction...')
    const { execute: depositExecute } = await raydium.cpmm.addLiquidity({
      poolInfo,
      poolKeys,
      inputAmount,
      slippage,
      baseIn,
      txVersion,
    })

    const { txId: depositTxId } = await depositExecute({ sendAndConfirm: true })
    console.log('Deposit successful!')
    console.log('Deposit Transaction ID:', `https://explorer.solana.com/tx/${depositTxId}`)

    // Step 2: Lock Liquidity
    console.log('Fetching LP token balance...')
    await raydium.account.fetchWalletTokenAccounts()
    const lpBalance = raydium.account.tokenAccounts.find((a) => a.mint.toBase58() === poolInfo.lpMint.address)
    if (!lpBalance) throw new Error(`No LP tokens found for pool: ${poolId}`)

    console.log('Executing lock transaction...')
    const { execute: lockExecute, extInfo } = await raydium.cpmm.lockLp({
      poolInfo,
      lpAmount: lpBalance.amount,
      withMetadata: true,
      txVersion,
    })

    const { txId: lockTxId } = await lockExecute({ sendAndConfirm: true })
    console.log('LP tokens locked successfully!')
    console.log('Lock Transaction ID:', `https://explorer.solana.com/tx/${lockTxId}`)
    console.log('Additional Info:', extInfo)

  } catch (error) {
    console.error('Transaction failed:', error)
    if (error.logs) {
      console.error('Transaction logs:', error.logs)
    }
  }
}

/** uncomment code below to execute */
// depositAndLockLiquidity()