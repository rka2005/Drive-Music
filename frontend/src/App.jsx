import React from 'react';
import Home from './components/Home';
import Loader from './components/Loader';
import SignInPage from './components/SignInPage';
import Footer from './components/Footer';
import './App.css';

const AUTH_STORAGE_KEY = 'drive-playlist-auth';

export default function App() {
  const [isPageLoading, setIsPageLoading] = React.useState(() => document.readyState !== 'complete');
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

  const handleSignIn = (profile) => {
    const nextAuthState = {
      isSignedIn: true,
      userProfile: profile ?? null,
    };

    setAuthState(nextAuthState);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuthState));
  };

  const handleSignOut = () => {
    window.google?.accounts?.id?.disableAutoSelect?.();
    const nextAuthState = { isSignedIn: false, userProfile: null };

    setAuthState(nextAuthState);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <div className="app-shell">
      {isPageLoading ? (
        <div className="app-loading-overlay" aria-hidden="true">
          <Loader
            message="Loading Drive Music"
            submessage="Preparing the listening room and syncing the interface..."
          />
        </div>
      ) : null}
      {isSignedIn ? (
        <Home onSignOut={handleSignOut} userProfile={userProfile} />
      ) : (
        <SignInPage onSignIn={handleSignIn} />
      )}
      <Footer />
    </div>
  );
}