// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './globals.css'

// Optional: guard to log render errors without crashing silently
function Root() {
  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

const rootEl = document.getElementById('root')

// Create root once; handle missing #root gracefully
if (!rootEl) {
  // If index.html doesn't have <div id="root"></div>
  const fallback = document.createElement('div')
  fallback.id = 'root'
  document.body.appendChild(fallback)
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />)