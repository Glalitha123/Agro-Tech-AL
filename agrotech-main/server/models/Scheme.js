import mongoose from 'mongoose';

const schemeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      default: 'All', // 'All' or specific state name e.g. 'Maharashtra'
    },
    minLandSize: {
      type: Number,
      default: 0, // 0 means no minimum limit
    },
    maxLandSize: {
      type: Number,
      default: 99999, // 99999 means no maximum limit
    },
    category: {
      type: String,
      enum: ['General', 'OBC', 'SC', 'ST', 'All'],
      default: 'All',
    },
    crops: [{ type: String }], // crops that this scheme applies to, e.g. ['Rice', 'Wheat', 'All']
    benefits: {
      type: String,
      required: true,
    },
    requiredDocuments: [{ type: String }],
    applicationProcess: {
      type: String,
      required: true,
    },
    officialLink: {
      type: String,
      default: '',
    },
    deadline: {
      type: String,
      default: 'N/A',
    },
  },
  {
    timestamps: true,
  }
);

const Scheme = mongoose.model('Scheme', schemeSchema);
export default Scheme;
