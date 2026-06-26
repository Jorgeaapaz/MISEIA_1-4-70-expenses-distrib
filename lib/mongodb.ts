import { MongoClient, Db } from 'mongodb';

let clientPromise: Promise<MongoClient> | undefined;
let indexesCreated = false;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI!;
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri).connect();
    }
    return global._mongoClientPromise;
  }
  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const db = client.db(process.env.MONGODB_DB!);

  if (!indexesCreated) {
    await db.collection('groups').createIndex({ name: 1 }, { unique: true });
    await db.collection('expenses').createIndex({ groupId: 1 });
    indexesCreated = true;
  }

  return db;
}

export default { getDb };
