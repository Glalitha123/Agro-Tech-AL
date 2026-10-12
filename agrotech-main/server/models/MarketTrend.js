import mongoose from 'mongoose';

const marketTrendSchema = new mongoose.Schema(
  {
    cropName: {
      type: String,
      required: true,
      unique: true,
    },
    currentPrice: {
      type: Number,
      required: true, // e.g. price per quintal in INR or USD
    },
    priceChangeWeek: {
      type: Number, // Percentage e.g. +3.5 or -1.2
      default: 0,
    },
    demandLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    recommendation: {
      type: String,
      default: 'Hold', // Hold, Sell, Cultivate, Harvest
    },
    forecast: [{ type: Number }], // List of forecasted prices for the next 4 weeks
    newsSummary: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const MarketTrend = mongoose.model('MarketTrend', marketTrendSchema);
export default MarketTrend;
