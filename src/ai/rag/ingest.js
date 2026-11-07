import "dotenv/config";
import mongoose from "mongoose";

import { connectDb } from "../../config/database.js";
import { loadDocuments } from "./loader.js";
import { splitDocuments } from "./splitter.js";
import { embeddings } from "./embeddings.js";

async function ingest() {
  try {
    await connectDb();

    console.log("📚 Loading documents...");
    const docs = await loadDocuments("./src/ai/knowledge");

    console.log(`Loaded ${docs.length} documents`);

    console.log("✂️ Splitting documents...");
    const chunks = await splitDocuments(docs);

    console.log(`Created ${chunks.length} chunks`);

    console.log("🧠 Generating embeddings...");

    const vectors = await embeddings.embedDocuments(
      chunks.map((chunk) => chunk.pageContent),
    );

    const collection = mongoose.connection.collection("knowledge");

    const records = chunks.map((chunk, index) => ({
      text: chunk.pageContent,
      embedding: vectors[index],

      source: chunk.metadata.source,
      category: chunk.metadata.category,
    }));

    // Replace only matching source chunks; preserve unrelated knowledge.
    for (const source of new Set(records.map((r) => r.source)))
      await collection.deleteMany({ source });

    await collection.insertMany(records);

    console.log(`✅ Inserted ${records.length} documents`);
    console.log("🎉 Knowledge ingestion completed!");
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

ingest();
