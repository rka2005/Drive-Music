import React from 'react';
import Home from './components/Home';
import Loader from './components/Loader';
import SignInPage from './components/SignInPage';
import Footer from './components/Footer';
import './App.css';

const AUTH_STORAGE_KEY = 'drive-playlist-auth';

export default function App() {
  const [isPageLoading, setIsPageLoading] = React.useState(() => document.readyState !== 'complete');
  const [backendSupportsAuth, setBackendSupportsAuth] = React.useState(null);
  const [authState, setAuthState] = React.useState(() => {
    try {
      const storedAuth = window.localStorage.getItem(AUTH_STORAGE_KEY);

      if (!storedAuth) {
        return { isSignedIn: false, userProfile: null };
      }

      const parsedAuth = JSON.parse(storedAuth);

      return {
        isSignedIn: Boolean(parsedAuth?.isSignedIn),
        userProfile: parsedAuth?.userProfile ?? null,
      };
    } catch {
      return { isSignedIn: false, userProfile: null };
    }
  });

  React.useEffect(() => {
    const markLoaded = () => setIsPageLoading(false);

    if (document.readyState === 'complete') {
      markLoaded();
      return undefined;
    }

    window.addEventListener('load', markLoaded, { once: true });

    return () => {
      window.removeEventListener('load', markLoaded);
    };
  }, []);

  const { isSignedIn, userProfile } = authState;

  React.useEffect(() => {
    const probeBackend = async () => {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      try {
        const response = await fetch(`${backendUrl}/`);
        const data = await response.json();
        setBackendSupportsAuth(Boolean(data?.endpoints?.auth));
      } catch {
        setBackendSupportsAuth(false);
      }
    };

    probeBackend();
  }, []);

  const persistGoogleSession = React.useCallback((profile) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    if (!profile?.credential) {
      return;
    }

    if (backendSupportsAuth !== true) {
      return;
    }

    void fetch(`${backendUrl}/api/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${profile.credential}`,
      },
      body: JSON.stringify({ credential: profile.credential }),
    }).catch((error) => {
      console.error('Failed to persist Google session:', error);
    });
  }, [backendSupportsAuth]);

  const [theme, setTheme] = React.useState(() => {
    try {
      return window.localStorage.getItem('drive-music-theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem('drive-music-theme', theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  const toggleTheme = React.useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleSignIn = (profile) => {
    const nextAuthState = {
      isSignedIn: true,
      userProfile: profile ?? null,
    };

    setAuthState(nextAuthState);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuthState));
    persistGoogleSession(profile);
  };

  const handleSignOut = () => {
    window.google?.accounts?.id?.disableAutoSelect?.();
    const nextAuthState = { isSignedIn: false, userProfile: null };

    setAuthState(nextAuthState);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <div className={`app-shell theme-${theme}`}>
      {isPageLoading ? (
        <div className="app-loading-overlay" aria-hidden="true">
          <Loader
            message="Loading Drive Music"
            submessage="Preparing the listening room and syncing the interface..."
          />
        </div>
      ) : null}
      {isSignedIn ? (
        <Home
          onSignOut={handleSignOut}
          userProfile={userProfile}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : (
        <SignInPage
          onSignIn={handleSignIn}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
      <Footer />
    </div>
  );
}