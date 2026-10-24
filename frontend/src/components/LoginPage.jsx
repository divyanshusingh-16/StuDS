import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { loginStudent, getCurrentUser } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Success message passed from registration page if redirected
  const registeredNotice = location.state?.registered ? location.state?.message || 'Account created successfully! Please sign in with your credentials.' : null;
  const redirectTarget = location.state?.from?.pathname || '/';

  // If already logged in, redirect away from login page
  useEffect(() => {
    getCurrentUser()
      .then(data => {
        if (data?.user) {
          if (onLoginSuccess) onLoginSuccess(data.user);
          navigate(redirectTarget, { replace: true });
        }
      })
      .catch(() => {});
  }, [navigate, redirectTarget, onLoginSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedId = identifier.trim();
    if (!trimmedId) {
      setErrorMessage('Please enter your college UID or email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await loginStudent(trimmedId, password);
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      const msg = err.message || 'Login failed';
      if (msg.includes('429') || msg.toLowerCase().includes('too many')) {
        setErrorMessage('Too many sign-in attempts. Please wait a few minutes before trying again.');
      } else if (msg.includes('Failed to fetch') || msg.toLowerCase().includes('network')) {
        setErrorMessage('Cannot reach the server. Please check your internet connection.');
      } else {
        setErrorMessage('Invalid username/UID or password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8f8f7] dark:bg-[#0f1013] text-neutral-900 dark:text-neutral-100 flex flex-col justify-center items-center px-4 py-12 transition-colors duration-150">
      <div className="w-full max-w-[420px] bg-white dark:bg-[#14161a] border border-neutral-200 dark:border-[#222428] rounded-2xl p-7 sm:p-9 shadow-sm">
        
        {/* Branding & Logo */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center mb-3">
            <img src="/logo.svg" alt="StuDS Logo" className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            StuDS
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs leading-relaxed">
            Your study materials, notes, and learning resources—all in one place.
          </p>
        </div>

        {/* Registered Success Banner */}
        {registeredNotice && !errorMessage && (
          <div className="mb-5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>{registeredNotice}</span>
          </div>
        )}

        {/* Error State */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5" htmlFor="login-identifier">
              College UID or Email
            </label>
            <input
              id="login-identifier"
              type="text"
              autoComplete="username"
              required
              placeholder="e.g. 22BCS10142 or student@college.edu"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-neutral-300 dark:border-[#2a2d34] bg-white dark:bg-[#181a1f] text-neutral-900 dark:text-white text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-colors shadow-2xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300" htmlFor="login-password">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-neutral-300 dark:border-[#2a2d34] bg-white dark:bg-[#181a1f] text-neutral-900 dark:text-white text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-colors shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-2xs disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Signing in…</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Link to Registration */}
        <div className="mt-6 pt-5 border-t border-neutral-100 dark:border-[#20232a] text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            New to StuDS?{' '}
            <Link
              to="/register"
              state={{ from: location.state?.from }}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
