import { createPublicClient, http, parseEventLogs, Log } from 'viem'
import { RPC_URL, VERSES_ADDRESS, START_BLOCK, BLOCK_INTERVAL, POLL_INTERVAL } from './config'
import { versesAbi } from './contracts/verses'
import { connectDb } from './utils/mongodb'
import { logger } from './utils/logger'
import { Db } from 'mongodb'

const client = createPublicClient({
  transport: http(RPC_URL),
})

async function processLogs(db: Db, logs: Log[]) {
  if (logs.length === 0) return

  const parsed = parseEventLogs({ abi: versesAbi, logs })

  for (const log of parsed) {
    const base = {
      blockNumber: Number(log.blockNumber),
      transactionHash: log.transactionHash,
      logIndex: log.logIndex,
      timestamp: new Date(),
    }

    switch (log.eventName) {
      case 'PartitionCreated': {
        const { conditionId, oracle, questionId, outcomeCount } = log.args
        await db.collection('partitions').updateOne(
          { conditionId },
          {
            $set: {
              conditionId,
              oracle,
              questionId,
              outcomeCount: outcomeCount.toString(),
              isResolved: false,
              ...base,
            },
          },
          { upsert: true }
        )
        logger.info({ conditionId, oracle }, 'PartitionCreated')
        break
      }

      case 'PartitionResolved': {
        const { conditionId, winningVerseId } = log.args
        await db.collection('partitions').updateOne(
          { conditionId },
          { $set: { isResolved: true, winningVerseId, ...base } }
        )
        logger.info({ conditionId, winningVerseId }, 'PartitionResolved')
        break
      }

      case 'TokenEnabled': {
        const { proxyAddress, verseId, token } = log.args
        await db.collection('tokens').updateOne(
          { verseId, token },
          { $set: { proxyAddress, verseId, token, ...base } },
          { upsert: true }
        )
        logger.info({ proxyAddress, verseId, token }, 'TokenEnabled')
        break
      }

      case 'TokenDeposited': {
        const { token, depositor, amount, conditionId } = log.args
        await db.collection('events').insertOne({
          type: 'TokenDeposited',
          token,
          user: depositor,
          amount: amount.toString(),
          conditionId,
          ...base,
        })
        logger.info({ token, depositor, amount: amount.toString() }, 'TokenDeposited')
        break
      }

      case 'TokenWithdrawn': {
        const { token, withdrawer, amount, conditionId } = log.args
        await db.collection('events').insertOne({
          type: 'TokenWithdrawn',
          token,
          user: withdrawer,
          amount: amount.toString(),
          conditionId,
          ...base,
        })
        logger.info({ token, withdrawer, amount: amount.toString() }, 'TokenWithdrawn')
        break
      }

      case 'PositionDeposited': {
        const { depositor, conditionId, index, amount } = log.args
        await db.collection('events').insertOne({
          type: 'PositionDeposited',
          user: depositor,
          conditionId,
          index: index.toString(),
          amount: amount.toString(),
          ...base,
        })
        logger.info({ depositor, conditionId, index: index.toString() }, 'PositionDeposited')
        break
      }

      case 'PositionWithdrawn': {
        const { withdrawer, conditionId, index, amount } = log.args
        await db.collection('events').insertOne({
          type: 'PositionWithdrawn',
          user: withdrawer,
          conditionId,
          index: index.toString(),
          amount: amount.toString(),
          ...base,
        })
        logger.info({ withdrawer, conditionId, index: index.toString() }, 'PositionWithdrawn')
        break
      }
    }
  }
}

async function backfill(db: Db) {
  const currentBlock = await client.getBlockNumber()
  const deployBlock = START_BLOCK > 0n ? START_BLOCK : currentBlock - 1000n
  let fromBlock = deployBlock

  logger.info({ from: fromBlock.toString(), to: currentBlock.toString() }, 'Starting backfill')

  while (fromBlock <= currentBlock) {
    const toBlock = fromBlock + BLOCK_INTERVAL > currentBlock ? currentBlock : fromBlock + BLOCK_INTERVAL

    try {
      const logs = await client.getLogs({
        address: VERSES_ADDRESS,
        fromBlock,
        toBlock,
      })
      await processLogs(db, logs)
    } catch (err) {
      logger.error({ fromBlock: fromBlock.toString(), err }, 'Error fetching logs')
    }

    fromBlock = toBlock + 1n
  }

  logger.info('Backfill complete')
  return currentBlock
}

async function poll(db: Db, lastBlock: bigint) {
  let fromBlock = lastBlock + 1n

  while (true) {
    try {
      const currentBlock = await client.getBlockNumber()

      if (currentBlock >= fromBlock) {
        const logs = await client.getLogs({
          address: VERSES_ADDRESS,
          fromBlock,
          toBlock: currentBlock,
        })
        await processLogs(db, logs)
        fromBlock = currentBlock + 1n
      }
    } catch (err) {
      logger.error({ err }, 'Poll error')
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL))
  }
}

async function main() {
  const db = await connectDb()

  // Create indexes
  await db.collection('partitions').createIndex({ conditionId: 1 }, { unique: true })
  await db.collection('tokens').createIndex({ verseId: 1, token: 1 }, { unique: true })
  await db.collection('events').createIndex({ type: 1 })
  await db.collection('events').createIndex({ user: 1 })
  await db.collection('events').createIndex({ conditionId: 1 })
  await db.collection('events').createIndex({ blockNumber: 1 })

  const lastBlock = await backfill(db)
  await poll(db, lastBlock)
}

main().catch((err) => {
  logger.fatal(err, 'Listener crashed')
  process.exit(1)
})
