import { api } from "../../../shared/services/api";

export interface Company {
  id: string;
  name: string;
  priceUnit: string; 
  billingType: 'GROUP' | 'INDIVIDUAL';
  active: boolean;
}

export interface CreateCompanyDTO {
  name: string;
  priceUnit: number;
  billingType: 'GROUP' | 'INDIVIDUAL';
}

class CompaniesService {
  async getAll() {
    const response = await api.get<Company[]>('/companies');
    return response.data;
  }

  async create(data: CreateCompanyDTO) {
    const response = await api.post<Company>('/companies', data);
    return response.data;
  }
}

export const companiesService = new CompaniesService();