import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { Mail, Lock, LogIn, Sprout, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const { login, loginWithOAuthSession, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    // Check if redirected from Google OAuth with token and user in URL
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    const userParam = params.get('user');
    const errParam = params.get('error');

    if (errParam) {
      setErrorMsg('Google Authentication failed. Please try again or log in with credentials.');
    }

    if (tokenParam && userParam) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userParam));
        loginWithOAuthSession(tokenParam, parsedUser);
        navigate('/dashboard', { replace: true });
        return;
      } catch (err) {
        console.error('OAuth state sync failed:', err);
      }
    }

    if (user) {
      navigate('/dashboard');
    }
    
    // Check if redirected due to expired token
    if (params.get('expired') === 'true') {
      setSessionExpired(true);
    }
  }, [user, navigate, location, loginWithOAuthSession]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSessionExpired(false);

    try {
      await login(email, password);
      // Retrieve redirect route or default to dashboard
      const origin = location.state?.from?.pathname || '/dashboard';
      navigate(origin, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-[calc(100vh-73px)] w-full flex items-center justify-center p-4 bg-grid-pattern dark:bg-earth-950">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="glass w-full max-w-md p-8 rounded-3xl shadow-xl border border-white/20"
      >
        {/* Branding header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="bg-farm-600 text-white p-3 rounded-2xl shadow-md mb-3">
            <Sprout className="h-6 w-6 hover-wiggle" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Welcome Back</h2>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Access your AgroTech dashboard & crop helper</p>
        </div>

        {/* Error Banners */}
        {sessionExpired && (
          <div className="mb-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 flex items-start gap-2 text-xs font-semibold">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>Your session has expired. Please log in again to continue.</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 flex items-start gap-2 text-xs font-semibold">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google Authentication Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
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
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-earth-800"></div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">or sign in with email</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-earth-800"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Email */}
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
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 focus:outline-none focus:ring-2 focus:ring-farm-500 transition-all duration-200 text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-earth-800 bg-white dark:bg-earth-900 focus:outline-none focus:ring-2 focus:ring-farm-500 transition-all duration-200 text-sm"
              />
            </div>
          </div>

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
                <LogIn className="h-5 w-5" />
                Sign In
              </>
            )}
          </button>
        </form>


        {/* Demo Credentials Tip */}
        <div className="mt-6 p-3.5 rounded-xl bg-gray-50 dark:bg-earth-900 border border-gray-150 dark:border-earth-800 text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
          <span className="font-bold text-gray-600 dark:text-gray-300 block mb-1">Demo Accounts available:</span>
          • Farmer: <span className="font-semibold text-farm-600 dark:text-farm-400">farmer@agrotech.com</span> / <span className="font-semibold text-farm-600 dark:text-farm-400">farmer123</span> <br />
          • Admin: <span className="font-semibold text-farm-600 dark:text-farm-400">admin@agrotech.com</span> / <span className="font-semibold text-farm-600 dark:text-farm-400">admin123</span>
        </div>

        {/* Redirect block */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-earth-900 text-center text-sm text-gray-400">
          New to AgroTech?{" "}
          <Link to="/register" className="text-farm-600 hover:text-farm-700 dark:text-farm-400 dark:hover:text-farm-300 font-bold">
            Create Account
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
