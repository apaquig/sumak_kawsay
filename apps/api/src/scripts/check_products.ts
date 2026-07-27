import mongoose from 'mongoose';
import { ProductModel } from '../models/Product.js';
import { env } from '../config/env.js';

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const products = await ProductModel.find();
  console.log(`Found ${products.length} products:`);
  for (const p of products) {
    console.log(`- Product: ${p.translations.es.name}, Category: ${p.category}, Published: ${p.published}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
