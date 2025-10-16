import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
//import './index.css'
import App from './App.jsx'
import { MeetingProvider } from '../../client/src/context/MeetingContext.jsx'

createRoot(document.getElementById('root')).render(
  <MeetingProvider>
    <App />
  </MeetingProvider>,
)
