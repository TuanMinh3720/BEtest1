const express = require("express");
const { connectToDb, db } = require("./db");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());

const jwtSecret = "yourSecretKey";

const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ error: "Unauthorized - No token provided" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ error: "Unauthorized - Invalid token" });
  }
};

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await db.users.findOne({ username, password });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ username: user.username }, jwtSecret);

    res.json({ token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/products", verifyToken, async (req, res) => {
  try {
    let query = {};

    if (req.query.lowQuantity === 'true') {
      query = { instock: { $lt: 100 } };
    }

    const products = await db.inventories.find(query).toArray();
    res.json(products);
  } catch (error) {
    console.error("Error retrieving products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/orders", verifyToken, async (req, res) => {
  try {
    const ordersWithProductDescription = await db.orders.aggregate([
      {
        $lookup: {
          from: "inventories",
          localField: "item",
          foreignField: "sku",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $project: {
          _id: 1,
          item: 1,
          price: 1,
          quantity: 1,
          "productDetails.description": 1,
        },
      },
    ]).toArray();

    res.json(ordersWithProductDescription);
  } catch (error) {
    console.error("Error retrieving orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(3000, () => {
  console.log("App is running at 3000");
  connectToDb();
});
