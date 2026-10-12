import React, { useState } from 'react';
import api from '../utils/api.js';
import { motion } from 'framer-motion';
import { 
  Search, 
  BookOpen, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle,
  FileText,
  FileSpreadsheet,
  Save,
  ArrowRight
} from 'lucide-react';

const QuickSearches = [
  'How to cure tomato early blight?',
  'Chemical treatment for rice blast disease',
  'Organic remedies for wheat stem rust',
  'SMAM solar water pump subsidy qualifications'
];

const TreatmentFinder = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSearch = async (e, customQuery) => {
    if (e) e.preventDefault();
    
    const activeQuery = customQuery || query;
    if (!activeQuery || activeQuery.trim() === '') {
      setErrorMsg('Please enter a pest, crop, or disease keyword to search.');
      return;
    }

    if (customQuery) {
      setQuery(customQuery);
    }

    setIsLoading(true);
    setErrorMsg('');
    setResult(null);
    setSaveSuccess(false);

    try {
      const { data } = await api.post('/api/crops/treatments/search-rag', { query: activeQuery });
      setResult(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Vector search failed. Please check backend connections.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTreatment = async () => {
    if (!result) return;
    
    setIsSaving(true);
    try {
      await api.post('/api/crops/treatments/save', {
        diseaseName: `RAG Search: ${result.query.substring(0, 30)}...`,
        cropType: 'Reference Manuals',
        recommendation: result.answer
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Already bookmarked or failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-8 max-w-5xl mx-auto w-full transition-colors duration-300">
      
      {/* Title */}
      <div className="border-b border-gray-200 dark:border-earth-800 pb-5">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          Scientific Treatment Finder
        </h1>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
          Perform a semantic vector search across official Agricultural Handbooks and Government Subsidies guidelines.
        </p>
      </div>

      {/* Main search card */}
      <div className="glass p-6 rounded-3xl border border-white/20">
        <form onSubmit={(e) => handleSearch(e)} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search e.g. 'tomato early blight copper dosage' or 'tractor subsidies'..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-farm-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query}
            className="bg-farm-600 hover:bg-farm-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-2xl text-sm transition-all duration-300 shadow-md flex items-center gap-1.5 shrink-0"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Search className="h-4.5 w-4.5" />
                Query RAG
              </>
            )}
          </button>
        </form>

        {/* Quick searches shortcuts */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0 mt-1 sm:mt-0">
            Suggested Searches:
          </span>
          <div className="flex flex-wrap gap-2">
            {QuickSearches.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => handleSearch(e, item)}
                className="bg-gray-150/50 hover:bg-gray-150 dark:bg-earth-900/60 dark:hover:bg-earth-800/80 border border-gray-200/40 dark:border-earth-800/50 text-[10px] text-gray-600 dark:text-gray-300 font-bold px-3 py-1.5 rounded-xl transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 flex items-start gap-2.5 text-xs font-semibold">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Result presentation panels */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-farm-600 dark:text-farm-400 font-semibold gap-3 text-sm">
          <div className="h-10 w-10 border-4 border-solid border-farm-200 border-t-farm-600 rounded-full animate-spin"></div>
          <span>Retrieving relevant vectors & synthesizing scientific remedies...</span>
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
        >
          
          {/* Main response Synthesized Card */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="glass p-6 rounded-3xl border border-white/20">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-earth-800 pb-3 mb-4">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-800 dark:text-white flex items-center gap-2">
                  <BookOpen className="h-4.5 w-4.5 text-farm-600" />
                  Synthesized Scientific Response
                </h3>

                {saveSuccess ? (
                  <span className="text-[10px] font-bold text-green-700 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Bookmarked to profile!
                  </span>
                ) : (
                  <button
                    onClick={handleSaveTreatment}
                    disabled={isSaving}
                    className="flex items-center gap-1 text-farm-600 hover:text-farm-700 dark:text-farm-400 dark:hover:text-farm-300 text-xs font-bold transition-colors"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Treatment
                  </button>
                )}
              </div>

              <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed text-gray-700 dark:text-gray-300 font-medium whitespace-pre-line">
                {result.answer}
              </div>
            </div>
          </div>

          {/* Reference Manual Sources Column */}
          <div className="flex flex-col gap-5">
            <div className="glass p-6 rounded-3xl border border-white/20">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-earth-800 pb-2">
                Reference Manuals matched
              </h3>

              <div className="flex flex-col gap-4">
                {result.sources?.map((src, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-gray-50 dark:bg-earth-900 border border-gray-150 dark:border-earth-850">
                    <div className="flex items-center gap-1.5 text-farm-700 dark:text-farm-400 mb-2">
                      <FileText className="h-4.5 w-4.5" />
                      <span className="font-extrabold text-xs">{src.title}</span>
                    </div>
                    
                    <div className="flex flex-col gap-1 text-[11px] text-gray-500 font-semibold leading-relaxed">
                      <span>Source: <strong className="text-gray-700 dark:text-gray-300">{src.source}</strong></span>
                      <span>Vector Relevance: <strong className="text-farm-600 dark:text-farm-400">{(src.score * 100).toFixed(1)}% match</strong></span>
                    </div>
                  </div>
                ))}

                {result.sources?.length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-xs italic">
                    No manual chunks matching query. Used general backup LLM training.
                  </div>
                )}
              </div>
            </div>
          </div>

        </motion.div>
      )}

    </div>
  );
};

export default TreatmentFinder;
