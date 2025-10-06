import React, { useState, useEffect } from 'react';
import { UserAnalytics } from '../types/analytics';
import { googleSheetsService } from '../services/googleSheets';
import UserAnalyticsModal from './UserAnalyticsModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const CarAnalyticsDashboard: React.FC = () => {
  const [userData, setUserData] = useState<UserAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedUser, setSelectedUser] = useState<UserAnalytics | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch data from Google Sheets
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const sheetsData = await googleSheetsService.fetchData();
        console.log('Loaded data from Google Sheets:', sheetsData);
        setUserData(sheetsData);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching Google Sheets data:', error);
        setUserData([]); // Set empty array if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []); // Remove dependency on useRealData

  // Calculate statistics
  const totalUsers = userData.length;
  const averageSessionTime = totalUsers > 0 
    ? userData.reduce((sum, user) => sum + user.totalTime, 0) / totalUsers 
    : 0;
  
  // Calculate section averages
  const sectionAverages = {
    backSeats: totalUsers > 0 ? userData.reduce((sum, user) => sum + user.sections.backSeats, 0) / totalUsers : 0,
    steering: totalUsers > 0 ? userData.reduce((sum, user) => sum + user.sections.steering, 0) / totalUsers : 0,
    carTyres: totalUsers > 0 ? userData.reduce((sum, user) => sum + user.sections.carTyres, 0) / totalUsers : 0,
    door: totalUsers > 0 ? userData.reduce((sum, user) => sum + user.sections.door, 0) / totalUsers : 0,
    dashboard: totalUsers > 0 ? userData.reduce((sum, user) => sum + user.sections.dashboard, 0) / totalUsers : 0,
    frontSeat: totalUsers > 0 ? userData.reduce((sum, user) => sum + user.sections.frontSeat, 0) / totalUsers : 0,
  };

  const mostViewedSection = Object.entries(sectionAverages).reduce((max, [key, value]) => 
    value > sectionAverages[max as keyof typeof sectionAverages] ? key : max, 'backSeats'
  );

  // Prepare chart data
  const chartData = Object.entries(sectionAverages).map(([name, value]) => ({
    name: getDisplayName(name),
    value: parseFloat(value.toFixed(1)),
    color: getColor(name)
  }));

  // Handle user click to show detailed analytics
  const handleUserClick = (user: UserAnalytics) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  // Generate overall insights based on all user data
  const generateOverallInsights = (allUsers: UserAnalytics[]) => {
    if (allUsers.length === 0) return [];
    
    const insights: string[] = [];
    
    // Calculate engagement patterns
    const totalSessions = allUsers.length;
    const avgSessionTime = allUsers.reduce((sum, user) => sum + user.totalTime, 0) / totalSessions;
    
    // Find peak engagement times
    const longSessions = allUsers.filter(user => user.totalTime > avgSessionTime * 1.5).length;
    
    // Section popularity analysis
    const sectionTotals = {
      steering: allUsers.reduce((sum, user) => sum + user.sections.steering, 0),
      dashboard: allUsers.reduce((sum, user) => sum + user.sections.dashboard, 0),
      frontSeat: allUsers.reduce((sum, user) => sum + user.sections.frontSeat, 0),
      backSeats: allUsers.reduce((sum, user) => sum + user.sections.backSeats, 0),
      door: allUsers.reduce((sum, user) => sum + user.sections.door, 0),
      carTyres: allUsers.reduce((sum, user) => sum + user.sections.carTyres, 0)
    };
    
    const mostPopular = Object.entries(sectionTotals).reduce((max, [key, value]) => 
      value > sectionTotals[max[0] as keyof typeof sectionTotals] ? [key, value] : max,
      Object.entries(sectionTotals)[0]
    );
    
    const leastPopular = Object.entries(sectionTotals).reduce((min, [key, value]) => 
      value < sectionTotals[min[0] as keyof typeof sectionTotals] ? [key, value] : min,
      Object.entries(sectionTotals)[0]
    );
    
    // Generate insights
    if (totalSessions >= 10) {
      insights.push(`🚀 Strong user engagement with ${totalSessions} total AR/VR sessions! The platform is gaining good traction.`);
    } else if (totalSessions >= 5) {
      insights.push(`📈 Growing user base with ${totalSessions} sessions. Continue to monitor engagement trends.`);
    }
    
    if (avgSessionTime > 30) {
      insights.push(`⏱️ Excellent user engagement with ${avgSessionTime.toFixed(1)}s average session time, indicating high interest in the AR/VR experience.`);
    } else if (avgSessionTime > 15) {
      insights.push(`🕰️ Good user engagement with ${avgSessionTime.toFixed(1)}s average session time. Users are spending quality time exploring.`);
    } else {
      insights.push(`⚡ Quick exploration pattern with ${avgSessionTime.toFixed(1)}s average session time. Users may be efficiently finding what they need.`);
    }
    
    if (longSessions > totalSessions * 0.3) {
      insights.push(`🎆 ${Math.round((longSessions/totalSessions)*100)}% of users are highly engaged, spending significantly more time than average exploring the car.`);
    }
    
    insights.push(`🏆 ${getDisplayName(mostPopular[0])} is the most popular section, capturing ${((mostPopular[1] as number) / allUsers.reduce((sum, user) => sum + user.totalTime, 0) * 100).toFixed(1)}% of total viewing time.`);
    
    if ((mostPopular[1] as number) > (leastPopular[1] as number) * 3) {
      insights.push(`📉 Significant preference disparity: ${getDisplayName(mostPopular[0])} receives ${((mostPopular[1] as number) / (leastPopular[1] as number)).toFixed(1)}x more attention than ${getDisplayName(leastPopular[0])}.`);
    }
    
    // Interior vs Exterior preference
    const totalInterior = allUsers.reduce((sum, user) => sum + user.sections.steering + user.sections.dashboard + user.sections.frontSeat + user.sections.backSeats, 0);
    const totalExterior = allUsers.reduce((sum, user) => sum + user.sections.door + user.sections.carTyres, 0);
    
    if (totalInterior > totalExterior * 1.5) {
      insights.push(`🚗 Users show strong preference for interior features, spending ${((totalInterior / (totalInterior + totalExterior)) * 100).toFixed(0)}% of time on interior elements.`);
    } else if (totalExterior > totalInterior * 1.5) {
      insights.push(`🎆 Users are more interested in exterior features, focusing ${((totalExterior / (totalInterior + totalExterior)) * 100).toFixed(0)}% of time on external elements.`);
    } else {
      insights.push(`⚖️ Balanced interest in both interior and exterior features, showing comprehensive car exploration behavior.`);
    }
    
    return insights;
  };
  
  const overallInsights = generateOverallInsights(userData);

  function getDisplayName(sectionName: string): string {
    const displayNames = {
      backSeats: 'Back Seats',
      steering: 'Steering',
      carTyres: 'Car Tyres',
      door: 'Door',
      dashboard: 'Dashboard',
      frontSeat: 'Front Seat'
    };
    return displayNames[sectionName as keyof typeof displayNames] || sectionName;
  }

  function getColor(sectionName: string): string {
    const colors = {
      backSeats: '#3b82f6',   // Blue
      steering: '#ef4444',    // Red  
      carTyres: '#10b981',    // Green
      door: '#8b5cf6',        // Purple
      dashboard: '#f59e0b',   // Orange
      frontSeat: '#06b6d4'    // Cyan
    };
    return colors[sectionName as keyof typeof colors] || '#8884d8';
  }

  // Styles
  const dashboardStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '1.5rem 2rem',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    border: '1px solid #e5e7eb',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  };


  return (
    <div style={dashboardStyle}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: '0', fontSize: '2rem', fontWeight: '700', color: '#111827' }}>
              🚗 Car Analytics Dashboard
            </h1>
            <p style={{ margin: '0.5rem 0 0', color: '#6b7280' }}>
              Real-time viewing analytics from AR/VR car sessions
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Last Updated: {lastUpdated.toLocaleTimeString()}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Auto-refresh: Every 30s
            </div>
          </div>
        </div>
      </header>

      <div style={containerStyle}>
        {loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            backgroundColor: 'white', 
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '1.125rem', color: '#3b82f6', marginBottom: '0.5rem' }}>
              🔄 Loading data from Google Sheets...
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Fetching real-time analytics data
            </div>
          </div>
        )}

        {/* Key Stats */}
        <div style={gridStyle}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>👥</span>
              <h3 style={{ margin: '0', color: '#111827', fontSize: '1.125rem' }}>Total Users</h3>
            </div>
            <p style={{ margin: '0', fontSize: '2.5rem', fontWeight: '700', color: '#3b82f6' }}>
              {totalUsers}
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
              Active AR/VR sessions
            </p>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>⏱️</span>
              <h3 style={{ margin: '0', color: '#111827', fontSize: '1.125rem' }}>Average Session Time</h3>
            </div>
            <p style={{ margin: '0', fontSize: '2.5rem', fontWeight: '700', color: '#10b981' }}>
              {averageSessionTime.toFixed(1)}s
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
              Per user session
            </p>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🔥</span>
              <h3 style={{ margin: '0', color: '#111827', fontSize: '1.125rem' }}>Most Viewed</h3>
            </div>
            <p style={{ margin: '0', fontSize: '1.75rem', fontWeight: '700', color: '#f59e0b' }}>
              {getDisplayName(mostViewedSection)}
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
              {sectionAverages[mostViewedSection as keyof typeof sectionAverages].toFixed(1)}s average
            </p>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>📊</span>
              <h3 style={{ margin: '0', color: '#111827', fontSize: '1.125rem' }}>Data Source</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: userData.length > 0 ? '#10b981' : '#ef4444',
                boxShadow: userData.length > 0 ? '0 0 0 2px rgba(16, 185, 129, 0.3)' : '0 0 0 2px rgba(239, 68, 68, 0.3)'
              }}></div>
              <span style={{ fontWeight: '600', color: userData.length > 0 ? '#10b981' : '#ef4444' }}>
                {userData.length > 0 ? '✅ Connected' : '❌ No Data'}
              </span>
            </div>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
              Google Sheets live connection
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Bar Chart */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 1.5rem', color: '#111827', fontSize: '1.25rem' }}>
              📊 Average Time by Car Section
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis label={{ value: 'Time (seconds)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value) => [`${value}s`, 'Average Time']}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 1.5rem', color: '#111827', fontSize: '1.25rem' }}>
              🥧 Viewing Time Distribution
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value}s`, 'Average Time']}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overall Insights */}
        {overallInsights.length > 0 && (
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 1.5rem', color: '#111827', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🤖 AI-Powered Overall Insights
              <span style={{ 
                fontSize: '0.75rem', 
                backgroundColor: '#3b82f6', 
                color: 'white', 
                padding: '0.25rem 0.5rem', 
                borderRadius: '0.25rem',
                fontWeight: '600'
              }}>LIVE</span>
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {overallInsights.map((insight, index) => (
                <div 
                  key={index} 
                  style={{
                    padding: '1rem 1.25rem',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    borderRadius: '0.75rem',
                    borderLeft: '4px solid #3b82f6',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onMouseOver={(e) => {
                    const div = e.target as HTMLDivElement;
                    div.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.15)';
                    div.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    const div = e.target as HTMLDivElement;
                    div.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                    div.style.transform = 'translateY(0)';
                  }}
                >
                  {insight}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Data Table */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0', color: '#111827', fontSize: '1.25rem' }}>
              📋 User Sessions ({userData.length} total)
            </h3>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
              💡 Click on any user button to view detailed analytics & insights
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Customer</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'right', borderBottom: '2px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Total Time</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'right', borderBottom: '2px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Back Seats</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'right', borderBottom: '2px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Steering</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'right', borderBottom: '2px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Car Tyres</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'right', borderBottom: '2px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Door</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'right', borderBottom: '2px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Dashboard</th>
                  <th style={{ padding: '1rem 0.75rem', textAlign: 'right', borderBottom: '2px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Front Seat</th>
                </tr>
              </thead>
              <tbody>
                {userData.map((user, index) => (
                  <tr key={user.sessionId} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                      <button
                        onClick={() => handleUserClick(user)}
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          border: 'none',
                          borderRadius: '0.5rem',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '0.875rem',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onMouseOver={(e) => {
                          const btn = e.target as HTMLButtonElement;
                          btn.style.transform = 'translateY(-1px)';
                          btn.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                          btn.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)';
                        }}
                        onMouseOut={(e) => {
                          const btn = e.target as HTMLButtonElement;
                          btn.style.transform = 'translateY(0)';
                          btn.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
                          btn.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
                        }}
                        title={`Click to view ${user.customerName}'s detailed analytics`}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>📊</span>
                          {user.customerName}
                        </span>
                      </button>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontWeight: '600', color: '#3b82f6' }}>
                      {user.totalTime.toFixed(1)}s
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                      {user.sections.backSeats.toFixed(1)}s
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                      {user.sections.steering.toFixed(1)}s
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                      {user.sections.carTyres.toFixed(1)}s
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                      {user.sections.door.toFixed(1)}s
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                      {user.sections.dashboard.toFixed(1)}s
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                      {user.sections.frontSeat.toFixed(1)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* User Analytics Modal */}
      {selectedUser && (
        <UserAnalyticsModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          allUsersData={userData}
        />
      )}
    </div>
  );
};

export default CarAnalyticsDashboard;