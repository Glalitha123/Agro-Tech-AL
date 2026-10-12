import Scheme from '../models/Scheme.js';
import User from '../models/User.js';

/**
 * @desc    Find schemes matching farmer profile and optional search terms
 * @route   POST /api/schemes/find
 * @access  Private
 */
export const findEligibleSchemes = async (req, res, next) => {
  const { state, landSize, category, crop } = req.body;
  
  // Use either body criteria (for custom searches) or default to user's saved profile values
  const farmerState = state !== undefined ? state : req.user.profile.state;
  const farmerLand = landSize !== undefined ? Number(landSize) : req.user.profile.landSize;
  const farmerCategory = category !== undefined ? category : req.user.profile.category;
  const farmerCrop = crop !== undefined ? crop : (req.user.profile.primaryCrops[0] || 'All');

  try {
    // Construct query parameters
    const query = {};

    // 1. Match State: either scheme is open to 'All' states, or matches farmer's state exactly
    if (farmerState && farmerState.trim() !== '') {
      query.state = { $in: ['All', farmerState] };
    }

    // 2. Match Category: either 'All' categories, or matches farmer category
    if (farmerCategory && farmerCategory.trim() !== '') {
      query.category = { $in: ['All', farmerCategory] };
    }

    // 3. Match Land Size limits: farmer land size must lie between min and max limits
    query.minLandSize = { $lte: farmerLand };
    query.maxLandSize = { $gte: farmerLand };

    // 4. Match Crops: either 'All', empty list, or contains farmer crop
    if (farmerCrop && farmerCrop.trim() !== '') {
      query.$or = [
        { crops: { $size: 0 } },
        { crops: 'All' },
        { crops: { $in: ['All', farmerCrop] } }
      ];
    }

    console.log('Querying schemes with:', query);
    const eligibleSchemes = await Scheme.find(query);

    res.json({
      profileUsed: {
        state: farmerState,
        landSize: farmerLand,
        category: farmerCategory,
        crop: farmerCrop
      },
      count: eligibleSchemes.length,
      schemes: eligibleSchemes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Save a scheme to farmer bookmarks
 * @route   POST /api/schemes/save
 * @access  Private
 */
export const saveScheme = async (req, res, next) => {
  const { schemeId } = req.body;

  if (!schemeId) {
    res.status(400);
    return next(new Error('Scheme ID is required'));
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const scheme = await Scheme.findById(schemeId);
    if (!scheme) {
      res.status(404);
      return next(new Error('Scheme not found'));
    }

    // Check if already bookmarked
    if (user.savedSchemes.includes(schemeId)) {
      res.status(400);
      return next(new Error('Scheme is already saved to your profile'));
    }

    user.savedSchemes.push(schemeId);
    await user.save();

    res.json({
      message: 'Scheme saved successfully',
      savedSchemes: user.savedSchemes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all saved schemes for farmer
 * @route   GET /api/schemes/saved
 * @access  Private
 */
export const getSavedSchemes = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('savedSchemes');
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }
    res.json(user.savedSchemes);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove saved scheme from farmer profile
 * @route   DELETE /api/schemes/saved/:id
 * @access  Private
 */
export const removeSavedScheme = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    user.savedSchemes = user.savedSchemes.filter(
      (id) => id.toString() !== req.params.id
    );
    await user.save();

    res.json({
      message: 'Scheme removed from bookmarks',
      savedSchemes: user.savedSchemes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all schemes (primarily for admin lists or general browsing)
 * @route   GET /api/schemes/all
 * @access  Private
 */
export const getAllSchemes = async (req, res, next) => {
  try {
    const schemes = await Scheme.find({}).sort({ createdAt: -1 });
    res.json(schemes);
  } catch (error) {
    next(error);
  }
};
