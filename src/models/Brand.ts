// src/models/Brand.ts
import { Schema, model } from "mongoose";

export interface IBrand {
  name: string;
  slug: string;
  status: "active" | "inactive";
  logo?: string;
  description?: string;
  website?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const brandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    logo: { type: String },
    description: { type: String },
    website: { type: String },
    sortOrder: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const BrandModel = model<IBrand>("Brand", brandSchema);
