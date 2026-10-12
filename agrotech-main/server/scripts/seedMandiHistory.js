import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MandiPrice from '../models/MandiPrice.js';
import connectDB from '../config/db.js';
import { normalizeName, parseArrivalDate } from '../utils/marketCalculations.js';

dotenv.config();

const historicalData = [
  // ================= Andhra Pradesh Seeds =================
  // 1. Maize (Corn) - Penukonda APMC (Upward trend)
  { state: 'Andhra Pradesh', district: 'Sri Sathya Sai', market: 'Penukonda APMC', commodity: 'Maize', variety: 'Hybrid/Local', grade: 'FAQ', date: '11/06/2026', min: 2100, max: 2300, modal: 2200 },
  { state: 'Andhra Pradesh', district: 'Sri Sathya Sai', market: 'Penukonda APMC', commodity: 'Maize', variety: 'Hybrid/Local', grade: 'FAQ', date: '18/06/2026', min: 2150, max: 2350, modal: 2250 },
  { state: 'Andhra Pradesh', district: 'Sri Sathya Sai', market: 'Penukonda APMC', commodity: 'Maize', variety: 'Hybrid/Local', grade: 'FAQ', date: '25/06/2026', min: 2200, max: 2400, modal: 2310 },
  { state: 'Andhra Pradesh', district: 'Sri Sathya Sai', market: 'Penukonda APMC', commodity: 'Maize', variety: 'Hybrid/Local', grade: 'FAQ', date: '02/07/2026', min: 2300, max: 2500, modal: 2380 },
  { state: 'Andhra Pradesh', district: 'Sri Sathya Sai', market: 'Penukonda APMC', commodity: 'Maize', variety: 'Hybrid/Local', grade: 'FAQ', date: '09/07/2026', min: 2400, max: 2500, modal: 2450 },

  // 2. Paddy(Common) (Paddy Rice) - Amalapuram APMC (Downward trend)
  { state: 'Andhra Pradesh', district: 'Dr.B.R.A.Konaseema', market: 'Amalapuram APMC', commodity: 'Paddy(Common)', variety: '1001', grade: 'Local', date: '11/06/2026', min: 2380, max: 2420, modal: 2400 },
  { state: 'Andhra Pradesh', district: 'Dr.B.R.A.Konaseema', market: 'Amalapuram APMC', commodity: 'Paddy(Common)', variety: '1001', grade: 'Local', date: '18/06/2026', min: 2370, max: 2410, modal: 2390 },
  { state: 'Andhra Pradesh', district: 'Dr.B.R.A.Konaseema', market: 'Amalapuram APMC', commodity: 'Paddy(Common)', variety: '1001', grade: 'Local', date: '25/06/2026', min: 2360, max: 2400, modal: 2380 },
  { state: 'Andhra Pradesh', district: 'Dr.B.R.A.Konaseema', market: 'Amalapuram APMC', commodity: 'Paddy(Common)', variety: '1001', grade: 'Local', date: '02/07/2026', min: 2350, max: 2390, modal: 2370 },
  { state: 'Andhra Pradesh', district: 'Dr.B.R.A.Konaseema', market: 'Amalapuram APMC', commodity: 'Paddy(Common)', variety: '1001', grade: 'Local', date: '09/07/2026', min: 2369, max: 2400, modal: 2369 },

  // 3. Maize (Corn) - Polavaram APMC (Stable trend)
  { state: 'Andhra Pradesh', district: 'Eluru', market: 'Polavaram APMC', commodity: 'Maize', variety: 'Local', grade: 'Local', date: '11/06/2026', min: 2400, max: 2400, modal: 2400 },
  { state: 'Andhra Pradesh', district: 'Eluru', market: 'Polavaram APMC', commodity: 'Maize', variety: 'Local', grade: 'Local', date: '18/06/2026', min: 2400, max: 2400, modal: 2400 },
  { state: 'Andhra Pradesh', district: 'Eluru', market: 'Polavaram APMC', commodity: 'Maize', variety: 'Local', grade: 'Local', date: '25/06/2026', min: 2400, max: 2400, modal: 2400 },
  { state: 'Andhra Pradesh', district: 'Eluru', market: 'Polavaram APMC', commodity: 'Maize', variety: 'Local', grade: 'Local', date: '02/07/2026', min: 2400, max: 2400, modal: 2400 },
  { state: 'Andhra Pradesh', district: 'Eluru', market: 'Polavaram APMC', commodity: 'Maize', variety: 'Local', grade: 'Local', date: '09/07/2026', min: 2400, max: 2400, modal: 2400 },

  // ================= Other State Seeds for Dropdown Validation =================
  // Bihar - Patna
  { state: 'Bihar', district: 'Patna', market: 'Patna APMC', commodity: 'Wheat', variety: 'Kalyansona', grade: 'FAQ', date: '09/07/2026', min: 2200, max: 2400, modal: 2300 },
  // Delhi - Azadpur
  { state: 'Delhi', district: 'New Delhi', market: 'Azadpur APMC', commodity: 'Onion', variety: 'Nasik', grade: 'FAQ', date: '09/07/2026', min: 1800, max: 2200, modal: 2000 },
  // Gujarat - Ahmedabad
  { state: 'Gujarat', district: 'Ahmedabad', market: 'Ahmedabad APMC', commodity: 'Cotton', variety: 'Shankar 6', grade: 'FAQ', date: '09/07/2026', min: 6800, max: 7200, modal: 7000 },
  // Haryana - Karnal
  { state: 'Haryana', district: 'Karnal', market: 'Karnal APMC', commodity: 'Paddy(Common)', variety: 'Basmati', grade: 'FAQ', date: '09/07/2026', min: 3800, max: 4200, modal: 4000 },
  // Karnataka - Bangalore
  { state: 'Karnataka', district: 'Bangalore', market: 'Yeshwanthpur APMC', commodity: 'Tomato', variety: 'Local', grade: 'FAQ', date: '09/07/2026', min: 1500, max: 2500, modal: 2000 },
  // Madhya Pradesh - Indore
  { state: 'Madhya Pradesh', district: 'Indore', market: 'Indore APMC', commodity: 'Mustard', variety: 'Local', grade: 'FAQ', date: '09/07/2026', min: 5200, max: 5600, modal: 5400 },
  // Maharashtra - Pune
  { state: 'Maharashtra', district: 'Pune', market: 'Pune APMC', commodity: 'Onion', variety: 'Local', grade: 'FAQ', date: '09/07/2026', min: 2000, max: 2400, modal: 2200 },
  // Punjab - Amritsar
  { state: 'Punjab', district: 'Amritsar', market: 'Amritsar APMC', commodity: 'Wheat', variety: 'Local', grade: 'FAQ', date: '09/07/2026', min: 2300, max: 2500, modal: 2400 },
  // Rajasthan - Jaipur
  { state: 'Rajasthan', district: 'Jaipur', market: 'Jaipur APMC', commodity: 'Mustard', variety: 'Mustard Seed', grade: 'FAQ', date: '09/07/2026', min: 5400, max: 5800, modal: 5600 },
  // Tamil Nadu - Chennai
  { state: 'Tamil Nadu', district: 'Chennai', market: 'Koyambedu APMC', commodity: 'Tomato', variety: 'Hybrid', grade: 'FAQ', date: '09/07/2026', min: 2000, max: 3000, modal: 2500 },
  // Uttar Pradesh - Lucknow
  { state: 'Uttar Pradesh', district: 'Lucknow', market: 'Lucknow APMC', commodity: 'Wheat', variety: 'Dara', grade: 'FAQ', date: '09/07/2026', min: 2250, max: 2350, modal: 2300 },
  // West Bengal - Kolkata
  { state: 'West Bengal', district: 'Kolkata', market: 'Kolkata APMC', commodity: 'Sugarcane', variety: 'Local', grade: 'FAQ', date: '09/07/2026', min: 350, max: 400, modal: 380 }
];

const seedMandiHistory = async () => {
  try {
    await connectDB();

    console.log('Clearing existing MandiPrice collection...');
    await MandiPrice.deleteMany({});
    console.log('MandiPrice collection cleared.');

    console.log('Seeding historical MandiPrice records...');
    for (const item of historicalData) {
      const parsedDate = parseArrivalDate(item.date);
      const normState = normalizeName(item.state);
      const normDistrict = normalizeName(item.district);
      const normMarket = normalizeName(item.market);
      const normCommodity = normalizeName(item.commodity);
      const normVariety = normalizeName(item.variety);
      const normGrade = normalizeName(item.grade);

      await MandiPrice.create({
        state: item.state,
        district: item.district,
        market: item.market,
        commodity: item.commodity,
        variety: item.variety,
        grade: item.grade,
        arrival_date: parsedDate,
        arrival_date_str: item.date,
        min_price: item.min,
        max_price: item.max,
        modal_price: item.modal,
        state_norm: normState,
        district_norm: normDistrict,
        market_norm: normMarket,
        commodity_norm: normCommodity,
        variety_norm: normVariety,
        grade_norm: normGrade
      });
    }

    console.log(`Successfully seeded ${historicalData.length} historical mandi price records!`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed historical mandi prices:', error.message);
    process.exit(1);
  }
};

seedMandiHistory();
