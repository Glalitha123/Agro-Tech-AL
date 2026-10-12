import React, { useState } from 'react';
import api from '../utils/api.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Camera, 
  Leaf, 
  Activity, 
  ShieldCheck, 
  AlertCircle, 
  Info,
  CheckCircle,
  HelpCircle,
  Save,
  Plus
} from 'lucide-react';

const CropsSelection = ['Tomato', 'Wheat', 'Paddy Rice', 'Corn', 'Cotton', 'Sugarcane', 'Mustard Seeds', 'Other'];

const CropDoctor = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [cropHint, setCropHint] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setDiagnosisResult(null);
      setErrorMsg('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setDiagnosisResult(null);
      setErrorMsg('');
    }
  };

  const handleDiagnose = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      setErrorMsg('Please select or capture a crop image first.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setDiagnosisResult(null);
    setSaveSuccess(false);

    const formData = new FormData();
    formData.append('image', selectedImage);
    formData.append('cropHint', cropHint || 'unknown');

    try {
      const { data } = await api.post('/api/crops/diagnose', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setDiagnosisResult(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to analyze crop image. Please check API credentials or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTreatment = async () => {
    if (!diagnosisResult) return;
    
    setIsSaving(true);
    try {
      const recText = `Organic Remedies: ${diagnosisResult.treatment.organic} \nChemical Treatment: ${diagnosisResult.treatment.chemical} \nDosage: ${diagnosisResult.treatment.dosage} \nPrecautions: ${diagnosisResult.treatment.precautions}`;
      
      await api.post('/api/crops/treatments/save', {
        diseaseName: diagnosisResult.diseaseName,
        cropType: diagnosisResult.cropName,
        recommendation: recText
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Already bookmarked or failed to save treatment recommendation.');
    } finally {
      setIsSaving(false);
    }
  };

  // Severity color maps
  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'Healthy': return 'bg-emerald-600 text-white';
      case 'Severe': return 'bg-red-500 text-white';
      case 'Moderate': return 'bg-amber-500 text-white';
      case 'Mild': return 'bg-green-600 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getSeverityBg = (sev) => {
    switch (sev) {
      case 'Healthy': return 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-150 dark:border-emerald-900/30';
      case 'Severe': return 'bg-red-50/50 dark:bg-red-950/20 border-red-150 dark:border-red-900/30';
      case 'Moderate': return 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-150 dark:border-amber-900/30';
      case 'Mild': return 'bg-green-50/50 dark:bg-emerald-950/20 border-green-150 dark:border-emerald-900/30';
      default: return 'bg-gray-50 dark:bg-earth-900 border-gray-200 dark:border-earth-800';
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full transition-colors duration-300">
      
      {/* Title */}
      <div className="border-b border-gray-200 dark:border-earth-800 pb-5">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          AI Crop Doctor
        </h1>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
          Upload an image of an unhealthy leaf to identify disease parameters and scientific treatments instantly.
        </p>
      </div>

      {/* Grid: Upload controls and output cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Upload form container */}
        <div className="flex flex-col gap-5">
          <div className="glass p-6 rounded-3xl border border-white/20">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Leaf className="h-4.5 w-4.5 text-farm-600 dark:text-farm-400" />
              Upload Infected Leaf Photo
            </h3>

            <form onSubmit={handleDiagnose} className="flex flex-col gap-5">
              
              {/* Drop area */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="relative h-64 border-2 border-dashed border-gray-200 dark:border-earth-800 rounded-2xl flex flex-col items-center justify-center bg-gray-50/50 dark:bg-earth-900/30 overflow-hidden cursor-pointer hover:bg-gray-100/30 transition-colors"
              >
                {!imagePreview ? (
                  <label className="flex flex-col items-center justify-center p-6 text-center cursor-pointer h-full w-full">
                    <Upload className="h-10 w-10 text-gray-400 mb-3" />
                    <span className="font-bold text-sm text-gray-700 dark:text-gray-300">Drag & Drop Image Here</span>
                    <span className="text-xs text-gray-400 mt-1">or Click to browse locally (PNG, JPG, up to 10MB)</span>
                    <input
                      type="file"
                      required
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative h-full w-full flex items-center justify-center">
                    <img 
                      src={imagePreview} 
                      alt="Crop upload preview" 
                      className="max-h-full max-w-full object-contain"
                    />
                    
                    {/* Scanning Sweeper effect (displays during active API analysis) */}
                    {isLoading && (
                      <div className="absolute inset-x-0 h-1.5 bg-farm-500 shadow-lg shadow-farm-500/80 animate-radar z-20"></div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                        setDiagnosisResult(null);
                      }}
                      className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-xl text-xs font-bold transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Crop type helper dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  Crop Type hint (Optional)
                  <HelpCircle className="h-3.5 w-3.5" title="Providing a crop category helps the AI diagnose with higher accuracy." />
                </label>
                <select
                  value={cropHint}
                  onChange={(e) => setCropHint(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 focus:outline-none focus:ring-2 focus:ring-farm-500 text-sm font-medium"
                >
                  <option value="">Unknown / Detect Automatically</option>
                  {CropsSelection.map((crop) => (
                    <option key={crop} value={crop}>{crop}</option>
                  ))}
                </select>
              </div>

              {/* Error messages */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 flex items-start gap-2.5 text-xs font-semibold">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Diagnosis submit */}
              <button
                type="submit"
                disabled={isLoading || !selectedImage}
                className="w-full bg-farm-600 hover:bg-farm-700 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 rounded-full border-2 border-solid border-white border-t-transparent animate-spin"></div>
                    <span>Diagnosing Leaf Patterns...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-5 w-5" />
                    Diagnose Disease
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Diagnosis Results display (rendered dynamically on API response) */}
        <div className="flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {diagnosisResult ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="glass p-6 rounded-3xl border border-white/20 flex flex-col gap-6"
              >
                
                {/* Result header */}
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-earth-800 pb-4">
                  <div>
                    <span className="bg-farm-100 dark:bg-farm-950 text-farm-700 dark:text-farm-300 px-3 py-1 rounded-full text-xs font-extrabold border border-farm-200 dark:border-farm-900/40 uppercase tracking-wider">
                      {diagnosisResult.cropName}
                    </span>
                    <h2 className="text-xl font-black text-gray-800 dark:text-white mt-2">
                      {diagnosisResult.diseaseName}
                    </h2>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(diagnosisResult.severity)}`}>
                      {diagnosisResult.severity}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Confidence: {diagnosisResult.confidenceScore}%
                    </span>
                  </div>
                </div>

                {/* Causes & Prevention list (Side-by-side or stacked) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Causes */}
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-earth-900 border border-gray-150 dark:border-earth-850">
                    <h4 className="font-extrabold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Infection Causes
                    </h4>
                    <ul className="list-disc pl-4 text-xs text-gray-600 dark:text-gray-300 flex flex-col gap-1.5 leading-relaxed">
                      {diagnosisResult.causes?.map((cause, idx) => (
                        <li key={idx}>{cause}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Prevention */}
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-earth-900 border border-gray-150 dark:border-earth-850">
                    <h4 className="font-extrabold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4 text-farm-600" />
                      Prevention Strategies
                    </h4>
                    <ul className="list-disc pl-4 text-xs text-gray-600 dark:text-gray-300 flex flex-col gap-1.5 leading-relaxed">
                      {diagnosisResult.preventionTips?.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Full treatment instructions detailed block */}
                <div className={`p-5 rounded-2xl border ${getSeverityBg(diagnosisResult.severity)} flex flex-col gap-4`}>
                  <h4 className="font-extrabold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-200/50 dark:border-earth-800/40 pb-2 flex items-center gap-1">
                    <Info className="h-4 w-4 text-farm-600" />
                    Remedies & Scientific Prescriptions
                  </h4>

                  <div className="flex flex-col gap-3.5 text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                    <p>
                      <strong className="text-gray-900 dark:text-white block font-bold text-sm mb-0.5">🌿 Organic Remedy:</strong>
                      {diagnosisResult.treatment?.organic}
                    </p>
                    <p>
                      <strong className="text-gray-900 dark:text-white block font-bold text-sm mb-0.5">🧪 Chemical Remedy:</strong>
                      {diagnosisResult.treatment?.chemical}
                    </p>
                    <p>
                      <strong className="text-gray-900 dark:text-white block font-bold text-sm mb-0.5">⚖️ Dosage details:</strong>
                      {diagnosisResult.treatment?.dosage}
                    </p>
                    <p>
                      <strong className="text-gray-900 dark:text-white block font-bold text-sm mb-0.5">⚠️ Safety Precautions:</strong>
                      {diagnosisResult.treatment?.precautions}
                    </p>
                  </div>

                  {/* Bookmark Button */}
                  <div className="mt-2 flex items-center justify-between border-t border-gray-200/50 dark:border-earth-800/40 pt-4 gap-4 flex-wrap">
                    {saveSuccess ? (
                      <span className="flex items-center gap-1 text-green-700 dark:text-green-400 text-xs font-bold animate-pulse">
                        <CheckCircle className="h-4.5 w-4.5" /> Bookmarked to Saved Treatments!
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
                        Add this treatment protocol to your profile bookmarks to read later.
                      </span>
                    )}

                    <button
                      onClick={handleSaveTreatment}
                      disabled={isSaving || saveSuccess}
                      className="bg-farm-600 hover:bg-farm-700 disabled:bg-green-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      {isSaving ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : saveSuccess ? (
                        'Saved'
                      ) : (
                        <>
                          <Save className="h-4 w-4" /> Save to Profile
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className="glass p-12 rounded-3xl border border-white/20 flex flex-col items-center justify-center text-center text-gray-400 h-full min-h-[400px]">
                <Leaf className="h-16 w-16 text-gray-300 dark:text-gray-700 mb-4 animate-pulse" />
                <h3 className="font-extrabold text-gray-800 dark:text-white text-base">Awaiting Leaf Diagnosis</h3>
                <p className="text-xs text-gray-500 max-w-sm mt-2 leading-relaxed">
                  Upload an image of your damaged plant foliage, select a category helper, and trigger diagnosis. The report will load here.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
};

export default CropDoctor;
