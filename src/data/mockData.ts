import { UserAnalytics, TimeSeriesData } from '../types/analytics';

export const mockUserData: UserAnalytics[] = [
  {
    customerName: "Naresh",
    sections: {
      backSeats: 2.8,
      steering: 3.5,
      carTyres: 8.6,
      door: 7.2,
      dashboard: 10.1,
      frontSeat: 11.93,
      dicky: 0,
      carBackSide: 0,
      chargingPort: 0,
      frontLight: 0
    },
    totalTime: 44.13,
    sessionDate: "2024-01-15T10:30:00Z",
    sessionId: "session_001"
  },
  {
    customerName: "Monasri",
    sections: {
      backSeats: 12.5,
      steering: 40.3,
      carTyres: 70.2,
      door: 60,
      dashboard: 88.85,
      frontSeat: 106.09,
      dicky: 0,
      carBackSide: 0,
      chargingPort: 0,
      frontLight: 0
    },
    totalTime: 377.94,
    sessionDate: "2024-01-15T14:20:00Z",
    sessionId: "session_002"
  },
  {
    customerName: "Michel",
    sections: {
      backSeats: 12,
      steering: 14.5,
      carTyres: 16,
      door: 18,
      dashboard: 20,
      frontSeat: 21.95,
      dicky: 0,
      carBackSide: 0,
      chargingPort: 0,
      frontLight: 0
    },
    totalTime: 102.45,
    sessionDate: "2024-01-16T09:15:00Z",
    sessionId: "session_003"
  }
];

export const mockTimeSeriesData: TimeSeriesData[] = [
  {
    date: "2024-01-15",
    totalSessions: 2,
    averageTime: 211.04,
    sections: {
      backSeats: 7.65,
      steering: 21.9,
      carTyres: 39.4,
      door: 33.6,
      dashboard: 49.48,
      frontSeat: 59.01,
      dicky: 0,
      carBackSide: 0,
      chargingPort: 0,
      frontLight: 0
    }
  },
  {
    date: "2024-01-16",
    totalSessions: 1,
    averageTime: 102.45,
    sections: {
      backSeats: 12,
      steering: 14.5,
      carTyres: 16,
      door: 18,
      dashboard: 20,
      frontSeat: 21.95,
      dicky: 0,
      carBackSide: 0,
      chargingPort: 0,
      frontLight: 0
    }
  }
];

// Function to generate additional mock data (not used when fetching from Google Sheets)
export const generateMockData = (count: number): UserAnalytics[] => {
  const names = [
    "Alex Thompson", "Maria Garcia", "James Wilson", "Anna Lee", 
    "Kevin Martinez", "Sophie Turner", "Daniel Kim", "Rachel Green"
  ];
  
  const data: UserAnalytics[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomName = names[Math.floor(Math.random() * names.length)];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    data.push({
      customerName: `${randomName}_${i}`,
      sections: {
        backSeats: Math.round((Math.random() * 15 + 5) * 10) / 10,
        steering: Math.round((Math.random() * 20 + 8) * 10) / 10,
        carTyres: Math.round((Math.random() * 18 + 6) * 10) / 10,
        door: Math.round((Math.random() * 25 + 5) * 10) / 10,
        dashboard: Math.round((Math.random() * 15 + 5) * 10) / 10,
        frontSeat: Math.round((Math.random() * 20 + 5) * 10) / 10,
        dicky: Math.round((Math.random() * 10 + 2) * 10) / 10,
        carBackSide: Math.round((Math.random() * 10 + 2) * 10) / 10,
        chargingPort: Math.round((Math.random() * 5 + 1) * 10) / 10,
        frontLight: Math.round((Math.random() * 8 + 2) * 10) / 10
      },
      totalTime: 0, // Will be calculated
      sessionDate: date.toISOString(),
      sessionId: `session_${String(i + 100).padStart(3, '0')}`
    });
    
    // Calculate total time
    const sections = data[data.length - 1].sections;
    data[data.length - 1].totalTime = Object.values(sections).reduce((sum, time) => sum + time, 0);
  }
  
  return data;
};
