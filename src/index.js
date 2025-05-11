import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { ResultsProvider } from './context/ResultsContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ResultsProvider>
      <App />
    </ResultsProvider>
  </React.StrictMode>,
);

serviceWorkerRegistration.register();