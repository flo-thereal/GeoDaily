import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {HashRouter} from 'react-router-dom';
import App from './App.tsx';
import { FirstVisitRedirect } from './components/FirstVisitRedirect';
import { applyTheme, getGamePreferences } from './lib/preferences';
import 'leaflet/dist/leaflet.css';
import './index.css';

applyTheme(getGamePreferences().theme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <FirstVisitRedirect>
        <App />
      </FirstVisitRedirect>
    </HashRouter>
  </StrictMode>,
);
