import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// In production, all API calls go to the deployed backend URL.
// In development, Vite proxy handles /api → localhost:5000.
const API_URL = import.meta.env.VITE_API_URL || 'https://notegen-ai-production.up.railway.app';
if (API_URL) {
  axios.defaults.baseURL = API_URL;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
