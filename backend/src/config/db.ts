import mongoose from 'mongoose';

type Env = 'development' | 'staging' | 'production';

const envUriMap: Record<Env, string | undefined> = {
  development: process.env.MONGO_URI_DEVELOPMENT,
  staging: process.env.MONGO_URI_STAGING,
  production: process.env.MONGO_URI_PRODUCTION,
};

function resolveUri(): string {
  const env = (process.env.NODE_ENV as Env) || 'development';
  const uri = envUriMap[env] || process.env.MONGO_URI;

  if (!uri) {
    throw new Error(
      `No MongoDB URI configured for NODE_ENV="${env}". ` +
      `Set MONGO_URI_${env.toUpperCase()} or MONGO_URI in your .env file.`
    );
  }

  return uri;
}

function maskUri(uri: string): string {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
}

export const connectDB = async (): Promise<void> => {
  const env = process.env.NODE_ENV || 'development';
  const uri = resolveUri();

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: env === 'production' ? 50 : 10,
    });
    console.log(`MongoDB connected [${env}] → ${maskUri(uri)}`);
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
