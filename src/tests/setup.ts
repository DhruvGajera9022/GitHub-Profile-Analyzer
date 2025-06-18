import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

jest.setTimeout(30000);

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  const MONGODB_URI = process.env.MONGODB_URI;
  console.log("MONGODB_URI => ", MONGODB_URI);
  if (!MONGODB_URI) {
    throw new Error("DB uri not found");
  }
  await mongoose.connect(MONGODB_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
