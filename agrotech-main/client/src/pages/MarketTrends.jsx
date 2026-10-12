import React, { useState, useEffect, useContext, useRef } from 'react';
import api from '../utils/api.js';
import { AuthContext } from '../context/AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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
  Legend,
  Filler
} from 'chart.js';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ChevronRight,
  Coins,
  Activity,
  Newspaper,
  MapPin,
  Store,
  BarChart3,
  PieChart,
  Sparkles,
  CheckCircle2,
  Layers,
  Search
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
  Legend,
  Filler
);

const SUPPORTED_CROPS = [
  { id: 'Paddy Rice', name: 'Paddy Rice', icon: '🌾', category: 'Kharif Staple' },
  { id: 'Wheat', name: 'Wheat', icon: '🌾', category: 'Rabi Grain' },
  { id: 'Corn', name: 'Corn (Maize)', icon: '🌽', category: 'Coarse Grain' },
  { id: 'Cotton', name: 'Cotton', icon: '🧵', category: 'Cash Crop' },
  { id: 'Sugarcane', name: 'Sugarcane', icon: '🎋', category: 'Commercial' },
  { id: 'Mustard Seeds', name: 'Mustard Seeds', icon: '🌼', category: 'Oilseed' },
  { id: 'Tomato', name: 'Tomato', icon: '🍅', category: 'Horticulture' },
  { id: 'Onion', name: 'Onion', icon: '🧅', category: 'Horticulture' }
];

const MarketTrends = () => {
  const { user } = useContext(AuthContext);

  // Core selection state: Crop -> Primary State -> Mandi District -> Specific Mandi
  const [selectedCrop, setSelectedCrop] = useState('Paddy Rice');
  const [primaryStates, setPrimaryStates] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  
  const [districtData, setDistrictData] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  
  const [mandiList, setMandiList] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState('');
  const [forecastDetails, setForecastDetails] = useState(null);

  // Loading & error states
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingMandis, setIsLoadingMandis] = useState(false);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Active chart tab (bar vs doughnut)
  const [activeChartType, setActiveChartType] = useState('bar');

  // Ref to store active AbortController to prevent race conditions
  const activeControllerRef = useRef(null);

  const getNewAbortSignal = () => {
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
    }
    const controller = new AbortController();
    activeControllerRef.current = controller;
    return controller.signal;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
    };
  }, []);

  // 1. Trigger state list fetch whenever Crop changes
  useEffect(() => {
    if (selectedCrop) {
      fetchCropStates(selectedCrop);
    }
  }, [selectedCrop]);

  const fetchCropStates = async (cropName) => {
    setIsLoadingStates(true);
    setErrorMsg('');
    setPrimaryStates([]);
    setSelectedState('');
    setDistrictData([]);
    setSelectedDistrict(null);
    setMandiList([]);
    setSelectedMarket('');
    setForecastDetails(null);

    const signal = getNewAbortSignal();
    try {
      const { data } = await api.get(`/api/market/crop-states?crop=${encodeURIComponent(cropName)}`, { signal });
      setPrimaryStates(data.primaryStates || []);
      
      // Pre-select first state or user's home state if in list
      if (data.primaryStates && data.primaryStates.length > 0) {
        let initialSt = data.primaryStates[0].stateName;
        if (user && user.profile && user.profile.state) {
          const userStMatch = data.primaryStates.find(
            s => s.stateName.toLowerCase() === user.profile.state.toLowerCase()
          );
          if (userStMatch) initialSt = userStMatch.stateName;
        }
        handleStateSelect(initialSt, cropName);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.message === 'canceled') return;
      console.error('Failed to load crop primary states:', err);
      setErrorMsg('Unable to load primary focus states for this crop.');
    } finally {
      setIsLoadingStates(false);
    }
  };

  // 2. Fetch primary mandi districts whenever State is selected
  const handleStateSelect = async (stateName, cropName = selectedCrop) => {
    setSelectedState(stateName);
    setSelectedDistrict(null);
    setMandiList([]);
    setSelectedMarket('');
    setForecastDetails(null);
    setIsLoadingDistricts(true);
    setErrorMsg('');

    const signal = getNewAbortSignal();
    try {
      const { data } = await api.get(
        `/api/market/crop-districts?crop=${encodeURIComponent(cropName)}&state=${encodeURIComponent(stateName)}`,
        { signal }
      );
      setDistrictData(data.districts || []);
      if (data.districts && data.districts.length > 0) {
        handleDistrictSelect(data.districts[0], stateName, cropName);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.message === 'canceled') return;
      console.error('Failed to fetch district mandis:', err);
      setErrorMsg('Failed to load mandi districts for this state.');
    } finally {
      setIsLoadingDistricts(false);
    }
  };

  // 3. Fetch mandis inside selected district
  const handleDistrictSelect = async (distObj, stateName = selectedState, cropName = selectedCrop) => {
    setSelectedDistrict(distObj);
    setSelectedMarket('');
    setForecastDetails(null);
    setIsLoadingMandis(true);
    setErrorMsg('');

    const signal = getNewAbortSignal();
    try {
      const { data } = await api.get(
        `/api/market/crop-district-markets?crop=${encodeURIComponent(cropName)}&state=${encodeURIComponent(stateName)}&district=${encodeURIComponent(distObj.district)}`,
        { signal }
      );
      setMandiList(data.mandis || []);
      if (data.mandis && data.mandis.length > 0) {
        handleMandiSelect(data.mandis[0].marketName, distObj.district, stateName, cropName);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.message === 'canceled') return;
      console.error('Failed to fetch mandis:', err);
      setErrorMsg('Failed to load detailed mandi records.');
    } finally {
      setIsLoadingMandis(false);
    }
  };

  // 4. Fetch 4-week forecast curve & advice for specific Mandi
  const handleMandiSelect = async (mandiName, distName = selectedDistrict?.district, stateName = selectedState, cropName = selectedCrop) => {
    setSelectedMarket(mandiName);
    setIsLoadingForecast(true);
    const signal = getNewAbortSignal();

    try {
      const { data } = await api.get(
        `/api/market/forecast?state=${encodeURIComponent(stateName)}&district=${encodeURIComponent(distName)}&market=${encodeURIComponent(mandiName)}&crop=${encodeURIComponent(cropName)}`,
        { signal }
      );
      setForecastDetails(data);
    } catch (err) {
      if (err.name === 'CanceledError' || err.message === 'canceled') return;
      console.error('Failed to load forecast:', err);
    } finally {
      setIsLoadingForecast(false);
    }
  };

  // Helper colors for District graphical representation
  const chartColors = [
    'rgba(34, 197, 94, 0.85)',   // emerald
    'rgba(59, 130, 246, 0.85)',  // blue
    'rgba(245, 158, 11, 0.85)',  // amber
    'rgba(168, 85, 247, 0.85)',  // purple
    'rgba(236, 72, 153, 0.85)',  // pink
    'rgba(14, 165, 233, 0.85)',  // sky
    'rgba(16, 185, 129, 0.85)',  // teal
    'rgba(249, 115, 22, 0.85)'   // orange
  ];

  // Bar Chart Data (Districts vs. Average Modal Price)
  const barChartData = districtData.length > 0 ? {
    labels: districtData.map(d => d.district),
    datasets: [{
      label: `Average Wholesale Rate (₹ / Quintal)`,
      data: districtData.map(d => d.avgModalPrice),
      backgroundColor: districtData.map((_, i) => chartColors[i % chartColors.length]),
      borderRadius: 8,
      borderWidth: 0
    }]
  } : null;

  // Doughnut Chart Data (Mandi Distribution by District)
  const doughnutChartData = districtData.length > 0 ? {
    labels: districtData.map(d => `${d.district} (${d.mandiCount} Mandi${d.mandiCount > 1 ? 's' : ''})`),
    datasets: [{
      label: 'Mandis Count',
      data: districtData.map(d => d.mandiCount),
      backgroundColor: districtData.map((_, i) => chartColors[i % chartColors.length]),
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 2
    }]
  } : null;

  // Line Chart Data for 4-Week Forecast
  const lineChartData = forecastDetails && forecastDetails.forecast ? {
    labels: ['Current Week', 'Week +1', 'Week +2', 'Week +3'],
    datasets: [{
      label: `${forecastDetails.cropName} Price Forecast (₹ / Quintal)`,
      data: forecastDetails.forecast,
      fill: true,
      backgroundColor: 'rgba(34, 197, 94, 0.12)',
      borderColor: '#22c55e',
      borderWidth: 3,
      pointBackgroundColor: '#15803d',
      pointRadius: 5,
      tension: 0.35
    }]
  } : null;

  const getRecommendationBadge = (rec) => {
    if (!rec) return 'bg-gray-100 text-gray-700 dark:bg-earth-900 dark:text-gray-400';
    switch (rec.toLowerCase()) {
      case 'sell soon':
      case 'sell': return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-900/40';
      case 'sell later':
      case 'harvest': return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40';
      case 'hold': return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border border-green-200 dark:border-green-900/40';
      default: return 'bg-gray-100 text-gray-700 dark:bg-earth-900 dark:text-gray-400';
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full transition-colors duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-earth-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-farm-500 animate-pulse" />
            Market Trends & Mandi Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-1">
            Crop-first intelligence: Select a crop to inspect primary producing states, active mandi districts, and real-time pricing data.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-farm-50 dark:bg-farm-950/40 border border-farm-200 dark:border-farm-900 px-3.5 py-2 rounded-2xl">
          <Activity className="h-4 w-4 text-farm-600 dark:text-farm-400 animate-spin" />
          <span className="text-xs font-bold text-farm-700 dark:text-farm-300">Live AGMARKNET Sync Active</span>
        </div>
      </div>

      {/* STEP 1: CROP SELECTION GRID */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-farm-600 text-white text-[11px]">1</span>
            Select Target Crop Focus
          </h2>
          <span className="text-xs text-gray-400">8 Supported Core Commodities</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {SUPPORTED_CROPS.map((crop) => {
            const isSelected = selectedCrop === crop.id;
            return (
              <button
                key={crop.id}
                onClick={() => setSelectedCrop(crop.id)}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                  isSelected
                    ? 'bg-farm-500 text-white border-farm-600 shadow-lg shadow-farm-500/20 scale-105 font-bold'
                    : 'bg-white dark:bg-earth-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-earth-800 hover:border-farm-300 hover:bg-farm-50/50 dark:hover:bg-earth-800'
                }`}
              >
                <span className="text-2xl">{crop.icon}</span>
                <span className="text-xs font-bold leading-tight">{crop.name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-earth-800 text-gray-500 dark:text-gray-400'
                }`}>
                  {crop.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: PRIMARY PRODUCING STATES */}
      <div className="glass p-5 rounded-3xl border border-white/20 dark:border-earth-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-farm-600 text-white text-[11px]">2</span>
            Primary Focus States for <span className="text-farm-600 dark:text-farm-400 underline decoration-wavy underline-offset-4">{selectedCrop}</span>
          </h2>

          {isLoadingStates && (
            <span className="text-xs font-semibold text-farm-500 animate-pulse flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 animate-spin" /> Syncing State Mandi Registries...
            </span>
          )}
        </div>

        {primaryStates.length === 0 && !isLoadingStates ? (
          <p className="text-xs text-gray-400 py-2">No primary states found for this crop.</p>
        ) : (
          <div className="flex flex-wrap gap-2.5 pt-1">
            {primaryStates.map((st) => {
              const isSelected = selectedState === st.stateName;
              return (
                <button
                  key={st.stateName}
                  onClick={() => handleStateSelect(st.stateName)}
                  className={`px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-earth-900 text-white dark:bg-farm-600 dark:text-white border-earth-900 dark:border-farm-500 shadow-md scale-102'
                      : 'bg-white dark:bg-earth-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-earth-800 hover:border-gray-400'
                  }`}
                >
                  <MapPin className={`h-3.5 w-3.5 ${isSelected ? 'text-farm-400' : 'text-gray-400'}`} />
                  <span>{st.stateName}</span>
                  {st.mandiCount > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-farm-100 text-farm-700 dark:bg-farm-950 dark:text-farm-300'
                    }`}>
                      {st.mandiCount} Mandi{st.mandiCount > 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ERROR BANNER */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 3 & 4: GRAPHICAL REPRESENTATION & MANDI DETAILS */}
      {!selectedState ? (
        <div className="glass p-12 rounded-3xl border border-white/20 flex flex-col items-center justify-center text-center gap-3">
          <Store className="h-12 w-12 text-farm-500 animate-bounce" />
          <h3 className="font-extrabold text-lg text-gray-800 dark:text-white">Select a State to View Mandi Hubs</h3>
          <p className="text-gray-400 text-xs max-w-md">
            Click on any of the primary producing states above to render the graphical district map and live mandi prices.
          </p>
        </div>
      ) : isLoadingDistricts ? (
        <div className="flex flex-col items-center justify-center py-20 text-farm-600 dark:text-farm-400 font-semibold gap-3 text-sm">
          <div className="h-10 w-10 border-4 border-solid border-farm-200 border-t-farm-600 rounded-full animate-spin"></div>
          <span>Gathering primary district mandis and live government prices...</span>
        </div>
      ) : districtData.length === 0 ? (
        <div className="glass p-12 rounded-3xl border border-white/20 flex flex-col items-center justify-center text-center gap-3">
          <AlertTriangle className="h-12 w-12 text-amber-500 animate-pulse" />
          <h3 className="font-extrabold text-lg text-gray-800 dark:text-white">No Mandi Records Found in {selectedState}</h3>
          <p className="text-gray-400 text-xs max-w-md">
            There are currently no AGMARKNET market reports for {selectedCrop} in {selectedState}. Try selecting another primary state above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT 7 COLS: GRAPHICAL REPRESENTATION OF PRIMARY DISTRICTS */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Graphical Chart Card */}
            <div className="glass p-6 rounded-3xl border border-white/20 dark:border-earth-800 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-earth-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-800 dark:text-white flex items-center gap-2">
                    <BarChart3 className="h-4.5 w-4.5 text-farm-600" />
                    Primary Mandi Districts in {selectedState}
                  </h3>
                  <span className="text-xs text-gray-400 font-medium">Graphical breakdown for {selectedCrop}</span>
                </div>

                {/* Chart Type Toggle Tabs */}
                <div className="flex bg-gray-100 dark:bg-earth-900 p-1 rounded-xl border border-gray-200 dark:border-earth-800 text-xs font-bold">
                  <button
                    onClick={() => setActiveChartType('bar')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                      activeChartType === 'bar'
                        ? 'bg-white dark:bg-earth-800 text-farm-600 dark:text-farm-400 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    Rates Chart
                  </button>
                  <button
                    onClick={() => setActiveChartType('doughnut')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                      activeChartType === 'doughnut'
                        ? 'bg-white dark:bg-earth-800 text-farm-600 dark:text-farm-400 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <PieChart className="h-3.5 w-3.5" />
                    Mandi Share
                  </button>
                </div>
              </div>

              {/* Graphical Render Container */}
              <div className="h-72 w-full flex items-center justify-center p-2">
                {activeChartType === 'bar' && barChartData ? (
                  <Bar
                    data={barChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (ctx) => ` Average Price: ₹ ${ctx.raw} / Quintal`
                          }
                        }
                      },
                      scales: {
                        y: {
                          grid: { color: 'rgba(156, 163, 175, 0.1)' },
                          title: { display: true, text: 'Modal Price (₹/Quintal)', font: { size: 10, weight: 'bold' } }
                        },
                        x: { grid: { display: false } }
                      }
                    }}
                  />
                ) : activeChartType === 'doughnut' && doughnutChartData ? (
                  <Doughnut
                    data={doughnutChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } }
                      }
                    }}
                  />
                ) : null}
              </div>
            </div>

            {/* Districts Data Table & Interactive Selection */}
            <div className="glass p-6 rounded-3xl border border-white/20 dark:border-earth-800 flex flex-col gap-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-800 dark:text-white border-b border-gray-100 dark:border-earth-800 pb-3 flex justify-between items-center">
                <span>Select District Mandi Hub</span>
                <span className="text-xs text-gray-400 font-normal">Click a row to inspect mandis</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-earth-800">
                      <th className="py-2.5 px-3">District</th>
                      <th className="py-2.5 px-3">Mandis Count</th>
                      <th className="py-2.5 px-3">Avg Rate</th>
                      <th className="py-2.5 px-3">Price Range</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-earth-800 text-xs">
                    {districtData.map((d) => {
                      const isSelected = selectedDistrict?.district === d.district;
                      return (
                        <tr
                          key={d.district}
                          onClick={() => handleDistrictSelect(d)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-farm-50 dark:bg-farm-950/50 font-bold text-farm-900 dark:text-farm-200'
                              : 'hover:bg-gray-50 dark:hover:bg-earth-900/60 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <td className="py-3 px-3 flex items-center gap-2">
                            <MapPin className={`h-3.5 w-3.5 ${isSelected ? 'text-farm-600' : 'text-gray-400'}`} />
                            <span className="font-bold">{d.district}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              {d.mandiCount} Mandi{d.mandiCount > 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-extrabold text-gray-900 dark:text-white">
                            ₹ {d.avgModalPrice}
                          </td>
                          <td className="py-3 px-3 text-gray-500 dark:text-gray-400 font-medium">
                            ₹ {d.minPrice} - ₹ {d.maxPrice}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button className={`p-1.5 rounded-xl transition-all ${
                              isSelected ? 'bg-farm-600 text-white' : 'bg-gray-100 dark:bg-earth-800 text-gray-400'
                            }`}>
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* RIGHT 5 COLS: SELECTED DISTRICT MANDIS & FORECAST LINE CHART */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Mandi Cards in Selected District */}
            <div className="glass p-6 rounded-3xl border border-white/20 dark:border-earth-800 flex flex-col gap-4">
              <div className="border-b border-gray-100 dark:border-earth-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-800 dark:text-white flex items-center gap-2">
                    <Store className="h-4.5 w-4.5 text-farm-600" />
                    Mandis in {selectedDistrict?.district}
                  </h3>
                  <span className="text-[11px] text-gray-400 font-medium">{mandiList.length} Active Market Reports</span>
                </div>
              </div>

              {isLoadingMandis ? (
                <div className="py-10 text-center text-xs text-farm-500 font-semibold animate-pulse">
                  Loading mandis in {selectedDistrict?.district}...
                </div>
              ) : mandiList.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No active mandis found for this district.</p>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {mandiList.map((m) => {
                    const isSelected = selectedMarket === m.marketName;
                    const isPositive = m.priceChangeWeek >= 0;
                    return (
                      <button
                        key={m.marketName}
                        onClick={() => handleMandiSelect(m.marketName)}
                        className={`p-3.5 rounded-2xl border text-left flex justify-between items-center transition-all ${
                          isSelected
                            ? 'bg-farm-500 text-white border-farm-600 shadow-md'
                            : 'bg-white dark:bg-earth-900 border-gray-200 dark:border-earth-800 hover:border-farm-300'
                        }`}
                      >
                        <div>
                          <span className={`font-extrabold text-xs block ${isSelected ? 'text-white' : 'text-gray-800 dark:text-white'}`}>
                            {m.marketName} Mandi
                          </span>
                          <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-farm-100' : 'text-gray-400 dark:text-gray-500'}`}>
                            Variety: {m.variety} | Grade: {m.grade}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className={`font-black text-sm block ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                            ₹ {m.currentPrice}
                          </span>
                          <span className={`text-[10px] font-bold block ${
                            isSelected
                              ? 'text-farm-100'
                              : isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                          }`}>
                            {isPositive ? '+' : ''}{m.priceChangeWeek}%
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Mandi 4-Week Forecast Curve */}
            <div className="glass p-6 rounded-3xl border border-white/20 dark:border-earth-800 flex flex-col gap-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-800 dark:text-white border-b border-gray-100 dark:border-earth-800 pb-3 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4.5 w-4.5 text-farm-600" />
                  4-Week Price Forecast Curve
                </span>
                {selectedMarket && (
                  <span className="text-[10px] text-farm-600 dark:text-farm-400 font-bold bg-farm-50 dark:bg-farm-950 px-2 py-0.5 rounded-full">
                    {selectedMarket}
                  </span>
                )}
              </h3>

              {isLoadingForecast ? (
                <div className="h-56 flex flex-col items-center justify-center gap-2 text-xs text-farm-500 font-semibold animate-pulse">
                  <Activity className="h-6 w-6 animate-spin" />
                  <span>Computing forecast curve...</span>
                </div>
              ) : forecastDetails ? (
                <div className="flex flex-col gap-4">
                  {/* Badges bar */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/60 dark:bg-earth-900 p-3 rounded-2xl border border-gray-100 dark:border-earth-800">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Advisor Action</span>
                      <span className={`inline-block text-xs font-black px-2 py-0.5 rounded-lg mt-1 ${getRecommendationBadge(forecastDetails.recommendation)}`}>
                        {forecastDetails.recommendation}
                      </span>
                    </div>

                    <div className="bg-white/60 dark:bg-earth-900 p-3 rounded-2xl border border-gray-100 dark:border-earth-800">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Price Risk</span>
                      <span className="text-xs font-black text-gray-800 dark:text-white mt-1 block">
                        {forecastDetails.riskLevel}
                      </span>
                    </div>
                  </div>

                  {/* Line Chart Container */}
                  <div className="h-52 w-full">
                    {lineChartData ? (
                      <Line
                        data={lineChartData}
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
                      <div className="text-center text-xs text-gray-400 py-12">
                        Insufficient historical data for forecast
                      </div>
                    )}
                  </div>

                  {/* Advisory Summary */}
                  <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-earth-900 text-xs text-gray-600 dark:text-gray-300 font-medium leading-relaxed border border-gray-100 dark:border-earth-800">
                    {forecastDetails.newsSummary}
                  </div>
                </div>
              ) : (
                <div className="text-center text-xs text-gray-400 py-12">
                  Select a mandi above to view price projection curve.
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default MarketTrends;
