import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';


import LandingPage from './pages/LandingPage.jsx';
import AnalysisPage from './pages/AnalysisPage.jsx';



function LogoImage() {
  const [src, setSrc] = React.useState('/visorax logo.png');
  return (
    <img
      src={src}
      alt="VisoraX"
      width={50}
      height={50}
      style={{ width: 50, height: 50, borderRadius: 12, objectFit: 'cover' }}
      onError={() => setSrc(logoFallback)}
    />
  );
}

export default function App() {
  return (
    <Router>
      <nav className="navbar">
        <div className="container">
          <div className="navbar-content">
            <Link to="/" className="logo" aria-label="VisoraX Home">
              <LogoImage />
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                VisoraX
              </motion.span>
            </Link>
            <ul className="nav-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/analysis">Analysis</Link></li>
            </ul>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
      </Routes>
    </Router>
  );
}
