import { useEffect, useMemo, useState } from 'react';
import { MovementType, movementsService, type CreateMovementDTO } from '../../services/movements.service';
import type { DailyReport } from '../../services/daily-reports.service';
import { companiesService, type Company } from '../../services/companies.service';
import './styles.css';

interface AgreementsPanelProps {
  report: DailyReport;
  onSuccess: () => void;
}

export function AgreementsPanel({ report, onSuccess }: AgreementsPanelProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  // New Company Form State
  const [newCompany, setNewCompany] = useState({
    name: '',
    priceUnit: '',
    billingType: 'GROUP' as 'GROUP' | 'INDIVIDUAL'
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    try {
      const data = await companiesService.getAll();
      setCompanies(data);
    } catch (error) {
      console.error(error);
    }
  }

  // Group movements by Company
  const agreementsByCompany = useMemo(() => {
    const agreements = report.movements?.filter(m => m.type === MovementType.INCOME_AGREEMENT) || [];
    const grouped = new Map<string, { company: Company, movements: typeof agreements }>();

    agreements.forEach(m => {
      if (m.companyId) {
        // Find company in our list or fallback to embedded company
        const company = companies.find(c => c.id === m.companyId) || m.company as unknown as Company; 
        if (!company) return;

        if (!grouped.has(company.id)) {
          grouped.set(company.id, { company, movements: [] });
        }
        grouped.get(company.id)?.movements.push(m);
      }
    });
    return Array.from(grouped.values());
  }, [report, companies]);

  const totalAgreements = useMemo(() => {
    return (report.movements?.filter(m => m.type === MovementType.INCOME_AGREEMENT) || [])
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
  }, [report]);

  // Handlers
  async function handleAddAgreement(companyId: string) {
    if (!companyId) return;
    const company = companies.find(c => c.id === companyId);
    if (!company) return;

    // Check if group already exists
    if (company.billingType === 'GROUP') {
      const existing = agreementsByCompany.find(g => g.company.id === companyId);
      if (existing) {
        alert("Esta empresa já está na lista. Ajuste a quantidade na linha existente.");
        return;
      }
    }

    // Create default movement
    try {
      await movementsService.create({
        type: MovementType.INCOME_AGREEMENT,
        amount: Number(company.priceUnit),
        quantity: 1,
        companyId: company.id,
        description: `Convênio: ${company.name}`,
        unitValue: Number(company.priceUnit), 
        consumer: ''
      } as any); // Cast because unitValue might not be in CreateDTO but backend accepts it? relying on service
      onSuccess();
    } catch (error) {
      alert("Erro ao adicionar convênio");
    }
  }

  async function handleUpdateQuantity(movementId: string, newQty: number, unitPrice: number) {
    if (newQty < 1) return;
    try {
      await movementsService.update(movementId, {
        quantity: newQty,
        amount: newQty * unitPrice
      });
      onSuccess();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleUpdateConsumer(movementId: string, name: string) {
    try {
      await movementsService.update(movementId, {
        consumer: name
      });
      onSuccess(); // Refresh to show saved state? Or just local? Better to refresh.
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Remover este item?")) {
      try {
        await movementsService.delete(id);
        onSuccess();
      } catch (error) {
        alert("Erro ao remover");
      }
    }
  }

  async function handleRegisterCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!newCompany.name || !newCompany.priceUnit) return;

    try {
      await companiesService.create({
        name: newCompany.name,
        priceUnit: Number(newCompany.priceUnit),
        billingType: newCompany.billingType
      });
      await loadCompanies();
      setShowRegisterModal(false);
      setNewCompany({ name: '', priceUnit: '', billingType: 'GROUP' });
      alert("Empresa cadastrada com sucesso!");
    } catch (error) {
      alert("Erro ao cadastrar empresa");
    }
  }

  return (
    <div className="agreements-section">
      <div className="section-header">
        <div className="header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-indigo">
            <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M16 18h.01"/>
          </svg>
          <h3>Vouchers & Convênios</h3>
        </div>
        <div className="total-badge">
          R$ {totalAgreements.toFixed(2)}
        </div>
      </div>

      <div className="list-container">
        {agreementsByCompany.length === 0 ? (
          <div className="empty-state">Nenhum convênio lançado hoje.</div>
        ) : (
          <ul className="items-list">
            {agreementsByCompany.map(({ company, movements }) => (
              <li key={company.id} className="list-group-item">
                {company.billingType === 'GROUP' ? (
                  // GROUP LAYOUT
                  movements.map(m => (
                    <div key={m.id} className="row-content">
                      <div className="col-company">
                        <label className="field-label">Empresa</label>
                        <select className="modern-select" disabled value={company.id}>
                           <option>{company.name}</option>
                        </select>
                      </div>
                      <div className="col-qty">
                        <label className="field-label">Qtd</label>
                        <input 
                          type="number" 
                          className="modern-input center-text"
                          value={m.quantity}
                          onChange={(e) => handleUpdateQuantity(m.id, Number(e.target.value), Number(company.priceUnit))}
                        />
                      </div>
                      <div className="col-total">
                        <label className="field-label">Total</label>
                        <span className="total-value">R$ {Number(m.amount).toFixed(2)}</span>
                      </div>
                      <button onClick={() => handleDelete(m.id)} className="btn-delete-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  ))
                ) : (
                  // INDIVIDUAL LAYOUT
                  <div className="individual-group">
                    <div className="group-header">
                       <span className="group-title">{company.name}</span>
                       <span className="group-badge">Unitário</span>
                    </div>
                    {movements.map(m => (
                      <div key={m.id} className="row-content individual-row">
                         <div className="col-company">
                            <input 
                              type="text" 
                              className="modern-input"
                              placeholder="Nome da pessoa..."
                              value={m.consumer || ''}
                              onChange={(e) => handleUpdateConsumer(m.id, e.target.value)}
                              onBlur={(e) => handleUpdateConsumer(m.id, e.target.value)} // Ensure save on blur
                            />
                         </div>
                         <div className="col-total">
                            <span className="total-value">R$ {Number(m.amount).toFixed(2)}</span>
                         </div>
                         <button onClick={() => handleDelete(m.id)} className="btn-delete-icon">
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                         </button>
                      </div>
                    ))}
                    <button className="btn-add-unit" onClick={() => handleAddAgreement(company.id)}>
                      + Adicionar Pessoa
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Agreement Section */}
      <div className="add-section">
        <select 
          className="modern-select full-width" 
          value="" 
          onChange={(e) => handleAddAgreement(e.target.value)}
        >
          <option value="">+ Adicionar Convênio</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        
        <div className="register-divider">
           <span>ou</span>
        </div>

        <button className="btn-register-new" onClick={() => setShowRegisterModal(true)}>
           Cadastrar Novo Convênio
        </button>
      </div>

      {/* Modal Registration */}
      {showRegisterModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Novo Convênio</h4>
              <button onClick={() => setShowRegisterModal(false)} className="close-modal">&times;</button>
            </div>
            <form onSubmit={handleRegisterCompany}>
              <div className="form-group">
                <label>Nome da Empresa</label>
                <input 
                  required
                  value={newCompany.name}
                  onChange={e => setNewCompany({...newCompany, name: e.target.value})}
                  className="modern-input"
                />
              </div>
              <div className="form-group">
                <label>Valor Unitário (R$)</label>
                <input 
                  required
                  type="number"
                  step="0.01"
                  value={newCompany.priceUnit}
                  onChange={e => setNewCompany({...newCompany, priceUnit: e.target.value})}
                  className="modern-input"
                />
              </div>
              <div className="form-group">
                <label>Tipo de Fechamento</label>
                <div className="radio-group">
                  <label>
                    <input 
                      type="radio" 
                      name="billingType"
                      checked={newCompany.billingType === 'GROUP'}
                      onChange={() => setNewCompany({...newCompany, billingType: 'GROUP'})}
                    />
                    Agrupado (Só Qtd)
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      name="billingType"
                      checked={newCompany.billingType === 'INDIVIDUAL'}
                      onChange={() => setNewCompany({...newCompany, billingType: 'INDIVIDUAL'})}
                    />
                    Unitário (Nome Pessoa)
                  </label>
                </div>
              </div>
              <button type="submit" className="btn-submit">Salvar Empresa</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}