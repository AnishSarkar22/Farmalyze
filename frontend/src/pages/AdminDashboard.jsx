import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Users, FileText, Activity, Search } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { currentUser } = useAuth();

  // Mock data for the admin dashboard
  const stats = [
    { id: 1, title: 'Total Users', value: 124, icon: <Users size={24} />, change: '+12%' },
    { id: 2, title: 'Crop Analyses', value: 843, icon: <FileText size={24} />, change: '+8%' },
    { id: 3, title: 'Fertilizer Analyses', value: 567, icon: <Activity size={24} />, change: '+15%' },
    { id: 4, title: 'Disease Detections', value: 231, icon: <Search size={24} />, change: '+24%' }
  ];

  const recentUsers = [
    { id: 1, name: 'Raj Sharma', email: 'raj.sharma@example.com', location: 'Bangalore', joined: '2025-06-01' },
    { id: 2, name: 'Priya Patel', email: 'priya.patel@example.com', location: 'Mumbai', joined: '2025-05-30' },
    { id: 3, name: 'Amit Kumar', email: 'amit.kumar@example.com', location: 'Delhi', joined: '2025-05-28' },
    { id: 4, name: 'Sunita Reddy', email: 'sunita.reddy@example.com', location: 'Hyderabad', joined: '2025-05-25' },
    { id: 5, name: 'Karthik Menon', email: 'karthik.m@example.com', location: 'Chennai', joined: '2025-05-24' }
  ];

  const popularCrops = [
    { id: 1, name: 'Rice', count: 245, percentage: 29 },
    { id: 2, name: 'Wheat', count: 187, percentage: 22 },
    { id: 3, name: 'Cotton', count: 124, percentage: 15 },
    { id: 4, name: 'Maize', count: 98, percentage: 12 },
    { id: 5, name: 'Sugarcane', count: 76, percentage: 9 }
  ];

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">Welcome back, {currentUser?.name || 'Admin'}</p>
          </div>
          <div className="admin-date">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        <div className="stats-grid">
          {stats.map(stat => (
            <div key={stat.id} className="stat-card">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-content">
                <h3 className="stat-title">{stat.title}</h3>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-change">{stat.change} this month</div>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-grid">
          <div className="admin-card users-table">
            <div className="card-header">
              <h2 className="card-title">Recent Users</h2>
              <button className="btn btn-outline btn-sm">View All</button>
            </div>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Location</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.location}</td>
                      <td>{user.joined}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-card crop-stats">
            <div className="card-header">
              <h2 className="card-title">Popular Crops</h2>
              <button className="btn btn-outline btn-sm">Details</button>
            </div>
            
            <div className="crops-list">
              {popularCrops.map(crop => (
                <div key={crop.id} className="crop-item">
                  <div className="crop-info">
                    <div className="crop-name">{crop.name}</div>
                    <div className="crop-count">{crop.count} analyses</div>
                  </div>
                  <div className="crop-percentage">
                    <div className="percentage-bar">
                      <div 
                        className="percentage-fill" 
                        style={{width: `${crop.percentage}%`}}
                      ></div>
                    </div>
                    <span>{crop.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card analytics-chart">
            <div className="card-header">
              <h2 className="card-title">Monthly Analytics</h2>
              <div className="chart-controls">
                <select className="form-select chart-select">
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="1year">Last Year</option>
                </select>
              </div>
            </div>
            
            <div className="chart-container">
              <BarChart size={280} />
              <div className="chart-placeholder">
                <p>Chart visualization showing usage metrics over time</p>
                <p className="chart-note">Data includes crop recommendations, fertilizer analyses, and disease detections</p>
              </div>
            </div>
          </div>

          <div className="admin-card system-status">
            <div className="card-header">
              <h2 className="card-title">System Status</h2>
              <span className="status-badge">All Systems Operational</span>
            </div>
            
            <div className="status-list">
              <div className="status-item">
                <div className="status-name">API Server</div>
                <div className="status-indicator online">Online</div>
              </div>
              <div className="status-item">
                <div className="status-name">Database</div>
                <div className="status-indicator online">Online</div>
              </div>
              <div className="status-item">
                <div className="status-name">ML Models</div>
                <div className="status-indicator online">Online</div>
              </div>
              <div className="status-item">
                <div className="status-name">Storage</div>
                <div className="status-indicator online">Online</div>
              </div>
            </div>
            
            <div className="uptime-info">
              <div className="uptime-label">Uptime (30 days):</div>
              <div className="uptime-value">99.97%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;