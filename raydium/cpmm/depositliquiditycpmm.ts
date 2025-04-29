import { ApiV3PoolInfoStandardItemCpmm, CpmmKeys, Percent, getPdaPoolAuthority } from '@raydium-io/raydium-sdk-v2'
import BN from 'bn.js'
import { initSdk, txVersion } from '../config'
import Decimal from 'decimal.js'
import { isValidCpmm } from './utils'
import { RAYDIUM_CPMM_POOL_ID } from '../../constants'

export const deposit = async () => {
  const raydium = await initSdk()

  // JAIL - SOL pool
  const poolId = RAYDIUM_CPMM_POOL_ID
  let poolInfo: ApiV3PoolInfoStandardItemCpmm
  let poolKeys: CpmmKeys | undefined

  if (raydium.cluster === 'mainnet') {
    // note: api doesn't support get devnet pool info, so in devnet else we go rpc method
    // if you wish to get pool info from rpc, also can modify logic to go rpc method directly
    const data = await raydium.api.fetchPoolById({ ids: poolId })
    poolInfo = data[0] as ApiV3PoolInfoStandardItemCpmm
    if (!isValidCpmm(poolInfo.programId)) throw new Error('target pool is not CPMM pool')
  } else {
    const data = await raydium.cpmm.getPoolInfoFromRpc(poolId)
    poolInfo = data.poolInfo
    poolKeys = data.poolKeys
  }

  const uiInputAmount = '100000' // JAIL amount
  console.log('Pool Info:', {
    mintA: poolInfo.mintA,
    mintB: poolInfo.mintB,
    decimals: poolInfo.mintB.decimals // Changed to mintB decimals
  })
  const decimalAmount = new Decimal(uiInputAmount).mul(10 ** poolInfo.mintB.decimals) // Changed to mintB decimals
  console.log('Calculated amount:', decimalAmount.toString())
  const inputAmount = new BN(decimalAmount.toFixed(0))
  console.log('BN amount:', inputAmount.toString())
  const slippage = new Percent(1, 100)
  const baseIn = false // Changed to false since we're depositing JAIL (mintB)

  // computePairAmount is not necessary, addLiquidity will compute automatically,
  // just for ui display
  /*
  const res = await raydium.cpmm.getRpcPoolInfos([poolId]);
  const pool1Info = res[poolId];

  const computeRes = await raydium.cpmm.computePairAmount({
    baseReserve: pool1Info.baseReserve,
    quoteReserve: pool1Info.quoteReserve,
    poolInfo,
    amount: uiInputAmount,
    slippage,
    baseIn,
    epochInfo: await raydium.fetchEpochInfo()
  });

  computeRes.anotherAmount.amount -> pair amount needed to add liquidity
  computeRes.anotherAmount.fee -> token2022 transfer fee, might be undefined if isn't token2022 program
  */

  const { execute } = await raydium.cpmm.addLiquidity({
    poolInfo,
    poolKeys,
    inputAmount,
    slippage,
    baseIn,
    txVersion,
    // optional: set up priority fee here
    // computeBudgetConfig: {
    //   units: 600000,
    //   microLamports: 46591500,
    // },

    // optional: add transfer sol to tip account instruction. e.g sent tip to jito
    // txTipConfig: {
    //   address: new PublicKey('96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5'),
    //   amount: new BN(10000000), // 0.01 sol
    // },
  })

  try {
    console.log('Executing transaction...')
    const { txId } = await execute({ sendAndConfirm: true })
    console.log('Transaction successful!')
    console.log('Transaction ID:', `https://explorer.solana.com/tx/${txId}`)
  } catch (error) {
    console.error('Transaction failed:', error)
    if (error.logs) {
      console.error('Transaction logs:', error.logs)
    }
  }
  // process.exit() // if you don't want to end up node execution, comment this line
}

/** uncomment code below to execute */
// deposit()