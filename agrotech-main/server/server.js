import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';


// Configurations and Database Connections
import connectDB from './config/db.js';
import { initPinecone } from './config/pinecone.js';

// Route Handlers
import authRoutes from './routes/authRoutes.js';
import cropRoutes from './routes/cropRoutes.js';
import schemeRoutes from './routes/schemeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import marketRoutes from './routes/marketRoutes.js';

// Error Middlewares
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

// Load variables
dotenv.config();

const app = express();

// Enable Cross-Origin Resource Sharing
app.use(cors({
  origin: '*', // Allow all client links to query in dev
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Resolve directory paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static uploaded crop files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    service: 'AgroTech AI Core API Engine',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

import passport from 'passport';
import session from 'express-session';
import { setupPassport } from './config/passport.js';

// Setup Passport Google Strategy
setupPassport();

// Express Session Middleware for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'agrotech_session_secret_key',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());

// Register Module Routes
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/market', marketRoutes);


// 404 Route Not Found fallback
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Initialize Database Connections and start server
const startServer = async () => {
  // Connect MongoDB
  await connectDB();

  // Connect Pinecone RAG Vector DB
  await initPinecone();

  // Create uploads folder if not exists
  const fs = await import('fs');
  const uploadPath = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log('Uploads directory initialized.');
  }

  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(` AgroTech AI API Server running on port ${PORT}`);
    console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=================================================`);
  });
};

startServer();
