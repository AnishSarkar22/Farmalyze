import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import {
  Tractor,
  Droplets,
  Microscope,
  AlertCircle,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
  CloudDrizzle,
} from "lucide-react";

import "../styles/Dashboard.css";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [userName, setUserName] = useState("User");

  // Sample data for demonstration
  const recentActivities = [
    {
      id: 1,
      type: "crop",
      title: "Rice Recommendation",
      date: "2025-06-02",
      status: "Completed",
    },
    {
      id: 2,
      type: "fertilizer",
      title: "NPK Analysis",
      date: "2025-06-01",
      status: "Completed",
    },
    {
      id: 3,
      type: "disease",
      title: "Leaf Spot Detection",
      date: "2025-05-28",
      status: "Completed",
    },
  ];

  const [weatherData, setWeatherData] = useState({
    location: "Loading...",
    temperature: "--°C",
    humidity: "--%",
    rainfall: "--mm",
    forecast: "Loading...",
  });

  useEffect(() => {
    const fetchWeatherData = async (position) => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/weather?lat=${position.latitude}&lon=${position.longitude}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setWeatherData({
              location: data.data.current.location,
              temperature: data.data.current.temperature,
              humidity: data.data.current.humidity,
              rainfall: data.data.current.rainfall,
              forecast: data.data.current.description,
              windSpeed: data.data.current.wind_speed,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching weather data:", error);
        setWeatherData({
          location: "Location unavailable",
          temperature: "--°C",
          humidity: "--%",
          rainfall: "--mm",
          forecast: "Weather data unavailable",
          windSpeed: "--m/s",
        });
      }
    };

    // Get user's location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await fetchWeatherData({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setWeatherData({
            location: "Location access denied",
            temperature: "--°C",
            humidity: "--%",
            rainfall: "--mm",
            forecast: "Please enable location access",
            windSpeed: "--m/s",
          });
        }
      );
    } else {
      setWeatherData({
        location: "Geolocation not supported",
        temperature: "--°C",
        humidity: "--%",
        rainfall: "--mm",
        forecast: "Weather data unavailable",
        windSpeed: "--m/s",
      });
    }
  }, []);

  useEffect(() => {
    // Set user name from Supabase user data
    if (currentUser?.user_metadata?.full_name) {
      const firstName = currentUser.user_metadata.full_name.split(" ")[0];
      setUserName(firstName);
    }
  }, [currentUser]);

  return (
    <div className="dashboard-container">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Welcome, {userName} 👋</h1>
          <p className="dashboard-subtitle">
            Your agricultural assistant dashboard
          </p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card quick-actions">
            <h2 className="card-title">Quick Actions</h2>
            <div className="quick-actions-grid">
              <Link to="/crop" className="quick-action-item">
                <div className="quick-action-icon">
                  <Tractor size={24} />
                </div>
                <span>Crop Recommendation</span>
              </Link>

              <Link to="/fertilizer" className="quick-action-item">
                <div className="quick-action-icon">
                  <Droplets size={24} />
                </div>
                <span>Fertilizer Suggestion</span>
              </Link>

              <Link to="/disease" className="quick-action-item">
                <div className="quick-action-icon">
                  <Microscope size={24} />
                </div>
                <span>Disease Detection</span>
              </Link>
            </div>
          </div>

          <div className="dashboard-card weather-card">
            <h2 className="card-title">Weather Information</h2>
            <div className="weather-content">
              <div className="weather-location">{weatherData.location}</div>
              <div className="weather-main">
                <div className="weather-icon">
                  {/* Weather icons based on OpenWeather conditions */}
                  {(() => {
                    const forecast = weatherData.forecast.toLowerCase();
                    if (forecast.includes("clear")) {
                      return <Sun size={64} />;
                    } else if (forecast.includes("cloud")) {
                      return <Cloud size={64} />;
                    } else if (forecast.includes("rain")) {
                      return <CloudRain size={64} />;
                    } else if (
                      forecast.includes("thunder") ||
                      forecast.includes("lightning")
                    ) {
                      return <CloudLightning size={64} />;
                    } else if (forecast.includes("snow")) {
                      return <CloudSnow size={64} />;
                    } else if (
                      forecast.includes("mist") ||
                      forecast.includes("fog")
                    ) {
                      return <CloudFog size={64} />;
                    } else if (forecast.includes("drizzle")) {
                      return <CloudDrizzle size={64} />;
                    } else {
                      return <Cloud size={64} />;
                    }
                  })()}
                </div>
                <div className="weather-temp">{weatherData.temperature}</div>
              </div>
              <div className="weather-details">
                <div className="weather-detail-item">
                  <span className="detail-label">Humidity:</span>
                  <span className="detail-value">{weatherData.humidity}</span>
                </div>
                <div className="weather-detail-item">
                  <span className="detail-label">Rainfall:</span>
                  <span className="detail-value">{weatherData.rainfall}</span>
                </div>
                <div className="weather-detail-item">
                  <span className="detail-label">Forecast:</span>
                  <span className="detail-value">{weatherData.forecast}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-card activity-card">
            <h2 className="card-title">Recent Activities</h2>
            {recentActivities.length > 0 ? (
              <div className="activity-list">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === "crop" && <Tractor size={18} />}
                      {activity.type === "fertilizer" && <Droplets size={18} />}
                      {activity.type === "disease" && <Microscope size={18} />}
                    </div>
                    <div className="activity-details">
                      <div className="activity-title">{activity.title}</div>
                      <div className="activity-meta">
                        <span className="activity-date">{activity.date}</span>
                        <span className="activity-status">
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <AlertCircle size={24} />
                <p>No recent activities</p>
              </div>
            )}
          </div>

          <div className="dashboard-card tips-card">
            <h2 className="card-title">Farming Tips</h2>
            <div className="tips-list">
              <div className="tip-item">
                <h3 className="tip-title">Soil Health Management</h3>
                <p className="tip-content">
                  Regularly test your soil to maintain optimal pH levels between
                  6.0-7.0 for most crops.
                </p>
              </div>

              <div className="tip-item">
                <h3 className="tip-title">Water Conservation</h3>
                <p className="tip-content">
                  Use drip irrigation to reduce water usage by up to 60%
                  compared to traditional methods.
                </p>
              </div>

              <div className="tip-item">
                <h3 className="tip-title">Seasonal Planning</h3>
                <p className="tip-content">
                  Plan your crop rotation to maximize soil nutrients and
                  minimize pest pressure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
