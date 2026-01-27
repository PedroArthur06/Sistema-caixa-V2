import { api } from "../../../shared/services/api";

export interface Company {
  id: string;
  name: string;
  priceUnit: string; 
  billingType: 'GROUP' | 'INDIVIDUAL';
  active: boolean;
}

class CompaniesService {
  async getAll() {
    const response = await api.get<Company[]>('/companies');
    return response.data;
  }
}

export const companiesService = new CompaniesService();