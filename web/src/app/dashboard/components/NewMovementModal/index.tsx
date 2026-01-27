import { useEffect, useState } from 'react';
import { movementsService, MovementType } from '../../services/movements.service';
import { type Company, companiesService } from '../../services/companies.service';
import './styles.css';

interface NewMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Tab = 'BALCAO' | 'CONVENIO' | 'DESPESA';

export function NewMovementModal({ isOpen, onClose, onSuccess }: NewMovementModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('BALCAO');
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);

  // --- Estados do Balcão/Despesa ---
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentType, setPaymentType] = useState<MovementType>(MovementType.INCOME_CASH);

  // --- Estados do Convênio ---
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [hasMeal, setHasMeal] = useState(true); // O cara pegou marmita?
  const [extraValue, setExtraValue] = useState(''); // Valor da Coca/Extra
  const [consumerName, setConsumerName] = useState(''); // Nome (se Individual)
  
  // Carrega empresas ao abrir
  useEffect(() => {
    if (isOpen) {
      companiesService.getAll().then(setCompanies).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Reseta form ao trocar de aba
  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setAmount('');
    setDescription('');
    setHasMeal(true);
    setExtraValue('');
    setConsumerName('');
    setPaymentType(MovementType.INCOME_CASH);
  }

  // --- Lógica Principal de Envio ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      // CENÁRIO 1: CONVÊNIO (A Lógica Complexa)
      if (activeTab === 'CONVENIO') {
        if (!selectedCompanyId) throw new Error("Selecione uma empresa");

        const company = companies.find(c => c.id === selectedCompanyId);
        if (!company) return;

        // Validação de Nome para Fechamento Individual
        if (company.billingType === 'INDIVIDUAL' && !consumerName.trim()) {
           throw new Error(`A empresa ${company.name} exige o nome do funcionário.`);
        }

        const promises = [];

        // 1. Lança a Marmita (Se houver)
        if (hasMeal) {
          promises.push(movementsService.create({
            type: MovementType.INCOME_AGREEMENT, // Backend vai usar itemCategory: MEAL
            amount: 0, // Backend ignora e usa o preço unitário
            quantity: 1,
            companyId: company.id,
            itemCategory: 'MEAL', // Importante mapear isso no service
            consumer: consumerName,
            description: 'Refeição Convênio'
          }));
        }

        // 2. Lança o Extra (Se houver valor)
        if (extraValue && Number(extraValue) > 0) {
          promises.push(movementsService.create({
            type: MovementType.INCOME_AGREEMENT,
            amount: Number(extraValue),
            quantity: 1,
            companyId: company.id,
            itemCategory: 'EXTRA', // Importante mapear isso no service
            consumer: consumerName,
            description: description || 'Consumo Extra (Bebida/Outros)'
          }));
        }

        if (promises.length === 0) throw new Error("Lance pelo menos uma marmita ou um extra.");
        
        await Promise.all(promises);
      } 
      
      // CENÁRIO 2: BALCÃO E DESPESA (Simples)
      else {
        if (!amount) throw new Error("Informe o valor");
        
        await movementsService.create({
          type: activeTab === 'DESPESA' ? MovementType.EXPENSE : paymentType,
          amount: Number(amount),
          quantity: 1,
          description: description || (activeTab === 'DESPESA' ? 'Saída de Caixa' : 'Venda Balcão')
        });
      }

      onSuccess();
      onClose();
      handleTabChange('BALCAO'); // Reseta
    } catch (error: any) {
      alert(error.message || "Erro ao salvar");
    } finally {
      setIsLoading(false);
    }
  }

  // Helper para calcular total visual do convênio
  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const mealPrice = selectedCompany ? Number(selectedCompany.priceUnit) : 0;
  const currentTotal = (hasMeal ? mealPrice : 0) + (extraValue ? Number(extraValue) : 0);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Novo Lançamento</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        {/* --- ABAS --- */}
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'BALCAO' ? 'active' : ''}`}
            onClick={() => handleTabChange('BALCAO')}
          >
            Balcão
          </button>
          <button 
            className={`tab-btn ${activeTab === 'CONVENIO' ? 'active' : ''}`}
            onClick={() => handleTabChange('CONVENIO')}
          >
            Convênio
          </button>
          <button 
            className={`tab-btn expense-tab ${activeTab === 'DESPESA' ? 'active' : ''}`}
            onClick={() => handleTabChange('DESPESA')}
          >
            Despesa
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          
          {/* === FORMULÁRIO DE CONVÊNIO === */}
          {activeTab === 'CONVENIO' && (
            <>
              <div className="form-group">
                <label>Empresa / Convênio</label>
                <select 
                  className="form-input"
                  value={selectedCompanyId}
                  onChange={e => setSelectedCompanyId(e.target.value)}
                  autoFocus
                >
                  <option value="">Selecione...</option>
                  {companies.filter(c => c.active).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {selectedCompany && (
                <>
                  <div className="convenio-summary">
                    <label className="checkbox-group">
                      <input 
                        type="checkbox" 
                        checked={hasMeal}
                        onChange={e => setHasMeal(e.target.checked)}
                      />
                      <span>Incluir Marmita (R$ {mealPrice.toFixed(2)})</span>
                    </label>

                    <div className="form-group">
                      <label>Valor Extra (Bebida/Doce)</label>
                      <input 
                        type="number" 
                        className="form-input"
                        placeholder="0.00"
                        value={extraValue}
                        onChange={e => setExtraValue(e.target.value)}
                      />
                    </div>

                    <div className="total-row convenios-row">
                      <span>Total do Lançamento:</span>
                      <span>R$ {currentTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {selectedCompany.billingType === 'INDIVIDUAL' && (
                    <div className="form-group" style={{ border: '1px solid orange', padding: '0.5rem', borderRadius: '4px' }}>
                      <label style={{ color: 'orange' }}>Nome do Funcionário (Obrigatório)</label>
                      <input 
                        type="text" 
                        className="form-input"
                        placeholder="Quem retirou?"
                        value={consumerName}
                        onChange={e => setConsumerName(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Observação (Opcional)</label>
                    <input 
                      type="text" 
                      className="form-input"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* === FORMULÁRIO DE BALCÃO / DESPESA === */}
          {activeTab !== 'CONVENIO' && (
            <>
              <div className="form-group">
                <label>Valor (R$)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="0.00"
                  autoFocus
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={activeTab === 'DESPESA' ? 'Ex: Compra de Gelo' : 'Ex: PF + Coca'}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              {activeTab === 'BALCAO' && (
                <div className="form-group">
                  <label>Forma de Pagamento</label>
                  <select 
                    className="form-input"
                    value={paymentType}
                    onChange={e => setPaymentType(e.target.value as MovementType)}
                  >
                    <option value={MovementType.INCOME_CASH}>Dinheiro</option>
                    <option value={MovementType.INCOME_PIX_KEY}>PIX (Chave)</option>
                    <option value={MovementType.INCOME_QR_CODE}>QR Code</option>
                    <option value={MovementType.INCOME_DEBIT}>Débito</option>
                    <option value={MovementType.INCOME_CREDIT}>Crédito</option>
                    <option value={MovementType.INCOME_IFOOD}>iFood</option>
                  </select>
                </div>
              )}
            </>
          )}

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Confirmar Lançamento'}
          </button>
        </form>
      </div>
    </div>
  );
}