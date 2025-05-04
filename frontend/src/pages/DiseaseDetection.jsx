import React, { useState, useRef, useEffect } from "react";
import { AlertCircle, Upload, Microscope, Check, X } from "lucide-react";
import "../styles/Form.css";
import "../styles/DiseaseDetection.css";
import { supabase } from "../config/supabase.js";

const DiseaseDetection = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Fetch session when component mounts
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    };

    getSession();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.includes("image/")) {
      setError("Please upload an image file");
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.includes("image/")) {
      setError("Please upload an image file");
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError("");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedImage) {
      setError("Please upload an image");
      return;
    }

    setLoading(true);
    setError("");

    // Create form data
    const formData = new FormData();
    formData.append("file", selectedImage);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/disease-predict`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (data.success) {
        // Store activity in Supabase
        await supabase.from("user_activities").insert({
          user_id: session.user.id,
          activity_type: "disease",
          title: `Disease Detection Analysis`,
          result: data.prediction,
          details: {
            disease_info: data.disease_info,
          },
        });

        setResult({
          diseaseName: data.prediction,
          // confidence: 95, // Add confidence if available from API
          description: data.disease_info,
          symptoms: ["View detailed symptoms on disease info section"],
          treatments: ["View treatment options on disease info section"],
          preventiveMeasures: [
            "View prevention measures on disease info section",
          ],
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="form-page">
      <div className="container">
        <div className="form-header">
          <h1 className="form-title">Plant Disease Detection</h1>
          <p className="form-subtitle">
            Upload an image of your plant to identify potential diseases
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
              <div
                className={`image-upload-area ${previewUrl ? "has-image" : ""}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {previewUrl ? (
                  <div className="image-preview-container">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="image-preview"
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={resetForm}
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <Upload size={48} className="upload-icon" />
                    <h3>Drag & Drop or Click to Upload</h3>
                    <p>Upload a clear image of the affected plant part</p>
                    <p className="file-requirements">
                      Supported formats: JPG, PNG, JPEG (Max size: 5MB)
                    </p>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  className="file-input"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>

              <div className="form-instructions">
                <h3>Tips for better results:</h3>
                <ul className="instructions-list">
                  <li>Take a clear, well-lit photo</li>
                  <li>Focus on the affected area</li>
                  <li>Include multiple affected parts if possible</li>
                  <li>Avoid shadows and reflections</li>
                </ul>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !selectedImage}
                >
                  {loading ? "Analyzing..." : "Detect Disease"}
                </button>
              </div>
            </form>
          ) : (
            <div className="result-card">
              <div className="result-header">
                <Microscope size={32} className="result-icon" />
                <h2 className="result-title">Disease Detection Results</h2>
              </div>

              <div className="result-main">
                <div className="result-image-container">
                  <img
                    src={previewUrl}
                    alt="Analyzed plant"
                    className="result-image"
                  />
                </div>

                <div className="disease-info">
                  <div className="disease-header">
                    <h3 className="disease-name">{result.diseaseName}</h3>
                    {/* :TODO: This section adds a prediction bar that displays the accuracy of the ML model (confidence)*/}
                    {/* <div className="disease-confidence">
                      <div className="confidence-bar">
                        <div 
                          className="confidence-fill" 
                          style={{width: `${result.confidence}%`}}
                        ></div>
                      </div>
                      <span>{result.confidence}% Confidence</span>
                    </div> */}
                  </div>

                  <p className="disease-description">{result.description}</p>

                  {/* <div className="disease-details">
                    <div className="detail-section">
                      <h4>Symptoms</h4>
                      <ul className="detail-list">
                        {result.symptoms.map((symptom, index) => (
                          <li key={index}>{symptom}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="detail-section">
                      <h4>Treatment</h4>
                      <ul className="detail-list">
                        {result.treatments.map((treatment, index) => (
                          <li key={index}>{treatment}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="detail-section">
                      <h4>Prevention</h4>
                      <ul className="detail-list">
                        {result.preventiveMeasures.map((measure, index) => (
                          <li key={index}>{measure}</li>
                        ))}
                      </ul>
                    </div>
                  </div> */}
                </div>
              </div>

              <div className="result-actions">
                <button className="btn btn-outline" onClick={resetForm}>
                  Analyze Another Image
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiseaseDetection;
