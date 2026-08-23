import { Types, Schema, model } from "mongoose";

export interface IProductVariantAttribute {
  attributeId: Types.ObjectId;
  value: string;
}

export interface IProductVariant {
  productId: Types.ObjectId;
  originalPrice?: number;
  images: string[];
  sku: string;
  attributes: IProductVariantAttribute[];
  price: number;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const productVariantAttributeSchema = new Schema<IProductVariantAttribute>(
  {
    attributeId: {
      type: Schema.Types.ObjectId,
      ref: "AttributeDefinition",
      required: true,
    },
    value: { type: String, required: true },
  },
  { _id: false },
);

const productVariantSchema = new Schema<IProductVariant>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    originalPrice: { type: Number },
    images: { type: [String], default: [] },
    sku: { type: String, required: true, unique: true },
    attributes: { type: [productVariantAttributeSchema], default: [] },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const ProductVariantModel = model<IProductVariant>(
  "ProductVariant",
  productVariantSchema,
);
