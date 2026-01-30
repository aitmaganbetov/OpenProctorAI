import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Simple app placeholder
function App() {
  return (
    <div className="w-full h-screen bg-gray-900 text-white flex items-center justify-center">
      <h1 className="text-4xl font-bold">University Proctoring AI</h1>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
