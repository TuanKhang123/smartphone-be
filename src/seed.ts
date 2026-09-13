import "dotenv/config";
import mongoose from "mongoose";

import { AttributeDefinitionModel } from "./models/AttributeDefinition.js";
import { BrandModel } from "./models/Brand.js";
import { CategoryModel } from "./models/Category.js";
import { InventoryModel } from "./models/Inventory.js";
import { ProductModel } from "./models/Product.js";
import { ProductVariantModel } from "./models/ProductVariant.js";

function requireSeedValue<T>(value: T | undefined, label: string): T {
  if (!value) {
    throw new Error(`Seed did not create ${label}`);
  }

  return value;
}

async function seed() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined");
  }

  await mongoose.connect(mongoUri);
  console.log(`Connected to database: ${mongoose.connection.name}`);

  await Promise.all([
    InventoryModel.deleteMany({}),
    ProductVariantModel.deleteMany({}),
    ProductModel.deleteMany({}),
    CategoryModel.deleteMany({}),
    BrandModel.deleteMany({}),
    AttributeDefinitionModel.deleteMany({}),
  ]);
  const attributeDefinitions = await AttributeDefinitionModel.create([
    {
      name: "Màu sắc",
      slug: "mau-sac",
      type: "select",
      isFilterable: true,
      isVariantAttribute: true,
      predefinedValues: ["Đen", "Trắng", "Xanh"],
      sortOrder: 1,
      status: "active",
      deletedAt: null,
    },
    {
      name: "Bộ nhớ trong",
      slug: "bo-nho-trong",
      type: "select",
      unit: "GB",
      isFilterable: true,
      isVariantAttribute: true,
      predefinedValues: ["128", "256", "512"],
      sortOrder: 2,
      status: "active",
      deletedAt: null,
    },
    {
      name: "Dung lượng pin",
      slug: "dung-luong-pin",
      type: "number",
      unit: "mAh",
      isFilterable: false,
      isVariantAttribute: false,
      predefinedValues: [],
      sortOrder: 3,
      status: "active",
      deletedAt: null,
    },
    {
      name: "Hỗ trợ NFC",
      slug: "ho-tro-nfc",
      type: "boolean",
      isFilterable: true,
      isVariantAttribute: false,
      predefinedValues: [],
      sortOrder: 4,
      status: "active",
      deletedAt: null,
    },
  ]);

  const colorAttribute = requireSeedValue(
    attributeDefinitions.find((item) => item.slug === "mau-sac"),
    "color attribute",
  );
  const storageAttribute = requireSeedValue(
    attributeDefinitions.find((item) => item.slug === "bo-nho-trong"),
    "storage attribute",
  );
  const batteryAttribute = requireSeedValue(
    attributeDefinitions.find((item) => item.slug === "dung-luong-pin"),
    "battery attribute",
  );
  const nfcAttribute = requireSeedValue(
    attributeDefinitions.find((item) => item.slug === "ho-tro-nfc"),
    "NFC attribute",
  );

  const categories = await CategoryModel.create([
    {
      name: "Điện thoại",
      slug: "dien-thoai",
      description: "Điện thoại thông minh",
      sortOrder: 1,
      attributeIds: [
        colorAttribute._id,
        storageAttribute._id,
        batteryAttribute._id,
        nfcAttribute._id,
      ],
      status: "active",
      deletedAt: null,
    },
    {
      name: "Tai nghe",
      slug: "tai-nghe",
      description: "Tai nghe không dây và có dây",
      sortOrder: 2,
      attributeIds: [colorAttribute._id],
      status: "active",
      deletedAt: null,
    },
  ]);

  const phoneCategory = requireSeedValue(
    categories.find((item) => item.slug === "dien-thoai"),
    "phone category",
  );
  const audioCategory = requireSeedValue(
    categories.find((item) => item.slug === "tai-nghe"),
    "audio category",
  );

  const brands = await BrandModel.create([
    {
      name: "Apple",
      slug: "apple",
      description: "Thương hiệu công nghệ Apple",
      sortOrder: 1,
      status: "active",
      deletedAt: null,
    },
    {
      name: "Samsung",
      slug: "samsung",
      description: "Thương hiệu công nghệ Samsung",
      sortOrder: 2,
      status: "active",
      deletedAt: null,
    },
    {
      name: "Xiaomi",
      slug: "xiaomi",
      description: "Thương hiệu công nghệ Xiaomi",
      sortOrder: 3,
      status: "active",
      deletedAt: null,
    },
  ]);

  const appleBrand = requireSeedValue(
    brands.find((item) => item.slug === "apple"),
    "Apple brand",
  );
  const samsungBrand = requireSeedValue(
    brands.find((item) => item.slug === "samsung"),
    "Samsung brand",
  );
  const xiaomiBrand = requireSeedValue(
    brands.find((item) => item.slug === "xiaomi"),
    "Xiaomi brand",
  );

  const products = await ProductModel.create([
    {
      name: "iPhone 15",
      slug: "iphone-15",
      categoryId: phoneCategory._id,
      brandId: appleBrand._id,
      thumbnailImage: "https://placehold.co/600x600?text=iPhone+15",
      description: "iPhone 15 với thiết kế hiện đại và hiệu năng ổn định.",
      specs: [
        { attributeId: batteryAttribute._id, value: "3349" },
        { attributeId: nfcAttribute._id, value: "true" },
      ],
      status: "active",
      deletedAt: null,
    },
    {
      name: "Samsung Galaxy S24",
      slug: "samsung-galaxy-s24",
      categoryId: phoneCategory._id,
      brandId: samsungBrand._id,
      thumbnailImage: "https://placehold.co/600x600?text=Galaxy+S24",
      description: "Samsung Galaxy S24 với màn hình chất lượng cao.",
      specs: [
        { attributeId: batteryAttribute._id, value: "4000" },
        { attributeId: nfcAttribute._id, value: "true" },
      ],
      status: "active",
      deletedAt: null,
    },
    {
      name: "Xiaomi Buds 5",
      slug: "xiaomi-buds-5",
      categoryId: audioCategory._id,
      brandId: xiaomiBrand._id,
      thumbnailImage: "https://placehold.co/600x600?text=Xiaomi+Buds+5",
      description:
        "Tai nghe không dây nhỏ gọn cho nhu cầu nghe nhạc hằng ngày.",
      specs: [],
      status: "active",
      deletedAt: null,
    },
  ]);

  const iphoneProduct = requireSeedValue(
    products.find((item) => item.slug === "iphone-15"),
    "iPhone product",
  );
  const galaxyProduct = requireSeedValue(
    products.find((item) => item.slug === "samsung-galaxy-s24"),
    "Galaxy product",
  );
  const airpodsProduct = requireSeedValue(
    products.find((item) => item.slug === "xiaomi-buds-5"),
    "Xiaomi Buds product",
  );

  const variants = await ProductVariantModel.create([
    {
      productId: iphoneProduct._id,
      sku: "IP15-BLK-128",
      attributes: [
        { attributeId: colorAttribute._id, value: "Đen" },
        { attributeId: storageAttribute._id, value: "128" },
      ],
      price: 19990000,
      originalPrice: 21990000,
      images: ["https://placehold.co/600x600?text=iPhone+15+Black"],
      status: "active",
      deletedAt: null,
    },
    {
      productId: iphoneProduct._id,
      sku: "IP15-BLU-256",
      attributes: [
        { attributeId: colorAttribute._id, value: "Xanh" },
        { attributeId: storageAttribute._id, value: "256" },
      ],
      price: 23990000,
      originalPrice: 24990000,
      images: ["https://placehold.co/600x600?text=iPhone+15+Blue"],
      status: "active",
      deletedAt: null,
    },
    {
      productId: galaxyProduct._id,
      sku: "S24-BLK-256",
      attributes: [
        { attributeId: colorAttribute._id, value: "Đen" },
        { attributeId: storageAttribute._id, value: "256" },
      ],
      price: 18990000,
      originalPrice: 20990000,
      images: ["https://placehold.co/600x600?text=Galaxy+S24+Black"],
      status: "active",
      deletedAt: null,
    },
    {
      productId: airpodsProduct._id,
      sku: "BUDS5-WHT",
      attributes: [{ attributeId: colorAttribute._id, value: "Trắng" }],
      price: 2490000,
      images: ["https://placehold.co/600x600?text=Xiaomi+Buds+5"],
      status: "active",
      deletedAt: null,
    },
  ]);

  const quantities = [8, 3, 5, 12];

  await InventoryModel.create(
    variants.map((variant, index) => ({
      variantId: variant._id,
      quantity: requireSeedValue(
        quantities[index],
        `quantity for variant ${index}`,
      ),
    })),
  );

  console.log("Seed completed successfully");
  console.log("Created 4 attributes, 2 categories, 3 brands, and 3 products");
  console.log(
    `Created ${variants.length} variants and ${variants.length} inventory records`,
  );
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
