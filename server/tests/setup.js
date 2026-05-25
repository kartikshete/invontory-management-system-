const mongoose = require('mongoose');

// Connect to a test database
beforeAll(async () => {
  const url = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1/innoventory_test';
  await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
});

// Clean up database between each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

// Disconnect Mongoose
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});
