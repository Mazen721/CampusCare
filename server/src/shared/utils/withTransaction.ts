import mongoose, { type ClientSession } from 'mongoose';

/**
 * Runs a multi-document operation in a MongoDB transaction.
 * Development and production require a replica set (Atlas by default).
 */
export async function withTransaction<T>(
  operation: (session: ClientSession) => Promise<T>,
): Promise<T> {
  const session = await mongoose.startSession();

  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await operation(session);
    });

    if (result === undefined) {
      throw new Error('Transaction completed without returning a result');
    }

    return result;
  } finally {
    await session.endSession();
  }
}
