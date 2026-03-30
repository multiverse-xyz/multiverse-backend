import express from 'express'
import cors from 'cors'
import { API_PORT } from './config'
import { connectDb } from './utils/mongodb'
import { logger } from './utils/logger'

async function main() {
  const db = await connectDb()
  const app = express()

  app.use(cors())
  app.use(express.json())

  // GET /partitions - all partitions
  app.get('/partitions', async (_req, res) => {
    const partitions = await db.collection('partitions').find().sort({ blockNumber: -1 }).toArray()
    res.json(partitions)
  })

  // GET /partitions/:conditionId - single partition
  app.get('/partitions/:conditionId', async (req, res) => {
    const partition = await db.collection('partitions').findOne({ conditionId: req.params.conditionId })
    if (!partition) return res.status(404).json({ error: 'Not found' })
    res.json(partition)
  })

  // GET /tokens - all enabled tokens
  app.get('/tokens', async (_req, res) => {
    const tokens = await db.collection('tokens').find().sort({ blockNumber: -1 }).toArray()
    res.json(tokens)
  })

  // GET /tokens/:verseId - tokens for a verse
  app.get('/tokens/:verseId', async (req, res) => {
    const tokens = await db.collection('tokens').find({ verseId: req.params.verseId }).toArray()
    res.json(tokens)
  })

  // GET /events - all events, supports ?type=&user=&conditionId=&limit=
  app.get('/events', async (req, res) => {
    const filter: Record<string, string> = {}
    if (req.query.type) filter.type = req.query.type as string
    if (req.query.user) filter.user = (req.query.user as string).toLowerCase()
    if (req.query.conditionId) filter.conditionId = req.query.conditionId as string

    const limit = Math.min(Number(req.query.limit) || 100, 1000)
    const events = await db.collection('events').find(filter).sort({ blockNumber: -1 }).limit(limit).toArray()
    res.json(events)
  })

  // GET /stats - basic stats
  app.get('/stats', async (_req, res) => {
    const [partitions, tokens, events] = await Promise.all([
      db.collection('partitions').countDocuments(),
      db.collection('tokens').countDocuments(),
      db.collection('events').countDocuments(),
    ])
    res.json({ partitions, tokens, events })
  })

  app.listen(API_PORT, '0.0.0.0', () => {
    logger.info({ port: API_PORT }, 'API server started')
  })
}

main().catch((err) => {
  logger.fatal(err, 'API crashed')
  process.exit(1)
})
