# AgroTech AI – Smart Crop Doctor & Government Scheme Finder

AgroTech AI is a production-ready, full-stack MERN application integrated with Google Gemini AI (Multimodal text/vision) and Pinecone Vector Database (RAG) to assist farmers in managing crop health, seeking treatments, and finding eligible government subsidies.

## Features

1. **User Authentication**: Farmer and Admin accounts with secure password hashing (bcrypt) and protected API endpoints (JWT).
2. **AI Crop Doctor**: Crop disease analysis by uploading leaves images to Google Gemini Vision. Estimates severity, lists causes, and provides remedies.
3. **Scientific Treatment Finder (RAG)**: Cosine similarity vector search over agricultural handbooks indexed in Pinecone, with synthesized treatment summaries from Gemini.
4. **Government Scheme Matcher**: Qualify farmers for central and state-specific agricultural subsidies based on acreage limits, crop types, states, and caste category parameters.
5. **Conversational Voice Assistant**: Web Speech API for voice transcribing, querying Gemini, and speaking responses back via Text-to-Speech (TTS).
6. **Market Trend Analysis**: Price movements, weekly price projection charts (Chart.js), and crop-specific agricultural news alerts.
7. **Admin Console**: Manage farmers directory, publish new government subsidies, upload reference PDFs, chunk and index vectors, and view platform metrics.
8. **Auto-detecting Fallback Mode**: Runs seamlessly out-of-the-box using local mock algorithms for Gemini Vision, text embeddings, and Pinecone vector search, allowing developers to test the app without configuring API keys.

---

## Workspace Folder Structure

```text
AgroTech AI/
├── server/                    # Express Backend
│   ├── config/                # Mongoose database & Pinecone configurations
│   ├── controllers/           # MVC Controllers (Auth, Crop, Scheme, Admin)
│   ├── middleware/            # JWT authorization and Central Error Handlers
│   ├── models/                # MongoDB Models (User, Diagnosis, Scheme, Market)
│   ├── routes/                # Express API Route endpoints mapping
│   ├── scripts/               # DB seeding script
│   ├── utils/                 # Gemini API, Vector embedder, and fallback algorithms
│   ├── uploads/               # Storage destination for uploaded leaf photos
│   ├── .env.example           # Variables template
│   └── package.json           # Backend dependencies configuration
│
├── client/                    # Vite React Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI widgets (Navbar, Sidebar, VoiceSearch)
│   │   ├── context/           # React Context (Authentication session state)
│   │   ├── pages/             # Layout pages (Home, Dashboard, CropDoctor, etc.)
│   │   ├── utils/             # Axios API client with header interceptors
│   │   ├── App.jsx            # Router and master layout mount
│   │   ├── index.css          # Tailwind configurations and glassmorphic styles
│   │   └── main.jsx           # Mounting DOM engine
│   ├── index.html             # Typography and SEO meta headers
│   ├── tailwind.config.js     # Color systems mapping (farm greens, harvest ambers)
│   ├── vite.config.js         # Port mapping and endpoint dev-proxy rules
│   └── package.json           # Frontend dependencies configuration
```

---

## Installation & Setup

### Prerequisite Checklist
- **Node.js** (v18.x or above recommended)
- **MongoDB** (Local Community Edition or Atlas Account)

### Step 1: Install Dependencies
Open two terminals or command lines in the root folder.

**In terminal 1 (Server Backend):**
```bash
cd server
npm install
```

**In terminal 2 (React Frontend):**
```bash
cd client
npm install
```

---

### Step 2: Configure Environment Variables

Create a `.env` file inside the `server/` directory:
```bash
cp .env.example .env
```
Inside `server/.env`, configure your credentials:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/agrotech
JWT_SECRET=your_jwt_super_secret_key_change_in_production

# Optional: Add keys to activate live AI & Pinecone. 
# Leaving these blank will auto-activate local Fallback Mock Mode.
GEMINI_API_KEY=AIzaSy...
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX_NAME=agrotech-schemes-index
```

---

### Step 3: Seed Database
Before starting the backend, prepopulate MongoDB with demo user credentials, seed government schemes, and market price datasets.

**In backend terminal (`server/`):**
```bash
npm run seed
```

This registers two accounts:
- **Farmer Account**: `farmer@agrotech.com` / `farmer123`
- **Admin Account**: `admin@agrotech.com` / `admin123`

---

### Step 4: Run Application

**Start the Backend Server (Express):**
In `server/` directory:
```bash
npm run dev
```
*Runs backend server on `http://localhost:5000`*

**Start the Frontend Client (Vite + React):**
In `client/` directory:
```bash
npm run dev
```
*Launches development UI client on `http://localhost:5173`*

Open **`http://localhost:5173`** in your browser to explore the platform!

---

## Technology Stack Specifications

- **Frontend**: React, React Router v6, Tailwind CSS v3, Axios, Framer Motion, Chart.js.
- **Backend**: Node.js, Express, Mongoose, Multer (in-memory buffers), bcryptjs, jsonwebtoken.
- **AI Engine**: Google Gemini API (`gemini-1.5-flash` for vision and conversational chatbot; `text-embedding-004` for vectorization).
- **Vector DB**: Pinecone Database (1536-dimensional embedding indices).
"# Agrotech" 
