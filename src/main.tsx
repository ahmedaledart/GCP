import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

const resetAppStorage = () => {
  try {
    const prefixes = ['sb-', 'supabase', 'APP_', 'GCP_', 'auth', 'platform', 'admin', 'user'];
    
    // Clear matching localStorage keys
    const lsKeysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && prefixes.some(p => key.startsWith(p) || key.includes('APP_VERSION'))) {
        lsKeysToRemove.push(key);
      }
    }
    lsKeysToRemove.forEach(key => localStorage.removeItem(key));

    // Clear matching sessionStorage keys
    const ssKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && prefixes.some(p => key.startsWith(p))) {
        ssKeysToRemove.push(key);
      }
    }
    ssKeysToRemove.forEach(key => sessionStorage.removeItem(key));
  } catch (e) {
    console.warn("Error during storage reset", e);
  }
};

// Expose globally for the error boundary or manual debugging
(window as any).resetAppStorage = resetAppStorage;

if (new URLSearchParams(window.location.search).has('reset')) {
  resetAppStorage();
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.delete('reset');
  const newSearch = searchParams.toString();
  const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
  window.location.replace(newUrl || '/GCP/#/');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
