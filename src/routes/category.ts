import { Router } from "express";
import { CategoryModel } from "../models/Category.js";

const categoryRouter = Router();

categoryRouter.get("/", async (req, res) => {
  try {
    const categories = await CategoryModel.find({
      status: "active",
      deletedAt: null,
    })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get categories",
    });
  }
});

export default categoryRouter;
