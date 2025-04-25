import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import { Plane, Tractor, Droplets, Microscope, TrendingUp } from 'lucide-react';
import Navbar from '../components/Navbar';
import './LandingPage.css';
import FarmalyzeLogo from "../assets/farmalyze.svg";

const LandingPage = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    
    const posArray = new Float32Array(particlesCount * 3);
    const scaleArray = new Float32Array(particlesCount);
    
    for (let i = 0; i < particlesCount * 3; i += 3) {
      // Position in a donut shape
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 10;
      
      posArray[i] = Math.cos(angle) * radius;
      posArray[i + 1] = (Math.random() - 0.5) * 5;
      posArray[i + 2] = Math.sin(angle) * radius;
      
      scaleArray[i / 3] = Math.random();
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('scale', new THREE.BufferAttribute(scaleArray, 1));
    
    // Material with custom shader for particles
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      sizeAttenuation: true,
      color: new THREE.Color('#4caf8e'),
      transparent: true,
      opacity: 0.8
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    
    // Camera position
    camera.position.z = 15;
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
      particlesMesh.rotation.y += 0.001;
      particlesMesh.rotation.x += 0.0005;
      
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="landing-page">
      <Navbar />
      
      <canvas ref={canvasRef} className="three-bg" />
      
      <div className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Transform Your Farming with Smart Agriculture</h1>
            <p className="hero-subtitle">
              Use data-driven insights to optimize crop selection, fertilizer usage, 
              and disease detection for better yields and sustainable farming.
            </p>
            <div className="hero-cta">
              <Link to="/signup" className="btn btn-primary hero-btn">Get Started</Link>
              {/* <Link to="/login" className="btn btn-outline hero-btn-secondary">Login</Link> */}
            </div>
          </div>
        </div>
      </div>
      
      <div className="features-section">
        <div className="container">
          <h2 className="section-title">Our Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Tractor size={32} />
              </div>
              <h3 className="feature-title">Crop Recommendation</h3>
              <p className="feature-desc">
                Get personalized crop recommendations based on soil composition, pH level, 
                rainfall, and geographical location.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Droplets size={32} />
              </div>
              <h3 className="feature-title">Fertilizer Suggestion</h3>
              <p className="feature-desc">
                Optimize fertilizer usage with custom recommendations based on soil nutrient 
                levels and your chosen crops.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Microscope size={32} />
              </div>
              <h3 className="feature-title">Disease Detection</h3>
              <p className="feature-desc">
                Identify plant diseases early with our image-based disease detection, 
                and get treatment recommendations.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <TrendingUp size={32} />
              </div>
              <h3 className="feature-title">Data Analytics</h3>
              <p className="feature-desc">
                Track your farm's performance over time with comprehensive analytics 
                and actionable insights.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3 className="step-title">Create an Account</h3>
              <p className="step-desc">Sign up and create your profile to get started.</p>
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <h3 className="step-title">Enter Your Data</h3>
              <p className="step-desc">Input soil parameters, location, and other details.</p>
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <h3 className="step-title">Get Recommendations</h3>
              <p className="step-desc">Receive instant, actionable insights and recommendations.</p>
            </div>
            
            <div className="step">
              <div className="step-number">4</div>
              <h3 className="step-title">Implement & Improve</h3>
              <p className="step-desc">Apply recommendations and track your results over time.</p>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
            <Link to="/" className="navbar-logo">
              <img src={FarmalyzeLogo} alt="Farmalyze Logo" className="logo-icon" />
            </Link>
            </div>
          
            <p className="footer-tagline">Empowering farmers with technology</p>
            <p className="copyright">© 2025 Farmalyze. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;