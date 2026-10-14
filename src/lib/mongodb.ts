import { MongoClient, Db } from "mongodb";

// One shared client per process. In dev, Next.js clears module state on HMR,
// so the promise is also stashed on globalThis to avoid piling up connections.
const globalWithMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

function connect(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI — set it in .env.local");
  }
  return new MongoClient(uri).connect();
}

// Lazy: the first getDb() call connects. Connecting at module load would crash
// `next build`, which evaluates route modules without any secrets present.
let clientPromise: Promise<MongoClient> | undefined =
  globalWithMongo._mongoClientPromise;

function getClient(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = connect();
    if (process.env.NODE_ENV === "development") {
      globalWithMongo._mongoClientPromise = clientPromise;
    }
  }
  return clientPromise;
}

/** Database handle; the db name comes from the URI path (e.g. /arcade3d). */
export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db();
}

// Unique usernames + session lookups + TTL cleanup of expired sessions.
// Runs once per process; createIndex is a no-op when the index already exists.
let indexesEnsured: Promise<unknown> | null = null;
export function ensureIndexes(db: Db): Promise<unknown> {
  indexesEnsured ??= Promise.all([
    db.collection("users").createIndex({ username: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ token: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
  return indexesEnsured;
}
