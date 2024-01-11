const { MongoClient } = require("mongodb");

const db = {};

const connectToDb = async () => {
  const client = new MongoClient("mongodb://localhost:27017/your_db_name");
  try {
    await client.connect();

    const database = client.db("your_db_name");
    db.inventories = database.collection("inventories");
    db.orders = database.collection("orders");
    db.users = database.collection("users");

    await db.inventories.deleteMany({});
    await db.orders.deleteMany({});
    await db.users.deleteMany({});

    await importData(db);

    console.log("Connected to MongoDB");
  } finally {
    process.on("SIGINT", () => {
      client.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    });
  }
};

const importData = async (db) => {
  await db.inventories.insertMany([
    { "_id": 1, "sku": "almonds", "description": "product 1", "instock": 120 },
    { "_id": 2, "sku": "bread", "description": "product 2", "instock": 80 },
    { "_id": 3, "sku": "cashews", "description": "product 3", "instock": 60 },
    { "_id": 4, "sku": "pecans", "description": "product 4", "instock": 70 },
  ]);

  await db.orders.insertMany([
    { "_id": 1, "item": "almonds", "price": 12, "quantity": 2 },
    { "_id": 2, "item": "pecans", "price": 20, "quantity": 1 },
    { "_id": 3, "item": "pecans", "price": 20, "quantity": 3 },
  ]);

  await db.users.insertMany([
    { "username": "admin", "password": "MindX@2022" },
    { "username": "alice", "password": "MindX@2022" },
  ]);

  console.log("Data imported into MongoDB");
};

module.exports = { connectToDb, db };
