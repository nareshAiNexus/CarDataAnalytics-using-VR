import React from 'react';
import { UserAnalytics, SECTION_COLORS } from '../types/analytics';
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { X, TrendingUp, Eye, Clock, Target } from 'lucide-react';

interface UserAnalyticsModalProps {
  user: UserAnalytics;
  isOpen: boolean;
  onClose: () => void;
  allUsersData: UserAnalytics[];
}

const UserAnalyticsModal: React.FC<UserAnalyticsModalProps> = ({ 
  user, 
  isOpen, 
  onClose, 
  allUsersData 
}) => {
  // Handle escape key press
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate user-specific insights
  const generateInsights = (userData: UserAnalytics, allUsers: UserAnalytics[]) => {
    const insights: string[] = [];
    const sections = userData.sections;
    
    // Calculate percentiles against all users
    const totalTimePercentile = calculatePercentile(userData.totalTime, allUsers.map(u => u.totalTime));
    const mostEngagedSection = Object.entries(sections).reduce((max, [key, value]) => 
      value > sections[max[0] as keyof typeof sections] ? [key, value] : max, 
      Object.entries(sections)[0]
    );
    
    const leastEngagedSection = Object.entries(sections).reduce((min, [key, value]) => 
      value < sections[min[0] as keyof typeof sections] ? [key, value] : min, 
      Object.entries(sections)[0]
    );

    // Generate insights based on data patterns
    if (totalTimePercentile > 75) {
      insights.push("🌟 This user spent significantly more time exploring the car than 75% of other users, showing high engagement!");
    } else if (totalTimePercentile < 25) {
      insights.push("⚡ This was a quick exploration session, spending less time than 75% of users. They may have found what they needed efficiently.");
    }

    const sectionEngagement = mostEngagedSection[1] / userData.totalTime * 100;
    if (sectionEngagement > 40) {
      insights.push(`🎯 Highly focused on ${getDisplayName(mostEngagedSection[0])}, spending ${sectionEngagement.toFixed(0)}% of total time there. This suggests strong interest in this area.`);
    }

    if (mostEngagedSection[1] > leastEngagedSection[1] * 3) {
      insights.push(`📊 Shows clear preference patterns: ${getDisplayName(mostEngagedSection[0])} received ${(mostEngagedSection[1] / leastEngagedSection[1]).toFixed(1)}x more attention than ${getDisplayName(leastEngagedSection[0])}.`);
    }

    // Behavioral pattern insights
    const exteriorTime = sections.carTyres + sections.door;
    const interiorTime = sections.backSeats + sections.frontSeat + sections.dashboard + sections.steering;
    
    if (exteriorTime > interiorTime) {
      insights.push("🚗 Exterior-focused viewer: Spent more time examining the car's external features than interior components.");
    } else if (interiorTime > exteriorTime * 2) {
      insights.push("🪑 Interior enthusiast: Showed strong preference for exploring the car's interior features and comfort elements.");
    }

    // Time distribution insights
    const sections_array = Object.values(sections);
    const maxTime = Math.max(...sections_array);
    const minTime = Math.min(...sections_array);
    const timeVariation = (maxTime - minTime) / userData.totalTime;
    
    if (timeVariation < 0.3) {
      insights.push("⚖️ Balanced exploration style: Distributed time relatively evenly across all car sections, showing thorough examination habits.");
    } else if (timeVariation > 0.6) {
      insights.push("🎯 Selective explorer: Shows highly focused viewing behavior with clear section preferences.");
    }

    return insights;
  };

  const calculatePercentile = (value: number, dataset: number[]): number => {
    const sorted = dataset.slice().sort((a, b) => a - b);
    const rank = sorted.findIndex(v => v >= value) + 1;
    return (rank / sorted.length) * 100;
  };

  const getDisplayName = (sectionName: string): string => {
    const displayNames: { [key: string]: string } = {
      backSeats: 'Back Seats',
      steering: 'Steering',
      carTyres: 'Car Tyres',
      door: 'Door',
      dashboard: 'Dashboard',
      frontSeat: 'Front Seat'
    };
    return displayNames[sectionName] || sectionName;
  };

  // Prepare chart data
  const sectionsChartData = Object.entries(user.sections).map(([name, value]) => ({
    section: getDisplayName(name),
    time: value,
    percentage: ((value / user.totalTime) * 100).toFixed(1),
    color: SECTION_COLORS[name as keyof typeof SECTION_COLORS]
  }));

  // Radar chart data
  const radarData = Object.entries(user.sections).map(([name, value]) => ({
    section: getDisplayName(name),
    value: value,
    fullMark: Math.max(...Object.values(user.sections)) * 1.2
  }));

  // Calculate comparison with average user
  const averageUser = {
    totalTime: allUsersData.reduce((sum, u) => sum + u.totalTime, 0) / allUsersData.length,
    sections: {
      backSeats: allUsersData.reduce((sum, u) => sum + u.sections.backSeats, 0) / allUsersData.length,
      steering: allUsersData.reduce((sum, u) => sum + u.sections.steering, 0) / allUsersData.length,
      carTyres: allUsersData.reduce((sum, u) => sum + u.sections.carTyres, 0) / allUsersData.length,
      door: allUsersData.reduce((sum, u) => sum + u.sections.door, 0) / allUsersData.length,
      dashboard: allUsersData.reduce((sum, u) => sum + u.sections.dashboard, 0) / allUsersData.length,
      frontSeat: allUsersData.reduce((sum, u) => sum + u.sections.frontSeat, 0) / allUsersData.length,
    }
  };

  const comparisonData = Object.entries(user.sections).map(([name, value]) => ({
    section: getDisplayName(name),
    userTime: value,
    averageTime: averageUser.sections[name as keyof typeof averageUser.sections],
    difference: ((value - averageUser.sections[name as keyof typeof averageUser.sections]) / averageUser.sections[name as keyof typeof averageUser.sections] * 100).toFixed(0)
  }));

  const insights = generateInsights(user, allUsersData);

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  };

  const contentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '1rem',
    maxWidth: '95vw',
    maxHeight: '95vh',
    width: '1200px',
    overflowY: 'auto',
    position: 'relative',
    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
  };

  const headerStyle: React.CSSProperties = {
    padding: '2rem 2rem 1rem',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    backgroundColor: 'white',
    zIndex: 10
  };

  const bodyStyle: React.CSSProperties = {
    padding: '2rem'
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
  };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: '0', fontSize: '2rem', fontWeight: '700', color: '#111827' }}>
                📊 {user.customerName}'s Analytics
              </h2>
              <p style={{ margin: '0.5rem 0 0', color: '#6b7280', fontSize: '1rem' }}>
                Detailed AR/VR car viewing session analysis
              </p>
            </div>
            <button 
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                color: '#6b7280',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div style={bodyStyle}>
          {/* Key Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <Clock style={{ margin: '0 auto 0.5rem', color: '#3b82f6' }} size={24} />
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>
                {user.totalTime.toFixed(1)}s
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Session Time</div>
            </div>
            
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <Eye style={{ margin: '0 auto 0.5rem', color: '#10b981' }} size={24} />
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
                {Object.values(user.sections).filter(v => v > 0).length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Sections Explored</div>
            </div>
            
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <Target style={{ margin: '0 auto 0.5rem', color: '#f59e0b' }} size={24} />
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
                {getDisplayName(Object.entries(user.sections).reduce((max, [key, value]) => 
                  value > user.sections[max[0] as keyof typeof user.sections] ? [key, value] : max, 
                  Object.entries(user.sections)[0]
                )[0])}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Most Viewed Section</div>
            </div>
            
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <TrendingUp style={{ margin: '0 auto 0.5rem', color: '#8b5cf6' }} size={24} />
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#8b5cf6' }}>
                {calculatePercentile(user.totalTime, allUsersData.map(u => u.totalTime)).toFixed(0)}%
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Engagement Percentile</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* User's Section Time Distribution */}
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: '600' }}>
                🎯 Section Time Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sectionsChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ section, percentage }) => `${section}: ${percentage}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="time"
                  >
                    {sectionsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}s`, 'Time']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Radar Chart - User Profile */}
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: '600' }}>
                🕸️ Viewing Profile
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="section" />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 'dataMax']} 
                    tickFormatter={(value) => `${value.toFixed(0)}s`}
                  />
                  <Radar
                    name="Time Spent"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}s`, 'Time']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparison Chart */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: '600' }}>
              📈 Comparison vs Average User
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="section" />
                <YAxis label={{ value: 'Time (seconds)', angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value, name) => [
                    `${Number(value).toFixed(1)}s`, 
                    name === 'userTime' ? 'This User' : 'Average User'
                  ]}
                />
                <Bar dataKey="averageTime" fill="#e5e7eb" name="Average User" />
                <Bar dataKey="userTime" fill="#3b82f6" name="This User" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* AI-Generated Insights */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: '600' }}>
              🤖 AI-Generated Insights
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {insights.map((insight, index) => (
                <div 
                  key={index} 
                  style={{
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '0.5rem',
                    borderLeft: '4px solid #3b82f6',
                    fontSize: '0.9rem',
                    lineHeight: '1.5'
                  }}
                >
                  {insight}
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Section Breakdown */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: '600' }}>
              📋 Detailed Section Breakdown
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Section</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Time</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>% of Session</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>vs Average</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((item, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', fontWeight: '500' }}>
                        {item.section}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                        {item.userTime.toFixed(1)}s
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                        {((item.userTime / user.totalTime) * 100).toFixed(1)}%
                      </td>
                      <td style={{ 
                        padding: '0.75rem', 
                        textAlign: 'right', 
                        borderBottom: '1px solid #e5e7eb',
                        color: Number(item.difference) > 0 ? '#10b981' : '#ef4444',
                        fontWeight: '600'
                      }}>
                        {Number(item.difference) > 0 ? '+' : ''}{item.difference}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAnalyticsModal;