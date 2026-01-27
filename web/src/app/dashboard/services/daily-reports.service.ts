import { api } from "../../../shared/services/api";

export interface DailyReport {
  id: string;
  date: string;
  openingBalance: string;
  finalBalance: string | null;
  status: 'OPEN' | 'CLOSED';
  movements: any[];
}

class DailyReportsService {
  async getToday() {
    const response = await api.get<DailyReport | null>('/daily-reports/today');
    return response.data;
  }

  async startDay(openingBalance: number) {
    const response = await api.post<DailyReport>('/daily-reports/start', {
      openingBalance
    });
    return response.data;
  }
}

export const dailyReportsService = new DailyReportsService();