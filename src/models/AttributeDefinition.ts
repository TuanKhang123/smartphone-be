import { Schema, model } from "mongoose";

export interface IAttributeDefinition {
  name: string;
  slug: string;
  type: "select" | "multi_select" | "text" | "number" | "boolean";
  unit?: string;
  isFilterable: boolean;
  isVariantAttribute: boolean;
  predefinedValues: string[];
  sortOrder: number;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const attributeDefinitionSchema = new Schema<IAttributeDefinition>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["select", "multi_select", "text", "number", "boolean"],
      required: true,
    },
    unit: { type: String },
    isFilterable: { type: Boolean, default: true },
    isVariantAttribute: { type: Boolean, default: false },
    predefinedValues: { type: [String], default: [] },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const AttributeDefinitionModel = model<IAttributeDefinition>(
  "AttributeDefinition",
  attributeDefinitionSchema,
);
