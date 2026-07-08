import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AVATAR_PRESETS = [
  { url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix', name: 'Felix' },
  { url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka', name: 'Aneka' },
  { url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack', name: 'Jack' },
  { url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sophie', name: 'Sophie' },
  { url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Nala', name: 'Nala' },
];

const COLOR_PRESETS = [
  { color: 'bg-violet-600', name: 'Purple' },
  { color: 'bg-emerald-600', name: 'Green' },
  { color: 'bg-rose-500', name: 'Red' },
  { color: 'bg-amber-500', name: 'Amber' },
  { color: 'bg-blue-600', name: 'Blue' }
];

// Lightweight JWT payload decoder
const decodeJwtPayload = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode Google credential token:', error);
    return null;
  }
};

export default function GoogleSignInMock() {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  
  // Custom Profile Picture Choices
  const [selectedAvatarType, setSelectedAvatarType] = useState('preset'); // 'preset', 'color', 'url'
  const [selectedPresetUrl, setSelectedPresetUrl] = useState(AVATAR_PRESETS[0].url);
  const [selectedPresetColor, setSelectedPresetColor] = useState(COLOR_PRESETS[0].color);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Real Google Sign-in config state
  const [clientId, setClientId] = useState(null);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const [isGsiLoading, setIsGsiLoading] = useState(false);
  const [preferSimulator, setPreferSimulator] = useState(false);

  // Fetch Public Config (Google Client ID)
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get('/api/config');
        if (response.data && response.data.googleClientId) {
          setClientId(response.data.googleClientId);
        }
      } catch (err) {
        console.warn('Failed to load Google Client ID config:', err.message);
      }
    };
    fetchConfig();
  }, []);

  // Dynamically load Google Identity Services client script
  useEffect(() => {
    if (!clientId) return;

    if (window.google?.accounts?.id) {
      setIsGsiLoaded(true);
      return;
    }

    setIsGsiLoading(true);
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsGsiLoaded(true);
      setIsGsiLoading(false);
    };
    script.onerror = () => {
      console.error('Failed to load Google Identity Services script.');
      setIsGsiLoading(false);
    };
    document.body.appendChild(script);
  }, [clientId]);

  // Fetch mock / DB accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        let apiAccounts = [];
        try {
          const response = await axios.get('/api/google-accounts');
          if (response.data) {
            apiAccounts = response.data;
          }
        } catch (err) {
          console.warn('Failed to load local Google accounts from API:', err.message);
        }

        // Get local storage simulated browser accounts
        let localAccounts = [];
        try {
          const stored = localStorage.getItem('google_browser_accounts');
          if (stored) {
            localAccounts = JSON.parse(stored);
          }
        } catch (err) {
          console.error('Failed to parse google_browser_accounts:', err);
        }

        // Merge accounts unique by email
        const mergedMap = new Map();

        // 1. API accounts
        apiAccounts.forEach(acc => {
          mergedMap.set(acc.email.toLowerCase(), {
            name: acc.name,
            email: acc.email,
            avatar: acc.avatar || null,
            avatarColor: acc.avatarColor || 'bg-violet-600',
            initial: acc.name ? acc.name.charAt(0).toUpperCase() : 'U'
          });
        });

        // 2. Local accounts
        localAccounts.forEach(acc => {
          mergedMap.set(acc.email.toLowerCase(), {
            name: acc.name,
            email: acc.email,
            avatar: acc.avatar || null,
            avatarColor: acc.avatarColor || 'bg-indigo-600',
            initial: acc.name ? acc.name.charAt(0).toUpperCase() : 'U'
          });
        });

        setAccounts(Array.from(mergedMap.values()));
      } catch (err) {
        console.error('Error fetching/merging accounts:', err);
        setAccounts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccounts();
  }, [showCustomInput]);

  // Initialize and Render Real Google Button
  useEffect(() => {
    if (!isGsiLoaded || !clientId || preferSimulator || showCustomInput) return;

    // Small delay to ensure the DOM element exists
    const timer = setTimeout(() => {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            const decoded = decodeJwtPayload(response.credential);
            if (decoded) {
              handleSelectAccount({
                name: decoded.name,
                email: decoded.email,
                avatar: decoded.picture
              });
            } else {
              setError('Failed to extract profile information from Google Sign-In.');
            }
          },
          auto_select: false,
          // Disable One Tap since we're in a popup - it won't work there
          cancel_on_tap_outside: false,
        });

        const btnContainer = document.getElementById('google-real-signin-btn');
        if (btnContainer) {
          btnContainer.innerHTML = ''; // Clear any previous button
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            width: 300,
            shape: 'pill',
            text: 'signin_with',
          });
        }
        // Note: Do NOT call prompt() in a popup - it causes conflicts
      } catch (err) {
        console.error('Error initializing Google Identity Services:', err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isGsiLoaded, clientId, preferSimulator, showCustomInput]);

  const handleSelectAccount = (acc) => {
    if (window.opener) {
      window.opener.postMessage(
        {
          type: 'GOOGLE_SIGNIN_SUCCESS',
          email: acc.email,
          name: acc.name,
          avatar: acc.avatar || null,
        },
        window.location.origin
      );
      window.close();
    } else {
      alert(`Successfully signed in with: ${acc.email}. You can close this window.`);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!customEmail.trim() || !customEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!customName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    let avatar = null;
    let avatarColor = 'bg-violet-600';
    if (selectedAvatarType === 'preset') {
      avatar = selectedPresetUrl;
    } else if (selectedAvatarType === 'url') {
      if (!customAvatarUrl.trim()) {
        setError('Please enter a valid image URL.');
        return;
      }
      avatar = customAvatarUrl.trim();
    } else {
      avatarColor = selectedPresetColor;
    }

    const newAccount = {
      name: customName.trim(),
      email: customEmail.trim(),
      avatar: avatar,
      avatarColor: avatarColor,
      initial: customName.trim().charAt(0).toUpperCase()
    };

    // Save to local storage google_browser_accounts
    try {
      const stored = localStorage.getItem('google_browser_accounts');
      const currentLocals = stored ? JSON.parse(stored) : [];
      const filtered = currentLocals.filter(acc => acc.email.toLowerCase() !== newAccount.email.toLowerCase());
      filtered.push(newAccount);
      localStorage.setItem('google_browser_accounts', JSON.stringify(filtered));
    } catch (err) {
      console.error('Failed to save browser account to storage:', err);
    }

    handleSelectAccount(newAccount);
  };

  const hasRealGoogle = clientId && isGsiLoaded && !preferSimulator;

  return (
    <div className="min-h-screen bg-[#f0f4f9] flex items-center justify-center p-4 font-sans text-gray-800">
      <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100 p-8 sm:p-10 flex flex-col items-center">
        
        {/* Google Logo */}
        <div className="flex items-center gap-0.5 mb-5 text-2xl font-bold font-display select-none">
          <span className="text-[#4285F4]">G</span>
          <span className="text-[#EA4335]">o</span>
          <span className="text-[#FBBC05]">o</span>
          <span className="text-[#4285F4]">g</span>
          <span className="text-[#34A853]">l</span>
          <span className="text-[#EA4335]">e</span>
        </div>

        {/* Headers */}
        <h2 className="text-xl font-medium tracking-tight text-[#1f1f1f] text-center">
          Sign in with Google
        </h2>
        <p className="text-sm text-[#5f6368] mt-1.5 mb-6 text-center">
          Choose an account to continue to <span className="font-semibold text-violet-600">Notegen.ai</span>
        </p>

        {error && (
          <div className="w-full mb-4 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-xs font-semibold text-rose-600 text-left">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="w-full py-12 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 rounded-full border-4 border-gray-100 border-t-[#4285F4] animate-spin" />
            <p className="text-xs text-gray-500 font-semibold tracking-wider animate-pulse">Reading browser accounts...</p>
          </div>
        ) : clientId && !preferSimulator && !showCustomInput ? (
          /* Real Google Identity Services Selector */
          <div className="w-full flex flex-col items-center justify-center py-8 gap-5">
            {isGsiLoading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="h-7 w-7 rounded-full border-4 border-gray-100 border-t-[#4285F4] animate-spin" />
                <p className="text-xs text-gray-400 font-medium">Loading Google Sign-In...</p>
              </div>
            ) : (
              <>
                <div id="google-real-signin-btn" className="min-h-[44px] flex items-center justify-center"></div>
                <p className="text-[11px] text-gray-400 font-medium text-center">
                  Click the button above to choose your Google account.
                </p>
              </>
            )}

            <button
              onClick={() => setPreferSimulator(true)}
              className="text-xs font-semibold text-violet-500 hover:text-violet-700 transition-colors bg-violet-50 hover:bg-violet-100 px-4 py-2 rounded-xl cursor-pointer"
            >
              Use Development Simulator instead
            </button>
          </div>
        ) : !showCustomInput ? (
          /* Simulator Account Chooser */
          <div className="w-full space-y-2">
            <div className="max-h-[250px] overflow-y-auto pr-1 space-y-2">
              {accounts.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center font-medium">
                  No accounts found. Use the form below to connect your email!
                </p>
              ) : (
                accounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => handleSelectAccount(acc)}
                    className="w-full p-3.5 rounded-xl border border-gray-100 hover:bg-[#f8fafd] hover:border-gray-200 transition-all flex items-center gap-3.5 text-left group cursor-pointer focus:outline-hidden focus:border-[#4285F4]/60"
                  >
                    {acc.avatar ? (
                      <img
                        src={acc.avatar}
                        alt={acc.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-xs"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${acc.name}`;
                        }}
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full ${acc.avatarColor || 'bg-violet-600'} text-white flex items-center justify-center font-bold text-sm shadow-xs`}>
                        {acc.initial || (acc.name ? acc.name.charAt(0).toUpperCase() : 'G')}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1f1f1f] truncate group-hover:text-[#4285F4] transition-colors">
                        {acc.name}
                      </p>
                      <p className="text-xs text-[#5f6368] truncate">{acc.email}</p>
                    </div>
                  </button>
                ))
              )}

              {/* Use Another Account Button */}
              <button
                onClick={() => {
                  setShowCustomInput(true);
                  setError('');
                }}
                className="w-full p-3.5 rounded-xl border border-dashed border-gray-200 hover:border-[#4285F4] hover:bg-[#f8fafd] transition-all flex items-center gap-3.5 text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 text-lg">
                  +
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Use another account</p>
                  <p className="text-[10px] text-gray-400">Sign in with a different email</p>
                </div>
              </button>
            </div>

            {clientId && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => setPreferSimulator(false)}
                  className="text-xs font-semibold text-gray-500 hover:text-[#4285F4] transition-colors"
                >
                  ← Switch back to Real Google Login
                </button>
              </div>
            )}

            {!clientId && (
              <div className="w-full mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-xs text-amber-800 leading-normal flex flex-col gap-1 text-left">
                <div className="font-bold flex items-center gap-1">
                  <span>💡</span> Tip for Developers
                </div>
                <p>To sign in with your <strong>real browser Google accounts</strong> (fetching your actual profile picture, name, and email), add your Google Client ID to the backend's <code>.env</code> file:</p>
                <code className="bg-amber-100/50 p-1 px-1.5 rounded-sm block mt-1 font-mono text-[10px] text-amber-950 select-all">GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com</code>
              </div>
            )}
          </div>
        ) : (
          /* Custom Email Entry Form */
          <form onSubmit={handleCustomSubmit} className="w-full space-y-4 text-left max-h-[420px] overflow-y-auto pr-1">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-hidden focus:border-[#4285F4] focus:bg-white transition-all text-sm font-semibold"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                Google Email Address
              </label>
              <input
                type="email"
                placeholder="your.google.account@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 outline-hidden focus:border-[#4285F4] focus:bg-white transition-all text-sm font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">
                Profile Picture Option
              </label>
              
              {/* Tabs for Picture Type */}
              <div className="flex border-b border-gray-100 mb-3 text-xs font-semibold text-gray-400">
                <button
                  type="button"
                  onClick={() => setSelectedAvatarType('preset')}
                  className={`flex-1 pb-2 border-b-2 transition-colors cursor-pointer ${selectedAvatarType === 'preset' ? 'border-[#4285F4] text-[#4285F4]' : 'border-transparent hover:text-gray-600'}`}
                >
                  Cartoon Avatars
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAvatarType('color')}
                  className={`flex-1 pb-2 border-b-2 transition-colors cursor-pointer ${selectedAvatarType === 'color' ? 'border-[#4285F4] text-[#4285F4]' : 'border-transparent hover:text-gray-600'}`}
                >
                  Initials & Colors
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAvatarType('url')}
                  className={`flex-1 pb-2 border-b-2 transition-colors cursor-pointer ${selectedAvatarType === 'url' ? 'border-[#4285F4] text-[#4285F4]' : 'border-transparent hover:text-gray-600'}`}
                >
                  Custom URL
                </button>
              </div>

              {/* Cartoon Avatars Preset Grid */}
              {selectedAvatarType === 'preset' && (
                <div className="grid grid-cols-5 gap-2 py-1">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setSelectedPresetUrl(preset.url)}
                      className={`relative rounded-xl overflow-hidden p-1 border-2 transition-all cursor-pointer hover:bg-gray-50 ${selectedPresetUrl === preset.url ? 'border-[#4285F4] scale-105 bg-blue-50/20' : 'border-gray-100'}`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-10 h-10 object-cover mx-auto" />
                    </button>
                  ))}
                </div>
              )}

              {/* Color Presets Grid */}
              {selectedAvatarType === 'color' && (
                <div className="grid grid-cols-5 gap-2 py-1">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => setSelectedPresetColor(preset.color)}
                      className={`relative h-11 rounded-xl flex items-center justify-center border-2 transition-all cursor-pointer ${selectedPresetColor === preset.color ? 'border-[#4285F4] scale-105' : 'border-transparent'}`}
                    >
                      <span className={`w-8 h-8 rounded-full ${preset.color} text-white flex items-center justify-center font-bold text-xs`}>
                        {customName ? customName.charAt(0).toUpperCase() : 'G'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Custom URL Input */}
              {selectedAvatarType === 'url' && (
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or any image link"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-50/50 outline-hidden focus:border-[#4285F4] focus:bg-white transition-all text-xs font-medium"
                />
              )}
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  setError('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 text-center cursor-pointer transition-colors"
              >
                Back to List
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#4285F4] hover:bg-[#357ae8] text-xs font-bold text-white text-center cursor-pointer transition-colors shadow-md shadow-blue-500/10"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-400 leading-normal max-w-[320px] mx-auto">
            To continue, Google will share your name, email address, language preference, and profile picture with Notegen.ai.
          </p>
        </div>

      </div>
    </div>
  );
}

