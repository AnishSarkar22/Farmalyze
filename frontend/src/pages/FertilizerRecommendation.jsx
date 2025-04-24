import React, { useState } from "react";
import { AlertCircle, Droplets, Check } from "lucide-react";
import parse from 'html-react-parser';
import "./Form.css";

const FertilizerRecommendation = () => {
  const [formData, setFormData] = useState({
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    cropname: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const cropTypes = [
    "rice",
    "maize",
    "chickpea",
    "kidneybeans",
    "pigeonpeas",
    "mothbeans",
    "mungbean",
    "blackgram",
    "lentil",
    "pomegranate",
    "banana",
    "mango",
    "grapes",
    "watermelon",
    "muskmelon",
    "apple",
    "orange",
    "papaya",
    "coconut",
    "cotton",
    "jute",
    "coffee",
  ];

  // const formatRecommendation = (text) => {
  //   // Split the text into title and suggestions
  //   const [title, ...rest] = text.split('Please consider the following suggestions:');
  //   const suggestions = rest.join('')
  //     .split('<br/>')
  //     .filter(Boolean)
  //     .map(suggestion => suggestion.trim()
  //       .replace(/<\/?[^>]+(>|$)/g, '')
  //       .replace(/^\d+\.\s*/, '')
  //       .replace(/\s*<i>/g, '')
  //       .replace(/<\/i>/g, '')
  //     );
  
  //   return { title: title.trim(), suggestions };
  // };

  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form inputs
    try {
      const response = await fetch(
        "http://localhost:8000/api/fertilizer-predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Failed to get recommendation");
      }
    } catch (err) {
      setError(`Failed to connect to the server: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="container">
        <div className="form-header">
          <h1 className="form-title">Fertilizer Recommendation</h1>
          <p className="form-subtitle">
            Get informed advice based on fertilizer based on soil
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
                  <label htmlFor="nitrogen" className="form-label">
                    Nitrogen (N) Level
                  </label>
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
                  <label htmlFor="phosphorus" className="form-label">
                    Phosphorus (P) Level
                  </label>
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
                  <label htmlFor="potassium" className="form-label">
                    Potassium (K) Level
                  </label>
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
                  <label htmlFor="cropname" className="form-label">
                    Crop you want to grow
                  </label>
                  <select
                    id="cropname"
                    name="cropname"
                    className="form-select"
                    value={formData.cropname}
                    onChange={handleChange}
                  >
                    <option value="">Select Crop Type</option>
                    {cropTypes.map((crop) => (
                      <option key={crop} value={crop}>
                        {crop}
                      </option>
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
                  {loading ? "Analyzing..." : "Predict"}
                </button>
              </div>
            </form>
          ) : (
            <div className="result-card">
              <div className="result-header">
                <Droplets size={32} className="result-icon" />
                <h2 className="result-title">
                  Fertilizer Recommendation Results
                </h2>
              </div>
              <div className="result-main">
                <div className="recommendation-content">
                  {parse(result.recommendation, {
                    replace: (domNode) => {
                      if (domNode.name === 'br') {
                        return <br />;
                      }
                      if (domNode.name === 'b') {
                        return <strong className="highlight-text">{domNode.children[0].data}</strong>;
                      }
                      if (domNode.name === 'i') {
                        return <em className="emphasis-text">{domNode.children[0].data}</em>;
                      }
                    }
                  })}
                </div>
              </div>
              <div className="result-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => setResult(null)}
                >
                  Analyze for another crop
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
