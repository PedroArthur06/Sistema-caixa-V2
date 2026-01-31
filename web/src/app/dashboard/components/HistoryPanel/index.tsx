import { useState, useEffect } from "react";
import { movementsService, type HistoryFilter } from "../../services/movements.service";
import { companiesService } from "../../services/companies.service";
import "./styles.css";

function groupByConsumer(movements: any[]) {
  const groups: Record<string, { totalAmount: number, totalQty: number, items: any[] }> = {};
  
  movements.forEach(m => {
    const name = m.consumer || 'Não Identificado';
    
    if (!groups[name]) {
      groups[name] = { totalAmount: 0, totalQty: 0, items: [] };
    }

    groups[name].totalAmount += Number(m.amount);
    
    groups[name].totalQty += (m.quantity || 1);
    
    groups[name].items.push(m);
  });

  return Object.entries(groups).map(([name, data]) => ({ name, ...data }));
}

export function HistoryPanel() {
  // Filtros
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [endDate, setEndDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  
  // Dados
  const [viewMode, setViewMode] = useState<'EXTRATO' | 'FECHAMENTO'>('EXTRATO');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [closings, setClosings] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Controle de Expansão
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [details, setDetails] = useState<any[]>([]);

  useEffect(() => {
    companiesService.getAll().then(setCompanies).catch(console.error);
  }, []);

  useEffect(() => {
    handleSearch();
    setExpandedCompany(null); 
  }, [viewMode]);

  async function handleSearch() {
    setLoading(true);
    try {
      const filter: HistoryFilter = {
        startDate,
        endDate,
        companyId: selectedCompany || undefined
      };

      if (viewMode === 'EXTRATO') {
        const data = await movementsService.getHistory(filter);
        setHistoryData(data);
      } else {
        const data = await movementsService.getOpenClosings(filter);
        setClosings(data);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao buscar dados.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleExpand(companyId: string) {
    if (expandedCompany === companyId) {
      setExpandedCompany(null);
      return;
    }
    setExpandedCompany(companyId);
    setDetails([]); 
    try {
      const data = await movementsService.getOpenDetails(companyId);
      setDetails(data);
    } catch (error) { console.error(error); }
  }

  async function handleRealizarFechamento(companyId: string) {
    const confirmText = "⚠️ ATENÇÃO ⚠️\n\nIsso vai ZERAR o saldo desta empresa e marcar os pedidos como cobrados.\n\nDeseja continuar?";
    if (!confirm(confirmText)) return;
    
    try {
      await movementsService.performClosing(companyId, endDate);
      alert("Ciclo fechado com sucesso!");
      handleSearch();
      setExpandedCompany(null);
    } catch (error) {
      alert("Erro ao fechar ciclo.");
    }
  }

  return (
    <div className="history-panel">
      
      {/* --- ÁREA DE FILTROS --- */}
      <div className="filters-container" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div className="filters-row">
          
          <div className="input-group">
            <label>De:</label>
            <input 
              type="date" 
              className="filter-input"
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
            />
          </div>

          <div className="input-group">
            <label>Até:</label>
            <input 
              type="date" 
              className="filter-input"
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
            />
          </div>

          <div className="input-group">
            <label>Empresa (Opcional):</label>
            <select 
              className="filter-select"
              value={selectedCompany} 
              onChange={e => setSelectedCompany(e.target.value)}
            >
              <option value="">Todas</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <button onClick={handleSearch} className="btn-search">
            🔍 FILTRAR
          </button>
        </div>

        <div className="tabs-header">
          <button 
            onClick={() => setViewMode('EXTRATO')}
            className={`tab-btn ${viewMode === 'EXTRATO' ? 'active' : ''}`}
          >
            📜 Extrato Detalhado
          </button>
          <button 
            onClick={() => setViewMode('FECHAMENTO')}
            className={`tab-btn ${viewMode === 'FECHAMENTO' ? 'active' : ''}`}
          >
            💰 Fechamento
          </button>
        </div>
      </div>

      {/* --- MODO EXTRATO --- */}
      {viewMode === 'EXTRATO' && (
        <div className="table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#666' }}>
                <th style={{ padding: '1rem' }}>Data</th>
                <th>Tipo</th>
                <th>Descrição / Empresa</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {historyData.map(mov => (
                <tr key={mov.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem' }}>{new Date(mov.createdAt).toLocaleString()}</td>
                  <td>{mov.type}</td>
                  <td>
                    {mov.company?.name || mov.description || '-'}
                    {mov.consumer && <span style={{fontSize: '0.8rem', color:'#888', display:'block'}}>{mov.consumer}</span>}
                  </td>
                  <td style={{ fontWeight: 'bold', color: mov.amount < 0 ? 'red' : 'green' }}>R$ {Number(mov.amount).toFixed(2)}</td>
                </tr>
              ))}
              {historyData.length === 0 && !loading && <tr><td colSpan={4} style={{padding: '2rem', textAlign: 'center', color: '#999'}}>Nenhum registro encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODO FECHAMENTO --- */}
      {viewMode === 'FECHAMENTO' && (
        <div className="closing-mode" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {closings.length === 0 && !loading && <div style={{textAlign: 'center', color: '#999', padding: '2rem'}}>Nenhum débito em aberto.</div>}
          
          {closings.map(item => {
            const isExpanded = expandedCompany === item.companyId;
            const isIndividual = item.billingType === 'INDIVIDUAL';
            
            // Agrupa se for individual e estiver expandido
            const consumerGroups = (isExpanded && isIndividual) ? groupByConsumer(details) : [];

            return (
              <div key={item.companyId} style={{ background: 'white', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                
                {/* CABEÇALHO DO CARD - COM LÓGICA CONDICIONAL DE EXIBIÇÃO */}
                <div 
                  onClick={() => toggleExpand(item.companyId)}
                  style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isExpanded ? '#f8fafc' : 'white' }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary)', fontSize: '1.3rem' }}>{item.companyName}</h3>
                    
                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', color: '#555', background: '#e5e7eb', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {isIndividual ? 'Por Pessoa' : 'Unificado'}
                      </span>
                      
                      <div style={{ width: '1px', height: '16px', background: '#ccc' }}></div>

                      {/* LÓGICA 1: Se for UNIFICADO, mostra TOTAL DE MARMITAS. Pessoas não importam. */}
                      {!isIndividual && (
                        <div title="Volume Total de Marmitas" style={{ display: 'flex', alignItems: 'center', color: '#4b5563' }}>
                          <span style={{ fontSize: '1.1rem', marginRight: '4px' }}>🍲</span>
                          <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{item.totalQuantity}</span>
                          <span style={{ fontSize: '0.8rem', marginLeft: '4px' }}>marmitas</span>
                        </div>
                      )}

                      {/* LÓGICA 2: Se for INDIVIDUAL, mostra QUANTAS PESSOAS. Total de marmitas geral é irrelevante aqui. */}
                      {isIndividual && (
                         <div title="Funcionários Ativos neste ciclo" style={{ display: 'flex', alignItems: 'center', color: '#4b5563' }}>
                           <span style={{ fontSize: '1.1rem', marginRight: '4px' }}>👥</span>
                           <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{item.totalTickets}</span> 
                           <span style={{ fontSize: '0.8rem', marginLeft: '4px' }}>pessoas ativas</span>
                         </div>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>Total a Receber</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#059669' }}>R$ {Number(item.totalAmount).toFixed(2)}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6366f1', marginTop: '4px' }}>{isExpanded ? '▼ recolher' : '▶ ver detalhes'}</div>
                  </div>
                </div>

                {/* DETALHES EXPANDIDOS */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #eee', padding: '1.5rem', animation: 'fadeIn 0.3s' }}>
                    
                    {/* LISTA POR PESSOA (INDIVIDUAL) */}
                    {isIndividual ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {consumerGroups.map(group => (
                          <div key={group.name} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1rem', background: '#fff' }}>
                            
                            {/* Nome da Pessoa */}
                            <div style={{ marginBottom: '0.5rem', borderBottom: '1px dashed #eee', paddingBottom: '0.5rem' }}>
                              <strong style={{ color: '#333', fontSize: '1.1rem' }}>👤 {group.name}</strong>
                            </div>
                            
                            {/* AQUI ESTÁ A LÓGICA PEDIDA: Quantidade de marmitas DESTA PESSOA */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#666' }}>Consumo:</span>
                                {/* Mostra a quantidade calculada no helper */}
                                <strong style={{ color: '#333' }}>{group.totalQty} unds</strong>
                            </div>
                            
                            {/* Valor Total da Pessoa */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', padding: '0.5rem', borderRadius: '6px' }}>
                                <span style={{ color: '#059669', fontSize: '0.9rem' }}>Total:</span>
                                <strong style={{ color: '#059669' }}>R$ {group.totalAmount.toFixed(2)}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // LISTA UNIFICADA (Para conferência simples de data/hora)
                      <div style={{ marginBottom: '2rem' }}>
                         <table style={{ width: '100%', fontSize: '0.9rem', color: '#555' }}>
                          <thead><tr style={{ textAlign: 'left', color: '#999' }}><th>Data</th><th>Item</th><th>Qtd</th><th>Valor</th></tr></thead>
                          <tbody>
                            {details.map(d => (
                              <tr key={d.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '0.5rem' }}>{new Date(d.createdAt).toLocaleDateString()} {new Date(d.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                <td>{d.description || 'Consumo'}</td>
                                <td>{d.quantity || 1}</td>
                                <td>R$ {Number(d.amount).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '2px dashed #eee' }}>
                      <button onClick={() => window.print()} className="btn-secondary" style={{ background: '#f3f4f6', color: '#333', border: '1px solid #ddd' }}>
                        🖨️ Imprimir
                      </button>
                      <button onClick={() => handleRealizarFechamento(item.companyId)} className="btn-primary" style={{ background: '#059669', border: '1px solid #047857' }}>
                        ✅ CONFIRMAR E ZERAR CICLO
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}