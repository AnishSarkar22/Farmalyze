import React, { useState } from 'react';
import { AlertCircle, Plane as Plant, Check } from 'lucide-react';
import './Form.css';

const CropRecommendation = () => {
  const [formData, setFormData] = useState({
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    phLevel: '',
    rainfall: '',
    state: '',
    city: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form inputs
    if (
      !formData.nitrogen || 
      !formData.phosphorus || 
      !formData.potassium || 
      !formData.phLevel || 
      !formData.rainfall || 
      !formData.state || 
      !formData.city
    ) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // Simulate API call for crop recommendation
    setTimeout(() => {
      // For demo purposes, we'll return mock results
      // In a real app, this would call an ML model API
      const mockCrops = [
        { name: 'Rice', confidence: 92, description: 'Ideal for your soil conditions with high rainfall.' },
        { name: 'Wheat', confidence: 87, description: 'Well-suited for your nutrient profile but requires moderate rainfall.' },
        { name: 'Maize', confidence: 78, description: 'Can grow well in your soil conditions with proper irrigation.' },
      ];
      
      setResult({
        recommendedCrop: mockCrops[0],
        alternatives: mockCrops.slice(1),
        soilHealth: 'Good',
        soilHealthDescription: 'Your soil has good nutrient balance. Consider adding organic matter to improve structure.'
      });
      
      setLoading(false);
    }, 2000);
  };
  
  const states = [
    'Andhra Pradesh', 'Karnataka', 'Tamil Nadu', 'Maharashtra', 
    'Punjab', 'Uttar Pradesh', 'West Bengal', 'Gujarat'
  ];
  
  // Sample cities based on selected state
  const getCitiesByState = (state) => {
    const citiesByState = {
      'Andhra Pradesh': ['Hyderabad', 'Vijayawada', 'Visakhapatnam'],
      'Karnataka': ['Bangalore', 'Mysore', 'Mangalore'],
      'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
      'Maharashtra': ['Mumbai', 'Pune', 'Nagpur'],
      'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar'],
      'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi'],
      'West Bengal': ['Kolkata', 'Siliguri', 'Asansol'],
      'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara']
    };
    
    return citiesByState[state] || [];
  };

  return (
    <div className="form-page">
      <div className="container">
        <div className="form-header">
          <h1 className="form-title">Crop Recommendation</h1>
          <p className="form-subtitle">
            Enter your soil parameters and location to receive personalized crop recommendations
          </p>
        </div>
        
        {error && (
          <div className="form-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        
        <div className="form-content-wrapper">
          {!result ? (
            <form onSubmit={handleSubmit} className="form-card">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="nitrogen" className="form-label">Nitrogen (N) Value</label>
                  <input
                    type="number"
                    id="nitrogen"
                    name="nitrogen"
                    className="form-input"
                    value={formData.nitrogen}
                    onChange={handleChange}
                    placeholder="e.g., 40"
                    min="0"
                    max="140"
                    step="1"
                  />
                  <small className="input-help">Range: 0-140 kg/ha</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="phosphorus" className="form-label">Phosphorus (P) Value</label>
                  <input
                    type="number"
                    id="phosphorus"
                    name="phosphorus"
                    className="form-input"
                    value={formData.phosphorus}
                    onChange={handleChange}
                    placeholder="e.g., 50"
                    min="0"
                    max="145"
                    step="1"
                  />
                  <small className="input-help">Range: 0-145 kg/ha</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="potassium" className="form-label">Potassium (K) Value</label>
                  <input
                    type="number"
                    id="potassium"
                    name="potassium"
                    className="form-input"
                    value={formData.potassium}
                    onChange={handleChange}
                    placeholder="e.g., 60"
                    min="0"
                    max="205"
                    step="1"
                  />
                  <small className="input-help">Range: 0-205 kg/ha</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="phLevel" className="form-label">pH Level</label>
                  <input
                    type="number"
                    id="phLevel"
                    name="phLevel"
                    className="form-input"
                    value={formData.phLevel}
                    onChange={handleChange}
                    placeholder="e.g., 6.5"
                    min="0"
                    max="14"
                    step="0.1"
                  />
                  <small className="input-help">Range: 0-14</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="rainfall" className="form-label">Annual Rainfall (mm)</label>
                  <input
                    type="number"
                    id="rainfall"
                    name="rainfall"
                    className="form-input"
                    value={formData.rainfall}
                    onChange={handleChange}
                    placeholder="e.g., 1000"
                    min="0"
                    step="1"
                  />
                  <small className="input-help">Annual rainfall in millimeters</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="state" className="form-label">State</label>
                  <select
                    id="state"
                    name="state"
                    className="form-select"
                    value={formData.state}
                    onChange={handleChange}
                  >
                    <option value="">Select State</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="city" className="form-label">City</label>
                  <select
                    id="city"
                    name="city"
                    className="form-select"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={!formData.state}
                  >
                    <option value="">Select City</option>
                    {formData.state && getCitiesByState(formData.state).map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                >
                  {loading ? 'Analyzing...' : 'Predict Crop'}
                </button>
              </div>
            </form>
          ) : (
            <div className="result-card">
              <div className="result-header">
                <Plant size={32} className="result-icon" />
                <h2 className="result-title">Crop Recommendation Results</h2>
              </div>
              
              <div className="result-main">
                <div className="recommended-crop">
                  <h3>Recommended Crop</h3>
                  <div className="crop-recommendation-primary">
                    <div className="crop-name">{result.recommendedCrop.name}</div>
                    <div className="crop-confidence">
                      <div className="confidence-bar">
                        <div 
                          className="confidence-fill" 
                          style={{width: `${result.recommendedCrop.confidence}%`}}
                        ></div>
                      </div>
                      <span>{result.recommendedCrop.confidence}% Match</span>
                    </div>
                    <p className="crop-description">{result.recommendedCrop.description}</p>
                  </div>
                </div>
                
                <div className="alternative-crops">
                  <h3>Alternative Options</h3>
                  <div className="alternatives-list">
                    {result.alternatives.map((crop, index) => (
                      <div key={index} className="alternative-item">
                        <div className="alternative-name">{crop.name}</div>
                        <div className="alternative-confidence">
                          <div className="confidence-bar">
                            <div 
                              className="confidence-fill" 
                              style={{width: `${crop.confidence}%`}}
                            ></div>
                          </div>
                          <span>{crop.confidence}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="soil-health">
                  <h3>Soil Health Assessment</h3>
                  <div className="soil-health-rating">
                    <span className="health-label">Health:</span>
                    <span className={`health-value health-${result.soilHealth.toLowerCase()}`}>
                      {result.soilHealth}
                    </span>
                  </div>
                  <p className="soil-description">{result.soilHealthDescription}</p>
                </div>
              </div>
              
              <div className="result-actions">
                <button 
                  className="btn btn-outline" 
                  onClick={() => setResult(null)}
                >
                  Back to Form
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropRecommendation;