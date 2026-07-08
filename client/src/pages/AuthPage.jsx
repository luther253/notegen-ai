import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMail,
  FiLock,
  FiUser,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiBookOpen,
  FiAlertCircle,
  FiCheckCircle,
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';

/* ------------------------------------------------------------------
  Shared animated background blobs
------------------------------------------------------------------ */
function BackgroundBlobs() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Top-left violet glow */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
        {/* Bottom-right indigo glow */}
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[120px]" />
        {/* Center accent pulse */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-violet-500/5 blur-[80px] animate-pulse-slow" />
      </div>

      {/* Floating grid pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(139,92,246,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.8) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------------
  Shared Brand Logo Header
------------------------------------------------------------------ */
function BrandLogo() {
  return (
    <Link to="/" className="flex flex-col items-center gap-3 mb-8 group">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform duration-300">
          <FiBookOpen className="text-white text-2xl" />
        </div>
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 opacity-0 group-hover:opacity-40 blur-md transition-opacity duration-300" />
      </div>
      <div className="text-center">
        <h1 className="font-display font-extrabold text-2xl tracking-tight text-white">
          Notegen<span className="text-violet-400">.ai</span>
        </h1>
        <p className="text-xs text-gray-500 mt-0.5 font-medium">AI Student Notes Generator</p>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------
  Alert Banner
------------------------------------------------------------------ */
function AlertBanner({ type, message }) {
  if (!message) return null;
  const styles = {
    error: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  };
  const icons = {
    error: <FiAlertCircle className="flex-shrink-0 text-sm" />,
    success: <FiCheckCircle className="flex-shrink-0 text-sm" />,
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold ${styles[type]}`}
    >
      {icons[type]}
      {message}
    </motion.div>
  );
}

/* ------------------------------------------------------------------
  Input Field Component
------------------------------------------------------------------ */
function InputField({ label, type, placeholder, value, onChange, icon: Icon, end, required }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
            <Icon className="text-sm" />
          </span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm px-4 py-3 rounded-xl outline-none focus:border-violet-500/60 focus:bg-white/[0.07] transition-all duration-200 font-medium"
          style={{ paddingLeft: Icon ? '2.5rem' : '1rem', paddingRight: end ? '3rem' : '1rem' }}
        />
        {end}
      </div>
    </div>
  );
}

/* ==================================================================
  LOGIN PANEL
================================================================== */
function LoginPanel({ onSwitch }) {
  const { login, loginAsGuest } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleClientId, setGoogleClientId] = useState(null);
  const [isGsiReady, setIsGsiReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef(null);

  // Fetch Google Client ID from backend config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data.googleClientId) {
          setGoogleClientId(data.googleClientId);
        }
      } catch (e) {
        console.warn('Could not load Google config:', e.message);
      }
    };
    loadConfig();
  }, []);

  // Load and initialize the Google Identity Services script
  useEffect(() => {
    if (!googleClientId) return;

    const initGsi = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (credentialResponse) => {
          try {
            setGoogleLoading(true);
            // Decode the JWT to get name, email, picture
            const base64 = credentialResponse.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
            await loginAsGuest(payload.email, payload.name, payload.picture);
            navigate('/dashboard');
          } catch (err) {
            setError('Google sign-in failed. Please try again.');
            setGoogleLoading(false);
          }
        },
        auto_select: false,
      });
      setIsGsiReady(true);
    };

    if (window.google?.accounts?.id) {
      initGsi();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = initGsi;
    document.body.appendChild(script);
  }, [googleClientId]);

  // Render the official Google button once GSI is ready
  useEffect(() => {
    if (!isGsiReady || !googleBtnRef.current) return;
    googleBtnRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      width: googleBtnRef.current.offsetWidth || 320,
      text: 'continue_with',
      logo_alignment: 'left',
    });
  }, [isGsiReady]);

  // Fallback: open mock popup when no real Google Client ID configured
  const handleGooglePopup = () => {
    const width = 500;
    const height = 620;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      '/google-signin-mock',
      'GoogleSignIn',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=no,resizable=no`
    );
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GOOGLE_SIGNIN_SUCCESS') {
        const { email: googleEmail, name: googleName, avatar: googleAvatar } = event.data;
        loginAsGuest(googleEmail, googleName, googleAvatar);
        window.removeEventListener('message', handleMessage);
        navigate('/dashboard');
      }
    };
    window.addEventListener('message', handleMessage);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const ok = await login(email, password);
    if (ok) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-display font-extrabold text-2xl text-white">Welcome back</h2>
        <p className="text-gray-500 text-sm mt-1">Sign in to access your study workspace</p>
      </div>

      <AlertBanner type="error" message={error} />

      <form onSubmit={handleLogin} className="space-y-4">
        <InputField
          label="Email address"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={FiMail}
          required
        />

        <InputField
          label="Password"
          type={showPass ? 'text' : 'password'}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={FiLock}
          required
          end={
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            >
              {showPass ? <FiEyeOff className="text-sm" /> : <FiEye className="text-sm" />}
            </button>
          }
        />

        <div className="flex justify-end">
          <span className="text-xs text-violet-400 hover:text-violet-300 cursor-pointer font-semibold transition-colors">
            Forgot password?
          </span>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3.5 mt-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In <FiArrowRight />
            </>
          )}
        </motion.button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Google Login */}
      {googleLoading ? (
        <div className="w-full py-3 rounded-xl border border-white/10 flex items-center justify-center gap-2 text-sm text-gray-400">
          <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          Signing in with Google...
        </div>
      ) : googleClientId && isGsiReady ? (
        /* Real Google button — rendered directly on the page, shows all browser accounts */
        <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]" />
      ) : (
        /* Fallback popup when no Client ID is configured */
        <button
          onClick={handleGooglePopup}
          className="w-full py-3 rounded-xl text-sm font-semibold text-gray-300 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <FcGoogle className="text-lg" /> Continue with Google
        </button>
      )}

      <p className="text-center text-xs text-gray-600">
        Don't have an account?{' '}
        <button
          onClick={onSwitch}
          className="text-violet-400 hover:text-violet-300 font-bold transition-colors cursor-pointer"
        >
          Create one free
        </button>
      </p>
    </div>
  );
}



/* ==================================================================
  REGISTER PANEL
================================================================== */
function RegisterPanel({ onSwitch }) {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match. Please try again.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    const ok = await register(username.trim(), email.trim(), password, university.trim(), course.trim());
    if (ok) {
      navigate('/dashboard');
    } else {
      setError('An account with this email already exists. Please sign in.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="font-display font-extrabold text-2xl text-white">Create an account</h2>
        <p className="text-gray-500 text-sm mt-1">Start generating AI notes for free today</p>
      </div>

      <AlertBanner type="error" message={error} />

      <form onSubmit={handleRegister} className="space-y-4">
        <InputField
          label="Full Name"
          type="text"
          placeholder="Alex Johnson"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          icon={FiUser}
          required
        />

        <InputField
          label="Email address"
          type="email"
          placeholder="you@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={FiMail}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="University"
            type="text"
            placeholder="MIT"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
          />
          <InputField
            label="Course / Major"
            type="text"
            placeholder="Computer Science"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
          />
        </div>

        <InputField
          label="Password"
          type={showPass ? 'text' : 'password'}
          placeholder="Min 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={FiLock}
          required
          end={
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            >
              {showPass ? <FiEyeOff className="text-sm" /> : <FiEye className="text-sm" />}
            </button>
          }
        />

        <InputField
          label="Confirm Password"
          type="password"
          placeholder="Re-enter password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          icon={FiLock}
          required
        />

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3.5 mt-1 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Free Account <FiArrowRight />
            </>
          )}
        </motion.button>
      </form>

      <p className="text-center text-xs text-gray-600">
        Already have an account?{' '}
        <button
          onClick={onSwitch}
          className="text-violet-400 hover:text-violet-300 font-bold transition-colors cursor-pointer"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}

/* ==================================================================
  MAIN EXPORT — Auth Page
================================================================== */
export default function AuthPage() {
  const [panel, setPanel] = useState('login'); // 'login' | 'register'
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const features = [
    { icon: '🤖', title: 'AI-Powered Notes', desc: 'Generate structured study guides in seconds' },
    { icon: '🃏', title: 'Smart Flashcards', desc: 'Auto-converted for active recall revision' },
    { icon: '🎯', title: 'Instant Quizzes', desc: 'Test comprehension with MCQ & short answers' },
    { icon: '📥', title: 'Export Anywhere', desc: 'Download as Markdown, TXT, or print to PDF' },
  ];

  return (
    <div className="min-h-screen bg-[#060810] flex relative overflow-hidden">
      <BackgroundBlobs />

      {/* ── LEFT PANEL (hidden on mobile) ─────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between p-12 relative">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group w-fit">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <FiBookOpen className="text-white text-base" />
          </div>
          <span className="font-display font-extrabold text-lg text-white">
            Notegen<span className="text-violet-400">.ai</span>
          </span>
        </Link>

        {/* Hero copy */}
        <div className="space-y-8 max-w-lg">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/10 text-xs font-bold text-violet-400"
            >
              <HiSparkles /> AI-Powered Study Platform
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="font-display font-extrabold text-4xl xl:text-5xl leading-tight text-white"
            >
              Study smarter,{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">
                not harder
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 text-base leading-relaxed"
            >
              Generate comprehensive AI-powered study notes, flashcards, and quizzes
              for any subject — all stored privately in your browser.
            </motion.p>
          </div>

          {/* Features grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 gap-4"
          >
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-1.5 hover:border-violet-500/20 transition-colors"
              >
                <span className="text-2xl">{f.icon}</span>
                <p className="font-bold text-sm text-white leading-tight">{f.title}</p>
                <p className="text-xs text-gray-500 leading-normal">{f.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom tagline */}
        <p className="text-xs text-gray-700 font-medium">
          Secure MongoDB Cloud Sync · No external tracking · JWT Session Protection
        </p>
      </div>

      {/* ── RIGHT PANEL — Auth card ────────────────────────── */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-12 relative">
        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80 }}
          className="w-full max-w-md bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl"
        >
          {/* Logo — mobile only */}
          <div className="lg:hidden">
            <BrandLogo />
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-8 border border-white/[0.06]">
            {['login', 'register'].map((tab) => (
              <button
                key={tab}
                onClick={() => setPanel(tab)}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg cursor-pointer transition-all capitalize ${
                  panel === tab
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Animated panel swap */}
          <AnimatePresence mode="wait">
            {panel === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
              >
                <LoginPanel onSwitch={() => setPanel('register')} />
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <RegisterPanel onSwitch={() => setPanel('login')} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
