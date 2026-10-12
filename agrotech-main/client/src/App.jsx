import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Core layout layouts
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import VoiceSearch from './components/VoiceSearch.jsx';

// Pages
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CropDoctor from './pages/CropDoctor.jsx';
import TreatmentFinder from './pages/TreatmentFinder.jsx';
import SchemeFinder from './pages/SchemeFinder.jsx';
import MarketTrends from './pages/MarketTrends.jsx';
import AdminPanel from './pages/AdminPanel.jsx';

const MainLayout = ({ children }) => {
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-earth-950 transition-colors duration-300">
      
      {/* Header */}
      <Navbar 
        onOpenVoice={() => setIsVoiceOpen(true)} 
        toggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} 
      />

      {/* Frame wrapper containing Sidebar and Pages */}
      <div className="flex flex-1 relative">
        <Sidebar 
          isOpen={isMobileSidebarOpen} 
          onCloseMobile={() => setIsMobileSidebarOpen(false)} 
        />

        {/* Content Outlet page */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Voice assistant modal */}
      <VoiceSearch 
        isOpen={isVoiceOpen} 
        onClose={() => setIsVoiceOpen(false)} 
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          
          {/* Public Landings */}
          <Route path="/" element={<Home />} />
          
          {/* Authorization credentials */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Farmer and Admin Pages */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/crop-doctor"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <CropDoctor />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/treatments"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TreatmentFinder />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/schemes"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <SchemeFinder />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trends"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <MarketTrends />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <MainLayout>
                  <AdminPanel />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
