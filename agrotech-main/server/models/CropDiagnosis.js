import mongoose from 'mongoose';

const cropDiagnosisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cropName: {
      type: String,
      required: true,
    },
    diseaseName: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['Healthy', 'Mild', 'Moderate', 'Severe', 'Unknown'],
      default: 'Unknown',
    },
    confidenceScore: {
      type: Number,
      default: 0, // value between 0 and 100
    },
    causes: [{ type: String }],
    preventionTips: [{ type: String }],
    treatment: {
      organic: { type: String, default: '' },
      chemical: { type: String, default: '' },
      dosage: { type: String, default: '' },
      precautions: { type: String, default: '' },
    },
    imagePath: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const CropDiagnosis = mongoose.model('CropDiagnosis', cropDiagnosisSchema);
export default CropDiagnosis;
