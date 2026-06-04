import { MongoClient, Db, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || ''

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI or DATABASE_URL in your environment variables')
}

const globalForMongo = globalThis as unknown as {
  mongoClient: MongoClient | undefined
  mongoDb: Db | undefined
  mongoConnected: boolean | undefined
}

let client: MongoClient
let db: Db
let connected = false

if (process.env.NODE_ENV === 'production') {
  client = new MongoClient(MONGODB_URI)
  db = client.db('istud')
} else {
  // In development, reuse the client to avoid multiple connections
  if (!globalForMongo.mongoClient) {
    globalForMongo.mongoClient = new MongoClient(MONGODB_URI)
    globalForMongo.mongoDb = globalForMongo.mongoClient.db('studysphere')
  }
  client = globalForMongo.mongoClient
  db = globalForMongo.mongoDb
  connected = globalForMongo.mongoConnected || false
}

// Connect on first use with retry logic
async function ensureConnection(retries = 2): Promise<Db> {
  if (connected) return db

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await client.connect()
      connected = true
      if (process.env.NODE_ENV !== 'production') {
        globalForMongo.mongoConnected = true
      }
      console.log('✅ Connected to MongoDB Atlas')
      return db
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt + 1} failed:`, error)
      if (attempt === retries) {
        throw new Error(
          'Failed to connect to MongoDB Atlas. ' +
          'Please ensure your server IP is added to the Atlas Network Access List. ' +
          'Go to MongoDB Atlas → Network Access → Add IP Address → Add 0.0.0.0/0 to allow all IPs.'
        )
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }

  return db
}

// Helper to get database with connection
export async function getDb(): Promise<Db> {
  return ensureConnection()
}

// Export ObjectId for convenience
export { ObjectId }

// Collection helpers
export async function users() {
  const database = await getDb()
  return database.collection('users')
}

export async function moodLogs() {
  const database = await getDb()
  return database.collection('moodlogs')
}

export async function chatMessages() {
  const database = await getDb()
  return database.collection('chatmessages')
}

export async function quizzes() {
  const database = await getDb()
  return database.collection('quizzes')
}

export async function quizQuestions() {
  const database = await getDb()
  return database.collection('quizquestions')
}
