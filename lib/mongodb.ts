import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

let indexesCreated = false;

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  const db = client.db(dbName);

  if (!indexesCreated) {
    await db.collection('groups').createIndex({ name: 1 }, { unique: true });
    await db.collection('expenses').createIndex({ groupId: 1 });
    indexesCreated = true;
  }

  return db;
}

export default clientPromise;
