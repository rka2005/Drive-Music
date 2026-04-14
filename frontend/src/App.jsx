import React from 'react';
import Home from './components/Home';
import SignInPage from './components/SignInPage';
import Footer from './components/Footer';
import './App.css';

const AUTH_STORAGE_KEY = 'drive-playlist-auth';

export default function App() {
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
    const nextAuthState = { isSignedIn: false, userProfile: null };

    setAuthState(nextAuthState);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <div className="app-shell">
      {isSignedIn ? (
        <Home onSignOut={handleSignOut} userProfile={userProfile} />
      ) : (
        <SignInPage onSignIn={handleSignIn} />
      )}
      <Footer />
    </div>
  );
}