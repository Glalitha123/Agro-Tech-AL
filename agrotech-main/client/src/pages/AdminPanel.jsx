import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  Users, 
  UploadCloud, 
  PlusCircle, 
  Activity, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Bookmark,
  MapPin,
  TrendingUp,
  Sliders,
  Database
} from 'lucide-react';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('analytics');

  // Analytics Metrics states
  const [analytics, setAnalytics] = useState(null);
  
  // Users states
  const [usersList, setUsersList] = useState([]);

  // RAG File Upload states
  const [docTitle, setDocTitle] = useState('');
  const [docSource, setDocSource] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Scheme Creation states
  const [schemeTitle, setSchemeTitle] = useState('');
  const [schemeDesc, setSchemeDesc] = useState('');
  const [schemeState, setSchemeState] = useState('All');
  const [schemeMinLand, setSchemeMinLand] = useState(0);
  const [schemeMaxLand, setSchemeMaxLand] = useState(9999);
  const [schemeCategory, setSchemeCategory] = useState('All');
  const [schemeCrops, setSchemeCrops] = useState('');
  const [schemeBenefits, setSchemeBenefits] = useState('');
  const [schemeDocs, setSchemeDocs] = useState('');
  const [schemeProcess, setSchemeProcess] = useState('');
  const [schemeLink, setSchemeLink] = useState('');
  const [schemeDeadline, setSchemeDeadline] = useState('Open Year-Round');
  const [schemeLoading, setSchemeLoading] = useState(false);
  const [schemeSuccess, setSchemeSuccess] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchAnalytics();
    fetchUsers();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get('/api/admin/analytics');
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/admin/users');
      setUsersList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a reference manual file to upload.');
      return;
    }

    setUploadLoading(true);
    setErrorMsg('');
    setUploadSuccess('');

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('docTitle', docTitle);
    formData.append('docSource', docSource || 'Uploaded Manual');

    try {
      const { data } = await api.post('/api/admin/upload-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadSuccess(`Success! ${data.fileName} was indexed into ${data.chunksCount} vectors using mode: ${data.vectorMode}.`);
      setDocTitle('');
      setDocSource('');
      setSelectedFile(null);
      // Reset input element
      document.getElementById('file-upload-input').value = '';
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to upload document RAG.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleCreateScheme = async (e) => {
    e.preventDefault();
    setSchemeLoading(true);
    setErrorMsg('');
    setSchemeSuccess('');

    try {
      const cropsList = schemeCrops.split(',').map(c => c.trim()).filter(c => c !== '');
      const docsList = schemeDocs.split(',').map(d => d.trim()).filter(d => d !== '');

      await api.post('/api/admin/schemes/create', {
        title: schemeTitle,
        description: schemeDesc,
        state: schemeState,
        minLandSize: Number(schemeMinLand),
        maxLandSize: Number(schemeMaxLand),
        category: schemeCategory,
        crops: cropsList.length > 0 ? cropsList : ['All'],
        benefits: schemeBenefits,
        requiredDocuments: docsList,
        applicationProcess: schemeProcess,
        officialLink: schemeLink,
        deadline: schemeDeadline
      });

      setSchemeSuccess(`Government Scheme "${schemeTitle}" created & auto-indexed in RAG database successfully!`);
      // Reset form fields
      setSchemeTitle('');
      setSchemeDesc('');
      setSchemeState('All');
      setSchemeMinLand(0);
      setSchemeMaxLand(9999);
      setSchemeCategory('All');
      setSchemeCrops('');
      setSchemeBenefits('');
      setSchemeDocs('');
      setSchemeProcess('');
      setSchemeLink('');
      setSchemeDeadline('Open Year-Round');
      
      fetchAnalytics(); // Refresh stats
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to create scheme. Check inputs.');
    } finally {
      setSchemeLoading(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full transition-colors duration-300">
      
      {/* Title */}
      <div className="border-b border-gray-200 dark:border-earth-800 pb-5">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2.5">
          <ShieldAlert className="h-8 w-8 text-red-500" />
          Admin Panel
        </h1>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
          Perform administrative configurations, moderate users, upload RAG documents, and create government schemes.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-gray-100 dark:border-earth-900 gap-1.5 flex-wrap">
        {[
          { id: 'analytics', label: 'Platform Analytics', icon: Activity },
          { id: 'users', label: 'Manage Farmers', icon: Users },
          { id: 'rag', label: 'Index RAG Manuals', icon: UploadCloud },
          { id: 'scheme', label: 'Publish Schemes', icon: PlusCircle }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setErrorMsg('');
              }}
              className={`flex items-center gap-2 font-bold text-xs uppercase tracking-wider py-3 px-5 rounded-t-xl transition-all border-b-2 ${
                isActive
                  ? 'border-farm-600 text-farm-700 dark:border-farm-400 dark:text-farm-300 bg-farm-50/50 dark:bg-earth-900/30'
                  : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Global Error message */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 flex items-start gap-2.5 text-xs font-semibold">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Dynamic Tab Body content */}
      <div className="flex flex-col gap-6">
        
        {/* Tab 1: Platform Analytics */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-8">
            
            {/* Quick Metrics grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              <div className="glass p-5 rounded-2xl border border-white/20">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Registered Farmers</span>
                <span className="text-2xl font-black text-gray-800 dark:text-white mt-1 block">
                  {analytics?.metrics?.totalFarmers || 0}
                </span>
                <span className="text-[9px] text-gray-400 dark:text-gray-500 block mt-0.5">Actively managing crop records</span>
              </div>

              <div className="glass p-5 rounded-2xl border border-white/20">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Crop Diagnoses</span>
                <span className="text-2xl font-black text-gray-800 dark:text-white mt-1 block">
                  {analytics?.metrics?.totalDiagnoses || 0}
                </span>
                <span className="text-[9px] text-gray-400 dark:text-gray-500 block mt-0.5">Diagnosed by Gemini Vision API</span>
              </div>

              <div className="glass p-5 rounded-2xl border border-white/20">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Government Schemes published</span>
                <span className="text-2xl font-black text-gray-800 dark:text-white mt-1 block">
                  {analytics?.metrics?.totalSchemes || 0}
                </span>
                <span className="text-[9px] text-gray-400 dark:text-gray-500 block mt-0.5">Seeded & indexed in databases</span>
              </div>

            </div>

            {/* Aggregated Breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Diagnosis Severity Split */}
              <div className="glass p-6 rounded-3xl border border-white/20">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-earth-800 pb-2">
                  Disease severity split
                </h3>
                <div className="flex flex-col gap-3 font-medium text-xs">
                  {['Healthy', 'Severe', 'Moderate', 'Mild', 'Unknown'].map(sev => {
                    const count = analytics?.severityBreakdown?.[sev] || 0;
                    return (
                      <div key={sev} className="flex items-center justify-between border-b border-gray-50 dark:border-earth-900 pb-2.5">
                        <span className="text-gray-400 dark:text-gray-500">{sev} cases:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-earth-900 px-3 py-1 rounded-lg">
                          {count} logs
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Farmers states representation */}
              <div className="glass p-6 rounded-3xl border border-white/20">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-earth-800 pb-2">
                  Farmers Registered By Region
                </h3>
                <div className="flex flex-col gap-3 font-medium text-xs max-h-48 overflow-y-auto">
                  {analytics?.farmersByState?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-gray-50 dark:border-earth-900 pb-2.5">
                      <span className="text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-farm-600" /> {item.state}
                      </span>
                      <span className="font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-earth-900 px-3 py-1 rounded-lg">
                        {item.count} farmers
                      </span>
                    </div>
                  ))}

                  {(!analytics?.farmersByState || analytics.farmersByState.length === 0) && (
                    <span className="text-gray-400 italic text-center block py-4">No regional data available.</span>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: User Moderation list */}
        {activeTab === 'users' && (
          <div className="glass p-6 rounded-3xl border border-white/20 overflow-hidden">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-earth-800 pb-3 flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-farm-600" />
              Farmer Accounts Directory
            </h3>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-150 dark:border-earth-800 text-gray-400 uppercase font-bold">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">State</th>
                    <th className="py-3 px-4">Acreage</th>
                    <th className="py-3 px-4">Primary Crops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-earth-900 font-medium">
                  {usersList.map(usr => (
                    <tr key={usr._id} className="hover:bg-gray-50/50 dark:hover:bg-earth-900/30 text-gray-700 dark:text-gray-300">
                      <td className="py-3.5 px-4 font-bold text-gray-800 dark:text-white">{usr.name}</td>
                      <td className="py-3.5 px-4">{usr.email}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                          usr.role === 'admin' 
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' 
                            : 'bg-farm-100 text-farm-700 dark:bg-farm-950 dark:text-farm-400'
                        }`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{usr.profile?.state || 'N/A'}</td>
                      <td className="py-3.5 px-4">{usr.profile?.landSize || 0} Acres</td>
                      <td className="py-3.5 px-4 font-semibold text-farm-600 dark:text-farm-400">
                        {usr.profile?.primaryCrops?.join(', ') || 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Vector manuals indexing */}
        {activeTab === 'rag' && (
          <div className="glass p-6 rounded-3xl border border-white/20 max-w-xl mx-auto w-full">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-earth-800 pb-3 flex items-center gap-2">
              <UploadCloud className="h-4.5 w-4.5 text-farm-600" />
              Index Handbook to Vector DB (RAG)
            </h3>

            {uploadSuccess && (
              <div className="mb-5 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/40 flex items-start gap-2.5 text-xs font-semibold animate-fade-in">
                <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleFileUpload} className="flex flex-col gap-4 text-xs font-semibold">
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Document Title</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Rice Blast Control manual"
                  className="px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium focus:ring-2 focus:ring-farm-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Source (Manual/Author)</label>
                <input
                  type="text"
                  required
                  value={docSource}
                  onChange={(e) => setDocSource(e.target.value)}
                  placeholder="e.g. Ministry of Agriculture"
                  className="px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium focus:ring-2 focus:ring-farm-500"
                />
              </div>

              <div className="flex flex-col gap-1 mt-2">
                <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Select Manual Document (TXT/MD)</label>
                <input
                  type="file"
                  id="file-upload-input"
                  required
                  accept=".txt,.md"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={uploadLoading || !selectedFile}
                className="w-full mt-4 bg-farm-600 hover:bg-farm-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {uploadLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing & Embedding Chunks...</span>
                  </>
                ) : (
                  <>
                    <Database className="h-4.5 w-4.5" />
                    Upsert Vectors
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Government schemes creator */}
        {activeTab === 'scheme' && (
          <div className="glass p-6 rounded-3xl border border-white/20 max-w-2xl mx-auto w-full">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-earth-800 pb-3 flex items-center gap-2">
              <PlusCircle className="h-4.5 w-4.5 text-farm-600" />
              Publish Government Scheme
            </h3>

            {schemeSuccess && (
              <div className="mb-5 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/40 flex items-start gap-2.5 text-xs font-semibold animate-fade-in">
                <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{schemeSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateScheme} className="flex flex-col gap-4 text-xs font-semibold">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Title */}
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Scheme Title</label>
                  <input
                    type="text"
                    required
                    value={schemeTitle}
                    onChange={(e) => setSchemeTitle(e.target.value)}
                    placeholder="e.g. PM Fasal Bima Yojana"
                    className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium"
                  />
                </div>

                {/* State */}
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Region State Limit</label>
                  <input
                    type="text"
                    required
                    value={schemeState}
                    onChange={(e) => setSchemeState(e.target.value)}
                    placeholder="All or specific State name"
                    className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium"
                  />
                </div>

                {/* Min Land size */}
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Min Acreage Limit (Acres)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    value={schemeMinLand}
                    onChange={(e) => setSchemeMinLand(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium"
                  />
                </div>

                {/* Max Land size */}
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Max Acreage Limit (Acres)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    value={schemeMaxLand}
                    onChange={(e) => setSchemeMaxLand(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium"
                  />
                </div>

                {/* Caste Category */}
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Social Category Category</label>
                  <select
                    value={schemeCategory}
                    onChange={(e) => setSchemeCategory(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium"
                  >
                    <option value="All">All</option>
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>

                {/* Crops */}
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Target Crops (comma separated)</label>
                  <input
                    type="text"
                    value={schemeCrops}
                    onChange={(e) => setSchemeCrops(e.target.value)}
                    placeholder="e.g. Wheat, Rice, All"
                    className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium"
                  />
                </div>

              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Description</label>
                <textarea
                  required
                  rows="2"
                  value={schemeDesc}
                  onChange={(e) => setSchemeDesc(e.target.value)}
                  placeholder="Provide scheme outline summary..."
                  className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium"
                ></textarea>
              </div>

              {/* Benefits */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Subsidy Benefits description</label>
                <textarea
                  required
                  rows="2"
                  value={schemeBenefits}
                  onChange={(e) => setSchemeBenefits(e.target.value)}
                  placeholder="e.g. Direct cash transfer of 6000 Rs or 50% mechanization subsidy..."
                  className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium"
                ></textarea>
              </div>

              {/* Required Documents */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Required Certificates (comma separated)</label>
                <input
                  type="text"
                  required
                  value={schemeDocs}
                  onChange={(e) => setSchemeDocs(e.target.value)}
                  placeholder="e.g. Aadhaar Card, Land Records, Bank Passbook"
                  className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium"
                />
              </div>

              {/* Application Process */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Step-by-Step Application Process</label>
                <textarea
                  required
                  rows="3"
                  value={schemeProcess}
                  onChange={(e) => setSchemeProcess(e.target.value)}
                  placeholder="Define registration instructions..."
                  className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Official Link */}
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Official Portal URL link</label>
                  <input
                    type="url"
                    value={schemeLink}
                    onChange={(e) => setSchemeLink(e.target.value)}
                    placeholder="https://pmkisan.gov.in"
                    className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium"
                  />
                </div>

                {/* Deadline */}
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 dark:text-gray-500 uppercase tracking-wider">Application Deadline</label>
                  <input
                    type="text"
                    value={schemeDeadline}
                    onChange={(e) => setSchemeDeadline(e.target.value)}
                    placeholder="e.g. August 15 or Open Year-Round"
                    className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 text-sm font-medium"
                  />
                </div>

              </div>

              <button
                type="submit"
                disabled={schemeLoading}
                className="w-full mt-4 bg-farm-600 hover:bg-farm-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {schemeLoading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <PlusCircle className="h-4.5 w-4.5" />
                    Publish Scheme
                  </>
                )}
              </button>

            </form>
          </div>
        )}

      </div>

    </div>
  );
};

export default AdminPanel;
