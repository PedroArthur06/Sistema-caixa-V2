import { useEffect, useState } from 'react';
import { companiesService, type Company } from '../../services/companies.service';
import { movementsService, MovementType } from '../../services/movements.service';
import './styles.css';

export function AgreementsPanel({ onSuccess }: { onSuccess: () => void }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedId, setSelectedId] = useState('');
  
  // Controle de lançamento
  const [qty, setQty] = useState(1);
  const [consumer, setConsumer] = useState('');
  
  // Controle de Criação 
  const [isCreating, setIsCreating] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyPrice, setNewCompanyPrice] = useState('');
  const [newCompanyType, setNewCompanyType] = useState<'GROUP'|'INDIVIDUAL'>('GROUP');

  useEffect(() => { loadCompanies(); }, []);

  async function loadCompanies() {
    companiesService.getAll().then(setCompanies).catch(console.error);
  }

  async function handleLaunch() {
    const company = companies.find(c => c.id === selectedId);
    if (!company) return;
    if (company.billingType === 'INDIVIDUAL' && !consumer) return alert("Nome obrigatório!");

    try {
      await movementsService.create({
        type: MovementType.INCOME_AGREEMENT,
        companyId: company.id,
        amount: 0,
        quantity: company.billingType === 'INDIVIDUAL' ? 1 : qty,
        consumer: consumer,
        itemCategory: 'MEAL',
        description: 'Marmita Convênio'
      });
      onSuccess();
      setQty(1);
      setConsumer('');
      alert("Lançamento Confirmado! ✅");
    } catch (e) { alert("Erro ao lançar"); }
  }

  async function handleCreate() {
    if (!newCompanyName || !newCompanyPrice) return;
    try {
      await companiesService.create({
        name: newCompanyName,
        priceUnit: Number(newCompanyPrice),
        billingType: newCompanyType
      });
      await loadCompanies();
      setIsCreating(false);
      setNewCompanyName('');
      setNewCompanyPrice('');
      alert("Empresa cadastrada!");
    } catch (e) { alert("Erro ao criar empresa"); }
  }

  const selected = companies.find(c => c.id === selectedId);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Cabeçalho do Painel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ color: 'var(--color-primary)' }}>Lançamento de Convênios</h2>
          <p style={{ color: '#666' }}>Selecione a empresa para registrar o consumo</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          style={{ 
            padding: '0.8rem 1.5rem', 
            background: 'white', 
            border: '1px solid var(--color-border)', 
            borderRadius: '8px',
            color: 'var(--color-primary)',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {isCreating ? 'Cancelar Cadastro' : '+ Nova Empresa'}
        </button>
      </div>

      {/* Área de Cadastro (Aparece só se clicar no botão) */}
      {isCreating && (
        <div style={{ background: '#FFF8E1', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #FFE0B2' }}>
          <h4>Cadastrar Nova Empresa Parceira</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', marginTop: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '0.8rem', display: 'block' }}>Nome da Empresa</label>
              <input style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc' }} value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', display: 'block' }}>Preço Marmita</label>
              <input type="number" style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc' }} value={newCompanyPrice} onChange={e => setNewCompanyPrice(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', display: 'block' }}>Tipo</label>
              <select style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc' }} value={newCompanyType} onChange={e => setNewCompanyType(e.target.value as any)}>
                <option value="GROUP">Geral</option>
                <option value="INDIVIDUAL">Individual</option>
              </select>
            </div>
            <button onClick={handleCreate} className="btn-primary" style={{ height: '45px', margin: 0 }}>Salvar</button>
          </div>
        </div>
      )}

      {/* LISTA DE SELEÇÃO CLEAN */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        
        <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>Selecione o Convênio:</label>
        <select 
          value={selectedId} 
          onChange={e => setSelectedId(e.target.value)}
          style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: '#FAFAFA' }}
        >
          <option value="">-- Clique para selecionar da lista --</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* CARTÃO DE AÇÃO (Só aparece quando selecionado) */}
        {selected && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '2rem', animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{selected.name}</span>
              <span style={{ background: '#eee', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.9rem' }}>
                Valor Unitário: <strong>R$ {Number(selected.priceUnit).toFixed(2)}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'end' }}>
              {selected.billingType === 'GROUP' ? (
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Quantidade de Marmitas</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: '50px', height: '50px', borderRadius: '8px', border: '1px solid #ccc', background: 'white', fontSize: '1.5rem' }}>-</button>
                    <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} style={{ width: '100px', height: '50px', textAlign: 'center', fontSize: '1.5rem', borderRadius: '8px', border: '1px solid #ccc' }} />
                    <button onClick={() => setQty(qty + 1)} style={{ width: '50px', height: '50px', borderRadius: '8px', border: '1px solid #ccc', background: 'white', fontSize: '1.5rem' }}>+</button>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nome do Colaborador</label>
                  <input 
                    value={consumer} 
                    onChange={e => setConsumer(e.target.value)}
                    placeholder="Digite o nome..."
                    style={{ width: '100%', height: '50px', padding: '0 1rem', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid #ccc' }}
                  />
                </div>
              )}

              <div style={{ flex: 1, textAlign: 'right' }}>
                <p style={{ marginBottom: '0.5rem', color: '#666' }}>Total do Lançamento</p>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '1rem' }}>
                  R$ {(qty * Number(selected.priceUnit)).toFixed(2)}
                </div>
                <button 
                  onClick={handleLaunch} 
                  style={{ width: '100%', padding: '1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  CONFIRMAR
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}