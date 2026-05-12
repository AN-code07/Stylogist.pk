import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";

// A single in-memory MongoDB replica set for the whole test run. Replica
// set (vs. standalone) is required because order.service.createOrder uses
// `session.startTransaction()`, and standalone Mongo rejects multi-doc
// transactions with "Transaction numbers are only allowed on a replica
// set member or mongos."
//
// One node is enough — we're not testing replication, just enabling the
// transaction API. Mongoose reuses one connection; afterEach wipes every
// collection so each test starts clean without paying the cost of
// restarting Mongo.

let mongo;

beforeAll(async () => {
  // Disable buffering so a forgotten `await` blows up immediately
  // instead of hanging until the test timeout.
  mongoose.set("bufferCommands", false);

  mongo = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  const uri = mongo.getUri();
  await mongoose.connect(uri, { dbName: "stylogist-test" });
});

afterEach(async () => {
  // Clear data BUT keep collections/indexes so the next test doesn't
  // pay the index-rebuild tax. We do this collection-by-collection
  // because dropDatabase would force mongoose to rebuild every schema
  // index on the next write.
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
});

afterAll(async () => {
  await mongoose.connection.close();
  if (mongo) await mongo.stop();
});
