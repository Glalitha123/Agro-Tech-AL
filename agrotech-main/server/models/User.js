import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: false,
    },
    googleId: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['farmer', 'admin'],
      default: 'farmer',
    },
    profile: {
      state: { type: String, default: '' },
      landSize: { type: Number, default: 0 }, // in acres
      category: {
        type: String,
        enum: ['General', 'OBC', 'SC', 'ST', ''],
        default: '',
      },
      primaryCrops: [{ type: String }],
    },
    savedTreatments: [
      {
        diseaseName: { type: String, required: true },
        cropType: { type: String, default: '' },
        recommendation: { type: String, required: true },
        savedAt: { type: Date, default: Date.now },
      },
    ],
    savedSchemes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scheme',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving if provided
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};


const User = mongoose.model('User', userSchema);
export default User;
