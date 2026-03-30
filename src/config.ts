import dotenv from 'dotenv'
dotenv.config()

export const RPC_URL = process.env.RPC_URL || 'http://anvil:8545'
export const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongo:27017'
export const DB_NAME = 'multiverse'
export const API_PORT = Number(process.env.API_PORT) || 3001
export const START_BLOCK = BigInt(process.env.START_BLOCK || '0')
export const BLOCK_INTERVAL = BigInt(process.env.BLOCK_INTERVAL || '5')
export const POLL_INTERVAL = 2000 // ms

export const VERSES_ADDRESS = '0x2d26B4a6A3d3Ec5E0497598d40775cF8d3a20aa7' as const
