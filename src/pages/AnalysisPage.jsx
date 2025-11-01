import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, AlertTriangle, Eye, Activity } from 'lucide-react';
import { dashcamAPI } from '../api';

const AnalysisPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Audio + overlay
  const alertAudioRef = useRef(null);
  const [showWarning, setShowWarning] = useState(false);
  const [showSoundPrompt, setShowSoundPrompt] = useState(false);

  // Use your exact file name (must be in /public)
  const ALERT_SRC = '/alarm-clock-90867.mp3';

  // Decide when to alert
  const shouldAlert = (res) => {
    if (!res) return false;
    return res.alert_level === 'danger' || res.alert_level === 'warning' || (res.has_glare && res.confidence >= 0.65);
  };

  // Prime audio after the first user gesture (Chrome/Safari autoplay policy)
  useEffect(() => {
    const prime = () => {
      const el = alertAudioRef.current;
      if (!el) return;
      el.src = ALERT_SRC;
      const p = el.play();
      if (p && typeof p.then === 'function') {
        p.then(() => { el.pause(); el.currentTime = 0; cleanup(); })
         .catch(() => { /* try again on next gesture */ });
      }
    };
    const cleanup = () => {
      window.removeEventListener('pointerdown', prime, true);
      window.removeEventListener('keydown', prime, true);
    };
    window.addEventListener('pointerdown', prime, true);
    window.addEventListener('keydown', prime, true);
    return cleanup;
  }, []);

  // Play when high risk result arrives
  useEffect(() => {
    if (!analysisResult) return;
    const trigger = shouldAlert(analysisResult);
    setShowWarning(trigger);
    if (trigger && alertAudioRef.current) {
      const el = alertAudioRef.current;
      el.src = ALERT_SRC;
      el.currentTime = 0;
      const p = el.play();
      if (p && typeof p.then === 'function') {
        p.catch(() => setShowSoundPrompt(true));
      }
    }
  }, [analysisResult]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setAnalysisResult(null);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files[0]); };
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const analyzeImage = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    try {
      const result = await dashcamAPI.analyzeImage(selectedFile);
      setAnalysisResult(result);
    } catch (err) {
      console.error('Analysis failed:', err);
      alert('Analysis failed. Check backend URL and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAlertColor = (level) => {
    switch (level) {
      case 'danger': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'caution': return '#eab308';
      case 'info': return '#3b82f6';
      default: return '#10b981';
    }
  };

  const getAlertIcon = (level) => {
    switch (level) {
      case 'danger': return '🚨';
      case 'warning': return '⚠️';
      case 'caution': return '⚡';
      case 'info': return 'ℹ️';
      default: return '✅';
    }
  };

  return (
    <div className="analysis-container">
      {/* Single audio element used for alerts */}
      <audio ref={alertAudioRef} preload="auto" />

      {/* If autoplay is blocked, let the user enable sound */}
      {showSoundPrompt && (
        <div style={{
          position: 'fixed', right: 16, bottom: 16, zIndex: 1600,
          background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }}>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!alertAudioRef.current) return;
              alertAudioRef.current.currentTime = 0;
              alertAudioRef.current.play().then(() => setShowSoundPrompt(false)).catch(()=>{});
            }}
          >
            Enable sound
          </button>
        </div>
      )}

      {/* Warning overlay */}
      {showWarning && (
        <div className="warning-overlay">
          <div className="warning-card">
            <div className="warning-icon"><div className="warning-triangle" /></div>
            <div className="warning-text">Glare Risk Detected</div>
            <div style={{ color: '#7c2d12', fontWeight: 600, fontSize: 14 }}>
              Level: {analysisResult?.alert_level?.toUpperCase() || 'N/A'} • Confidence: {Math.round((analysisResult?.confidence || 0) * 100)}%
            </div>
          </div>
        </div>
      )}

      <div className="container">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{
              fontSize: '48px', fontWeight: '800',
              background: 'linear-gradient(135deg, #1e3a8a, #3b82f6, #10b981)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              marginBottom: '16px'
            }}>
              VisoraX Analysis
            </h1>
            <p style={{ fontSize: '18px', color: '#64748b' }}>
              Upload an image for advanced glare detection 
            </p>
          </div>

          {/* Grid */}
          <div className="analysis-grid">
            {/* Upload column */}
            <motion.div className="upload-section" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <ImageIcon size={32} style={{ color: '#3b82f6' }} />
                <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1e3a8a', margin: 0 }}>Image Upload</h2>
              </div>

              <motion.div
                className={`upload-area ${dragOver ? 'dragover' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('fileInput').click()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div className="upload-icon" animate={{ y: dragOver ? -10 : 0, rotate: dragOver ? 10 : 0 }}>
                  <Upload size={48} />
                </motion.div>
                <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px', color: '#1e3a8a' }}>
                  {dragOver ? 'Drop it here!' : 'Upload Image'}
                </h3>
                <p style={{ color: '#64748b', fontSize: '16px' }}>Drag & drop an image or click to browse</p>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>Supports JPG, PNG, WEBP</p>
              </motion.div>

              <input id="fileInput" type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />

              <AnimatePresence>
                {selectedFile && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: '24px' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.2)', borderRadius: '16px', padding: '20px' }}>
                      <p style={{ fontWeight: '600', marginBottom: '16px', color: '#1e3a8a' }}>📁 {selectedFile.name}</p>
                      {imagePreview && (
                        <motion.img
                          src={imagePreview}
                          alt="Preview"
                          style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '12px', marginBottom: '20px' }}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        />
                      )}
                      <motion.button className="btn btn-primary" onClick={analyzeImage} disabled={isAnalyzing} style={{ width: '100%' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        {isAnalyzing ? (<><div className="loading-spinner" style={{ width: 20, height: 20, margin: 0 }} />Analyzing...</>) : (<><Eye size={24} />Start Analysis</>)}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Results column */}
            <motion.div className="results-section" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <AlertTriangle size={32} style={{ color: '#3b82f6' }} />
                <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1e3a8a', margin: 0 }}>Analysis Results</h2>
              </div>

              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div style={{ textAlign: 'center', padding: '60px 20px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ fontSize: '64px', marginBottom: '24px' }}>🤖</motion.div>
                    <h3 style={{ color: '#1e3a8a', marginBottom: '16px' }}>Processing...</h3>
                    <p style={{ color: '#64748b' }}>VisoraX is analyzing image for glare detection</p>
                    <div className="loading-spinner" />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {analysisResult && !isAnalyzing && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.6 }}>
                    <div className="status-grid">
                      <motion.div className="status-item" whileHover={{ y: -4, scale: 1.02 }} style={{ borderLeft: `4px solid ${getAlertColor(analysisResult.alert_level)}` }}>
                        <div className="status-value" style={{ color: getAlertColor(analysisResult.alert_level) }}>{getAlertIcon(analysisResult.alert_level)}</div>
                        <div className="status-label">{analysisResult.has_glare ? 'GLARE DETECTED' : 'ALL CLEAR'}</div>
                      </motion.div>
                      <motion.div className="status-item" whileHover={{ y: -4, scale: 1.02 }}>
                        <div className="status-value">{Math.round(analysisResult.confidence * 100)}%</div>
                        <div className="status-label">Confidence</div>
                      </motion.div>
                      <motion.div className="status-item" whileHover={{ y: -4, scale: 1.02 }}>
                        <div className={`alert-badge alert-${analysisResult.alert_level}`}>{analysisResult.alert_level.toUpperCase()}</div>
                        <div className="status-label" style={{ marginTop: 8 }}>Alert Level</div>
                      </motion.div>
                      <motion.div className="status-item" whileHover={{ y: -4, scale: 1.02 }}>
                        <div className="status-value">{analysisResult.processing_time}s</div>
                        <div className="status-label">Processing Time</div>
                      </motion.div>
                    </div>

                    {analysisResult.method_scores && (
                      <motion.div style={{ marginTop: 32 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        <h3 style={{ marginBottom: 20, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Activity size={24} />Detection Methods
                        </h3>
                        {Object.entries(analysisResult.method_scores).map(([method, score], idx) => (
                          <motion.div key={method} style={{ marginBottom: 16 }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#1e3a8a', fontWeight: 600 }}>
                              <span style={{ textTransform: 'capitalize' }}>{method.replace('_', ' ')}</span>
                              <span>{Math.round(score * 100)}%</span>
                            </div>
                            <div style={{ height: 8, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 4, overflow: 'hidden' }}>
                              <motion.div style={{ height: '100%', background: `linear-gradient(90deg, ${getAlertColor(analysisResult.alert_level)}, #10b981)`, borderRadius: 4 }} initial={{ width: 0 }} animate={{ width: `${score * 100}%` }} transition={{ duration: 1, delay: idx * 0.1 }} />
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {!analysisResult && !isAnalyzing && (
                <motion.div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div style={{ fontSize: '64px', marginBottom: '24px', opacity: 0.5 }}>📊</div>
                  <h3 style={{ marginBottom: 16 }}>Ready for Analysis</h3>
                  <p>Upload an image to see the glare detection in action</p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalysisPage;