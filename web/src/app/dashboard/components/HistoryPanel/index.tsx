import { useState, useEffect } from "react";
import { movementsService, type HistoryFilter, type ClosingData } from "../../services/movements.service";
import { companiesService } from "../../services/companies.service";
import "./styles.css"; 

export function HistoryPanel() {
  // Estados dos Filtros
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-CA')); 
  const [endDate, setEndDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  
  // Estado dos Dados
  const [viewMode, setViewMode] = useState<'EXTRATO' | 'FECHAMENTO'>('EXTRATO');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [closingData, setClosingData] = useState<ClosingData[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
        const data = await movementsService.getClosings(filter);
        setClosingData(data);
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
  }, [viewMode]); // Recarrega quando troca de aba visual

  // Função simples de impressão
  function handlePrint() {
    window.print();
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
               <div className="closing-header">
                  <h3>Totalizadores por Empresa</h3>
                  <button onClick={handlePrint} className="btn-print">🖨️ Imprimir Relatório</button>
               </div>
               
               <div className="closings-grid">
                 {closingData.map(item => (
                   <div key={item.companyId} className="closing-card">
                     <h3 className="card-title">{item.companyName}</h3>
                     
                     <div className="card-row">
                        <span className="card-label">Qtd. Pedidos:</span>
                        <span className="card-value">{item.totalTickets}</span>
                     </div>
                     <div className="card-row">
                        <span className="card-label">Marmitas/Itens:</span>
                        <span className="card-value">{item.totalQuantity}</span>
                     </div>
                     
                     <div className="card-footer">
                        <span className="total-label">Total Gasto</span>
                        <span className="total-value">R$ {Number(item.totalAmount).toFixed(2)}</span>
                     </div>
                   </div>
                 ))}
               </div>
               
               {closingData.length === 0 && <div className="empty-state">Nenhum fechamento encontrado neste período.</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}