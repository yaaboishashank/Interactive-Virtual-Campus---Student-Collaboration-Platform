import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import AppProviders from "./app/AppProviders.jsx";

import "./styles/tokens.css";
import "./styles/themes.css";
import "./styles/globals.css";


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>
)
