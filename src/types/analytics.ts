export interface CarSection {
  dashboard: number;
  steering: number;
  door: number;
  dicky: number;
  frontSeat: number;
  backSeats: number;
  carTyres: number;
  carBackSide: number;
  chargingPort: number;
  frontLight: number;
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
  'dashboard',
  'steering',
  'door',
  'dicky',
  'frontSeat',
  'backSeats',
  'carTyres',
  'carBackSide',
  'chargingPort',
  'frontLight'
] as const;

export const SECTION_COLORS = {
  dashboard: '#f59e0b',
  steering: '#ef4444',
  door: '#8b5cf6',
  dicky: '#ec4899',
  frontSeat: '#06b6d4',
  backSeats: '#3b82f6',
  carTyres: '#10b981',
  carBackSide: '#f97316',
  chargingPort: '#84cc16',
  frontLight: '#eab308'
} as const;
