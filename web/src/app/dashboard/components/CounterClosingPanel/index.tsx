import { useState } from 'react';
import { movementsService, MovementType } from '../../services/movements.service';
import './styles.css';

interface MethodInput {
  value: string;
  qty: string;
}

export function CounterClosingPanel({ onSuccess }: { onSuccess: () => void }) {
  const [inputs, setInputs] = useState<Record<string, MethodInput>>({
    [MovementType.INCOME_CASH]: { value: '', qty: '' },
    [MovementType.INCOME_DEBIT]: { value: '', qty: '' },
    [MovementType.INCOME_CREDIT]: { value: '', qty: '' },
    [MovementType.INCOME_PIX_KEY]: { value: '', qty: '' }, 
    [MovementType.INCOME_QR_CODE]: { value: '', qty: '' },
    [MovementType.INCOME_IFOOD]: { value: '', qty: '' },
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const labels: Record<string, string> = {
    [MovementType.INCOME_CASH]: '💵 Dinheiro Vivo',
    [MovementType.INCOME_DEBIT]: '💳 Débito',
    [MovementType.INCOME_CREDIT]: '💳 Crédito',
    [MovementType.INCOME_PIX_KEY]: '💠 Pix (Dona)',
    [MovementType.INCOME_QR_CODE]: '📱 QR Code',
    [MovementType.INCOME_IFOOD]: '🛵 iFood',
  };

  const handleChange = (type: string, field: 'value' | 'qty', val: string) => {
    setInputs(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: val }
    }));
  };

  async function handleBatchSave() {
    if (!window.confirm("Confirma o lançamento dos totais do balcão?")) return;
    
    setIsLoading(true);
    const promises = [];

    try {
      for (const [type, data] of Object.entries(inputs)) {
        if (Number(data.value) > 0) {
          promises.push(movementsService.create({
            type: type as MovementType,
            amount: Number(data.value),
            quantity: Number(data.qty) || 1, 
            description: 'Fechamento de Turno (Total)'
          }));
        }
      }
      
      if (promises.length === 0) {
        alert("Preencha pelo menos um valor!");
        return;
      }

      await Promise.all(promises);
      alert("Totais lançados com sucesso!");
      
      // Limpa tudo após salvar
      const reset = {} as any;
      Object.keys(inputs).forEach(k => reset[k] = { value: '', qty: '' });
      setInputs(reset);
      
      onSuccess();
    } catch (error) {
      alert("Erro ao salvar totais");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', height: '100%', overflowY: 'auto' }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>📝 Totais Balcão (Maquininha)</h3>
      
      <div className="closing-grid">
        {Object.entries(inputs).map(([type, data]) => (
          <div key={type} className="method-card">
            <div className="input-wrapper" style={{ flex: 2 }}>
              <label>{labels[type]}</label>
              <input 
                type="number" 
                placeholder="R$ 0.00" 
                value={data.value}
                onChange={e => handleChange(type, 'value', e.target.value)}
              />
            </div>
            <div className="input-wrapper" style={{ flex: 1 }}>
              <label>Qtd. Vendas</label>
              <input 
                type="number" 
                placeholder="0" 
                value={data.qty}
                onChange={e => handleChange(type, 'qty', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleBatchSave} disabled={isLoading} className="save-batch-btn">
        {isLoading ? 'Salvando...' : 'LANÇAR TOTAIS'}
      </button>
    </div>
  );
}