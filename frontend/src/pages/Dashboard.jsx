import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import parse from "html-react-parser";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
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
  MessageSquare,
  Send,
} from "lucide-react";

import "../styles/Dashboard.css";

const Dashboard = () => {
  const { currentUser, token } = useAuth();
  const [userName, setUserName] = useState("User");
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedActivityId, setExpandedActivityId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreActivities, setHasMoreActivities] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [farmingTips, setFarmingTips] = useState([]);
  const [isTipsLoading, setIsTipsLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [loadingStates, setLoadingStates] = useState({
    weather: true,
    activities: true,
    tips: true,
  });
  const ACTIVITIES_PER_PAGE = 10;

  // Fetch user activities from backend
  useEffect(() => {
    const fetchUserActivities = async () => {
      if (!currentUser || !token) return;

      try {
        setIsLoading(true);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/activities?page=${currentPage}&limit=${ACTIVITIES_PER_PAGE}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const newActivities = data.activities.map((activity) => ({
              id: activity.id,
              type: activity.activity_type,
              title: activity.title,
              date: activity.created_at,
              status: activity.status,
              result: activity.result,
              details: activity.details,
            }));

            if (currentPage === 1) {
              // Reset activities for first page
              setRecentActivities(newActivities);
            } else {
              // Append for subsequent pages
              setRecentActivities((current) => {
                const existingIds = new Set(current.map((activity) => activity.id));
                const uniqueNewActivities = newActivities.filter(
                  (activity) => !existingIds.has(activity.id)
                );
                return [...current, ...uniqueNewActivities];
              });
            }

            setHasMoreActivities(data.pagination.has_more);
          }
        }
      } catch (error) {
        console.error("Error fetching user activities:", error);
      } finally {
        setIsLoading(false);
        setLoadingStates((prev) => {
          const newState = { ...prev, activities: false };
          if (!newState.weather && !newState.activities && !newState.tips) {
            setIsDashboardLoading(false);
          }
          return newState;
        });
      }
    };

    fetchUserActivities();
  }, [currentUser, token, currentPage]);

  // Polling for real-time updates (replaced Supabase real-time)
  useEffect(() => {
    if (!currentUser || !token) return;

    const pollForUpdates = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/activities?page=1&limit=5`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.activities.length > 0) {
            const latestActivities = data.activities.map((activity) => ({
              id: activity.id,
              type: activity.activity_type,
              title: activity.title,
              date: activity.created_at,
              status: activity.status,
              result: activity.result,
              details: activity.details,
            }));

            setRecentActivities((current) => {
              if (current.length === 0) return latestActivities;
              
              const existingIds = new Set(current.map((activity) => activity.id));
              const newActivities = latestActivities.filter(
                (activity) => !existingIds.has(activity.id)
              );

              if (newActivities.length > 0) {
                return [
                  ...newActivities,
                  ...current.slice(0, Math.max(0, ACTIVITIES_PER_PAGE - newActivities.length))
                ];
              }

              return current;
            });
          }
        }
      } catch (error) {
        console.error("Error polling for updates:", error);
      }
    };

    // Poll every 30 seconds for new activities
    const interval = setInterval(pollForUpdates, 30000);

    return () => clearInterval(interval);
  }, [currentUser, token]);

  // Fetch farming tips with existing fallback implementation
  useEffect(() => {
    const fetchFarmingTips = async () => {
      setIsTipsLoading(true);
      try {
        setFarmingTips([
          {
            id: 1,
            title: "Soil Health Management",
            content:
              "Regularly test your soil to maintain optimal pH levels between 6.0-7.0 for most crops.",
          },
          {
            id: 2,
            title: "Water Conservation",
            content:
              "Use drip irrigation to reduce water usage by up to 60% compared to traditional methods.",
          },
          {
            id: 3,
            title: "Seasonal Planning",
            content:
              "Plan your crop rotation to maximize soil nutrients and minimize pest pressure.",
          },
          {
            id: 4,
            title: "Pest Management",
            content:
              "Implement integrated pest management (IPM) strategies to reduce pesticide dependency.",
          },
          {
            id: 5,
            title: "Crop Diversification",
            content:
              "Grow different crops to improve soil health and reduce risk of total crop failure.",
          },
        ]);
      } catch (error) {
        console.error("Error loading farming tips:", error);
      } finally {
        setIsTipsLoading(false);
        setLoadingStates((prev) => {
          const newState = { ...prev, tips: false };
          if (!newState.weather && !newState.activities && !newState.tips) {
            setIsDashboardLoading(false);
          }
          return newState;
        });
      }
    };

    fetchFarmingTips();
  }, []);

  const [weatherData, setWeatherData] = useState({
    location: "Loading...",
    temperature: "--°C",
    humidity: "--%",
    rainfall: "--mm",
    forecast: "Loading...",
  });

  useEffect(() => {
    const fetchWeatherData = async (position) => {
      setIsWeatherLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/weather?lat=${
            position.latitude
          }&lon=${position.longitude}`
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
      } finally {
        setIsWeatherLoading(false);
        // Update unified loading state
        setLoadingStates((prev) => {
          const newState = { ...prev, weather: false };
          // Check if all components are loaded
          if (!newState.weather && !newState.activities && !newState.tips) {
            setIsDashboardLoading(false);
          }
          return newState;
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
          setLoadingStates((prev) => {
            const newState = { ...prev, weather: false };
            if (!newState.weather && !newState.activities && !newState.tips) {
              setIsDashboardLoading(false);
            }
            return newState;
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
      setLoadingStates((prev) => {
        const newState = { ...prev, weather: false };
        if (!newState.weather && !newState.activities && !newState.tips) {
          setIsDashboardLoading(false);
        }
        return newState;
      });
    }
  }, []);

   // Fetch username from backend using JWT
  useEffect(() => {
    const fetchUserName = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/username`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        if (data.success && data.name) {
          setUserName(data.name.split(" ")[0]); // Use first name
        }
      } catch {
        // fallback to default
        setUserName("User");
      }
    };
    fetchUserName();
  }, [token]);

  return (
    <div className="dashboard-container">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            Welcome,{" "}
            {isDashboardLoading ? (
              <Skeleton
                width={80}
                height={30}
                style={{ display: "inline-block", verticalAlign: "middle" }}
              />
            ) : (
              <>{userName} 👋</>
            )}
          </h1>
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

          {/* Weather card */}
          <div className="dashboard-card weather-card">
            <h2 className="card-title">Weather Information</h2>
            {isDashboardLoading ? (
              <div className="weather-skeleton">
                <div className="weather-skeleton-location">
                  <Skeleton width={180} height={24} />
                </div>
                <div className="weather-skeleton-main">
                  <div className="weather-skeleton-icon">
                    <Skeleton circle width={64} height={64} />
                  </div>
                  <div className="weather-skeleton-temp">
                    <Skeleton width={80} height={32} />
                  </div>
                </div>
                <div className="weather-skeleton-details">
                  <div className="weather-skeleton-item">
                    <Skeleton width={150} height={18} />
                  </div>
                  <div className="weather-skeleton-item">
                    <Skeleton width={150} height={18} />
                  </div>
                  <div className="weather-skeleton-item">
                    <Skeleton width={150} height={18} />
                  </div>
                </div>
              </div>
            ) : (
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
            )}
          </div>

          {/* CHATBOT CARD */}

          {/* <div className="dashboard-card chatbot-card">
            <h2 className="card-title">Farm Assistant</h2>
            <div className="chatbot-container">
              <div className="chat-messages">
                <div className="bot-message">
                  <MessageSquare size={16} />
                  <p>
                    Hello! I'm your farming assistant. How can I help you today?
                  </p>
                </div>
                 // Placeholder for future message history
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Ask me about farming..."
                  disabled={isDashboardLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target.value.trim() !== "") {
                      // Handle message sending when Enter is pressed
                      // This will connect to your ML backend in the future
                      console.log("Message sent:", e.target.value);
                      e.target.value = ""; // Clear input after sending
                    }
                  }}
                />
                <button
                  className="send-button"
                  disabled={isDashboardLoading}
                  onClick={() => {
                    const input = document.querySelector(".chat-input input");
                    if (input.value.trim() !== "") {
                      // Handle message sending when button is clicked
                      console.log("Message sent:", input.value);
                      input.value = ""; // Clear input after sending
                    }
                  }}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div> */}

          {/* Recent Activities card */}
          <div className="dashboard-card activity-card">
            <h2 className="card-title">Recent Activities</h2>
            {isDashboardLoading ? (
              <div className="activity-skeleton">
                {[...Array(3)].map((_, index) => (
                  <div className="skeleton-activity-item" key={index}>
                    <div className="skeleton-activity-header">
                      <div className="skeleton-icon">
                        <Skeleton circle width={24} height={24} />
                      </div>
                      <div className="skeleton-content">
                        <Skeleton width={180} height={18} />
                        <div className="skeleton-meta">
                          <Skeleton width={120} height={14} />
                          <Skeleton width={60} height={14} />
                        </div>
                      </div>
                    </div>
                    <div className="skeleton-result">
                      <Skeleton width="100%" height={30} />
                      <Skeleton
                        width={100}
                        height={24}
                        style={{ marginTop: "10px" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <>
                <div className="activity-list">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">
                        {activity.type === "crop" && <Tractor size={18} />}
                        {activity.type === "fertilizer" && (
                          <Droplets size={18} />
                        )}
                        {activity.type === "disease" && (
                          <Microscope size={18} />
                        )}
                      </div>
                      <div className="activity-details">
                        <div className="activity-title">{activity.title}</div>
                        <div className="activity-meta">
                          <span className="activity-date">
                            {new Date(activity.date).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                          <span
                            className={`activity-status status-${activity.status.toLowerCase()}`}
                          >
                            {activity.status}
                          </span>
                        </div>
                        {activity.result && (
                          <div className="activity-result">
                            <div className="result-summary">
                              {activity.type === "fertilizer"
                                ? parse(activity.result.split("<br/>")[0]) // Show first line as summary
                                : parse(activity.result)}
                            </div>

                            <button
                              className={`toggle-details-btn ${
                                expandedActivityId === activity.id
                                  ? "expanded"
                                  : ""
                              }`}
                              onClick={() =>
                                setExpandedActivityId(
                                  expandedActivityId === activity.id
                                    ? null
                                    : activity.id
                                )
                              }
                            >
                              {expandedActivityId === activity.id
                                ? "Show Less ↑"
                                : "Show Details ↓"}
                            </button>

                            {expandedActivityId === activity.id &&
                              activity.details && (
                                <div className="activity-details-expanded">
                                  {activity.type === "crop" && (
                                    <>
                                      <div className="details-grid">
                                        <div className="detail-item">
                                          <span className="detail-label-activity">
                                            Temperature
                                          </span>
                                          <span className="detail-value-activity">
                                            {
                                              activity.details.conditions
                                                .temperature
                                            }
                                            °C
                                          </span>
                                        </div>
                                        <div className="detail-item">
                                          <span className="detail-label-activity">
                                            Humidity
                                          </span>
                                          <span className="detail-value-activity">
                                            {
                                              activity.details.conditions
                                                .humidity
                                            }
                                            %
                                          </span>
                                        </div>
                                        <div className="detail-item">
                                          <span className="detail-label-activity">
                                            Soil Health
                                          </span>
                                          <span className="detail-value-activity">
                                            {
                                              activity.details.conditions
                                                .soil_health
                                            }
                                          </span>
                                        </div>
                                      </div>

                                      {/* alternative crops section */}
                                      {/* alternative crops section */}
                                      {((Array.isArray(
                                        activity.details.recommendations
                                      ) &&
                                        activity.details.recommendations
                                          .length > 1) ||
                                        (Array.isArray(
                                          activity.details.alternatives
                                        ) &&
                                          activity.details.alternatives.length >
                                            0)) && (
                                        <div className="alternative-crops-section">
                                          <h4 className="alternatives-title">
                                            Alternative Crops
                                          </h4>
                                          <div className="alternatives-text">
                                            {/* Combine all alternative crop names into a comma-separated string */}
                                            {(() => {
                                              // Get the main recommended crop name to exclude it
                                              const mainCropName =
                                                activity.result
                                                  ? activity.result
                                                      .replace(
                                                        "Recommended crop: ",
                                                        ""
                                                      )
                                                      .trim()
                                                  : "";

                                              // Get crop names from recommendations array (excluding the main crop)
                                              const recCrops = Array.isArray(
                                                activity.details.recommendations
                                              )
                                                ? activity.details.recommendations
                                                    .filter(
                                                      (rec) =>
                                                        rec.crop !==
                                                        mainCropName
                                                    )
                                                    .map((crop) => crop.crop)
                                                : [];

                                              // Get crop names from alternatives array (excluding the main crop)
                                              const altCrops = Array.isArray(
                                                activity.details.alternatives
                                              )
                                                ? activity.details.alternatives
                                                    .filter(
                                                      (alt) =>
                                                        alt.name !==
                                                        mainCropName
                                                    )
                                                    .map((alt) => alt.name)
                                                : [];

                                              // Create a Set to remove duplicates from combined arrays
                                              const uniqueCrops = [
                                                ...new Set([
                                                  ...recCrops,
                                                  ...altCrops,
                                                ]),
                                              ];

                                              // Return comma-separated string of unique alternative crops
                                              return uniqueCrops.join(", ");
                                            })()}
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {activity.type === "fertilizer" && (
                                    <>
                                      <div className="details-grid">
                                        <div className="detail-item">
                                          <span className="detail-label-activity">
                                            Nitrogen (N)
                                          </span>
                                          <span className="detail-value-activity">
                                            {activity.details.nitrogen} kg/ha
                                          </span>
                                        </div>
                                        <div className="detail-item">
                                          <span className="detail-label">
                                            Phosphorus (P)
                                          </span>
                                          <span className="detail-value-activity">
                                            {activity.details.phosphorus} kg/ha
                                          </span>
                                        </div>
                                        <div className="detail-item">
                                          <span className="detail-label-activity">
                                            Potassium (K)
                                          </span>
                                          <span className="detail-value-activity">
                                            {activity.details.potassium} kg/ha
                                          </span>
                                        </div>
                                      </div>
                                      <div className="recommendations">
                                        {parse(
                                          activity.result
                                            .split("<br/>")
                                            .slice(1)
                                            .join("<br/>")
                                        )}
                                      </div>
                                    </>
                                  )}
                                  {activity.type === "disease" && (
                                    <>
                                      <div className="disease-info">
                                        <div className="detail-item">
                                          <span className="detail-label-activity">
                                            Disease Name
                                          </span>
                                          <span className="detail-value-activity">
                                            {activity.details.disease_name}
                                          </span>
                                        </div>
                                        <div className="detail-item">
                                          <span className="detail-label-activity">
                                            Confidence
                                          </span>
                                          <span className="detail-value-activity">
                                            {activity.details.confidence}%
                                          </span>
                                        </div>
                                      </div>
                                      <div className="treatment-steps">
                                        {parse(
                                          activity.result
                                            .split("<br/>")
                                            .slice(1)
                                            .join("<br/>")
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pagination-controls">
                  {hasMoreActivities ? (
                    <button
                      className="load-more-button"
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="loading-spinner"></span>
                          Loading more...
                        </>
                      ) : (
                        "Load More Activities"
                      )}
                    </button>
                  ) : (
                    recentActivities.length > ACTIVITIES_PER_PAGE && (
                      <button
                        className="reset-button"
                        onClick={() => {
                          setCurrentPage(1);
                          setRecentActivities([]);
                          setHasMoreActivities(true);
                        }}
                      >
                        Back to Recent Activities
                      </button>
                    )
                  )}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <AlertCircle size={24} />
                <p>No recent activities</p>
              </div>
            )}
          </div>

          {/* Tips Card */}
          <div className="dashboard-card tips-card">
            <h2 className="card-title">Farming Tips</h2>
            {isDashboardLoading || isTipsLoading ? (
              <div className="tips-skeleton">
                {[...Array(3)].map((_, index) => (
                  <div className="skeleton-tip-item" key={index}>
                    <Skeleton width={180} height={24} />
                    <Skeleton
                      width="100%"
                      height={48}
                      style={{ marginTop: "8px" }}
                    />
                  </div>
                ))}
              </div>
            ) : farmingTips.length > 0 ? (
              <div className="tips-list">
                {farmingTips.map((tip) => (
                  <div className="tip-item" key={tip.id}>
                    <h3 className="tip-title">{tip.title}</h3>
                    <p className="tip-content">{parse(tip.content)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <AlertCircle size={24} />
                <p>No farming tips available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
