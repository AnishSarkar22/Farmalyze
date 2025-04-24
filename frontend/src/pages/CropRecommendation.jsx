import React, { useState, useEffect } from "react";
import { AlertCircle, Tractor, Check } from "lucide-react";
import "./Form.css";
import { state_arr, s_a } from "../components/cities.js";

const CropRecommendation = () => {
  const [formData, setFormData] = useState({
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    ph: "",
    rainfall: "",
    state: "",
    city: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Create state dropdown when component mounts
    const stateSelect = document.getElementById("state");
    if (stateSelect) {
      stateSelect.length = 0;
      stateSelect.options[0] = new Option("Select State", "");
      stateSelect.selectedIndex = 0;
      for (let i = 0; i < state_arr.length; i++) {
        stateSelect.options[stateSelect.length] = new Option(
          state_arr[i],
          state_arr[i]
        );
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // If state is changed, update cities
    if (name === "state") {
      const citySelect = document.getElementById("city");
      const stateIndex = state_arr.indexOf(value) + 1; // +1 because s_a array is 1-based

      if (citySelect) {
        citySelect.length = 0;
        citySelect.options[0] = new Option("Select City", "");
        citySelect.selectedIndex = 0;

        if (value) {
          // Get cities from s_a array and split by |
          const cityArr = s_a[stateIndex].split("|");
          cityArr.forEach((city) => {
            citySelect.options[citySelect.length] = new Option(
              city.trim(),
              city.trim()
            );
          });
        }
      }
    }
  };

  // First modify the handleSubmit function:
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form inputs
    if (
      !formData.nitrogen ||
      !formData.phosphorus ||
      !formData.potassium ||
      !formData.ph ||
      !formData.rainfall ||
      !formData.state ||
      !formData.city
    ) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/crop-predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nitrogen: formData.nitrogen,
          phosphorus: formData.phosphorus,
          potassium: formData.potassium,
          ph: formData.ph,
          rainfall: formData.rainfall,
          city: formData.city,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          recommendedCrop: {
            name: data.prediction,
            confidence: 95,
            description: `Based on your soil parameters and weather conditions in ${formData.city}, ${data.prediction} is recommended as the best crop for your farm.`,
          },
          alternatives: data.alternatives,
          conditions: data.conditions,
          soilHealth: data.conditions.soil_health,
          soilHealthDescription: `Your soil parameters indicate ${data.conditions.soil_health.toLowerCase()} growing conditions. The current temperature is ${
            data.conditions.temperature
          }°C with ${data.conditions.humidity}% humidity.`,
        });
      } else {
        setError(data.error || "Failed to get prediction");
      }
    } catch (err) {
      setError("Failed to connect to the server");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="container">
        <div className="form-header">
          <h1 className="form-title">Crop Recommendation</h1>
          <p className="form-subtitle">
            Enter your soil parameters and location to receive personalized crop
            recommendations
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
                    Nitrogen (N) Value
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
                    Phosphorus (P) Value
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
                    Potassium (K) Value
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
                  <label htmlFor="phLevel" className="form-label">
                    pH Level
                  </label>
                  <input
                    type="number"
                    id="ph"
                    name="ph"
                    className="form-input"
                    value={formData.ph}
                    onChange={handleChange}
                    placeholder="e.g., 6.5"
                    min="0"
                    max="14"
                    step="0.1"
                  />
                  <small className="input-help">Range: 0-14</small>
                </div>

                <div className="form-group">
                  <label htmlFor="rainfall" className="form-label">
                    Annual Rainfall (mm)
                  </label>
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
                  <small className="input-help">
                    Annual rainfall in millimeters
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="state" className="form-label">
                    State
                  </label>
                  <select
                    id="state"
                    name="state"
                    className="form-select"
                    value={formData.state}
                    onChange={handleChange}
                  >
                    <option value="">Select State</option>
                    {/* {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))} */}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="city" className="form-label">
                    City
                  </label>
                  <select
                    id="city"
                    name="city"
                    className="form-select"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={!formData.state}
                  >
                    <option value="">Select City</option>
                    {/* {formData.state && getCitiesByState(formData.state).map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))} */}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Analyzing..." : "Predict Crop"}
                </button>
              </div>
            </form>
          ) : (
            <div className="result-card">
              <div className="result-header">
                <Tractor size={32} className="result-icon" />
                <h2 className="result-title">Crop Recommendation Results</h2>
              </div>

              <div className="result-main">
                <div className="recommended-crop">
                  <h3>Recommended Crop</h3>
                  <div className="crop-recommendation-primary">
                    <div className="crop-name">
                      {result.recommendedCrop.name}
                    </div>

                    {/* :TODO: confidence bar and percentage to be done later */}
                    {/* <div className="crop-confidence">
                      <div className="confidence-bar">
                        <div
                          className="confidence-fill"
                          style={{
                            width: `${result.recommendedCrop.confidence}%`,
                          }}
                        ></div>
                      </div>
                      <span>{result.recommendedCrop.confidence}% Match</span>
                    </div> */}
                    <p className="crop-description">
                      {result.recommendedCrop.description}
                    </p>
                  </div>
                </div>

                <div className="alternative-crops">
                  <h3>Alternative Options</h3>
                  <div className="alternatives-list">
                    {Array.isArray(result.alternatives) &&
                      result.alternatives.map((crop, index) => (
                        <div key={index} className="alternative-item">
                          <div className="alternative-header">
                            <div className="alternative-name">{crop.name}</div>
                            <div className="confidence-tag">
                              {crop.confidence}% Match
                            </div>
                          </div>
                          <div className="alternative-details">
                            <div className="confidence-progress">
                              <div
                                className="confidence-bar"
                                style={{
                                  background: `linear-gradient(to right, 
                                  #2E7D32 ${crop.confidence}%, 
                                  #e0e0e0 ${crop.confidence}%
                                )`,
                                }}
                              />
                            </div>
                            <p className="alternative-reason">{crop.reason}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="soil-health">
                  <h3>Soil Health Assessment</h3>
                  <div className="soil-health-rating">
                    <span className="health-label">Health:</span>
                    <span
                      className={`health-value health-${result.soilHealth.toLowerCase()}`}
                    >
                      {result.soilHealth}
                    </span>
                  </div>
                  <p className="soil-description">
                    {result.soilHealthDescription}
                  </p>
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

export default CropRecommendation;
