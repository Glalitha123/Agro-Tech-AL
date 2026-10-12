import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Scheme from '../models/Scheme.js';
import MarketTrend from '../models/MarketTrend.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('Clearing existing database collections...');
    await User.deleteMany({});
    await Scheme.deleteMany({});
    await MarketTrend.deleteMany({});

    console.log('Database collections cleared.');

    // 1. Create Seed Users
    console.log('Creating Seed Users...');
    
    // Admin Account
    const adminUser = await User.create({
      name: 'Aditya Patel (Admin)',
      email: 'admin@agrotech.com',
      password: 'admin123',
      role: 'admin',
      profile: {
        state: 'Delhi',
        landSize: 0,
        category: 'General',
        primaryCrops: []
      }
    });
    console.log(`- Admin User created: ${adminUser.email} (Password: admin123)`);

    // Farmer Account
    const farmerUser = await User.create({
      name: 'Ramesh Kumar (Farmer)',
      email: 'farmer@agrotech.com',
      password: 'farmer123',
      role: 'farmer',
      profile: {
        state: 'Maharashtra',
        landSize: 6.5, // acres
        category: 'OBC',
        primaryCrops: ['Wheat', 'Tomato', 'Paddy Rice']
      }
    });
    console.log(`- Farmer User created: ${farmerUser.email} (Password: farmer123)`);

    // 2. Create Seed Government Schemes
    console.log('Creating Seed Schemes...');
    const schemes = [
      {
        title: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
        description: 'An initiative by the Government of India that provides up to ₹6,000 per year in three equal installments to all landholding farmer families to help procure agricultural inputs.',
        state: 'All',
        minLandSize: 0,
        maxLandSize: 9999,
        category: 'All',
        crops: ['All'],
        benefits: 'Direct cash transfer of ₹6,000 annually, deposited as ₹2,000 every 4 months directly into the farmers bank accounts.',
        requiredDocuments: ['Aadhaar Card', 'Land Ownership Records (7/12 extract/Khata)', 'Bank Account Passbook Details', 'Mobile Number linked to Aadhaar'],
        applicationProcess: 'Register online at the PM-Kisan portal (https://pmkisan.gov.in) using Aadhaar and mobile number, verify land details, and submit for regional officer approval.',
        officialLink: 'https://pmkisan.gov.in',
        deadline: 'Open Year-Round'
      },
      {
        title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
        description: 'A government-sponsored crop insurance scheme that integrates multiple stakeholders to protect farmers against financial loss due to natural calamities, pests, and crop diseases.',
        state: 'All',
        minLandSize: 0.1,
        maxLandSize: 100,
        category: 'All',
        crops: ['Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Mustard Seeds'],
        benefits: 'Insurance payout covering full cost of sowing and harvest damages. Extremely low premium: 1.5% for Rabi crops, 2.0% for Kharif crops, and 5% for horticultural/commercial crops.',
        requiredDocuments: ['Sowing Certificate issued by local agricultural officer', 'Land tenancy agreement (if sharecropper)', 'Land registry record', 'Aadhaar Card', 'Cancelled Bank Cheque'],
        applicationProcess: 'Apply through your lending bank or directly on the PMFBY portal (https://pmfby.gov.in). Premium is deducted and policy activated before crop cycle starts.',
        officialLink: 'https://pmfby.gov.in',
        deadline: 'August 15 (Kharif), December 31 (Rabi)'
      },
      {
        title: 'Sub-Mission on Agricultural Mechanization (SMAM)',
        description: 'A scheme aimed at promoting agricultural mechanization by providing subsidies on farming machinery to small, marginal, and female farmers to increase farm productivity.',
        state: 'All',
        minLandSize: 0,
        maxLandSize: 9999,
        category: 'All', // Priority given to SC, ST, OBC
        crops: ['All'],
        benefits: '40% to 50% financial subsidy on purchase of farming implements such as Tractors, Power Tillers, Seed Drills, Rotavators, and Solar Water Pumps.',
        requiredDocuments: ['Land possession certificate', 'Aadhaar Card', 'Farmer Category Certificate (SC/ST/OBC)', 'Bank details', 'Quotation of the machine from an authorized dealer'],
        applicationProcess: 'Apply on the SMAM portal. Upload land details and select the desired machine. Once the pre-authorization is issued, buy the machinery and submit invoice to receive cash subsidy.',
        officialLink: 'https://agrimachinery.nic.in',
        deadline: 'Subject to regional budgets'
      },
      {
        title: 'Soil Health Card Scheme',
        description: 'Assists state governments to issue soil health cards to all farmers. The card provides soil nutrient status and recommendations for fertilizer dosage based on soil testing.',
        state: 'All',
        minLandSize: 0,
        maxLandSize: 9999,
        category: 'All',
        crops: ['All'],
        benefits: 'Free soil testing across 12 vital parameters (NPK, Sulfur, Zinc, Iron, pH, EC, etc.) and scientific guidelines on corrective dosages to reduce input costs by up to 10-15%.',
        requiredDocuments: ['Aadhaar Card', 'Soil Sample ID (provided by collection officer)', 'Mobile Number'],
        applicationProcess: 'Soil samples are collected from the farmers field by local agricultural officers. After laboratory analysis, cards are printed and delivered or can be downloaded online.',
        officialLink: 'https://soilhealth.dac.gov.in',
        deadline: 'Open Year-Round'
      },
      {
        title: 'Maharashtra Dr. Punjabrao Deshmukh Interest Subsidy Scheme',
        description: 'A state-specific scheme in Maharashtra which provides interest concessions on short-term crop loans to encourage timely repayments.',
        state: 'Maharashtra',
        minLandSize: 0.1,
        maxLandSize: 5.0, // Targeted to small/marginal farmers
        category: 'All',
        crops: ['Wheat', 'Tomato', 'Rice', 'Soybean', 'Cotton'],
        benefits: '3% interest subsidy on timely repayment of crop loans up to ₹3 Lakhs, effectively making the loan interest rate 0% for compliant farmers.',
        requiredDocuments: ['Land 7/12 Extract and 8A record', 'Crop Sowing Self-Declaration', 'Bank Loan Account statement showing timely repayment', 'Aadhaar Card'],
        applicationProcess: 'Submit interest waiver claim form through the cooperative society or bank branches where the crop loan was serviced.',
        officialLink: 'https://krishi.maharashtra.gov.in',
        deadline: 'March 31 annually'
      }
    ];

    await Scheme.insertMany(schemes);
    console.log(`- Seeded ${schemes.length} Government Schemes successfully.`);

    // 3. Create Seed Market Prices & Trends
    console.log('Creating Seed Market Trends...');
    const marketTrends = [
      {
        cropName: 'Wheat',
        currentPrice: 2450,
        priceChangeWeek: 2.4,
        demandLevel: 'High',
        riskLevel: 'Low',
        recommendation: 'Hold',
        forecast: [2450, 2480, 2510, 2550],
        newsSummary: 'Government increases MSP for wheat. Export demands from South-East Asia remain robust due to dry weather conditions in competing nations.'
      },
      {
        cropName: 'Paddy Rice',
        currentPrice: 2200,
        priceChangeWeek: 1.8,
        demandLevel: 'High',
        riskLevel: 'Low',
        recommendation: 'Hold',
        forecast: [2200, 2210, 2240, 2260],
        newsSummary: 'Paddy harvesting begins in northern states. Quality of grains reported high. Stable monsoon rains have backed bumper crops.'
      },
      {
        cropName: 'Cotton',
        currentPrice: 7200,
        priceChangeWeek: -1.5,
        demandLevel: 'Medium',
        riskLevel: 'Medium',
        recommendation: 'Sell',
        forecast: [7200, 7150, 7100, 7050],
        newsSummary: 'Global textile demand sees slight slowdown. Influx of new harvest in local markets creates short-term supply excess, pushing rates down.'
      },
      {
        cropName: 'Mustard Seeds',
        currentPrice: 5650,
        priceChangeWeek: 4.2,
        demandLevel: 'High',
        riskLevel: 'High',
        recommendation: 'Harvest',
        forecast: [5650, 5800, 5950, 6100],
        newsSummary: 'Edible oil imports decline, raising local seed demands. Shortage of cold-storage facilities is driving prompt processing transactions.'
      },
      {
        cropName: 'Tomato',
        currentPrice: 3500,
        priceChangeWeek: -12.5,
        demandLevel: 'Low',
        riskLevel: 'High',
        recommendation: 'Sell',
        forecast: [3500, 3100, 2800, 2500],
        newsSummary: 'Peak harvesting season has flooded regional markets with tomato supplies. High perishability leads to high price dips.'
      }
    ];

    await MarketTrend.insertMany(marketTrends);
    console.log(`- Seeded ${marketTrends.length} Crop Market Trends successfully.`);

    console.log('Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Failed:', error.message);
    process.exit(1);
  }
};

seedData();
