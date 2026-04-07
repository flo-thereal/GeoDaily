import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Globe, Loader2 } from 'lucide-react';
import { login, register } from '../services/api';

type AuthMode = 'login' | 'register';

export function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!displayName.trim()) {
          setError('Display name is required');
          setIsLoading(false);
          return;
        }
        await register(email, password, displayName);
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
  };

  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden min-h-screen flex flex-col items-center justify-center relative p-6">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary-fixed-dim opacity-20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-primary-fixed opacity-30 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Header */}
      <nav className="fixed top-0 left-0 w-full z-50 px-8 py-6 flex justify-between items-center bg-surface/30 backdrop-blur-xl">
        <Link to="/welcome" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-headline font-black text-xl">G</div>
          <span className="font-headline font-extrabold text-xl tracking-tight text-on-surface">GeoDaily</span>
        </Link>
      </nav>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-surface-container-lowest rounded-2xl shadow-2xl shadow-primary/10 p-8 md:p-10 space-y-8">
          {/* Logo & Title */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mx-auto">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="font-headline text-3xl font-extrabold text-on-surface">
                {mode === 'login' ? 'Welcome Back' : 'Join the Expedition'}
              </h1>
              <p className="text-on-surface-variant mt-2">
                {mode === 'login' 
                  ? 'Continue your global discovery journey' 
                  : 'Start mastering the world in 5 minutes a day'}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display Name (Register only) */}
            {mode === 'register' && (
              <div className="space-y-2">
                <label className="font-label text-xs font-bold text-on-surface-variant px-1">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Explorer Name"
                    className="w-full bg-surface-container-low border-none rounded-xl pl-12 pr-4 py-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/30 transition-all outline-none"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="font-label text-xs font-bold text-on-surface-variant px-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="explorer@geodaily.com"
                  className="w-full bg-surface-container-low border-none rounded-xl pl-12 pr-4 py-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/30 transition-all outline-none"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="font-label text-xs font-bold text-on-surface-variant px-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-low border-none rounded-xl pl-12 pr-4 py-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/30 transition-all outline-none"
                  required
                  disabled={isLoading}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-br from-primary to-primary-dim text-on-primary px-8 py-4 rounded-full font-headline font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-outline-variant/30"></div>
            <span className="text-xs text-outline font-medium uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-outline-variant/30"></div>
          </div>

          {/* Continue as Guest (Dev Mode) */}
          <Link
            to="/"
            className="w-full bg-surface-container-high text-on-surface px-8 py-4 rounded-full font-headline font-bold flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-lg">explore</span>
            Continue as Guest
          </Link>

          {/* Toggle Mode */}
          <p className="text-center text-sm text-on-surface-variant">
            {mode === 'login' ? (
              <>
                New to GeoDaily?{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-primary font-bold hover:underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-primary font-bold hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-outline mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      {/* Floating Decorative Orb */}
      <div className="absolute bottom-10 right-10 w-20 h-20 bg-tertiary-container/20 rounded-full backdrop-blur-xl border border-tertiary/10 flex items-center justify-center shadow-2xl hidden md:flex">
        <span className="material-symbols-outlined text-tertiary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
      </div>
    </div>
  );
}
