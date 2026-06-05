import { MongoClient, Db, ObjectId } from 'mongodb'

const DB_NAME = 'istud'

const globalForMongo = globalThis as unknown as {
  mongoClient: MongoClient | undefined
  mongoConnected: boolean | undefined
}

let clientInstance: MongoClient | null = null
let dbInstance: Db | null = null
let connected = false

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || ''
  if (!uri) {
    throw new Error('Please define MONGODB_URI or DATABASE_URL in your environment variables')
  }
  return uri
}

function getClient(): { client: MongoClient; db: Db } {
  if (clientInstance && dbInstance) {
    return { client: clientInstance, db: dbInstance }
  }

  const uri = getMongoUri()

  if (process.env.NODE_ENV === 'production') {
    clientInstance = new MongoClient(uri)
    dbInstance = clientInstance.db(DB_NAME)
  } else {
    // In development, reuse the client to avoid multiple connections
    if (!globalForMongo.mongoClient) {
      globalForMongo.mongoClient = new MongoClient(uri)
      globalForMongo.mongoClient.db(DB_NAME)
    }
    clientInstance = globalForMongo.mongoClient
    dbInstance = clientInstance.db(DB_NAME)
    connected = globalForMongo.mongoConnected || false
  }

  return { client: clientInstance, db: dbInstance }
}

// Connect on first use with retry logic
async function ensureConnection(retries = 2): Promise<Db> {
  if (connected) return getClient().db

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { client } = getClient()
      await client.connect()
      connected = true
      if (process.env.NODE_ENV !== 'production') {
        globalForMongo.mongoConnected = true
      }
      console.log('Connected to MongoDB Atlas')
      return getClient().db
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt + 1} failed:`, error)
      if (attempt === retries) {
        throw new Error(
          'Failed to connect to MongoDB Atlas. ' +
          'Please ensure your server IP is added to the Atlas Network Access List. ' +
          'Go to MongoDB Atlas > Network Access > Add IP Address > Add 0.0.0.0/0 to allow all IPs.'
        )
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }

  return getClient().db
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

// Mood logs removed - mood feature deleted
// Chat messages removed - chat is now stateless (no DB persistence)

export async function quizzes() {
  const database = await getDb()
  return database.collection('quizzes')
}

export async function quizQuestions() {
  const database = await getDb()
  return database.collection('quizquestions')
}

/** Drop the moodlogs and chatmessages collections to free up DB space */
export async function cleanupOldCollections() {
  const database = await getDb()
  const collections = await database.listCollections().toArray()
  const collectionNames = collections.map(c => c.name)
  for (const name of ['moodlogs', 'chatmessages', 'chats']) {
    if (collectionNames.includes(name)) {
      try {
        await database.collection(name).drop()
        console.log(`Dropped legacy collection: ${name}`)
      } catch {
        // Collection might already be dropped
      }
    }
  }
}
