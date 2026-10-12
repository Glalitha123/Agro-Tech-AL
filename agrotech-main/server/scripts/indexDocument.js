import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initPinecone } from "../config/pinecone.js";
import { indexDocument } from "../utils/pineconeEmbedder.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const run = async () => {
  try {
    console.log("Starting document ingestion...");
    console.log("Document:\nagriculture.txt\n");

    const filePath = path.resolve(__dirname, "../data/agriculture.txt");

    if (!fs.existsSync(filePath)) {
      throw new Error(`Document not found: ${filePath}`);
    }

    const text = fs.readFileSync(filePath, "utf-8");

    if (!text.trim()) {
      throw new Error("The agriculture document is empty.");
    }

    console.log("Document loaded successfully.");
    console.log(`Document length:\n${text.length} characters\n`);

    console.log("Initializing Pinecone client...");
    const pc = await initPinecone();
    if (!pc) {
      throw new Error("Pinecone client initialization failed or returned null (e.g. missing API key).");
    }

    console.log("Splitting document into chunks...");
    const result = await indexDocument(
      "agriculture_document_1",
      text,
      {
        source: "Agriculture Knowledge Base",
        title: "Agriculture Document",
        fileName: "agriculture.txt"
      }
    );

    console.log("\nIndexing completed.");

    if (result.mode !== "pinecone") {
      throw new Error(
        `Document was NOT inserted into Pinecone. Indexing used local fallback mode: "${result.mode}".`
      );
    }

    console.log(
      `Successfully inserted ${result.count} vectors into Pinecone.`
    );
    console.log("Indexing completed successfully.");

    process.exit(0);
  } catch (error) {
    console.error("\nDocument indexing failed:", error.message);
    process.exit(1);
  }
};

run();
