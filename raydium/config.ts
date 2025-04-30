import { Raydium, TxVersion, parseTokenAccountResp } from '@raydium-io/raydium-sdk-v2'
import { Connection, Keypair, clusterApiUrl, PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import bs58 from 'bs58'
import dotenv from "dotenv";

dotenv.config();

export const owner: Keypair = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!))
export const connection = new Connection(process.env.RPC_URL!)

export const txVersion = TxVersion.V0 // or TxVersion.LEGACY
const cluster = 'mainnet' // 'mainnet' | 'devnet'

let raydium: Raydium | undefined
export const initSdk = async (params?: { loadToken?: boolean }) => {
  if (raydium) return raydium
  if (connection.rpcEndpoint === clusterApiUrl('mainnet-beta'))
    console.warn('using free rpc node might cause unexpected error, strongly suggest uses paid rpc node')
  // console.log(`connect to rpc ${connection.rpcEndpoint} in ${cluster}`)
  raydium = await Raydium.load({
    owner,
    connection,
    cluster,
    disableFeatureCheck: true,
    disableLoadToken: !params?.loadToken,
    blockhashCommitment: 'finalized',
    // urlConfigs: {
    //   BASE_HOST: '<API_HOST>', // api url configs, currently api doesn't support devnet
    // },
  })

  /**
   * By default: sdk will automatically fetch token account data when need it or any sol balace changed.
   * if you want to handle token account by yourself, set token account data after init sdk
   * code below shows how to do it.
   * note: after call raydium.account.updateTokenAccount, raydium will not automatically fetch token account
   */

  /*  
  raydium.account.updateTokenAccount(await fetchTokenAccountData())
  connection.onAccountChange(owner.publicKey, async () => {
    raydium!.account.updateTokenAccount(await fetchTokenAccountData())
  })
  */

  return raydium
}

export const fetchTokenAccountData = async () => {
  const solAccountResp = await connection.getAccountInfo(owner.publicKey)
  const tokenAccountResp = await connection.getTokenAccountsByOwner(owner.publicKey, { programId: TOKEN_PROGRAM_ID })
  const token2022Req = await connection.getTokenAccountsByOwner(owner.publicKey, { programId: TOKEN_2022_PROGRAM_ID })
  const tokenAccountData = parseTokenAccountResp({
    owner: owner.publicKey,
    solAccountResp,
    tokenAccountResp: {
      context: tokenAccountResp.context,
      value: [...tokenAccountResp.value, ...token2022Req.value],
    },
  })
  return tokenAccountData
}

export const grpcUrl = process.env.GRPC_URL!
export const grpcToken = process.env.GRPC_TOKEN!

export const fetchRaydiumLockedCpmmNft = async () => {
  const heliusUrl = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
  const body = JSON.stringify({
    "jsonrpc": "2.0",
    "id": "my-id",
    "method": "searchAssets",
    "params": {
      "ownerAddress": owner.publicKey.toBase58(),
      "tokenType": "all",
      "limit": 1000
    }
  })
  const response = await fetch(heliusUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body
  })
  const data = await response.json()
  const assets = data.result.items
  // console.log(assets)
  const RFKAssets = assets.filter((asset: any) => asset.content.metadata.symbol === 'RFK' && asset.content.metadata.name === 'Raydium Fee Key (CPMM)')
  const mintAddresses: string[] = []
  for (const asset of RFKAssets) {
    const mintAddress = asset.id
    mintAddresses.push(mintAddress as string)
  }
  return mintAddresses
}

export const fetchRaydiumLockedClmmNft = async () => {
  const heliusUrl = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
  const body = JSON.stringify({
    "jsonrpc": "2.0",
    "id": "my-id",
    "method": "searchAssets",
    "params": {
      "ownerAddress": owner.publicKey.toBase58(),
      "tokenType": "all",
      "limit": 1000
    }
  })
  const response = await fetch(heliusUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body
  })
  const data = await response.json()
  const assets = data.result.items
  // console.log(assets)
  const CLMMAssets = assets.filter((asset: any) => asset.content.metadata.symbol === 'RFK' && asset.content.metadata.name === 'Raydium Fee Key (CLMM)')
  const mintAddresses: string[] = []
  for (const asset of CLMMAssets) {
    const mintAddress = asset.id
    mintAddresses.push(mintAddress as string)
  }
  return mintAddresses
}