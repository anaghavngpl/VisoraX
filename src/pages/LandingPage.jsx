import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Car, Shield, MapPin, BarChart3, Zap, Eye } from 'lucide-react';

const LandingPage = () => {
  const [titleRef, titleInView] = useInView({ threshold: 0.3, triggerOnce: true });
  const [featuresRef, featuresInView] = useInView({ threshold: 0.2, triggerOnce: true });

  const features = [
    { icon: <Eye size={48} />, title: 'AI Glare Detection', description: 'YOLOv8-powered detection of dangerous glare conditions in real time.', color: '#3b82f6' },
    { icon: <Car size={48} />, title: 'Smart Dashcam', description: 'Professional recording with on-device intelligence and instant alerts.', color: '#10b981' },
    { icon: <MapPin size={48} />, title: 'GPS Fleet Tracking', description: 'Live routes, heatmaps, and safety monitoring across the fleet.', color: '#6366f1' },
    { icon: <BarChart3 size={48} />, title: 'Analytics Dashboard', description: 'Performance metrics and safety insights for better decisions.', color: '#06b6d4' },
    { icon: <Shield size={48} />, title: 'Safety Alerts', description: 'Proactive notifications to prevent incidents and reduce risk.', color: '#8b5cf6' },
    { icon: <Zap size={48} />, title: 'Real-Time Processing', description: 'GPU-accelerated inference for immediate driver feedback.', color: '#f59e0b' },
  ];

  const titleVariants = { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } } };
  const letterVariants = { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

  return (
    <div>
      <section className="hero">
        <div className="hero-bg" />
        <div className="container" style={{ position: 'relative' }}>
          <motion.div ref={titleRef} initial="hidden" animate={titleInView ? 'visible' : 'hidden'} variants={containerVariants}>
            <motion.h1 className="hero-title" variants={titleVariants} aria-label="VisoraX">
              {'VisoraX'.split('').map((ch, i) => (
                <motion.span key={i} variants={letterVariants} style={{ display: 'inline-block' }}>
                  {ch}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p className="hero-subtitle" variants={titleVariants}>
              Next-Gen DriveVision
            </motion.p>

            <motion.p className="hero-description" variants={titleVariants}>
              Experience the future of road safety with VisoraX glare detection, real-time analytics,
              and intelligent fleet management for driver safety.
            </motion.p>

            <motion.div
              style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '48px' }}
              variants={titleVariants}
            >
              <Link to="/analysis" className="btn btn-primary">
                <Zap size={24} />
                Start Analysis
              </Link>
              <a href="#features" className="btn btn-secondary">
                <Car size={24} />
                View Features
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="features" style={{ padding: '100px 0' }}>
        <div className="container">
          <motion.div ref={featuresRef} initial="hidden" animate={featuresInView ? 'visible' : 'hidden'} variants={containerVariants}>
            <motion.h2
              style={{
                textAlign: 'center', fontSize: '48px', fontWeight: 800, marginBottom: '64px',
                background: 'linear-gradient(135deg, #1e3a8a, #3b82f6, #10b981)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}
              variants={titleVariants}
            >
              Intelligent Safety Features
            </motion.h2>

            <div className="features-grid">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="feature-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  whileHover={{ y: -12, scale: 1.03 }}
                >
                  <div className="feature-icon" style={{ color: feature.color }}>
                    {feature.icon}
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section style={{ padding: '100px 0' }}>
        <div className="container">
          <motion.div
            className="glass-card"
            style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(30px)' }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3 style={{ fontSize: '32px', marginBottom: '20px', color: '#1e3a8a', fontWeight: 700 }}>
              🌟 Ready to Transform Road Safety? 🌟
            </h3>
            <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '18px', fontWeight: 500 }}>
              Enterprise Ready • 24/7 Support • AIS-140 Compatible
            </p>
            <p style={{ color: '#64748b', fontSize: '16px', opacity: 0.8 }}>
              Real-time Analytics • Cloud Storage • Fleet Management
            </p>
            <div style={{ marginTop: '32px' }}>
              <Link to="/analysis" className="btn btn-primary">
                <Eye size={24} />
                Try VisoraX Now
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;