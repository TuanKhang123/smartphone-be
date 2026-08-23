import { Types, Schema, model } from "mongoose";

export interface IInventory {
  variantId: Types.ObjectId;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>(
  {
    variantId: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
      unique: true,
    },
    quantity: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

export const InventoryModel = model<IInventory>("Inventory", inventorySchema);