import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import IntroAnimation from './components/IntroAnimation.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <IntroAnimation>
      <App />
    </IntroAnimation>
  </React.StrictMode>,
)
