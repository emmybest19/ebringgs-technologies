import mongoose from 'mongoose';

/**
 * Resolves a single MongoDB cluster URI from `MONGO_URI` and derives the
 * database name from `NODE_ENV` — so one connection string covers all
 * environments. The actual database used is `ebringgs-{env}`:
 *   development → ebringgs-development
 *   staging     → ebringgs-staging
 *   production  → ebringgs-production
 */
function resolveUri(): string {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error(
      'MONGO_URI is not set in .env — provide your Atlas cluster connection string.'
    );
  }
  return uri;
}

function resolveDbName(): string {
  const env = (process.env.NODE_ENV || 'development').toLowerCase();
  return `ebringgs-${env}`;
}

function maskUri(uri: string): string {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
}

export const connectDB = async (): Promise<void> => {
  const env = process.env.NODE_ENV || 'development';
  const uri = resolveUri();
  const dbName = resolveDbName();

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: env === 'production' ? 50 : 10,
    });
    console.log(`MongoDB connected [${env}] → ${maskUri(uri)} (db: ${dbName})`);
  } catch (err) {
    console.error(`MongoDB connection error [${env}]:`, err);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn(`MongoDB disconnected [${env}]`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`MongoDB error [${env}]:`, err);
  });
};
