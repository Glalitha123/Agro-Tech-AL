import mongoose from 'mongoose';

const mandiPriceSchema = new mongoose.Schema(
  {
    state: { type: String, required: true },
    district: { type: String, required: true },
    market: { type: String, required: true },
    commodity: { type: String, required: true },
    variety: { type: String, default: 'Other' },
    grade: { type: String, default: 'FAQ' },
    arrival_date: { type: Date, required: true },
    arrival_date_str: { type: String, required: true }, // Raw dd/mm/yyyy string
    min_price: { type: Number, required: true },
    max_price: { type: Number, required: true },
    modal_price: { type: Number, required: true },

    // Normalized lowercase/trimmed fields for robust querying
    state_norm: { type: String, required: true, index: true },
    district_norm: { type: String, required: true, index: true },
    market_norm: { type: String, required: true, index: true },
    commodity_norm: { type: String, required: true, index: true },
    variety_norm: { type: String, index: true },
    grade_norm: { type: String, index: true }
  },
  {
    timestamps: true
  }
);

// Create compound unique index to prevent duplicate daily records for the same variety/grade
mandiPriceSchema.index(
  {
    state_norm: 1,
    district_norm: 1,
    market_norm: 1,
    commodity_norm: 1,
    variety_norm: 1,
    grade_norm: 1,
    arrival_date: 1
  },
  { unique: true }
);

const MandiPrice = mongoose.model('MandiPrice', mandiPriceSchema);
export default MandiPrice;
