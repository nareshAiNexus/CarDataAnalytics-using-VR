export interface CarSection {
  backSeats: number;
  steering: number;
  carTyres: number;
  door: number;
  dashboard: number;
  frontSeat: number;
}

export interface UserAnalytics {
  customerName: string;
  sections: CarSection;
  totalTime: number;
  sessionDate: string;
  sessionId: string;
}

export interface AggregateData {
  totalUsers: number;
  averageSessionTime: number;
  mostViewedSection: string;
  leastViewedSection: string;
  sectionAverages: CarSection;
}

export interface SectionStats {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface TimeSeriesData {
  date: string;
  totalSessions: number;
  averageTime: number;
  sections: CarSection;
}

export const CAR_SECTIONS = [
  'backSeats',
  'steering',
  'carTyres',
  'door',
  'dashboard',
  'frontSeat'
] as const;

export const SECTION_COLORS = {
  backSeats: '#3b82f6',
  steering: '#ef4444',
  carTyres: '#10b981',
  door: '#8b5cf6',
  dashboard: '#f59e0b',
  frontSeat: '#06b6d4'
} as const;
