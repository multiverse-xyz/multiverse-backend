import { MongoClient } from 'mongodb'
import { MONGO_URL, DB_NAME } from '../config'
import { logger } from './logger'

const client = new MongoClient(MONGO_URL)

export async function connectDb() {
  await client.connect()
  logger.info('Connected to MongoDB')
  return client.db(DB_NAME)
}

export const mongoClient = client
