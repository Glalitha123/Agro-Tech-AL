import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scroll, 
  MapPin, 
  Landmark, 
  UserCheck, 
  Coins, 
  FileText, 
  Info,
  Calendar, 
  ExternalLink, 
  Bookmark, 
  BookmarkCheck,
  Search,
  Filter,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const StatesList = [
  'All', 'Andhra Pradesh', 'Bihar', 'Delhi', 'Gujarat', 'Haryana', 
  'Karnataka', 'Madhya Pradesh', 'Maharashtra', 'Punjab', 
  'Rajasthan', 'Tamil Nadu', 'Uttar Pradesh', 'West Bengal'
];

const CategoryList = ['All', 'General', 'OBC', 'SC', 'ST'];
const CropsSelection = ['All', 'Wheat', 'Paddy Rice', 'Corn', 'Cotton', 'Sugarcane', 'Mustard Seeds', 'Tomato', 'Onion'];

const SchemeFinder = () => {
  const { user } = useContext(AuthContext);

  // Filter conditions initialized with user profile details
  const [state, setState] = useState(user?.profile?.state || '');
  const [landSize, setLandSize] = useState(user?.profile?.landSize || 0);
  const [category, setCategory] = useState(user?.profile?.category || '');
  const [crop, setCrop] = useState(user?.profile?.primaryCrops?.[0] || 'All');

  const [schemes, setSchemes] = useState([]);
  const [savedSchemeIds, setSavedSchemeIds] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  useEffect(() => {
    fetchEligibleSchemes();
    fetchSavedSchemesIds();
  }, []);

  const fetchEligibleSchemes = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { data } = await api.post('/api/schemes/find', {
        state,
        landSize: Number(landSize),
        category,
        crop
      });
      setSchemes(data.schemes);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Could not fetch government schemes.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavedSchemesIds = async () => {
    try {
      const { data } = await api.get('/api/schemes/saved');
      setSavedSchemeIds(data.map(s => s._id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveScheme = async (schemeId) => {
    try {
      await api.post('/api/schemes/save', { schemeId });
      setSavedSchemeIds([...savedSchemeIds, schemeId]);
      setSaveSuccessMsg('Scheme bookmarked successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 3050);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full transition-colors duration-300">
      
      {/* Title */}
      <div className="border-b border-gray-200 dark:border-earth-800 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            Government Scheme Finder
          </h1>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Qualify for central sector and state schemes based on land size limits, geographic state, and demographic traits.
          </p>
        </div>
        
        {saveSuccessMsg && (
          <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/40 px-3.5 py-2 rounded-xl text-xs font-bold animate-pulse">
            <CheckCircle className="h-4 w-4" />
            {saveSuccessMsg}
          </div>
        )}
      </div>

      {/* Grid: 1. Filter widget, 2. Scheme grid lists */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Filter Side Widget */}
        <div className="glass p-6 rounded-3xl border border-white/20 flex flex-col gap-5">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-800 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-earth-800 pb-3">
            <Filter className="h-4.5 w-4.5 text-farm-600 dark:text-farm-400" />
            Qualifications Matcher
          </h3>

          <div className="flex flex-col gap-4 text-xs font-semibold">
            
            {/* State filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Region State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium"
              >
                {StatesList.map((st) => (
                  <option key={st} value={st === 'All' ? '' : st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Land Size filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Acreage (Acres)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={landSize}
                onChange={(e) => setLandSize(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium"
              />
            </div>

            {/* Category filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Social Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium"
              >
                {CategoryList.map((cat) => (
                  <option key={cat} value={cat === 'All' ? '' : cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Crops filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Target Crop</label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium"
              >
                {CropsSelection.map((cr) => (
                  <option key={cr} value={cr}>{cr}</option>
                ))}
              </select>
            </div>

            {/* Run queries */}
            <button
              onClick={fetchEligibleSchemes}
              disabled={isLoading}
              className="w-full mt-2 bg-farm-600 hover:bg-farm-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-sm transition-all duration-300 flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Find Schemes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Schemes listing section */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 flex items-start gap-2.5 text-xs font-semibold">
              <AlertCircle className="h-4.5 w-4.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-farm-600 dark:text-farm-400 font-semibold gap-3 text-sm">
              <div className="h-10 w-10 border-4 border-solid border-farm-200 border-t-farm-600 rounded-full animate-spin"></div>
              <span>Searching matches records...</span>
            </div>
          ) : schemes.length > 0 ? (
            <div className="flex flex-col gap-6">
              {schemes.map((sch) => {
                const isSaved = savedSchemeIds.includes(sch._id);
                return (
                  <div 
                    key={sch._id}
                    className="glass p-6 rounded-3xl border border-white/20 flex flex-col gap-5 hover:shadow-md transition-shadow relative"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-gray-100 dark:border-earth-800 pb-3.5 gap-4">
                      <div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-farm-600 dark:text-farm-400 bg-farm-100 dark:bg-farm-950 px-2.5 py-0.5 rounded-full border border-farm-200 dark:border-farm-900/40 uppercase tracking-wider">
                          <Scroll className="h-3 w-3" />
                          {sch.state === 'All' ? 'Central Scheme' : `${sch.state} State Scheme`}
                        </span>
                        
                        <h3 className="font-extrabold text-lg text-gray-800 dark:text-white mt-2">
                          {sch.title}
                        </h3>
                      </div>

                      {/* Bookmark button */}
                      <button
                        onClick={() => !isSaved && handleSaveScheme(sch._id)}
                        disabled={isSaved}
                        className={`p-2 rounded-xl border transition-all ${
                          isSaved 
                            ? 'bg-farm-50/50 dark:bg-farm-950/20 text-farm-600 dark:text-farm-400 border-farm-200 dark:border-farm-900/50' 
                            : 'bg-white border-gray-200 text-gray-400 hover:text-farm-600 dark:bg-earth-900 dark:border-earth-800'
                        }`}
                        title={isSaved ? "Saved" : "Save Scheme"}
                      >
                        {isSaved ? <BookmarkCheck className="h-4.5 w-4.5" /> : <Bookmark className="h-4.5 w-4.5" />}
                      </button>
                    </div>

                    {/* Meta qualifying tags */}
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold text-gray-500">
                      <span className="flex items-center gap-1 bg-gray-50 dark:bg-earth-900 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-earth-800">
                        <MapPin className="h-3.5 w-3.5 text-farm-600" /> State: {sch.state}
                      </span>
                      <span className="flex items-center gap-1 bg-gray-50 dark:bg-earth-900 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-earth-800">
                        <Landmark className="h-3.5 w-3.5 text-farm-600" /> Land: {sch.minLandSize} - {sch.maxLandSize} Acres
                      </span>
                      <span className="flex items-center gap-1 bg-gray-50 dark:bg-earth-900 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-earth-800">
                        <UserCheck className="h-3.5 w-3.5 text-farm-600" /> Caste: {sch.category}
                      </span>
                    </div>

                    {/* Detailed info breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-gray-700 dark:text-gray-300 font-medium">
                      
                      {/* Benefits & Docs */}
                      <div className="flex flex-col gap-3">
                        <p>
                          <strong className="text-gray-900 dark:text-white font-bold block mb-1 uppercase tracking-wider text-[10px]">💰 Subsidy Benefits:</strong>
                          {sch.benefits}
                        </p>
                        <div>
                          <strong className="text-gray-900 dark:text-white font-bold block mb-1 uppercase tracking-wider text-[10px]">📁 Required Certificates:</strong>
                          <ul className="list-disc pl-4 flex flex-col gap-0.5">
                            {sch.requiredDocuments?.map((doc, idx) => (
                              <li key={idx}>{doc}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Process & Deadlines */}
                      <div className="flex flex-col gap-3 border-t md:border-t-0 md:border-l border-gray-100 dark:border-earth-900 pt-4 md:pt-0 md:pl-5">
                        <p>
                          <strong className="text-gray-900 dark:text-white font-bold block mb-1 uppercase tracking-wider text-[10px]">ℹ️ Application Process:</strong>
                          {sch.applicationProcess}
                        </p>
                        
                        <div className="flex items-center justify-between border-t border-gray-50 dark:border-earth-850 pt-3 mt-auto">
                          <span className="flex items-center gap-1 font-bold text-[10px] text-gray-400 uppercase tracking-wider">
                            <Calendar className="h-3.5 w-3.5 text-farm-600" />
                            Deadline: {sch.deadline}
                          </span>
                          
                          {sch.officialLink && (
                            <a
                              href={sch.officialLink}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-farm-600 hover:bg-farm-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1 shadow-sm transition-colors text-xs"
                            >
                              Apply Link
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass p-12 rounded-3xl border border-white/20 text-center text-gray-400">
              <Scroll className="h-14 w-14 text-gray-300 dark:text-gray-700 mx-auto mb-3.5" />
              <h3 className="font-bold text-gray-800 dark:text-white text-base">No Matching Schemes Found</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-2 leading-relaxed">
                We couldn't find any schemes matching your selected region state, acreage limits, and castes filter. Try broadening your filter toggles.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default SchemeFinder;
