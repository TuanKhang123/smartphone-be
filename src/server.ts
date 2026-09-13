import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import categoryRouter from "./routes/category.js";
import brandRouter from "./routes/brand.js";
import productRouter from "./routes/product.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/categories", categoryRouter);
app.use("/brands", brandRouter);
app.use("/products", productRouter);
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

async function start() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("MongoDB connected");
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
}

start();
