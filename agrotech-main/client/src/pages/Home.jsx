import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sprout, 
  Camera, 
  BookOpen, 
  Scroll, 
  TrendingUp,
  Mic, 
  ArrowRight, 
  CheckCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';

const Home = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const features = [
    {
      title: "AI Crop Doctor",
      desc: "Upload or take photos of unhealthy plants. Our Gemini Vision model diagnoses diseases, estimates severity, and yields treatments within seconds.",
      icon: Camera,
      color: "bg-emerald-500",
      link: "/crop-doctor"
    },
    {
      title: "Scientific RAG Query",
      desc: "Semantic text searches matching vector databases indexed with authoritative agricultural handbooks. Returns verified chemical dosage and organic cures.",
      icon: BookOpen,
      color: "bg-amber-500",
      link: "/treatments"
    },
    {
      title: "Government Scheme Finder",
      desc: "Match profile acreage, state bounds, crops, and demographics against central databases to view subsidies, eligibility limits, and official applications.",
      icon: Scroll,
      color: "bg-blue-500",
      link: "/schemes"
    },
    {
      title: "Market Trend Analysis",
      desc: "Check real-time regional rates, demand indicators, weather-news alerts, risk flags, and 4-week crop price projection charts.",
      icon: TrendingUp,
      color: "bg-teal-500",
      link: "/trends"
    },
    {
      title: "Voice Assistant Doctor",
      desc: "Farmers speak queries directly. Conversational speech recognition transcribes Hindi/English dialects, generating audio readbacks.",
      icon: Mic,
      color: "bg-indigo-500",
      link: "/dashboard"
    }
  ];

  return (
    <div className="min-h-screen bg-grid-pattern dark:bg-earth-950 flex flex-col items-center">
      
      {/* Hero Section */}
      <section className="relative w-full max-w-7xl px-4 pt-16 pb-20 md:pt-24 md:pb-28 flex flex-col items-center text-center">
        
        {/* Glow Badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-1.5 bg-farm-100 dark:bg-farm-950/60 border border-farm-200 dark:border-farm-900/50 px-4 py-1.5 rounded-full text-xs font-bold text-farm-700 dark:text-farm-300 shadow-sm mb-6"
        >
          <Zap className="h-3.5 w-3.5 fill-current text-farm-600 dark:text-farm-400" />
          Powered by Gemini Vision AI & Pinecone RAG
        </motion.div>

        {/* Catchy Headline */}
        <motion.h1 
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-900 dark:text-white max-w-4xl leading-tight"
        >
          Empowering Farmers with <br />
          <span className="bg-gradient-to-r from-farm-600 to-harvest-500 bg-clip-text text-transparent">
            Smart AI Crop Doctor
          </span>{" "}
          & Schemes
        </motion.h1>

        {/* Short Subtext */}
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed"
        >
          Diagnose crop diseases instantly, query scientific manuals via vector search, identify qualified government subsidies, and analyze market price indexes.
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-10 flex flex-wrap gap-4 justify-center"
        >
          <Link
            to="/dashboard"
            className="flex items-center gap-2 bg-farm-600 hover:bg-farm-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 group"
          >
            Go to Dashboard
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
          </Link>
          <Link
            to="/crop-doctor"
            className="flex items-center gap-2 bg-white hover:bg-gray-50 dark:bg-earth-900 dark:hover:bg-earth-800 text-gray-800 dark:text-white font-bold px-8 py-4 rounded-2xl border border-gray-200 dark:border-earth-800 shadow-sm transition-all duration-300"
          >
            Diagnose Crop Disease
          </Link>
        </motion.div>
      </section>

      {/* Trust Badges */}
      <section className="w-full bg-white dark:bg-earth-950 py-10 border-y border-gray-100 dark:border-earth-900">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center">
            <CheckCircle className="h-8 w-8 text-farm-600 dark:text-farm-400 mb-2" />
            <span className="font-bold text-gray-800 dark:text-gray-200">Instant AI Diagnosis</span>
            <span className="text-xs text-gray-500 mt-1">Multi-modal Gemini Vision engine</span>
          </div>
          <div className="flex flex-col items-center border-y sm:border-y-0 sm:border-x border-gray-150 dark:border-earth-850 py-4 sm:py-0">
            <ShieldCheck className="h-8 w-8 text-harvest-600 dark:text-harvest-400 mb-2" />
            <span className="font-bold text-gray-800 dark:text-gray-200">Verified Treatments</span>
            <span className="text-xs text-gray-500 mt-1">RAG retrieval from agricultural books</span>
          </div>
          <div className="flex flex-col items-center">
            <Sprout className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-2" />
            <span className="font-bold text-gray-800 dark:text-gray-200">Subsidy Allocation</span>
            <span className="text-xs text-gray-500 mt-1">Demographics scheme matching</span>
          </div>
        </div>
      </section>

      {/* Interactive Feature Grid */}
      <section className="max-w-7xl w-full px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">What does AgroTech AI offer?</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-3">Comprehensive toolsets engineered to make farming scientific, profitable, and safe.</p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="glass glass-hover p-6 rounded-3xl flex flex-col justify-between group h-full"
              >
                <div>
                  <div className={`${feat.color} text-white p-3 rounded-2xl w-fit shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-extrabold text-xl text-gray-800 dark:text-white mt-5">
                    {feat.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
                
                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-earth-900 flex items-center justify-between">
                  <Link 
                    to={feat.link} 
                    className="text-farm-600 dark:text-farm-400 font-bold text-sm flex items-center gap-1.5 group-hover:text-farm-700 dark:group-hover:text-farm-300"
                  >
                    Open Tool
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Footer Branding */}
      <footer className="w-full bg-white dark:bg-earth-950 py-10 border-t border-gray-150 dark:border-earth-900 mt-auto flex flex-col items-center">
        <div className="flex items-center gap-2">
          <div className="bg-farm-600 text-white p-1.5 rounded-lg">
            <Sprout className="h-4 w-4" />
          </div>
          <span className="font-extrabold text-sm text-gray-800 dark:text-gray-200">AgroTech AI</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">© 2026 AgroTech AI. Built with MERN Stack and Google Gemini AI. All rights reserved.</p>
      </footer>

    </div>
  );
};

export default Home;
