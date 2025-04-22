import React, { useState } from 'react';
import { AlertCircle, Droplets, Check } from 'lucide-react';
import './Form.css';

const FertilizerRecommendation = () => {
  const [formData, setFormData] = useState({
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    cropType: ''
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
      !formData.cropType
    ) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // Simulate API call for fertilizer recommendation
    setTimeout(() => {
      // For demo purposes, we'll return mock results
      // In a real app, this would call an ML model API
      setResult({
        recommendedFertilizer: {
          name: 'NPK 14-35-14',
          description: 'Balanced fertilizer with higher phosphorus content, ideal for your crop type.'
        },
        applicationRate: '250 kg/ha',
        applicationFrequency: 'Every 4-6 weeks during growing season',
        nutrientDeficiencies: [
          { nutrient: 'Phosphorus', status: 'Low', recommendation: 'Increase phosphorus application by 20%' }
        ],
        additionalRecommendations: [
          'Consider adding organic matter to improve soil structure',
          'Test soil pH regularly to ensure optimal nutrient absorption',
          'Apply in small amounts rather than a single large application'
        ]
      });
      
      setLoading(false);
    }, 2000);
  };
  
  const cropTypes = [
    'Rice', 'Wheat', 'Maize', 'Cotton', 
    'Sugarcane', 'Vegetables', 'Fruits', 'Pulses'
  ];

  return (
    <div className="form-page">
      <div className="container">
        <div className="form-header">
          <h1 className="form-title">Fertilizer Recommendation</h1>
          <p className="form-subtitle">
            Enter your soil nutrient levels and crop type to receive personalized fertilizer recommendations
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
                  <label htmlFor="nitrogen" className="form-label">Nitrogen (N) Level</label>
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
                  <label htmlFor="phosphorus" className="form-label">Phosphorus (P) Level</label>
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
                  <label htmlFor="potassium" className="form-label">Potassium (K) Level</label>
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
                  <label htmlFor="cropType" className="form-label">Crop Type</label>
                  <select
                    id="cropType"
                    name="cropType"
                    className="form-select"
                    value={formData.cropType}
                    onChange={handleChange}
                  >
                    <option value="">Select Crop Type</option>
                    {cropTypes.map(crop => (
                      <option key={crop} value={crop}>{crop}</option>
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
                  {loading ? 'Analyzing...' : 'Predict Fertilizer'}
                </button>
              </div>
            </form>
          ) : (
            <div className="result-card">
              <div className="result-header">
                <Droplets size={32} className="result-icon" />
                <h2 className="result-title">Fertilizer Recommendation Results</h2>
              </div>
              
              <div className="result-main">
                <div className="recommended-fertilizer">
                  <h3>Recommended Fertilizer</h3>
                  <div className="fertilizer-recommendation-primary">
                    <div className="fertilizer-name">{result.recommendedFertilizer.name}</div>
                    <p className="fertilizer-description">{result.recommendedFertilizer.description}</p>
                  </div>
                </div>
                
                <div className="application-details">
                  <h3>Application Details</h3>
                  <div className="application-info">
                    <div className="application-item">
                      <span className="application-label">Rate:</span>
                      <span className="application-value">{result.applicationRate}</span>
                    </div>
                    <div className="application-item">
                      <span className="application-label">Frequency:</span>
                      <span className="application-value">{result.applicationFrequency}</span>
                    </div>
                  </div>
                </div>
                
                <div className="nutrient-deficiencies">
                  <h3>Nutrient Analysis</h3>
                  <div className="deficiencies-list">
                    {result.nutrientDeficiencies.length > 0 ? (
                      result.nutrientDeficiencies.map((item, index) => (
                        <div key={index} className="deficiency-item">
                          <div className="deficiency-header">
                            <span className="deficiency-nutrient">{item.nutrient}</span>
                            <span className={`deficiency-status status-${item.status.toLowerCase()}`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="deficiency-recommendation">{item.recommendation}</p>
                        </div>
                      ))
                    ) : (
                      <p className="no-deficiencies">No significant nutrient deficiencies detected.</p>
                    )}
                  </div>
                </div>
                
                <div className="additional-recommendations">
                  <h3>Additional Recommendations</h3>
                  <ul className="recommendations-list">
                    {result.additionalRecommendations.map((rec, index) => (
                      <li key={index} className="recommendation-item">
                        <Check size={16} className="recommendation-icon" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
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

export default FertilizerRecommendation;