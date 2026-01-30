import { useState, useEffect } from "react";
import { movementsService, type HistoryFilter } from "../../services/movements.service";
import { companiesService } from "../../services/companies.service";
import "./styles.css";

// Helper para agrupar por consumidor (JavaScript puro)
function groupByConsumer(movements: any[]) {
  const groups: Record<string, { total: number, items: any[] }> = {};
  
  movements.forEach(m => {
    const name = m.consumer || 'Não Identificado';
    if (!groups[name]) groups[name] = { total: 0, items: [] };
    groups[name].total += Number(m.amount);
    groups[name].items.push(m);
  });

  return Object.entries(groups).map(([name, data]) => ({ name, ...data }));
}

export function HistoryPanel() {
  // Estados dos Filtros
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-CA')); 
  const [endDate, setEndDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  
  // Estado dos Dados
  const [viewMode, setViewMode] = useState<'EXTRATO' | 'FECHAMENTO'>('EXTRATO');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [closings, setClosings] = useState<any[]>([]); // Mudado de closingData para closings
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Estado para controlar qual empresa está expandida
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [details, setDetails] = useState<any[]>([]); // Detalhes da empresa expandida

  // Carregar empresas para o select
  useEffect(() => {
    companiesService.getAll().then(setCompanies).catch(console.error);
  }, []);

  // Função principal de busca
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
      alert("Erro ao buscar dados");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Monitorar mudança de aba para buscar automaticamente
  useEffect(() => {
    handleSearch();
  }, [viewMode]); 

  // Função para carregar detalhes ao expandir
  async function toggleExpand(companyId: string) {
    if (expandedCompany === companyId) {
      setExpandedCompany(null); // Fecha se já estiver aberto
      return;
    }
    
    setExpandedCompany(companyId);
    setDetails([]); // Limpa anterior
    try {
      const data = await movementsService.getOpenDetails(companyId);
      setDetails(data);
    } catch (error) { console.error(error); }
  }

  async function handleRealizarFechamento(companyId: string) {
    if (!confirm("Tem certeza? Isso vai ZERAR o saldo desta empresa e marcar estes pedidos como cobrados.")) return;
    
    try {
      await movementsService.performClosing(companyId, endDate); // Usa a data do filtro como corte
      alert("Ciclo fechado com sucesso!");
      handleSearch(); // Recarrega a lista
      setExpandedCompany(null);
    } catch (error) { alert("Erro ao fechar ciclo."); }
  }

  return (
    <div className="history-panel">
      {/* --- ÁREA DE FILTROS --- */}
      <div className="filters-container">
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

        {/* --- ABAS INTERNAS --- */}
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
            💰 Fechamento (Soma)
          </button>
        </div>
      </div>

      {/* --- CONTEÚDO --- */}
      {loading ? <div className="empty-state">Carregando dados...</div> : (
        <>
          {viewMode === 'EXTRATO' && (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Descrição / Empresa</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map(mov => (
                    <tr key={mov.id}>
                      <td>{new Date(mov.createdAt).toLocaleString()}</td>
                      <td>{mov.type}</td>
                      <td>
                        {mov.company?.name || mov.description || '-'}
                        {mov.consumer && <span className="consumer-name">{mov.consumer}</span>}
                      </td>
                      <td className={mov.amount < 0 ? 'amount-negative' : 'amount-positive'}>
                        R$ {Number(mov.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {historyData.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                         Nenhum registro encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'FECHAMENTO' && (
            <div className="closing-mode">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {closings.map(item => {
                  const isExpanded = expandedCompany === item.companyId;
                  const isIndividual = item.billingType === 'INDIVIDUAL';
                  
                  // Se for Individual, agrupamos os detalhes por pessoa
                  const consumerGroups = isExpanded && isIndividual ? groupByConsumer(details) : [];

                  return (
                    <div key={item.companyId} style={{ background: 'white', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden' }}>
                      
                      {/* CABEÇALHO DO CARD (Clicável) */}
                      <div 
                        onClick={() => toggleExpand(item.companyId)}
                        style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isExpanded ? '#f9fafb' : 'white' }}
                      >
                        <div>
                          <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>{item.companyName}</h3>
                          <span style={{ fontSize: '0.8rem', color: '#666', background: '#eee', padding: '2px 8px', borderRadius: '4px' }}>
                            {isIndividual ? 'Por Pessoa' : 'Grupo Único'}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                            R$ {Number(item.totalAmount).toFixed(2)}
                          </div>
                          <small style={{ color: '#888' }}>{isExpanded ? '▼ Recolher' : '▶ Ver Detalhes'}</small>
                        </div>
                      </div>

                      {/* ÁREA EXPANDIDA (Detalhes) */}
                      {isExpanded && (
                        <div style={{ borderTop: '1px solid #eee', padding: '1.5rem', animation: 'fadeIn 0.3s' }}>
                          
                          {/* VISUALIZAÇÃO INDIVIDUAL (Por Pessoa) */}
                          {isIndividual ? (
                            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.5rem' }}>
                              {consumerGroups.map((group: any) => (
                                <div key={group.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px dashed #eee' }}>
                                  <span>👤 {group.name}</span>
                                  <strong>R$ {group.total.toFixed(2)}</strong>
                                </div>
                              ))}
                            </div>
                          ) : (
                            // VISUALIZAÇÃO GRUPO (Lista Simples)
                            <ul style={{ marginBottom: '1.5rem', paddingLeft: '1rem', color: '#555' }}>
                              {details.map(d => (
                                <li key={d.id}>
                                  {new Date(d.createdAt).toLocaleDateString()} - {d.description || 'Marmita'} (R$ {Number(d.amount).toFixed(2)})
                                </li>
                              ))}
                            </ul>
                          )}

                          {/* AÇÕES DO FECHAMENTO */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                            <button onClick={() => window.print()} className="btn-secondary">
                              🖨️ Imprimir Conferência
                            </button>
                            <button 
                              onClick={() => handleRealizarFechamento(item.companyId)}
                              className="btn-primary"
                              style={{ background: '#059669' }}
                            >
                              ✅ CONFIRMAR FECHAMENTO E ZERAR
                            </button>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {closings.length === 0 && <div className="empty-state">Nenhum fechamento pendente.</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}