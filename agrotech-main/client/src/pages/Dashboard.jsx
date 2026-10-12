import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import { motion } from 'framer-motion';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { 
  User, 
  MapPin, 
  Layers, 
  Calendar, 
  FileText, 
  Trash2, 
  Edit3, 
  Heart, 
  FolderHeart, 
  ChevronRight,
  TrendingUp,
  Activity,
  History,
  Save,
  Check
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user, updateProfile } = useContext(AuthContext);
  
  const [diagnosisHistory, setDiagnosisHistory] = useState([]);
  const [savedTreatments, setSavedTreatments] = useState([]);
  const [savedSchemes, setSavedSchemes] = useState([]);
  const [marketTrends, setMarketTrends] = useState([]);
  
  // Profile editing mode states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editState, setEditState] = useState(user?.profile?.state || '');
  const [editLandSize, setEditLandSize] = useState(user?.profile?.landSize || 0);
  const [editCategory, setEditCategory] = useState(user?.profile?.category || '');
  const [editCrops, setEditCrops] = useState(user?.profile?.primaryCrops?.join(', ') || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const historyRes = await api.get('/api/crops/history');
      setDiagnosisHistory(historyRes.data);

      const treatmentsRes = await api.get('/api/crops/treatments/saved');
      setSavedTreatments(treatmentsRes.data);

      const schemesRes = await api.get('/api/schemes/saved');
      setSavedSchemes(schemesRes.data);

      const trendsRes = await api.get('/api/market/trends');
      setMarketTrends(trendsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard info:', err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const cropsArray = editCrops
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c !== '');

      await updateProfile({
        name: editName,
        profile: {
          state: editState,
          landSize: Number(editLandSize),
          category: editCategory,
          primaryCrops: cropsArray,
        },
      });
      
      setSaveSuccess(true);
      setIsEditingProfile(false);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchDashboardData();
    } catch (err) {
      console.error('Update profile error', err);
    }
  };

  const deleteSavedTreatment = async (id) => {
    try {
      await api.delete(`/api/crops/treatments/saved/${id}`);
      setSavedTreatments(savedTreatments.filter((t) => t._id !== id));
    } catch (err) {
      console.error('Failed to delete treatment:', err);
    }
  };

  const deleteSavedScheme = async (id) => {
    try {
      await api.delete(`/api/schemes/saved/${id}`);
      setSavedSchemes(savedSchemes.filter((s) => s._id !== id));
    } catch (err) {
      console.error('Failed to delete scheme:', err);
    }
  };

  /* --- Chart Computations --- */
  // 1. Severity Breakdown Doughnut
  const severityCount = { Mild: 0, Moderate: 0, Severe: 0, Healthy: 0 };
  diagnosisHistory.forEach(d => {
    if (d.severity in severityCount) {
      severityCount[d.severity]++;
    } else if (d.diseaseName === 'Healthy') {
      severityCount['Healthy']++;
    }
  });

  const doughnutData = {
    labels: ['Healthy', 'Mild', 'Moderate', 'Severe'],
    datasets: [{
      label: 'Diagnosis Count',
      data: [severityCount.Healthy, severityCount.Mild, severityCount.Moderate, severityCount.Severe],
      backgroundColor: [
        'rgba(34, 197, 94, 0.75)',  // green
        'rgba(245, 158, 11, 0.75)',  // amber
        'rgba(239, 68, 68, 0.75)',   // red
        'rgba(185, 28, 28, 0.85)'    // dark-red
      ],
      borderColor: [
        '#22c55e', '#f59e0b', '#ef4444', '#b91c1c'
      ],
      borderWidth: 1.5
    }]
  };

  // 2. Crop Prices Bar Chart
  const cropPricesData = {
    labels: marketTrends.map(t => t.cropName),
    datasets: [{
      label: 'Market Price (₹ / Quintal)',
      data: marketTrends.map(t => t.currentPrice),
      backgroundColor: 'rgba(22, 101, 52, 0.7)',
      borderColor: '#166534',
      borderWidth: 1.5,
      borderRadius: 8
    }]
  };

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full transition-colors duration-300">
      
      {/* Dynamic Welcome and edit bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 dark:border-earth-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Farmer Dashboard
          </h1>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 leading-none">
            Review diagnostics records, update profile guidelines, and inspect seed yields trends.
          </p>
        </div>
        
        {saveSuccess && (
          <div className="flex items-center gap-1 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/40 px-3 py-1.5 rounded-xl text-xs font-bold animate-pulse">
            <Check className="h-4 w-4" />
            Profile Updated Successfully!
          </div>
        )}
      </div>

      {/* Grid: 1. Profile Widget, 2. Statistics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Details (Farmer Onboarding data view/edit) */}
        <div className="glass p-6 rounded-3xl border border-white/20 h-fit">
          <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-earth-800 pb-3">
            <h3 className="font-extrabold text-gray-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
              <User className="h-4.5 w-4.5 text-farm-600 dark:text-farm-400" />
              Farmer Profile
            </h3>
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="text-farm-600 dark:text-farm-400 hover:text-farm-700 dark:hover:text-farm-300 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-earth-900 transition-colors"
            >
              <Edit3 className="h-4.5 w-4.5" />
            </button>
          </div>

          {!isEditingProfile ? (
            <div className="flex flex-col gap-4 text-sm font-medium">
              <div className="flex items-center justify-between border-b border-gray-50 dark:border-earth-900 pb-2">
                <span className="text-gray-400 dark:text-gray-500">Name:</span>
                <span className="text-gray-800 dark:text-gray-200 font-bold">{user?.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-50 dark:border-earth-900 pb-2">
                <span className="text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> State:
                </span>
                <span className="text-gray-800 dark:text-gray-200 font-bold">{user?.profile?.state || 'Not Configured'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-50 dark:border-earth-900 pb-2">
                <span className="text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <Layers className="h-4 w-4" /> Acreage:
                </span>
                <span className="text-gray-800 dark:text-gray-200 font-bold">{user?.profile?.landSize} Acres</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-50 dark:border-earth-900 pb-2">
                <span className="text-gray-400 dark:text-gray-500">Category:</span>
                <span className="text-gray-800 dark:text-gray-200 font-bold">{user?.profile?.category || 'Not Specified'}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-gray-400 dark:text-gray-500">Primary Crops Cultivated:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {user?.profile?.primaryCrops?.length > 0 ? (
                    user.profile.primaryCrops.map((c) => (
                      <span key={c} className="bg-farm-100 dark:bg-farm-950 text-farm-700 dark:text-farm-300 px-2.5 py-1 rounded-full text-xs font-bold border border-farm-200/50 dark:border-farm-900/30">
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs italic text-gray-400">No Crops Added</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-3 text-xs font-semibold">
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Farmer Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium focus:ring-2 focus:ring-farm-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Region State</label>
                <input
                  type="text"
                  required
                  value={editState}
                  onChange={(e) => setEditState(e.target.value)}
                  placeholder="e.g. Maharashtra"
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium focus:ring-2 focus:ring-farm-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Land Acreage</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.1"
                  value={editLandSize}
                  onChange={(e) => setEditLandSize(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium focus:ring-2 focus:ring-farm-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Social Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium focus:ring-2 focus:ring-farm-500"
                >
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Crops (separated by comma)</label>
                <input
                  type="text"
                  value={editCrops}
                  onChange={(e) => setEditCrops(e.target.value)}
                  placeholder="Wheat, Paddy Rice, Cotton"
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium focus:ring-2 focus:ring-farm-500"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  className="flex-1 bg-farm-600 hover:bg-farm-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-1 text-xs"
                >
                  <Save className="h-4.5 w-4.5" /> Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-earth-900 dark:hover:bg-earth-805 border border-gray-200 dark:border-earth-800 font-bold py-2 rounded-lg text-gray-500 dark:text-gray-400 text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Charts and Data analytics */}
        <div className="glass p-6 rounded-3xl border border-white/20 lg:col-span-2 flex flex-col md:flex-row gap-6 items-center">
          
          {/* Price Trends Bar chart */}
          <div className="w-full md:w-3/5">
            <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-farm-600" /> Major Crop Price Index
            </h4>
            <div className="h-56 flex items-center justify-center">
              {marketTrends.length > 0 ? (
                <Bar 
                  data={cropPricesData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { grid: { color: 'rgba(156, 163, 175, 0.1)' } },
                      x: { grid: { display: false } }
                    }
                  }} 
                />
              ) : (
                <span className="text-xs text-gray-400">Loading chart data...</span>
              )}
            </div>
          </div>

          {/* Disease severity doughnut */}
          <div className="w-full md:w-2/5 border-t md:border-t-0 md:border-l border-gray-100 dark:border-earth-900 pt-6 md:pt-0 md:pl-6">
            <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1">
              <Activity className="h-4 w-4 text-red-500" /> Diagnosis Severity Spread
            </h4>
            <div className="h-52 flex items-center justify-center">
              {diagnosisHistory.length > 0 ? (
                <Doughnut 
                  data={doughnutData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } }
                  }} 
                />
              ) : (
                <div className="text-center py-8">
                  <span className="text-xs text-gray-400 block mb-1">No diagnoses logged yet</span>
                  <span className="text-[10px] text-gray-500 block leading-tight">Remedies diagnosed in AI Crop Doctor will display here</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Grid: Saved Treatments and Saved Schemes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Saved Treatments list */}
        <div className="glass p-6 rounded-3xl border border-white/20">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-earth-800 pb-2 flex items-center gap-2">
            <FolderHeart className="h-4.5 w-4.5 text-red-500" />
            Bookmarked Treatments ({savedTreatments.length})
          </h3>

          <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
            {savedTreatments.length > 0 ? (
              savedTreatments.map((t) => (
                <div key={t._id} className="p-4 rounded-2xl bg-gray-50 dark:bg-earth-900 border border-gray-150 dark:border-earth-850 flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-gray-800 dark:text-white">{t.diseaseName}</span>
                      {t.cropType && (
                        <span className="bg-farm-100 dark:bg-farm-950 text-farm-700 dark:text-farm-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {t.cropType}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-2 line-clamp-3">
                      {t.recommendation}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteSavedTreatment(t._id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                    title="Delete Saved Treatment"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Heart className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-2.5" />
                <span className="text-xs font-semibold">No treatments saved to profile yet.</span>
                <span className="text-[10px] text-gray-500 block leading-tight mt-1">Search treatments and click 'Save to profile' to bookmark</span>
              </div>
            )}
          </div>
        </div>

        {/* Saved Schemes list */}
        <div className="glass p-6 rounded-3xl border border-white/20">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-earth-800 pb-2 flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-blue-500" />
            Bookmarked Government Schemes ({savedSchemes.length})
          </h3>

          <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
            {savedSchemes.length > 0 ? (
              savedSchemes.map((s) => (
                <div key={s._id} className="p-4 rounded-2xl bg-gray-50 dark:bg-earth-900 border border-gray-150 dark:border-earth-850 flex justify-between items-start gap-4">
                  <div>
                    <span className="font-extrabold text-sm text-gray-800 dark:text-white block">{s.title}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1 block">Benefits:</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {s.benefits}
                    </p>
                    {s.officialLink && (
                      <a 
                        href={s.officialLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-farm-600 dark:text-farm-400 text-xs font-bold mt-2.5 hover:underline"
                      >
                        Apply Here <ChevronRight className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => deleteSavedScheme(s._id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                    title="Delete Saved Scheme"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                <FileText className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-2.5" />
                <span className="text-xs font-semibold">No schemes saved to profile yet.</span>
                <span className="text-[10px] text-gray-500 block leading-tight mt-1">Visit government schemes tab to view eligible and save</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* History Log cards grid */}
      <div className="glass p-6 rounded-3xl border border-white/20">
        <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-800 dark:text-white mb-5 border-b border-gray-100 dark:border-earth-800 pb-2 flex items-center gap-2">
          <History className="h-4.5 w-4.5 text-farm-600" />
          Diagnosis logs History ({diagnosisHistory.length})
        </h3>

        {diagnosisHistory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {diagnosisHistory.map((d) => (
              <div key={d._id} className="rounded-2xl border border-gray-150 dark:border-earth-850 overflow-hidden flex flex-col justify-between bg-white dark:bg-earth-900 group shadow-sm hover:shadow-md transition-shadow">
                
                {/* Image panel */}
                <div className="h-36 relative overflow-hidden bg-gray-100">
                  <img 
                    src={d.imagePath} 
                    alt={d.diseaseName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-white">
                    Conf: {d.confidenceScore}%
                  </div>
                  <div className={`absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold text-white ${
                    d.severity === 'Severe' 
                      ? 'bg-red-600' 
                      : d.severity === 'Moderate' 
                      ? 'bg-amber-500' 
                      : 'bg-green-600'
                  }`}>
                    {d.severity}
                  </div>
                </div>

                {/* Details summary */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-gray-50 dark:border-earth-850 pb-2 mb-2">
                      <span className="font-extrabold text-sm text-gray-800 dark:text-white truncate max-w-[150px]">{d.diseaseName}</span>
                      <span className="bg-farm-50 dark:bg-farm-950 text-farm-600 dark:text-farm-400 font-extrabold text-[10px] px-2 py-0.5 rounded-md border border-farm-100 dark:border-farm-900/40">
                        {d.cropName}
                      </span>
                    </div>
                    
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Prevention Tip:</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      {d.preventionTips[0] || 'Clean crop residue and ensure structural spacing between plantings.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-50 dark:border-earth-850 flex items-center justify-between text-[10px] text-gray-400">
                    <span className="font-semibold">Diagnosed on:</span>
                    <span className="font-bold flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(d.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 dark:border-earth-800 rounded-2xl">
            <span className="text-xs font-semibold block mb-1">No diagnosis records exist in your folder.</span>
            <span className="text-[10px] text-gray-500 block leading-tight mb-4">You can take a photo of an unhealthy leaf to run AI scanning</span>
            <button
              onClick={() => window.location.href = '/crop-doctor'}
              className="bg-farm-600 hover:bg-farm-700 text-white font-bold py-2 px-5 rounded-xl text-xs transition-colors shadow-sm"
            >
              Scan Crop Disease
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
