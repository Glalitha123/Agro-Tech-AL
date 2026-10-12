import express from 'express';
import MandiPrice from '../models/MandiPrice.js';
import { protect } from '../middleware/authMiddleware.js';
import { 
  normalizeName, 
  parseArrivalDate,
  calculatePriceChangePercentage,
  calculateLinearRegressionForecast,
  calculateAdvisorRecommendation,
  calculatePriceRisk
} from '../utils/marketCalculations.js';
import { stateDistricts, getDistrictAliases } from '../config/stateDistricts.js';

const router = express.Router();

const COMMODITY_MAPPINGS = {
  "Wheat": ["wheat"],
  "Paddy Rice": ["paddy(dhan)(common)", "paddy(common)", "paddy", "rice", "paddy(dhan)(grade a)"],
  "Corn": ["maize", "corn"],
  "Cotton": ["cotton"],
  "Sugarcane": ["sugarcane"],
  "Mustard Seeds": ["mustard", "mustard seed", "mustard seeds"],
  "Tomato": ["tomato"],
  "Onion": ["onion"]
};

// Primary agricultural focus states for each supported crop
const CROP_PRIMARY_STATES = {
  "Paddy Rice": ["Punjab", "Haryana", "Uttar Pradesh", "West Bengal", "Andhra Pradesh", "Tamil Nadu", "Bihar"],
  "Wheat": ["Punjab", "Haryana", "Uttar Pradesh", "Madhya Pradesh", "Rajasthan", "Bihar"],
  "Corn": ["Karnataka", "Bihar", "Madhya Pradesh", "Rajasthan", "Uttar Pradesh", "Andhra Pradesh"],
  "Cotton": ["Gujarat", "Maharashtra", "Madhya Pradesh", "Rajasthan", "Haryana", "Andhra Pradesh"],
  "Sugarcane": ["Uttar Pradesh", "Maharashtra", "Karnataka", "Tamil Nadu", "Bihar", "Gujarat"],
  "Mustard Seeds": ["Rajasthan", "Madhya Pradesh", "Haryana", "Uttar Pradesh", "Gujarat"],
  "Tomato": ["Andhra Pradesh", "Maharashtra", "Karnataka", "Madhya Pradesh", "Gujarat", "Tamil Nadu"],
  "Onion": ["Maharashtra", "Madhya Pradesh", "Karnataka", "Gujarat", "Rajasthan", "Bihar"]
};

// Default Mandi seeds per crop & state for instant rendering and high reliability
const CROP_DISTRICT_MANDIS = {
  "Paddy Rice": {
    "Punjab": [
      { district: "Amritsar", market: "Amritsar Main", basePrice: 2280, variety: "Basmati", grade: "FAQ" },
      { district: "Amritsar", market: "Rayya", basePrice: 2240, variety: "Common", grade: "FAQ" },
      { district: "Ludhiana", market: "Ludhiana Grain", basePrice: 2310, variety: "Grade A", grade: "FAQ" },
      { district: "Ludhiana", market: "Khanna", basePrice: 2350, variety: "Basmati", grade: "FAQ" },
      { district: "Patiala", market: "Patiala City", basePrice: 2260, variety: "Common", grade: "FAQ" },
      { district: "Patiala", market: "Rajpura", basePrice: 2290, variety: "Grade A", grade: "FAQ" },
      { district: "Jalandhar", market: "Jalandhar Cantonment", basePrice: 2250, variety: "Common", grade: "FAQ" },
      { district: "Kapurthala", market: "Phagwara", basePrice: 2220, variety: "Common", grade: "FAQ" }
    ],
    "Haryana": [
      { district: "Karnal", market: "Karnal Mandi", basePrice: 2340, variety: "Super Basmati", grade: "FAQ" },
      { district: "Karnal", market: "Gharaunda", basePrice: 2300, variety: "Grade A", grade: "FAQ" },
      { district: "Ambala", market: "Ambala City", basePrice: 2270, variety: "Common", grade: "FAQ" },
      { district: "Kurukshetra", market: "Thanesar", basePrice: 2320, variety: "Basmati", grade: "FAQ" },
      { district: "Kaithal", market: "Kaithal Grain", basePrice: 2290, variety: "Common", grade: "FAQ" }
    ],
    "Uttar Pradesh": [
      { district: "Bareilly", market: "Bareilly Grain", basePrice: 2180, variety: "Common", grade: "FAQ" },
      { district: "Aligarh", market: "Aligarh Mandi", basePrice: 2210, variety: "Grade A", grade: "FAQ" },
      { district: "Varanasi", market: "Varanasi Mandi", basePrice: 2150, variety: "Common", grade: "FAQ" },
      { district: "Gorakhpur", market: "Gorakhpur Grain", basePrice: 2160, variety: "Common", grade: "FAQ" }
    ],
    "West Bengal": [
      { district: "Hooghly", market: "Singur Mandi", basePrice: 2230, variety: "Minikit", grade: "FAQ" },
      { district: "Burdwan", market: "Burdwan Grain", basePrice: 2270, variety: "Swarna", grade: "FAQ" },
      { district: "Nadia", market: "Krishnanagar", basePrice: 2200, variety: "Common", grade: "FAQ" },
      { district: "Murshidabad", market: "Baharampur", basePrice: 2190, variety: "Common", grade: "FAQ" }
    ],
    "Andhra Pradesh": [
      { district: "Guntur", market: "Guntur Yard", basePrice: 2300, variety: "BPT 5204", grade: "FAQ" },
      { district: "East Godavari", market: "Kakinada", basePrice: 2340, variety: "Grade A", grade: "FAQ" },
      { district: "West Godavari", market: "Eluru", basePrice: 2320, variety: "Grade A", grade: "FAQ" },
      { district: "Krishna", market: "Vijayawada", basePrice: 2290, variety: "Common", grade: "FAQ" }
    ],
    "Tamil Nadu": [
      { district: "Thanjavur", market: "Thanjavur Grain", basePrice: 2250, variety: "Ponni", grade: "FAQ" },
      { district: "Madurai", market: "Madurai Central", basePrice: 2220, variety: "Common", grade: "FAQ" },
      { district: "Tiruchirappalli", market: "Trichy Market", basePrice: 2240, variety: "Ponni", grade: "FAQ" }
    ],
    "Bihar": [
      { district: "Patna", market: "Patna Main", basePrice: 2120, variety: "Common", grade: "FAQ" },
      { district: "Rohtas", market: "Sasaram", basePrice: 2180, variety: "Grade A", grade: "FAQ" },
      { district: "West Champaran", market: "Bettiah", basePrice: 2140, variety: "Common", grade: "FAQ" }
    ]
  },
  "Wheat": {
    "Punjab": [
      { district: "Ludhiana", market: "Ludhiana Grain", basePrice: 2480, variety: "PBW 343", grade: "FAQ" },
      { district: "Amritsar", market: "Amritsar Main", basePrice: 2460, variety: "Kalyan Sona", grade: "FAQ" },
      { district: "Bathinda", market: "Bathinda Mandi", basePrice: 2440, variety: "Common", grade: "FAQ" },
      { district: "Sangrur", market: "Sangrur Grain", basePrice: 2470, variety: "Grade A", grade: "FAQ" }
    ],
    "Haryana": [
      { district: "Karnal", market: "Karnal Mandi", basePrice: 2490, variety: "Sharbati", grade: "FAQ" },
      { district: "Hisar", market: "Hisar Market", basePrice: 2450, variety: "Common", grade: "FAQ" },
      { district: "Sirsa", market: "Sirsa Mandi", basePrice: 2460, variety: "Grade A", grade: "FAQ" },
      { district: "Fatehabad", market: "Fatehabad Grain", basePrice: 2430, variety: "Common", grade: "FAQ" }
    ],
    "Uttar Pradesh": [
      { district: "Bareilly", market: "Bareilly Grain", basePrice: 2390, variety: "Dara", grade: "FAQ" },
      { district: "Meerut", market: "Meerut Mandi", basePrice: 2430, variety: "Desi", grade: "FAQ" },
      { district: "Agra", market: "Agra Mandi", basePrice: 2410, variety: "Dara", grade: "FAQ" },
      { district: "Kanpur Nagar", market: "Kanpur Central", basePrice: 2400, variety: "Common", grade: "FAQ" }
    ],
    "Madhya Pradesh": [
      { district: "Indore", market: "Indore Malwa", basePrice: 2550, variety: "Sharbati Gold", grade: "FAQ" },
      { district: "Ujjain", market: "Ujjain Mandi", basePrice: 2510, variety: "Sharbati", grade: "FAQ" },
      { district: "Dewas", market: "Dewas Grain", basePrice: 2480, variety: "Lokwan", grade: "FAQ" },
      { district: "Bhopal", market: "Karond Mandi", basePrice: 2470, variety: "Common", grade: "FAQ" }
    ],
    "Rajasthan": [
      { district: "Kota", market: "Kota Grain", basePrice: 2470, variety: "Desi Sharbati", grade: "FAQ" },
      { district: "Sri Ganganagar", market: "Ganganagar Main", basePrice: 2450, variety: "Kalyan", grade: "FAQ" },
      { district: "Jaipur", market: "Mohana Mandi", basePrice: 2440, variety: "Common", grade: "FAQ" },
      { district: "Alwar", market: "Alwar Market", basePrice: 2420, variety: "Common", grade: "FAQ" }
    ],
    "Bihar": [
      { district: "Patna", market: "Patna Central", basePrice: 2350, variety: "Common", grade: "FAQ" },
      { district: "Gaya", market: "Gaya Mandi", basePrice: 2340, variety: "Common", grade: "FAQ" },
      { district: "Rohtas", market: "Sasaram", basePrice: 2380, variety: "Grade A", grade: "FAQ" }
    ]
  },
  "Corn": {
    "Karnataka": [
      { district: "Davanagere", market: "Davanagere Yard", basePrice: 2150, variety: "Yellow Hybrid", grade: "FAQ" },
      { district: "Belagavi", market: "Belagavi Mandi", basePrice: 2120, variety: "Yellow", grade: "FAQ" },
      { district: "Haveri", market: "Haveri Market", basePrice: 2140, variety: "Hybrid", grade: "FAQ" },
      { district: "Chitradurga", market: "Chitradurga Grain", basePrice: 2110, variety: "Common", grade: "FAQ" }
    ],
    "Bihar": [
      { district: "Khagaria", market: "Khagaria Yard", basePrice: 2180, variety: "Yellow Hybrid", grade: "FAQ" },
      { district: "Begusarai", market: "Begusarai Mandi", basePrice: 2160, variety: "Yellow", grade: "FAQ" },
      { district: "Samastipur", market: "Samastipur Grain", basePrice: 2140, variety: "Common", grade: "FAQ" },
      { district: "Bhagalpur", market: "Bhagalpur Yard", basePrice: 2130, variety: "Common", grade: "FAQ" }
    ],
    "Madhya Pradesh": [
      { district: "Chhindwara", market: "Chhindwara Yard", basePrice: 2100, variety: "Yellow", grade: "FAQ" },
      { district: "Dhar", market: "Dhar Mandi", basePrice: 2080, variety: "Hybrid", grade: "FAQ" },
      { district: "Khargone", market: "Khargone Grain", basePrice: 2090, variety: "Yellow", grade: "FAQ" }
    ],
    "Rajasthan": [
      { district: "Bhilwara", market: "Bhilwara Mandi", basePrice: 2070, variety: "White", grade: "FAQ" },
      { district: "Udaipur", market: "Udaipur Yard", basePrice: 2060, variety: "Common", grade: "FAQ" },
      { district: "Chittorgarh", market: "Chittorgarh Mandi", basePrice: 2080, variety: "Yellow", grade: "FAQ" }
    ],
    "Uttar Pradesh": [
      { district: "Bahraich", market: "Bahraich Mandi", basePrice: 2090, variety: "Yellow", grade: "FAQ" },
      { district: "Kanpur Dehat", market: "Rura Mandi", basePrice: 2110, variety: "Hybrid", grade: "FAQ" },
      { district: "Bulandshahr", market: "Bulandshahr Grain", basePrice: 2130, variety: "Yellow", grade: "FAQ" }
    ],
    "Andhra Pradesh": [
      { district: "Guntur", market: "Guntur Market", basePrice: 2160, variety: "Yellow Hybrid", grade: "FAQ" },
      { district: "Kurnool", market: "Kurnool Yard", basePrice: 2140, variety: "Yellow", grade: "FAQ" },
      { district: "West Godavari", market: "Eluru Mandi", basePrice: 2170, variety: "Hybrid", grade: "FAQ" }
    ]
  },
  "Cotton": {
    "Gujarat": [
      { district: "Rajkot", market: "Rajkot Yard", basePrice: 7350, variety: "Shankar 6", grade: "FAQ" },
      { district: "Amreli", market: "Amreli Mandi", basePrice: 7280, variety: "Kalyan", grade: "FAQ" },
      { district: "Surendranagar", market: "Wadhwan", basePrice: 7310, variety: "Shankar 6", grade: "FAQ" },
      { district: "Bhavnagar", market: "Bhavnagar Mandi", basePrice: 7260, variety: "Common", grade: "FAQ" }
    ],
    "Maharashtra": [
      { district: "Yavatmal", market: "Yavatmal Yard", basePrice: 7240, variety: "BT Cotton", grade: "FAQ" },
      { district: "Jalgaon", market: "Jalgaon Market", basePrice: 7290, variety: "Shankar", grade: "FAQ" },
      { district: "Akola", market: "Akola Mandi", basePrice: 7220, variety: "BT Cotton", grade: "FAQ" },
      { district: "Wardha", market: "Hinganghat", basePrice: 7260, variety: "Medium Staple", grade: "FAQ" }
    ],
    "Madhya Pradesh": [
      { district: "Khargone", market: "Khargone Mandi", basePrice: 7180, variety: "Medium Staple", grade: "FAQ" },
      { district: "Khandwa", market: "Khandwa Market", basePrice: 7150, variety: "Common", grade: "FAQ" },
      { district: "Dhar", market: "Dhar Yard", basePrice: 7190, variety: "BT Cotton", grade: "FAQ" }
    ],
    "Rajasthan": [
      { district: "Hanumangarh", market: "Hanumangarh Town", basePrice: 7320, variety: "J-34", grade: "FAQ" },
      { district: "Sri Ganganagar", market: "Ganganagar Grain", basePrice: 7340, variety: "J-34", grade: "FAQ" }
    ],
    "Haryana": [
      { district: "Sirsa", market: "Sirsa Mandi", basePrice: 7300, variety: "J-34", grade: "FAQ" },
      { district: "Fatehabad", market: "Bhattukalan", basePrice: 7270, variety: "Common", grade: "FAQ" },
      { district: "Hisar", market: "Hisar Yard", basePrice: 7280, variety: "BT Cotton", grade: "FAQ" }
    ],
    "Andhra Pradesh": [
      { district: "Guntur", market: "Guntur Cotton Yard", basePrice: 7210, variety: "Long Staple", grade: "FAQ" },
      { district: "Kurnool", market: "Adoni Mandi", basePrice: 7250, variety: "Medium Staple", grade: "FAQ" }
    ]
  },
  "Sugarcane": {
    "Uttar Pradesh": [
      { district: "Muzaffarnagar", market: "Muzaffarnagar Yard", basePrice: 350, variety: "Co 0238", grade: "FAQ" },
      { district: "Meerut", market: "Meerut Mandi", basePrice: 345, variety: "Early Maturing", grade: "FAQ" },
      { district: "Bijnor", market: "Bijnor Market", basePrice: 348, variety: "Co 0238", grade: "FAQ" },
      { district: "Lakhimpur Kheri", market: "Lakhimpur Yard", basePrice: 340, variety: "General", grade: "FAQ" }
    ],
    "Maharashtra": [
      { district: "Kolhapur", market: "Kolhapur Sugar Hub", basePrice: 360, variety: "Co 86032", grade: "FAQ" },
      { district: "Sangli", market: "Sangli Yard", basePrice: 358, variety: "Co 86032", grade: "FAQ" },
      { district: "Pune", market: "Baramati", basePrice: 352, variety: "General", grade: "FAQ" },
      { district: "Solapur", market: "Solapur Market", basePrice: 348, variety: "General", grade: "FAQ" }
    ],
    "Karnataka": [
      { district: "Mandya", market: "Mandya Mandi", basePrice: 355, variety: "Co 62175", grade: "FAQ" },
      { district: "Belagavi", market: "Sankeshwar", basePrice: 352, variety: "General", grade: "FAQ" },
      { district: "Bagalkote", market: "Sameerwadi", basePrice: 350, variety: "General", grade: "FAQ" }
    ],
    "Tamil Nadu": [
      { district: "Coimbatore", market: "Coimbatore Yard", basePrice: 345, variety: "Co 86032", grade: "FAQ" },
      { district: "Erode", market: "Erode Market", basePrice: 342, variety: "General", grade: "FAQ" },
      { district: "Salem", market: "Salem Mandi", basePrice: 340, variety: "General", grade: "FAQ" }
    ],
    "Bihar": [
      { district: "West Champaran", market: "Bagaha Mill Yard", basePrice: 335, variety: "Common", grade: "FAQ" },
      { district: "Gopalganj", market: "Harkhua", basePrice: 332, variety: "Common", grade: "FAQ" }
    ],
    "Gujarat": [
      { district: "Surat", market: "Bardoli Yard", basePrice: 355, variety: "Co 86032", grade: "FAQ" },
      { district: "Navsari", market: "Gandevi", basePrice: 350, variety: "General", grade: "FAQ" }
    ]
  },
  "Mustard Seeds": {
    "Rajasthan": [
      { district: "Bharatpur", market: "Bharatpur Mandi", basePrice: 5720, variety: "Kalu Mustard", grade: "FAQ" },
      { district: "Alwar", market: "Alwar Market", basePrice: 5680, variety: "Black Seed", grade: "FAQ" },
      { district: "Sri Ganganagar", market: "Ganganagar Yard", basePrice: 5750, variety: "Yellow Seed", grade: "FAQ" },
      { district: "Kota", market: "Kota Grain", basePrice: 5640, variety: "Common", grade: "FAQ" },
      { district: "Jaipur", market: "Kukas Mandi", basePrice: 5660, variety: "Common", grade: "FAQ" }
    ],
    "Madhya Pradesh": [
      { district: "Morena", market: "Morena Mandi", basePrice: 5650, variety: "Mustard Black", grade: "FAQ" },
      { district: "Bhind", market: "Bhind Yard", basePrice: 5620, variety: "Common", grade: "FAQ" },
      { district: "Sheopur", market: "Sheopur Market", basePrice: 5600, variety: "Common", grade: "FAQ" }
    ],
    "Haryana": [
      { district: "Bhiwani", market: "Bhiwani Mandi", basePrice: 5700, variety: "Yellow Mustard", grade: "FAQ" },
      { district: "Rewari", market: "Rewari Yard", basePrice: 5670, variety: "Black Seed", grade: "FAQ" },
      { district: "Mahendragarh", market: "Narnaul", basePrice: 5650, variety: "Common", grade: "FAQ" }
    ],
    "Uttar Pradesh": [
      { district: "Agra", market: "Agra Grain", basePrice: 5610, variety: "Rai Mustard", grade: "FAQ" },
      { district: "Mathura", market: "Mathura Mandi", basePrice: 5590, variety: "Common", grade: "FAQ" },
      { district: "Aligarh", market: "Aligarh Yard", basePrice: 5620, variety: "Common", grade: "FAQ" }
    ],
    "Gujarat": [
      { district: "Banaskantha", market: "Palanpur", basePrice: 5690, variety: "Mustard Bold", grade: "FAQ" },
      { district: "Patan", market: "Patan Mandi", basePrice: 5660, variety: "Common", grade: "FAQ" }
    ]
  },
  "Tomato": {
    "Andhra Pradesh": [
      { district: "Chittoor", market: "Madanapalle Yard", basePrice: 3450, variety: "Hybrid Tomato", grade: "FAQ" },
      { district: "Ananthapuramu", market: "Anantapur Mandi", basePrice: 3380, variety: "Local Red", grade: "FAQ" },
      { district: "Kurnool", market: "Kurnool Market", basePrice: 3400, variety: "Hybrid", grade: "FAQ" }
    ],
    "Maharashtra": [
      { district: "Nashik", market: "Pimplegaon Yard", basePrice: 3600, variety: "Special Grade 1", grade: "FAQ" },
      { district: "Pune", market: "Narayangaon", basePrice: 3550, variety: "Hybrid Red", grade: "FAQ" },
      { district: "Ahmednagar", market: "Sangamner", basePrice: 3480, variety: "Local", grade: "FAQ" }
    ],
    "Karnataka": [
      { district: "Kolar", market: "Kolar APMC Yard", basePrice: 3520, variety: "Hybrid Tomato", grade: "FAQ" },
      { district: "Bengaluru Rural", market: "Hoskote Mandi", basePrice: 3490, variety: "Red Gold", grade: "FAQ" },
      { district: "Chikkaballapura", market: "Chintamani", basePrice: 3460, variety: "Local", grade: "FAQ" }
    ],
    "Madhya Pradesh": [
      { district: "Shivpuri", market: "Shivpuri Yard", basePrice: 3350, variety: "Desi Tomato", grade: "FAQ" },
      { district: "Jabalpur", market: "Jabalpur Market", basePrice: 3390, variety: "Hybrid", grade: "FAQ" },
      { district: "Indore", market: "Choithram Mandi", basePrice: 3420, variety: "Red Hybrid", grade: "FAQ" }
    ],
    "Gujarat": [
      { district: "Kheda", market: "Nadiad Mandi", basePrice: 3410, variety: "Local Red", grade: "FAQ" },
      { district: "Anand", market: "Anand Yard", basePrice: 3440, variety: "Hybrid", grade: "FAQ" },
      { district: "Ahmedabad", market: "Jamalpur Market", basePrice: 3470, variety: "Grade A", grade: "FAQ" }
    ],
    "Tamil Nadu": [
      { district: "Dindigul", market: "Oddanchatram Yard", basePrice: 3430, variety: "Country Tomato", grade: "FAQ" },
      { district: "Krishnagiri", market: "Hosur Market", basePrice: 3460, variety: "Hybrid Red", grade: "FAQ" }
    ]
  },
  "Onion": {
    "Maharashtra": [
      { district: "Nashik", market: "Lasalgaon APMC", basePrice: 2850, variety: "Red Onion", grade: "FAQ" },
      { district: "Nashik", market: "Pimpalgaon", basePrice: 2820, variety: "Garwa Red", grade: "FAQ" },
      { district: "Ahmednagar", market: "Rahuri Mandi", basePrice: 2780, variety: "Red", grade: "FAQ" },
      { district: "Pune", market: "Chakan Yard", basePrice: 2800, variety: "White Onion", grade: "FAQ" },
      { district: "Solapur", market: "Solapur Market", basePrice: 2760, variety: "Common Red", grade: "FAQ" }
    ],
    "Madhya Pradesh": [
      { district: "Neemuch", market: "Neemuch Yard", basePrice: 2740, variety: "Red Onion", grade: "FAQ" },
      { district: "Mandsaur", market: "Mandsaur Mandi", basePrice: 2710, variety: "Red", grade: "FAQ" },
      { district: "Indore", market: "Indore APMC", basePrice: 2770, variety: "Grade A", grade: "FAQ" }
    ],
    "Karnataka": [
      { district: "Gadag", market: "Gadag Yard", basePrice: 2730, variety: "Bangalore Rose", grade: "FAQ" },
      { district: "Dharwad", market: "Hubballi Mandi", basePrice: 2750, variety: "Red Onion", grade: "FAQ" },
      { district: "Chitradurga", market: "Chitradurga Market", basePrice: 2700, variety: "Common", grade: "FAQ" }
    ],
    "Gujarat": [
      { district: "Bhavnagar", market: "Mahuva Mandi", basePrice: 2790, variety: "White Onion", grade: "FAQ" },
      { district: "Rajkot", market: "Gondal Yard", basePrice: 2810, variety: "Red Onion", grade: "FAQ" },
      { district: "Amreli", market: "Amreli Market", basePrice: 2740, variety: "Red", grade: "FAQ" }
    ],
    "Rajasthan": [
      { district: "Alwar", market: "Alwar Grain Yard", basePrice: 2680, variety: "Red", grade: "FAQ" },
      { district: "Sikar", market: "Sikar Mandi", basePrice: 2660, variety: "Common", grade: "FAQ" },
      { district: "Nagaur", market: "Nagaur Market", basePrice: 2650, variety: "Common", grade: "FAQ" }
    ],
    "Bihar": [
      { district: "Patna", market: "Patna City Mandi", basePrice: 2620, variety: "Common Red", grade: "FAQ" },
      { district: "Nalanda", market: "Bihar Sharif", basePrice: 2640, variety: "Red", grade: "FAQ" }
    ]
  }
};

// Ensures baseline mandi records exist in MongoDB for fast, high-reliability rendering
async function ensureBaselineMandiData(cropName, stateName) {
  try {
    const mappedCommNames = COMMODITY_MAPPINGS[cropName] || [cropName.toLowerCase()];
    const count = await MandiPrice.countDocuments({
      state_norm: normalizeName(stateName),
      commodity_norm: { $in: mappedCommNames }
    });

    if (count > 0) return; // DB already has records

    const cropSeeds = CROP_DISTRICT_MANDIS[cropName];
    if (!cropSeeds || !cropSeeds[stateName]) return;

    const itemsToInsert = [];
    const baseDate = new Date();

    for (const seed of cropSeeds[stateName]) {
      // Create 3 historical dates for linear regression & weekly trend calculations
      const dateOffsets = [0, 3, 7];
      const commodityRaw = cropName === 'Paddy Rice' ? 'Paddy(Dhan)(Common)' : cropName;
      const normComm = normalizeName(commodityRaw);

      for (const daysAgo of dateOffsets) {
        const d = new Date(baseDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        const dayStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        const priceVariation = (daysAgo === 0 ? 0 : daysAgo === 3 ? -25 : -40);
        const modal = seed.basePrice + priceVariation;

        itemsToInsert.push({
          state: stateName,
          district: seed.district,
          market: seed.market,
          commodity: commodityRaw,
          variety: seed.variety,
          grade: seed.grade,
          arrival_date: d,
          arrival_date_str: dayStr,
          min_price: Math.round(modal * 0.95),
          max_price: Math.round(modal * 1.05),
          modal_price: modal,
          state_norm: normalizeName(stateName),
          district_norm: normalizeName(seed.district),
          market_norm: normalizeName(seed.market),
          commodity_norm: normComm,
          variety_norm: normalizeName(seed.variety),
          grade_norm: normalizeName(seed.grade)
        });
      }
    }

    if (itemsToInsert.length > 0) {
      await MandiPrice.insertMany(itemsToInsert);
      console.log(`[SEED] Auto-seeded ${itemsToInsert.length} baseline records for ${cropName} in ${stateName}`);
    }
  } catch (err) {
    console.error('Error in ensureBaselineMandiData:', err.message);
  }
}

// In-memory cache for state fetching to avoid hitting API repeatedly
const stateFetchCache = {};
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Helper function to fetch all records for a state from data.gov.in using pagination
 */
async function fetchAndSyncStateData(stateName) {
  const normState = normalizeName(stateName);
  const now = Date.now();
  
  if (stateFetchCache[normState] && (now - stateFetchCache[normState].timestamp < CACHE_DURATION)) {
    return;
  }

  console.log(`[BACKGROUND SYNC] Fetching fresh data from Government API for state: ${stateName}`);
  const apiKey = process.env.DATAGOV_API_KEY || '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
  const limit = apiKey.startsWith('579b') ? 10 : 1000;
  let offset = 0;
  let hasMore = true;
  let attempt = 0;
  const maxAttempts = 15; // Controlled ceiling

  while (hasMore && attempt < maxAttempts) {
    attempt++;
    const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&filters[state]=${encodeURIComponent(stateName)}&limit=${limit}&offset=${offset}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data || !data.records || data.records.length === 0) {
        hasMore = false;
        break;
      }

      const records = data.records;
      const total = parseInt(data.total, 10) || 0;

      for (const rec of records) {
        if (rec.modal_price === undefined || rec.modal_price === null || rec.modal_price === '') {
          continue;
        }

        const parsedDate = parseArrivalDate(rec.arrival_date);
        if (!parsedDate) continue;

        const rawState = rec.state;
        const rawDistrict = rec.district;
        const rawMarket = rec.market;
        const rawCommodity = rec.commodity;
        const rawVariety = rec.variety || 'Other';
        const rawGrade = rec.grade || 'FAQ';

        const normStateVal = normalizeName(rawState);
        const normDistrictVal = normalizeName(rawDistrict);
        const normMarketVal = normalizeName(rawMarket);
        const normCommodityVal = normalizeName(rawCommodity);
        const normVarietyVal = normalizeName(rawVariety);
        const normGradeVal = normalizeName(rawGrade);

        await MandiPrice.findOneAndUpdate(
          {
            state_norm: normStateVal,
            district_norm: normDistrictVal,
            market_norm: normMarketVal,
            commodity_norm: normCommodityVal,
            variety_norm: normVarietyVal,
            grade_norm: normGradeVal,
            arrival_date: parsedDate
          },
          {
            state: rawState,
            district: rawDistrict,
            market: rawMarket,
            commodity: rawCommodity,
            variety: rawVariety,
            grade: rawGrade,
            arrival_date_str: rec.arrival_date,
            min_price: Number(rec.min_price) || 0,
            max_price: Number(rec.max_price) || 0,
            modal_price: Number(rec.modal_price) || 0
          },
          { upsert: true, new: true }
        );
      }

      offset += limit;
      if (offset >= total) {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Error fetching state data from API on attempt ${attempt}:`, error.message);
      hasMore = false;
      break;
    }
  }

  stateFetchCache[normState] = { timestamp: now };
}

/**
 * @desc    Get crop market price trends (used by Dashboard bar chart)
 * @route   GET /api/market/trends
 * @access  Private
 */
router.get('/trends', protect, async (req, res, next) => {
  try {
    const cropsToAggregate = ['Wheat', 'Paddy Rice', 'Corn', 'Cotton', 'Sugarcane', 'Mustard Seeds', 'Tomato', 'Onion'];
    const trends = [];

    for (const crop of cropsToAggregate) {
      const mappedCommNames = COMMODITY_MAPPINGS[crop];
      const records = await MandiPrice.find({ commodity_norm: { $in: mappedCommNames } });
      if (records.length > 0) {
        records.sort((a, b) => new Date(a.arrival_date) - new Date(b.arrival_date));
        const latest = records[records.length - 1];
        
        const change = calculatePriceChangePercentage(records);
        const forecast = calculateLinearRegressionForecast(records) || [latest.modal_price, latest.modal_price, latest.modal_price, latest.modal_price];
        const rec = calculateAdvisorRecommendation(records);
        const risk = calculatePriceRisk(records);

        trends.push({
          cropName: crop,
          currentPrice: latest.modal_price,
          priceChangeWeek: change !== null ? change : 0,
          demandLevel: 'Demand Data Unavailable',
          riskLevel: risk === 'Risk Data Unavailable' ? 'Medium' : risk.replace(' Risk', ''),
          recommendation: rec === 'Recommendation Unavailable' ? 'Hold' : rec,
          forecast,
          newsSummary: `National wholesale average rate for ${crop} is tracking around ₹${latest.modal_price}/quintal. Volatility remains ${risk}.`
        });
      }
    }

    if (trends.length > 0) {
      return res.json(trends);
    }

    const standardMockTrends = [
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

    res.json(standardMockTrends);
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Get dynamic sorted districts for selected state
 * @route   GET /api/market/districts
 * @access  Private
 */
router.get('/districts', protect, async (req, res, next) => {
  const { state } = req.query;
  if (!state) {
    return res.status(400).json({ message: 'State parameter is required.' });
  }

  const districtsList = stateDistricts[state];
  if (!districtsList) {
    return res.status(400).json({ message: 'Unsupported or invalid state.' });
  }

  try {
    fetchAndSyncStateData(state).catch(err => console.error('Async sync error:', err.message));
    const sortedDistricts = [...districtsList].sort((a, b) => a.localeCompare(b));
    res.json(sortedDistricts);
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Get dynamic sorted markets for selected district and state
 * @route   GET /api/market/markets
 * @access  Private
 */
router.get('/markets', protect, async (req, res, next) => {
  const { state, district } = req.query;
  if (!state || !district) {
    return res.status(400).json({ message: 'State and district parameters are required.' });
  }

  try {
    const aliasList = getDistrictAliases(district);
    const markets = await MandiPrice.find({
      state_norm: normalizeName(state),
      district_norm: { $in: aliasList }
    }).distinct('market');
    
    markets.sort((a, b) => a.localeCompare(b));
    res.json(markets);
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Get available crops in selected market and calculate latest prices + changes
 * @route   GET /api/market/crops
 * @access  Private
 */
router.get('/crops', protect, async (req, res, next) => {
  const { state, district, market } = req.query;
  if (!state || !district || !market) {
    return res.status(400).json({ message: 'State, district, and market parameters are required.' });
  }

  try {
    const aliasList = getDistrictAliases(district);
    const records = await MandiPrice.find({
      state_norm: normalizeName(state),
      district_norm: { $in: aliasList },
      market_norm: normalizeName(market)
    });

    const commodityGroups = {};
    for (const rec of records) {
      const normComm = rec.commodity_norm;
      if (!commodityGroups[normComm]) {
        commodityGroups[normComm] = [];
      }
      commodityGroups[normComm].push(rec);
    }

    const availableCrops = [];

    for (const [frontendName, mappedNames] of Object.entries(COMMODITY_MAPPINGS)) {
      let cropRecords = [];
      for (const normName of mappedNames) {
        if (commodityGroups[normName]) {
          cropRecords.push(...commodityGroups[normName]);
        }
      }

      if (cropRecords.length > 0) {
        cropRecords.sort((a, b) => new Date(a.arrival_date) - new Date(b.arrival_date));
        const latestRecord = cropRecords[cropRecords.length - 1];
        const pctChange = calculatePriceChangePercentage(cropRecords);

        availableCrops.push({
          cropName: frontendName,
          currentPrice: latestRecord.modal_price,
          priceChangeWeek: pctChange !== null ? pctChange : 0,
          isPctChangeAvailable: pctChange !== null
        });
      }
    }

    res.json(availableCrops);
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Get forecast and historical details for selected crop in selected market
 * @route   GET /api/market/forecast
 * @access  Private
 */
router.get('/forecast', protect, async (req, res, next) => {
  const { state, district, market, crop } = req.query;
  if (!state || !district || !market || !crop) {
    return res.status(400).json({ message: 'State, district, market, and crop parameters are required.' });
  }

  try {
    const mappedCommNames = COMMODITY_MAPPINGS[crop];
    if (!mappedCommNames) {
      return res.status(400).json({ message: 'Unsupported crop.' });
    }

    const aliasList = getDistrictAliases(district);
    const records = await MandiPrice.find({
      state_norm: normalizeName(state),
      district_norm: { $in: aliasList },
      market_norm: normalizeName(market),
      commodity_norm: { $in: mappedCommNames }
    });

    if (records.length === 0) {
      return res.status(404).json({ message: 'No records found for this crop in the selected market.' });
    }

    records.sort((a, b) => new Date(a.arrival_date) - new Date(b.arrival_date));

    const latestRecord = records[records.length - 1];
    const priceChangeWeek = calculatePriceChangePercentage(records);
    const forecast = calculateLinearRegressionForecast(records);
    const recommendation = calculateAdvisorRecommendation(records);
    const riskLevel = calculatePriceRisk(records);
    const lastUpdated = latestRecord.arrival_date_str;

    const direction = priceChangeWeek !== null && priceChangeWeek >= 0 ? 'upward' : 'downward';
    const changeStr = priceChangeWeek !== null ? `${priceChangeWeek > 0 ? '+' : ''}${priceChangeWeek}%` : 'N/A';
    
    let newsSummary = `Latest daily wholesale market reports for ${crop} in ${latestRecord.market} (${latestRecord.district}, ${latestRecord.state}) indicate a modal price of ₹${latestRecord.modal_price} per quintal. Variety: ${latestRecord.variety}, Grade: ${latestRecord.grade}. The local price trend is ${direction} with a weekly change of ${changeStr}. Price risk volatility is categorized as ${riskLevel}. Recommended advisor action is: ${recommendation}.`;

    res.json({
      cropName: crop,
      currentPrice: latestRecord.modal_price,
      priceChangeWeek: priceChangeWeek !== null ? priceChangeWeek : 0,
      isPctChangeAvailable: priceChangeWeek !== null,
      recommendation,
      demandLevel: 'Demand Data Unavailable',
      riskLevel,
      forecast,
      lastUpdated,
      newsSummary
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Get primary agricultural focus states for a specific crop
 * @route   GET /api/market/crop-states
 * @access  Private
 */
router.get('/crop-states', protect, async (req, res, next) => {
  const { crop } = req.query;
  if (!crop) {
    return res.status(400).json({ message: 'Crop parameter is required.' });
  }

  const primaryStates = CROP_PRIMARY_STATES[crop] || [
    "Punjab", "Haryana", "Uttar Pradesh", "Madhya Pradesh", "Rajasthan", "Gujarat", "Maharashtra", "Andhra Pradesh", "Karnataka", "West Bengal"
  ];

  try {
    const mappedCommNames = COMMODITY_MAPPINGS[crop] || [crop.toLowerCase()];
    const statesData = [];

    for (const stateName of primaryStates) {
      // 1. Ensure baseline seed data for this crop & state exists
      await ensureBaselineMandiData(crop, stateName);

      // 2. Fire live API sync asynchronously in background without blocking request
      fetchAndSyncStateData(stateName).catch(err => console.error(`Async sync error for ${stateName}:`, err.message));

      // 3. Query DB for district & mandi counts
      const records = await MandiPrice.find({
        state_norm: normalizeName(stateName),
        commodity_norm: { $in: mappedCommNames }
      });

      const uniqueDistricts = new Set(records.map(r => r.district));
      const uniqueMarkets = new Set(records.map(r => r.market));

      statesData.push({
        stateName,
        districtCount: uniqueDistricts.size,
        mandiCount: uniqueMarkets.size,
        recordCount: records.length,
        isPrimary: true
      });
    }

    res.json({
      crop,
      primaryStates: statesData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Get primary districts having mandis for selected crop and state (for graphical chart)
 * @route   GET /api/market/crop-districts
 * @access  Private
 */
router.get('/crop-districts', protect, async (req, res, next) => {
  const { crop, state } = req.query;
  if (!crop || !state) {
    return res.status(400).json({ message: 'Crop and state parameters are required.' });
  }

  try {
    const mappedCommNames = COMMODITY_MAPPINGS[crop] || [crop.toLowerCase()];

    // 1. Ensure baseline seed data exists
    await ensureBaselineMandiData(crop, state);

    // 2. Fire live API sync in background without blocking
    fetchAndSyncStateData(state).catch(err => console.error(`Async sync error for ${state}:`, err.message));

    // 3. Query DB for records
    const records = await MandiPrice.find({
      state_norm: normalizeName(state),
      commodity_norm: { $in: mappedCommNames }
    });

    const districtGroupMap = {};
    for (const rec of records) {
      const distName = rec.district;
      if (!districtGroupMap[distName]) {
        districtGroupMap[distName] = {
          district: distName,
          markets: new Set(),
          prices: [],
          latestDate: rec.arrival_date,
          records: []
        };
      }
      districtGroupMap[distName].markets.add(rec.market);
      districtGroupMap[distName].prices.push(rec.modal_price);
      districtGroupMap[distName].records.push(rec);
    }

    const districtStatsList = Object.values(districtGroupMap).map(d => {
      const avgPrice = Math.round(d.prices.reduce((a, b) => a + b, 0) / d.prices.length);
      const minPrice = Math.min(...d.prices);
      const maxPrice = Math.max(...d.prices);
      
      d.records.sort((a, b) => new Date(a.arrival_date) - new Date(b.arrival_date));
      const latestPrice = d.records[d.records.length - 1].modal_price;

      return {
        district: d.district,
        mandiCount: d.markets.size,
        markets: Array.from(d.markets),
        avgModalPrice: avgPrice,
        minPrice,
        maxPrice,
        latestPrice,
        totalRecords: d.records.length
      };
    });

    districtStatsList.sort((a, b) => b.mandiCount - a.mandiCount || b.avgModalPrice - a.avgModalPrice);

    res.json({
      crop,
      state,
      districtsCount: districtStatsList.length,
      districts: districtStatsList
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Get detailed mandi list and price records for selected crop, state, and district
 * @route   GET /api/market/crop-district-markets
 * @access  Private
 */
router.get('/crop-district-markets', protect, async (req, res, next) => {
  const { crop, state, district } = req.query;
  if (!crop || !state || !district) {
    return res.status(400).json({ message: 'Crop, state, and district parameters are required.' });
  }

  try {
    const mappedCommNames = COMMODITY_MAPPINGS[crop] || [crop.toLowerCase()];
    const aliasList = getDistrictAliases(district);

    await ensureBaselineMandiData(crop, state);

    const records = await MandiPrice.find({
      state_norm: normalizeName(state),
      district_norm: { $in: aliasList },
      commodity_norm: { $in: mappedCommNames }
    });

    const marketGroups = {};
    for (const rec of records) {
      if (!marketGroups[rec.market]) {
        marketGroups[rec.market] = [];
      }
      marketGroups[rec.market].push(rec);
    }

    const mandis = Object.entries(marketGroups).map(([marketName, recList]) => {
      recList.sort((a, b) => new Date(a.arrival_date) - new Date(b.arrival_date));
      const latest = recList[recList.length - 1];
      const changePct = calculatePriceChangePercentage(recList);

      return {
        marketName,
        currentPrice: latest.modal_price,
        minPrice: latest.min_price,
        maxPrice: latest.max_price,
        variety: latest.variety,
        grade: latest.grade,
        lastUpdated: latest.arrival_date_str,
        priceChangeWeek: changePct !== null ? changePct : 0
      };
    });

    mandis.sort((a, b) => a.marketName.localeCompare(b.marketName));

    res.json({
      crop,
      state,
      district,
      mandiCount: mandis.length,
      mandis
    });
  } catch (error) {
    next(error);
  }
});

export default router;
