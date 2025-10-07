import { UserAnalytics } from '../types/analytics';

// Extract sheet ID from environment variables
const SHEET_ID = process.env.REACT_APP_GOOGLE_SHEETS_ID || '1lf-VvqwQOrkA6NCEQkwWSkK9mfruEAbL66tvT6QUxWk';
const SHEET_GID = process.env.REACT_APP_GOOGLE_SHEETS_GID || '1318682208';
const SHEET_NAME = process.env.REACT_APP_GOOGLE_SHEETS_NAME || 'GazeData';

if (!process.env.REACT_APP_GOOGLE_SHEETS_ID) {
  console.warn('⚠️  REACT_APP_GOOGLE_SHEETS_ID not found in environment variables. Using fallback ID.');
}

export class GoogleSheetsService {
  private static instance: GoogleSheetsService;

  private constructor() {}

  public static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  // Fetch data directly from Google Sheets using CSV export
  public async fetchData(): Promise<UserAnalytics[]> {
    try {
      // Use the CSV export URL which doesn't require API key
      const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
      
      console.log('Fetching from URL:', csvUrl);
      
      const response = await fetch(csvUrl);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const csvText = await response.text();
      console.log('Raw CSV data (first 500 chars):', csvText.substring(0, 500));
      console.log('CSV length:', csvText.length);
      
      return this.parseCSVData(csvText);
    } catch (error) {
      console.error('Error fetching Google Sheets data:', error);
      console.error('Sheet ID:', SHEET_ID);
      console.error('Sheet GID:', SHEET_GID);
      // Return empty array on error - the dashboard will fall back to demo data
      return [];
    }
  }

  private parseCSVData(csvText: string): UserAnalytics[] {
    const lines = csvText.split('\n');
    if (lines.length < 2) return [];

    // Parse header row - keep exact case and spaces
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data: UserAnalytics[] = [];

    // Find column indices based on your exact headers (case and space sensitive)
    const timestampIndex = headers.findIndex(h => h === 'Timestamp');
    const customerNameIndex = headers.findIndex(h => h === 'Customer Name');
    const dashboardIndex = headers.findIndex(h => h === 'DashBoard');
    const steeringIndex = headers.findIndex(h => h === 'Sterring');
    const doorIndex = headers.findIndex(h => h === 'Door');
    const dickyIndex = headers.findIndex(h => h === 'Dicky');
    const frontSeatIndex = headers.findIndex(h => h === 'Front Seat');
    const backSeatsIndex = headers.findIndex(h => h === 'Back Seats');
    const carTyresIndex = headers.findIndex(h => h === 'Car Tyres');
    const carBackSideIndex = headers.findIndex(h => h === 'Car BackSide');
    const chargingPortIndex = headers.findIndex(h => h === 'Charging Port');
    const frontLightIndex = headers.findIndex(h => h === 'Front & Light');

    console.log('Headers found:', headers);
    console.log('Column indices:', {
      timestamp: timestampIndex,
      customerName: customerNameIndex,
      dashboard: dashboardIndex,
      steering: steeringIndex,
      door: doorIndex,
      dicky: dickyIndex,
      frontSeat: frontSeatIndex,
      backSeats: backSeatsIndex,
      carTyres: carTyresIndex,
      carBackSide: carBackSideIndex,
      chargingPort: chargingPortIndex,
      frontLight: frontLightIndex
    });

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.parseCSVLine(line);
      if (values.length < 3) { // Minimum expected columns (at least customer name and some data)
        continue;
      }

      const customerName = values[customerNameIndex] || `User ${i}`;
      const timestamp = values[timestampIndex] || new Date().toISOString();
      
      // Map all sections with fallback to 0 if missing
      const sections = {
        dashboard: this.parseNumericValue(values[dashboardIndex]),
        steering: this.parseNumericValue(values[steeringIndex]),
        door: this.parseNumericValue(values[doorIndex]),
        dicky: this.parseNumericValue(values[dickyIndex]),
        frontSeat: this.parseNumericValue(values[frontSeatIndex]),
        backSeats: this.parseNumericValue(values[backSeatsIndex]),
        carTyres: this.parseNumericValue(values[carTyresIndex]),
        carBackSide: this.parseNumericValue(values[carBackSideIndex]),
        chargingPort: this.parseNumericValue(values[chargingPortIndex]),
        frontLight: this.parseNumericValue(values[frontLightIndex])
      };

      // Calculate total time from all sections
      const totalTime = Object.values(sections).reduce((sum, time) => sum + time, 0);

      // Include all rows, even if totalTime is 0 (as requested)
      data.push({
        customerName: customerName.replace(/"/g, ''),
        sections,
        totalTime,
        sessionDate: timestamp,
        sessionId: `sheets_${customerName}_${i}`
      });
    }

    console.log(`Parsed ${data.length} records from Google Sheets`);
    return data;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private parseNumericValue(value: string): number {
    if (!value) return 0;
    const cleaned = value.replace(/"/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Method to test if the sheet is accessible
  public async testConnection(): Promise<boolean> {
    try {
      const data = await this.fetchData();
      return data.length > 0;
    } catch {
      return false;
    }
  }
}

export const googleSheetsService = GoogleSheetsService.getInstance();