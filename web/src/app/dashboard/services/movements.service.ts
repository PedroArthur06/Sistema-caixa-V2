import { api } from "../../../shared/services/api";

export const MovementType = {
  INCOME_CASH: 'INCOME_CASH',
  INCOME_DEBIT: 'INCOME_DEBIT',
  INCOME_CREDIT: 'INCOME_CREDIT',
  INCOME_QR_CODE: 'INCOME_QR_CODE',
  INCOME_PIX_KEY: 'INCOME_PIX_KEY',
  INCOME_IFOOD: 'INCOME_IFOOD',
  INCOME_AGREEMENT: 'INCOME_AGREEMENT',
  EXPENSE: 'EXPENSE'
} as const;

export type MovementType = typeof MovementType[keyof typeof MovementType];

export interface CreateMovementDto {
  type: MovementType;
  amount: number;
  description?: string;
  companyId?: string;
  itemCategory?: 'MEAL' | 'EXTRA';
  consumer?: string;
  quantity?: number;
}

export type CreateMovementDTO = CreateMovementDto;

export interface HistoryFilter {
  startDate: string;
  endDate: string;
  companyId?: string;
}

export interface ClosingData {
  companyId: string;
  companyName: string;
  totalAmount: number;
  totalQuantity: number;
  totalTickets: number;
}

export const movementsService = {
  create: async (data: CreateMovementDto) => {
    return api.post('/movements', data);
  },

  getAllToday: async () => {
    const { data } = await api.get('/movements');
    return data;
  },

  update: async (id: string, data: Partial<CreateMovementDto>) => {
    const { data: responseData } = await api.put(`/movements/${id}`, data);
    return responseData;
  },

  delete: async (id: string) => {
    return api.delete(`/movements/${id}`);
  },


  // 1. Histórico Geral (Extrato corrido)
  getHistory: async (filter: HistoryFilter) => {
    const { data } = await api.get('/movements/history', { params: filter });
    return data;
  },

  // 2. Busca empresas que estão DEVENDO (Ciclo aberto)
  getOpenClosings: async (filter: HistoryFilter) => {
    const { data } = await api.get('/movements/closings/open', { params: filter });
    return data;
  },

  // 3. Busca os detalhes (pedidos) de uma empresa específica para expandir
  getOpenDetails: async (companyId: string) => {
    const { data } = await api.get(`/movements/closings/details/${companyId}`);
    return data;
  },

  // 4. ZERA a conta (Fecha o ciclo)
  performClosing: async (companyId: string, endDate: string) => {
    const { data } = await api.post('/movements/closings/finish', { companyId, endDate });
    return data;
  }
};