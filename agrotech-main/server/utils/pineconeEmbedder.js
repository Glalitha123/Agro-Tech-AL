import { pineconeClient } from '../config/pinecone.js';
import { getEmbedding } from './gemini.js';
import dotenv from 'dotenv';
dotenv.config();

const indexName = process.env.PINECONE_INDEX_NAME || 'agrotech-schemes-index';

// In-memory document storage fallback (for offline vector search mock)
const localVectorDatabase = [];

/**
 * Text splitter helper to chunk PDF text
 */
export const chunkText = (text, maxLength = 800, overlap = 150) => {
  const words = text.split(/\s+/);
  const chunks = [];
  let currentChunk = [];
  let currentLength = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentChunk.push(word);
    currentLength += word.length + 1; // +1 for space

    if (currentLength >= maxLength) {
      chunks.push(currentChunk.join(' '));
      // Slide back by overlap (approximate overlap by words count)
      const overlapWordsCount = Math.floor(overlap / 6); // Avg word length is 6
      const backStep = Math.min(overlapWordsCount, currentChunk.length - 1);
      i = i - backStep;
      
      currentChunk = [];
      currentLength = 0;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
};

/**
 * Indexes a document by chunking it, embedding each chunk, and saving it to Pinecone (or local fallback db)
 */
export const indexDocument = async (docId, text, metadata = {}) => {
  const chunks = chunkText(text);
  console.log(`Split document ${docId} into ${chunks.length} chunks.`);

  const upsertVectors = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunkTextContent = chunks[i];
    const chunkId = `${docId}_chunk_${i}`;
    const embedding = await getEmbedding(chunkTextContent);
    
    if (i === 0) {
      console.log(`Embedding dimension: ${embedding.length}`);
      
      if (pineconeClient) {
        try {
          const indexInfo = await pineconeClient.describeIndex(indexName);
          const expectedDimension = indexInfo.dimension;
          if (embedding.length !== expectedDimension) {
            const dimensionError = `Dimension mismatch error: The generated embedding dimension is ${embedding.length}, but the Pinecone index "${indexName}" expects dimension ${expectedDimension}. Cannot insert vectors into Pinecone.`;
            console.error(dimensionError);
            throw new Error(dimensionError);
          }
        } catch (err) {
          console.error(`Verification of Pinecone index "${indexName}" failed: ${err.message}`);
          throw err;
        }
      }
    }

    // Add to in-memory fallback db
    localVectorDatabase.push({
      id: chunkId,
      text: chunkTextContent,
      vector: embedding,
      metadata: { ...metadata, text: chunkTextContent, docId }
    });

    upsertVectors.push({
      id: chunkId,
      values: embedding,
      metadata: {
        ...metadata,
        text: chunkTextContent,
        docId,
      }
    });
  }

  // Attempt to write to Pinecone if available
  if (pineconeClient) {
    try {
      const index = pineconeClient.Index(indexName);
      // Split upsert into batches of 100
      const batchSize = 100;
      const totalBatches = Math.ceil(upsertVectors.length / batchSize);
      for (let j = 0; j < upsertVectors.length; j += batchSize) {
        const batch = upsertVectors.slice(j, j + batchSize);
        const batchNum = Math.floor(j / batchSize) + 1;
        await index.upsert(batch);
        console.log(`Uploaded batch ${batchNum}/${totalBatches}`);
      }
      console.log(`Successfully indexed ${upsertVectors.length} vectors in Pinecone.`);
      return { success: true, count: upsertVectors.length, mode: 'pinecone' };
    } catch (error) {
      console.error('Error writing to Pinecone:', error.message);
      console.log('Document cached in local memory fallback.');
      return { success: true, count: upsertVectors.length, mode: 'local_fallback' };
    }
  }

  console.log(`Document indexed locally. Total cache size: ${localVectorDatabase.length} chunks.`);
  return { success: true, count: upsertVectors.length, mode: 'local_fallback' };
};

/**
 * Queries Pinecone (or local fallback db) for top matches and retrieves combined text context
 */
export const searchSimilarDocs = async (queryText, topK = 3) => {
  console.log(`Searching similar documents for: "${queryText}"`);
  const queryEmbedding = await getEmbedding(queryText);

  // Fallback if Pinecone is not initialized
  if (!pineconeClient) {
    console.log('Pinecone not active. Using local memory cosine similarity search...');
    return await performLocalSimilaritySearch(queryEmbedding, queryText, topK);
  }

  try {
    const index = pineconeClient.Index(indexName);
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
    });

    if (queryResponse.matches && queryResponse.matches.length > 0) {
      const docs = queryResponse.matches
        .map(match => {
          return {
            score: match.score,
            text: match.metadata?.text || '',
            source: match.metadata?.source || 'Agricultural Manual',
            title: match.metadata?.title || 'General Reference',
          };
        })
        .filter(doc => doc.score >= 0.3); // Apply relevance threshold
      return docs;
    }
    
    console.log('No matches found in Pinecone. Running local search...');
    return await performLocalSimilaritySearch(queryEmbedding, queryText, topK);
  } catch (error) {
    console.error('Pinecone search failed:', error.message);
    console.log('Using local similarity search as fallback.');
    return await performLocalSimilaritySearch(queryEmbedding, queryText, topK);
  }
};

/**
 * Helper to compute Cosine Similarity between two vectors
 */
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * COSINE SIMILARITY SEARCH FALLBACK (entirely offline/local)
 */
const performLocalSimilaritySearch = async (queryEmbedding, queryText, topK) => {
  // If memory cache is empty, seed with some standard crop-treatments and government scheme documents
  if (localVectorDatabase.length === 0) {
    await seedLocalVectorCache();
  }

  const results = localVectorDatabase.map(doc => {
    // Standard cosine similarity
    let score = cosineSimilarity(queryEmbedding, doc.vector);
    
    // Add text similarity bump for exact keyword matches to make search super realistic
    const keywords = queryText.toLowerCase().split(/\s+/);
    let matchCount = 0;
    keywords.forEach(kw => {
      if (kw.length > 3 && doc.text.toLowerCase().includes(kw)) {
        matchCount++;
      }
    });
    score += (matchCount * 0.05); // slight bump per keyword match

    return {
      score,
      text: doc.text,
      source: doc.metadata.source || 'Agricultural Reference',
      title: doc.metadata.title || 'Scheme Finder Document',
    };
  });

  // Sort by score descending, filter by threshold, and return top K
  return results
    .filter(doc => doc.score >= 0.3) // Apply relevance threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
};

/**
 * Seeds local vector database with rich realistic documents
 */
const seedLocalVectorCache = async () => {
  const seedDocs = [
    {
      text: "Tomato Blight Management Guideline. Early blight of tomato is caused by the fungus Alternaria solani. Organic remedies include applying a 10% solution of seaweed extract or a copper hydroxide spray weekly. Maintain clean garden beds and remove crop residues. Chemical treatments like Chlorothalonil applied at 2g per liter are highly effective.",
      source: "National Crop Protection Manual",
      title: "Tomato Blight Management Guideline"
    },
    {
      text: "Rice Blast Treatment Protocol. Pyricularia oryzae causes blast disease in paddy fields. Organic controls suggest spraying fermented neem seed kernel extract. Chemical intervention includes spraying Tricyclazole 75% WP at 0.6g/liter of water or Hexaconazole 5% EC at 2ml/liter. Avoid excessive nitrogen fertilizer.",
      source: "Agronomy Handbook 2025",
      title: "Rice Blast Treatment Protocol"
    },
    {
      text: "Wheat Rust Prevention and Cure. Wheat stem rust is controlled by sowing resistant cultivars. Chemical control: Propiconazole 25% EC should be sprayed at 1ml per liter of water as soon as initial pustules are spotted on leaves. Wear protective masks. Organic approaches include applying bio-agents like Bacillus subtilis.",
      source: "Handbook on Cereal Diseases",
      title: "Wheat Rust Prevention and Cure"
    },
    {
      text: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN). A central sector scheme providing direct income support of Rs. 6000 per year in three equal installments to all landholding farmer families. Requires land records, Aadhaar, and active bank accounts. Link: https://pmkisan.gov.in. Applicable to all categories of farmers across all states.",
      source: "Ministry of Agriculture Schemes Book",
      title: "PM-KISAN Scheme"
    },
    {
      text: "Sub-Mission on Agricultural Mechanization (SMAM). Provides financial subsidies of up to 40% to 50% for purchasing farming equipment like tractors, power tillers, and harvesters. Benefits SC, ST, and OBC category farmers and women on priority. Landholding size limits: No upper limit, but small and marginal farmers get higher subsidies.",
      source: "Government Subsidy Guidelines",
      title: "Sub-Mission on Agricultural Mechanization"
    },
    {
      text: "Maharashtra Dr. Punjabrao Deshmukh Interest Subsidy Scheme. Provides 3% interest subsidy on crop loans up to 3 Lakhs for small landholders in Maharashtra. Requires bank loan papers, land titles (7/12 extract), and crop sowing certificates. Applicable only to Maharashtra farmers.",
      source: "Maharashtra State Schemes Registry",
      title: "Maharashtra Punjabrao Deshmukh Scheme"
    }
  ];

  console.log('Generating real embeddings for local vector cache seeding...');
  for (let idx = 0; idx < seedDocs.length; idx++) {
    const doc = seedDocs[idx];
    try {
      const embedding = await getEmbedding(doc.text);
      localVectorDatabase.push({
        id: `seed_doc_${idx}`,
        text: doc.text,
        vector: embedding,
        metadata: {
          source: doc.source,
          title: doc.title,
          text: doc.text
        }
      });
    } catch (err) {
      console.error(`Failed to generate real embedding for seed doc ${idx}:`, err.message);
      // Fallback to normalized mock vector of 3072 dimensions
      const mockVector = Array.from({ length: 3072 }, () => Math.random() * 2 - 1);
      const mag = Math.sqrt(mockVector.reduce((sum, val) => sum + val * val, 0));
      const normalized = mockVector.map(val => val / mag);
      localVectorDatabase.push({
        id: `seed_doc_${idx}`,
        text: doc.text,
        vector: normalized,
        metadata: {
          source: doc.source,
          title: doc.title,
          text: doc.text
        }
      });
    }
  }
  console.log(`Seeded local memory vector database cache with ${localVectorDatabase.length} documents.`);
};
