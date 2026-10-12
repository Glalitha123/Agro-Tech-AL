import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { User, Mail, Lock, UserPlus, Sprout, AlertCircle, MapPin, Landmark, Sliders, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const StatesList = [
  'Andhra Pradesh', 'Bihar', 'Delhi', 'Gujarat', 'Haryana', 
  'Karnataka', 'Madhya Pradesh', 'Maharashtra', 'Punjab', 
  'Rajasthan', 'Tamil Nadu', 'Uttar Pradesh', 'West Bengal'
];

const CropsList = ['Wheat', 'Paddy Rice', 'Corn', 'Cotton', 'Sugarcane', 'Mustard Seeds', 'Tomato', 'Onion'];

const Register = () => {
  const { register, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('farmer');

  // Farmer specific profile parameters
  const [state, setState] = useState('');
  const [landSize, setLandSize] = useState('0');
  const [category, setCategory] = useState('');
  const [selectedCrops, setSelectedCrops] = useState([]);

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleCropToggle = (crop) => {
    if (selectedCrops.includes(crop)) {
      setSelectedCrops(selectedCrops.filter((c) => c !== crop));
    } else {
      setSelectedCrops([...selectedCrops, crop]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMsg('Please fill in name, email, and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      await register(
        name,
        email,
        password,
        role,
        role === 'farmer' ? state : '',
        role === 'farmer' ? Number(landSize) : 0,
        role === 'farmer' ? category : '',
        role === 'farmer' ? selectedCrops : []
      );
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please check inputs and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] w-full flex items-center justify-center p-4 bg-grid-pattern dark:bg-earth-950">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="glass w-full max-w-2xl p-8 rounded-3xl shadow-xl border border-white/20 my-6"
      >
        {/* Branding header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="bg-farm-600 text-white p-3 rounded-2xl shadow-md mb-3">
            <Sprout className="h-6 w-6 hover-wiggle" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Create AgroTech Account</h2>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Get immediate crop disease remedies and subsidies checks</p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 flex items-start gap-2 text-xs font-semibold">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google Authentication Button */}
        <button
          type="button"
          onClick={() => window.location.href = '/api/auth/google'}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-earth-900 hover:bg-gray-50 dark:hover:bg-earth-800 text-gray-700 dark:text-white font-bold py-3 px-4 rounded-xl border border-gray-200 dark:border-earth-800 shadow-sm hover:shadow transition-all duration-200 mb-5 text-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign up with Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-earth-800"></div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">or register with email</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-earth-800"></div>
        </div>


        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* Base credentials section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ramesh Kumar"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 focus:outline-none focus:ring-2 focus:ring-farm-500 text-sm"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@agrotech.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 focus:outline-none focus:ring-2 focus:ring-farm-500 text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 focus:outline-none focus:ring-2 focus:ring-farm-500 text-sm"
                />
              </div>
            </div>

            {/* Account Role */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('farmer')}
                  className={`py-3 rounded-xl border text-sm font-bold transition-all duration-200 ${
                    role === 'farmer'
                      ? 'bg-farm-600 border-farm-600 text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 dark:bg-earth-900 dark:border-earth-800 dark:text-gray-300'
                  }`}
                >
                  Farmer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-3 rounded-xl border text-sm font-bold transition-all duration-200 ${
                    role === 'admin'
                      ? 'bg-farm-600 border-farm-600 text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 dark:bg-earth-900 dark:border-earth-800 dark:text-gray-300'
                  }`}
                >
                  Administrator
                </button>
              </div>
            </div>

          </div>

          {/* Farmer Profile Customizer (Rendered only for role 'farmer') */}
          {role === 'farmer' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="border-t border-gray-150 dark:border-earth-800 pt-5 flex flex-col gap-4"
            >
              <h3 className="font-extrabold text-sm text-farm-700 dark:text-farm-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="h-4.5 w-4.5" />
                Farmer Profile (For Government Scheme Finder)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Farmer State */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Region State</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                      className="w-full pl-9 pr-8 py-3 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 focus:outline-none focus:ring-2 focus:ring-farm-500 text-sm appearance-none"
                    >
                      <option value="">Select State</option>
                      {StatesList.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Farmer Acreage */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Land Size (Acres)</label>
                  <div className="relative">
                    <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.1"
                      value={landSize}
                      onChange={(e) => setLandSize(e.target.value)}
                      placeholder="e.g. 5.5"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 focus:outline-none focus:ring-2 focus:ring-farm-500 text-sm"
                    />
                  </div>
                </div>

                {/* Farmer Category */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Social Category</label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 focus:outline-none focus:ring-2 focus:ring-farm-500 text-sm appearance-none"
                    >
                      <option value="">Select Category</option>
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

              </div>

              {/* Farmer Crops Checklist */}
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Primary Crops Cultivated</label>
                <div className="flex flex-wrap gap-2.5">
                  {CropsList.map((crop) => {
                    const isChecked = selectedCrops.includes(crop);
                    return (
                      <button
                        type="button"
                        key={crop}
                        onClick={() => handleCropToggle(crop)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                          isChecked
                            ? 'bg-farm-100 border-farm-400 text-farm-700 dark:bg-farm-950 dark:border-farm-800 dark:text-farm-300'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 dark:bg-earth-900 dark:border-earth-800'
                        }`}
                      >
                        {crop}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-farm-600 hover:bg-farm-700 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-5 w-5 rounded-full border-2 border-solid border-white border-t-transparent animate-spin"></div>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Register Account
              </>
            )}
          </button>
        </form>

        {/* Redirect block */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-earth-900 text-center text-sm text-gray-400">
          Already registered on AgroTech?{" "}
          <Link to="/login" className="text-farm-600 hover:text-farm-700 dark:text-farm-400 dark:hover:text-farm-300 font-bold">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
