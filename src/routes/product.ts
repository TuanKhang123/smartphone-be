import { Router } from "express";

import { ProductModel } from "../models/Product.js";
import { ProductVariantModel } from "../models/ProductVariant.js";

const productRouter = Router();

productRouter.get("/", async (req, res) => {
  try {
    const products = await ProductModel.find({
      status: "active",
      deletedAt: null,
    })
      .populate("categoryId", "name slug")
      .populate("brandId", "name slug")
      .lean();

    const productIds = products.map((pro) => pro._id);

    const productVariants = await ProductVariantModel.find({
      productId: { $in: productIds },
      status: "active",
      deletedAt: null,
    }).lean();

    console.log('productVariants', productVariants);
    

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get products",
    });
  }
});

export default productRouter;
