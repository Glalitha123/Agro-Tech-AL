import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config();

let pineconeClient = null;

const initPinecone = async () => {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    console.warn('Pinecone API Key is missing. RAG functionality will run in local similarity Search Fallback Mode.');
    return null;
  }

  try {
    const pc = new Pinecone({ apiKey });
    console.log('Pinecone Client Initialized Successfully.');
    pineconeClient = pc;
    return pc;
  } catch (error) {
    console.error('Failed to initialize Pinecone Client:', error.message);
    return null;
  }
};

export { initPinecone, pineconeClient };
export default () => pineconeClient;
