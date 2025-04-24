import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
import { Plane as Plant, Droplets, Microscope, AlertCircle } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [userName, setUserName] = useState('User');

  // Sample data for demonstration
  const recentActivities = [
    { id: 1, type: 'crop', title: 'Rice Recommendation', date: '2025-06-02', status: 'Completed' },
    { id: 2, type: 'fertilizer', title: 'NPK Analysis', date: '2025-06-01', status: 'Completed' },
    { id: 3, type: 'disease', title: 'Leaf Spot Detection', date: '2025-05-28', status: 'Completed' }
  ];

  const weatherData = {
    location: 'Bangalore, India',
    temperature: '28°C',
    humidity: '65%',
    rainfall: '15mm',
    forecast: 'Partly Cloudy'
  };

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/current-user', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const firstName = data.user.name.split(' ')[0];
          setUserName(firstName);
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
        setUserName('User');
      }
    };

    fetchUserName();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Welcome, {userName}  👋</h1>
          <p className="dashboard-subtitle">Your agricultural assistant dashboard</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card quick-actions">
            <h2 className="card-title">Quick Actions</h2>
            <div className="quick-actions-grid">
              <Link to="/crop" className="quick-action-item">
                <div className="quick-action-icon">
                  <Plant size={24} />
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
                  {/* Weather icon based on forecast */}
                  {weatherData.forecast === 'Partly Cloudy' && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="4"></circle>
                      <path d="M12 2v2"></path>
                      <path d="M12 20v2"></path>
                      <path d="m4.93 4.93 1.41 1.41"></path>
                      <path d="m17.66 17.66 1.41 1.41"></path>
                      <path d="M2 12h2"></path>
                      <path d="M20 12h2"></path>
                      <path d="m6.34 17.66-1.41 1.41"></path>
                      <path d="m19.07 4.93-1.41 1.41"></path>
                    </svg>
                  )}
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
                {recentActivities.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === 'crop' && <Plant size={18} />}
                      {activity.type === 'fertilizer' && <Droplets size={18} />}
                      {activity.type === 'disease' && <Microscope size={18} />}
                    </div>
                    <div className="activity-details">
                      <div className="activity-title">{activity.title}</div>
                      <div className="activity-meta">
                        <span className="activity-date">{activity.date}</span>
                        <span className="activity-status">{activity.status}</span>
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
                <p className="tip-content">Regularly test your soil to maintain optimal pH levels between 6.0-7.0 for most crops.</p>
              </div>
              
              <div className="tip-item">
                <h3 className="tip-title">Water Conservation</h3>
                <p className="tip-content">Use drip irrigation to reduce water usage by up to 60% compared to traditional methods.</p>
              </div>
              
              <div className="tip-item">
                <h3 className="tip-title">Seasonal Planning</h3>
                <p className="tip-content">Plan your crop rotation to maximize soil nutrients and minimize pest pressure.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;