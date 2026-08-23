import { Types, Schema, model } from "mongoose";

export interface IProductSpec {
  attributeId: Types.ObjectId;
  value: string;
}

export interface IProduct {
  name: string;
  slug: string;
  categoryId: Types.ObjectId;
  brandId: Types.ObjectId;
  thumbnailImage?: string;
  description?: string;
  specs: IProductSpec[];
  status: "draft" | "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const productSpecSchema = new Schema<IProductSpec>(
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

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    thumbnailImage: { type: String },
    description: { type: String },
    specs: { type: [productSpecSchema], default: [] },
    status: {
      type: String,
      enum: ["draft", "active", "inactive"],
      default: "draft",
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const ProductModel = model<IProduct>("Product", productSchema);
