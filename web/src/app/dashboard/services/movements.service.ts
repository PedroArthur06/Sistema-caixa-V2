import { api } from "../../../shared/services/api";

export const MovementType = {
  INCOME_CASH: 'INCOME_CASH',
  INCOME_DEBIT: 'INCOME_DEBIT',
  INCOME_CREDIT: 'INCOME_CREDIT',
  INCOME_PIX_KEY: 'INCOME_PIX_KEY',
  INCOME_QR_CODE: 'INCOME_QR_CODE',
  INCOME_AGREEMENT: 'INCOME_AGREEMENT',
  INCOME_IFOOD: 'INCOME_IFOOD',
  EXPENSE: 'EXPENSE',
} as const;

export type MovementType = typeof MovementType[keyof typeof MovementType];

export interface CreateMovementDTO {
  type: MovementType;
  amount: number;
  quantity: number;
  description?: string;
  companyId?: string;
  itemCategory?: 'MEAL' | 'EXTRA';
  consumer?: string;

}

class MovementsService {
  async create(data: CreateMovementDTO) {
    const response = await api.post('/movements', data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateMovementDTO>) {
    const response = await api.put(`/movements/${id}`, data);
    return response.data;
  }

  async delete(id: string) {
    await api.delete(`/movements/${id}`);
  }
}

export const movementsService = new MovementsService();