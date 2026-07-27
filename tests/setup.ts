import mongoose from "mongoose";

beforeAll(async () => {
  const uri = process.env.MONGO_MEMORY_URI;
  if (!uri) {
    throw new Error("MONGO_MEMORY_URI is not set — globalSetup did not run.");
  }
  await mongoose.connect(uri, { dbName: `medimate_test_${process.pid}` });
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
