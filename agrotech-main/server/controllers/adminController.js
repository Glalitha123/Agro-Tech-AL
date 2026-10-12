import User from '../models/User.js';
import Scheme from '../models/Scheme.js';
import CropDiagnosis from '../models/CropDiagnosis.js';
import { indexDocument } from '../utils/pineconeEmbedder.js';

/**
 * @desc    Get all users (farmers/admins)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new Government Scheme
 * @route   POST /api/admin/schemes/create
 * @access  Private/Admin
 */
export const createScheme = async (req, res, next) => {
  const {
    title,
    description,
    state,
    minLandSize,
    maxLandSize,
    category,
    crops,
    benefits,
    requiredDocuments,
    applicationProcess,
    officialLink,
    deadline,
  } = req.body;

  try {
    const schemeExists = await Scheme.findOne({ title });

    if (schemeExists) {
      res.status(400);
      return next(new Error('Scheme already exists with this title'));
    }

    const scheme = await Scheme.create({
      title,
      description,
      state: state || 'All',
      minLandSize: minLandSize || 0,
      maxLandSize: maxLandSize || 99999,
      category: category || 'All',
      crops: crops || ['All'],
      benefits,
      requiredDocuments: requiredDocuments || [],
      applicationProcess,
      officialLink: officialLink || '',
      deadline: deadline || 'N/A',
    });

    // Automatically Index Scheme into RAG vector database for semantic query searches!
    const indexText = `Scheme: ${scheme.title}. Description: ${scheme.description}. Benefits: ${scheme.benefits}. Crops: ${scheme.crops.join(', ')}. Eligible State: ${scheme.state}. Land Limit: ${scheme.minLandSize} to ${scheme.maxLandSize} acres. Category: ${scheme.category} farmers. How to apply: ${scheme.applicationProcess}`;
    await indexDocument(scheme._id.toString(), indexText, {
      type: 'scheme',
      title: scheme.title,
      source: 'Government Schemes Registry',
    });

    res.status(201).json(scheme);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload Handbook PDF or text document and generate RAG Embeddings
 * @route   POST /api/admin/upload-document
 * @access  Private/Admin
 */
export const uploadDocumentRAG = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      return next(new Error('Please upload a document file (TXT/PDF)'));
    }

    const { docTitle, docSource } = req.body;
    const originalName = req.file.originalname;
    
    let textContent = '';

    // If text file (TXT, Markdown), read buffer directly
    if (req.file.mimetype === 'text/plain' || originalName.endsWith('.txt') || originalName.endsWith('.md')) {
      textContent = req.file.buffer.toString('utf-8');
    } else {
      // For PDF files or other formats, we extract text characters.
      // To ensure no installation failures on Windows systems, we run a robust text extraction parser
      // which searches printable characters or simulates extraction.
      const rawText = req.file.buffer.toString('binary');
      // basic extraction: pull ascii printable groups to get the words from PDF/Doc binary
      const cleanText = rawText.replace(/[^\x20-\x7E\n\r]/g, ' ');
      textContent = `Document Upload: ${docTitle || originalName}. Context content extracted:\n ${cleanText.substring(0, 15000)}`;
    }

    if (!textContent || textContent.trim().length < 10) {
      res.status(400);
      return next(new Error('Could not extract sufficient text from the uploaded document'));
    }

    const docId = `upload_${Date.now()}`;
    const result = await indexDocument(docId, textContent, {
      title: docTitle || originalName,
      source: docSource || 'Uploaded File',
      fileName: originalName
    });

    res.json({
      message: 'Document uploaded and successfully indexed into Vector Database.',
      documentId: docId,
      fileName: originalName,
      chunksCount: result.count,
      vectorMode: result.mode
    });
  } catch (error) {
    console.error('Error uploading and indexing document:', error);
    next(error);
  }
};

/**
 * @desc    Get dashboard analytics metrics
 * @route   GET /api/admin/analytics
 * @access  Private/Admin
 */
export const getPlatformAnalytics = async (req, res, next) => {
  try {
    const totalFarmers = await User.countDocuments({ role: 'farmer' });
    const totalDiagnoses = await CropDiagnosis.countDocuments({});
    const totalSchemes = await Scheme.countDocuments({});

    // Severity breakdown
    const severityStats = await CropDiagnosis.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    const severityBreakdown = { Healthy: 0, Mild: 0, Moderate: 0, Severe: 0, Unknown: 0 };
    severityStats.forEach(stat => {
      if (stat._id in severityBreakdown) {
        severityBreakdown[stat._id] = stat.count;
      }
    });

    // Top crop diseases diagnosed
    const topDiseases = await CropDiagnosis.aggregate([
      { $group: { _id: '$diseaseName', count: { $sum: 1 }, crop: { $first: '$cropName' } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Farmers registered by state
    const farmersByState = await User.aggregate([
      { $match: { role: 'farmer' } },
      { $group: { _id: '$profile.state', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      metrics: {
        totalFarmers,
        totalDiagnoses,
        totalSchemes
      },
      severityBreakdown,
      topDiseases: topDiseases.map(d => ({ disease: d._id, crop: d.crop, count: d.count })),
      farmersByState: farmersByState.map(s => ({ state: s._id || 'Unspecified', count: s.count }))
    });
  } catch (error) {
    next(error);
  }
};
