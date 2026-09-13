import { Router } from "express";
import { BrandModel } from "../models/Brand.js";

const brandRouter = Router();

brandRouter.get("/", async (req, res) => {
  try {
    const brands = await BrandModel.find({
      status: "active",
      deletedAt: null,
    })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get brands",
    });
  }
});

export default brandRouter;
