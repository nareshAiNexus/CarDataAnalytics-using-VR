import { UserAnalytics } from '../types/analytics';

// Extract sheet ID from environment variables
const SHEET_ID = process.env.REACT_APP_GOOGLE_SHEETS_ID || '11W6vDoREHNMCNhaPNh50VBQ69iprItV9Ei2vsDh-JTE';
const SHEET_NAME = process.env.REACT_APP_GOOGLE_SHEETS_NAME || 'car-data-analytics';

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
      const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
      
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      return this.parseCSVData(csvText);
    } catch (error) {
      console.error('Error fetching Google Sheets data:', error);
      // Return empty array on error - the dashboard will fall back to demo data
      return [];
    }
  }

  private parseCSVData(csvText: string): UserAnalytics[] {
    const lines = csvText.split('\n');
    if (lines.length < 2) return [];

    // Parse header row
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
    const data: UserAnalytics[] = [];

    // Find column indices based on your exact headers
    const customerIdIndex = headers.findIndex(h => h.includes('customerid'));
    const customerNameIndex = headers.findIndex(h => h.includes('customername'));
    const backSeatsIndex = headers.findIndex(h => h.includes('backseats'));
    const steeringIndex = headers.findIndex(h => h.includes('steering'));
    const carTyresIndex = headers.findIndex(h => h.includes('cartyres'));
    const doorIndex = headers.findIndex(h => h.includes('door'));
    const dashboardIndex = headers.findIndex(h => h.includes('dashboard'));
    const frontSeatIndex = headers.findIndex(h => h.includes('frontseat'));
    const totalTimeIndex = headers.findIndex(h => h.includes('totaltime'));

    console.log('Headers found:', headers);
    console.log('Column indices:', {
      customerId: customerIdIndex,
      customerName: customerNameIndex,
      backSeats: backSeatsIndex,
      steering: steeringIndex,
      carTyres: carTyresIndex,
      door: doorIndex,
      dashboard: dashboardIndex,
      frontSeat: frontSeatIndex,
      totalTime: totalTimeIndex
    });

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.parseCSVLine(line);
      if (values.length < 7) { // Minimum expected columns
        continue;
      }

      const customerId = values[customerIdIndex] || i.toString();
      const customerName = values[customerNameIndex] || `User ${customerId}`;
      
      // Map your actual data columns directly
      const sections = {
        backSeats: this.parseNumericValue(values[backSeatsIndex]),
        steering: this.parseNumericValue(values[steeringIndex]),
        carTyres: this.parseNumericValue(values[carTyresIndex]),
        door: this.parseNumericValue(values[doorIndex]),
        dashboard: this.parseNumericValue(values[dashboardIndex]),
        frontSeat: this.parseNumericValue(values[frontSeatIndex])
      };

      // Use the TotalTime from your sheet if available, otherwise calculate
      const totalTime = totalTimeIndex >= 0 
        ? this.parseNumericValue(values[totalTimeIndex])
        : Object.values(sections).reduce((sum, time) => sum + time, 0);

      if (totalTime > 0) { // Only include rows with actual data
        data.push({
          customerName: customerName.replace(/"/g, ''),
          sections,
          totalTime,
          sessionDate: new Date().toISOString(),
          sessionId: `sheets_${customerId}`
        });
      }
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