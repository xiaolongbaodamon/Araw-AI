import React, { useState } from 'react';
import {
  Sun,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from 'lucide-react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from '../firebase';

interface AuthScreenProps {
  onSuccess: () => void;
  onOpenRules?: () => void;
  onSelectPreset?: (preset: 'student' | 'freelancer' | 'professional') => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccess,
  onOpenRules: _onOpenRules,
  onSelectPreset,
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'professional' | 'freelancer'>('professional');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Google Sign-In (Connect Gmail)
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Guest Instant Demo
  const handleGuestSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInAnonymously(auth);
      if (onSelectPreset) {
        onSelectPreset('professional');
      }
      onSuccess();
    } catch (err: any) {
      console.error('Guest Sign-In Error:', err);
      setError(err.message || 'Could not start guest session.');
    } finally {
      setLoading(false);
    }
  };

  // Email/Password Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (isForgotPassword) {
      if (!email.trim()) {
        setError('Please enter your email address.');
        return;
      }
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, email.trim());
        setSuccessMsg(`Password reset email sent to ${email}.`);
        setIsForgotPassword(false);
      } catch (err: any) {
        setError(err.message || 'Failed to send password reset email.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim() || !password) {
      setError('Please provide your email and password.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        onSuccess();
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (cred.user && name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() });
        }
        if (onSelectPreset) {
          onSelectPreset(role);
        }
        onSuccess();
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      let message = err.message || 'Authentication failed.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        message = 'Invalid email or password.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'No account found with this email.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'An account already exists with this email.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-6rem)] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-xl p-8 sm:p-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold mx-auto shadow-md shadow-amber-500/10">
            <Sun className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            {isForgotPassword
              ? 'Reset password'
              : mode === 'signin'
              ? 'Sign in to Araw'
              : 'Create your account'}
          </h1>
          <p className="text-xs text-stone-500">
            {isForgotPassword
              ? 'Enter your email to receive recovery instructions.'
              : mode === 'signin'
              ? 'Welcome back. Enter your details to continue.'
              : 'Sign up to start tracking your daily progress.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        {!isForgotPassword && (
          <div className="flex items-center p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Error / Success Feedback */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Quick Google Auth */}
        {!isForgotPassword && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 font-semibold text-xs flex items-center justify-center gap-3 transition-colors active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

            <div className="relative flex items-center justify-center">
              <div className="border-t border-stone-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-medium text-stone-400 uppercase tracking-wider shrink-0">
                or
              </span>
            </div>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Register Name */}
          {mode === 'register' && !isForgotPassword && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all shadow-2xs"
              />
            </div>
          )}

          {/* Register Role */}
          {mode === 'register' && !isForgotPassword && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">
                Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    role === 'student'
                      ? 'border-stone-900 bg-stone-900 text-white font-semibold'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('professional')}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    role === 'professional'
                      ? 'border-stone-900 bg-stone-900 text-white font-semibold'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  Professional
                </button>
                <button
                  type="button"
                  onClick={() => setRole('freelancer')}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    role === 'freelancer'
                      ? 'border-stone-900 bg-stone-900 text-white font-semibold'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  Freelancer
                </button>
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all shadow-2xs"
            />
          </div>

          {/* Password Input */}
          {!isForgotPassword && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError(null);
                    }}
                    className="text-[11px] text-stone-500 hover:text-stone-900 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Confirm Password (Register only) */}
          {mode === 'register' && !isForgotPassword && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all shadow-2xs"
              />
            </div>
          )}

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                <span>Please wait...</span>
              </>
            ) : isForgotPassword ? (
              <span>Send reset link</span>
            ) : mode === 'signin' ? (
              <span>Sign in</span>
            ) : (
              <span>Create account</span>
            )}
          </button>

          {/* Return from forgot password */}
          {isForgotPassword && (
            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="w-full text-center text-xs text-stone-500 hover:text-stone-800 font-medium py-1 cursor-pointer"
            >
              Back to sign in
            </button>
          )}
        </form>

        {/* Guest Shortcut */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-center text-xs text-stone-500">
          <button
            type="button"
            onClick={handleGuestSignIn}
            disabled={loading}
            className="hover:text-stone-900 font-medium transition-colors cursor-pointer"
          >
            Continue as Guest
          </button>
        </div>

      </div>
    </div>
  );
};
