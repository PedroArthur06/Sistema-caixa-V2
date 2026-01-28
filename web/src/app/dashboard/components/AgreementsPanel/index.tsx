import { useEffect, useState } from 'react';
import { companiesService, type Company } from '../../services/companies.service';
import { movementsService, MovementType } from '../../services/movements.service';
import './styles.css';

interface AgreementRow {
  id: string;
  companyId: string;
  quantity: number;
  consumer: string;
}

export function AgreementsPanel({ onSuccess }: { onSuccess: () => void }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  
  // Initialize with one empty row
  const [rows, setRows] = useState<AgreementRow[]>([
    { id: crypto.randomUUID(), companyId: '', quantity: 1, consumer: '' }
  ]);
  
  // Creation Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', price: '', type: 'GROUP' as 'GROUP'|'INDIVIDUAL' });

  useEffect(() => { loadCompanies(); }, []);

  async function loadCompanies() {
    companiesService.getAll().then(setCompanies).catch(console.error);
  }

  // --- Row Management ---

  function handleAddRow() {
    setRows([...rows, { id: crypto.randomUUID(), companyId: '', quantity: 1, consumer: '' }]);
  }

  function handleRemoveRow(id: string) {
    if (rows.length === 1) {
      setRows([{ id: crypto.randomUUID(), companyId: '', quantity: 1, consumer: '' }]);
      return;
    }
    setRows(rows.filter(r => r.id !== id));
  }

  function updateRow(id: string, field: keyof AgreementRow, value: any) {
    setRows(rows.map(r => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    }));
  }

  // --- Calculations ---

  const calculateRowTotal = (row: AgreementRow) => {
    const company = companies.find(c => c.id === row.companyId);
    if (!company) return 0;
    return Number(company.priceUnit) * row.quantity;
  };

  const grandTotal = rows.reduce((acc, row) => acc + calculateRowTotal(row), 0);

  // --- Actions ---

  async function handleLaunch() {
    // Validate
    const invalidRow = rows.find(r => !r.companyId);
    if (invalidRow) return alert("Selecione a empresa em todas as linhas!");

    // Check individual consumers
    for (const row of rows) {
      const company = companies.find(c => c.id === row.companyId);
      if (company?.billingType === 'INDIVIDUAL' && !row.consumer) {
        return alert(`Preencha o nome do funcionário para a empresa ${company.name}`);
      }
    }

    try {
      // Process one by one (could be parallelized too)
      await Promise.all(rows.map(async (row) => {
        const company = companies.find(c => c.id === row.companyId);
        if (!company) return;

        await movementsService.create({
          type: MovementType.INCOME_AGREEMENT,
          companyId: row.companyId,
          amount: 0, // Backend calculates or ignores this based on quantity? Usually price is fetched backend-side or we might need to send expected amount. 
                     // Looking at previous code, amount was 0. 
          quantity: company.billingType === 'INDIVIDUAL' ? 1 : row.quantity,
          consumer: company.billingType === 'INDIVIDUAL' ? row.consumer : '',
          itemCategory: 'MEAL',
          description: 'Marmita Convênio'
        });
      }));

      onSuccess();
      setRows([{ id: crypto.randomUUID(), companyId: '', quantity: 1, consumer: '' }]);
      alert("Lançamentos realizados com sucesso!");
    } catch (e) {
      console.error(e);
      alert("Erro ao lançar convênios.");
    }
  }

  async function handleCreate() {
    if (!newCompany.name || !newCompany.price) return;
    try {
      await companiesService.create({
        name: newCompany.name,
        priceUnit: Number(newCompany.price),
        billingType: newCompany.type
      });
      await loadCompanies();
      setIsCreating(false);
      setNewCompany({ name: '', price: '', type: 'GROUP' });
      alert("Empresa Salva!");
    } catch (e) { alert("Erro ao criar"); }
  }

  return (
    <div className="agreements-container">
      <div className="header-row">
        <h3>🏢 Vouchers & Convênios</h3>
        <button onClick={() => setIsCreating(!isCreating)} className="btn-secondary">
          {isCreating ? 'Cancelar' : '+ Nova Empresa'}
        </button>
      </div>

      {/* CREATE NEW COMPANY */}
      {isCreating && (
        <div className="create-box">
          <input placeholder="Nome da Empresa" value={newCompany.name} onChange={e => setNewCompany({...newCompany, name: e.target.value})} />
          <input type="number" placeholder="Valor (R$)" value={newCompany.price} onChange={e => setNewCompany({...newCompany, price: e.target.value})} style={{ width: '120px' }} />
          <select value={newCompany.type} onChange={e => setNewCompany({...newCompany, type: e.target.value as any})}>
            <option value="GROUP">Geral (Qtd)</option>
            <option value="INDIVIDUAL">Individual (Nome)</option>
          </select>
          <button onClick={handleCreate} className="btn-primary">Salvar</button>
        </div>
      )}

      {/* LIST OF ROWS */}
      <div className="rows-container">
        {rows.map((row) => {
          const selectedCompany = companies.find(c => c.id === row.companyId);
          const isIndividual = selectedCompany?.billingType === 'INDIVIDUAL';
          
          return (
            <div key={row.id} className="agreement-row">
              <div className="field-group grow">
                <label>Empresa</label>
                <select 
                  value={row.companyId} 
                  onChange={e => updateRow(row.id, 'companyId', e.target.value)}
                  className="row-select"
                >
                  <option value="">Selecione...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (R$ {Number(c.priceUnit).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {isIndividual ? (
                 <div className="field-group grow">
                 <label>Funcionário</label>
                 <input 
                   type="text"
                   value={row.consumer}
                   onChange={e => updateRow(row.id, 'consumer', e.target.value)}
                   className="row-input"
                   placeholder="Nome..."
                 />
               </div>
              ) : (
                <div className="field-group" style={{ width: '80px' }}>
                  <label>Qtd</label>
                  <input 
                    type="number" 
                    value={row.quantity} 
                    onChange={e => updateRow(row.id, 'quantity', Number(e.target.value))}
                    className="row-input center"
                    min={1}
                  />
                </div>
              )}

              <div className="row-total">
                <label>Total</label>
                <span>R$ {calculateRowTotal(row).toFixed(2)}</span>
              </div>

              <div className="row-actions">
                <button 
                  onClick={() => handleRemoveRow(row.id)}
                  className="btn-icon-trash"
                  title="Remover linha"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={handleAddRow} className="add-row-btn">
        + Adicionar Convênio
      </button>

      <div className="footer-summary">
        <span>Total em Vouchers:</span>
        <span className="total-value">R$ {grandTotal.toFixed(2)}</span>
      </div>

      <div className="action-bar">
         <button onClick={handleLaunch} className="btn-primary full-width">
            CONFIRMAR LANÇAMENTOS
         </button>
      </div>
    </div>
  );
}