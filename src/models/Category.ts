import { Types, Schema, model } from "mongoose";

export interface ICategory {
  name: string;
  slug: string;
  parentId: Types.ObjectId | null;
  description?: string;
  image?: string;
  sortOrder: number;
  attributeIds: Types.ObjectId[];
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    description: { type: String },
    image: { type: String },
    sortOrder: { type: Number, default: 0 },
    attributeIds: [{ type: Schema.Types.ObjectId, ref: "AttributeDefinition" }],
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const CategoryModel = model<ICategory>("Category", categorySchema);
