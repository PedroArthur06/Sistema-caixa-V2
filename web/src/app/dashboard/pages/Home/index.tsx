import { useEffect, useState } from "react";
import { useAuth } from "../../../../shared/contexts/AuthContext";
import { dailyReportsService, type DailyReport } from "../../services/daily-reports.service";
import { CounterClosingPanel } from "../../components/CounterClosingPanel";
import { AgreementsPanel } from "../../components/AgreementsPanel";
import { FinalReportPanel } from "../../components/FinalReportPanel";
import { movementsService, MovementType } from "../../services/movements.service";

type Tab = 'BALCAO' | 'CONVENIOS' | 'RESUMO';

export function Dashboard() {
  const { signOut, user } = useAuth();
  const [report, setReport] = useState<DailyReport | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('BALCAO');
  const [openingValue, setOpeningValue] = useState('');

  useEffect(() => { loadReport(); }, []);

  async function loadReport() {
    try {
      const data = await dailyReportsService.getToday();
      setReport(data);
    } catch (error) { console.error(error); }
  }

  async function handleOpenCaixa() {
    if (!openingValue) return;
    await dailyReportsService.startDay(Number(openingValue));
    loadReport();
  }

  // --- TELA DE CAIXA FECHADO ---
  if (!report) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)' }}>
        <div style={{ background: 'white', padding: '3rem', borderRadius: '16px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h1 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Villa Bistrô</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>O caixa do dia ainda não foi aberto.</p>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="number" 
              placeholder="Fundo de Caixa (R$)" 
              value={openingValue}
              onChange={e => setOpeningValue(e.target.value)}
              style={{ padding: '1rem', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid #ccc', width: '200px' }}
            />
            <button 
              onClick={handleOpenCaixa} 
              className="btn-primary"
              style={{ margin: 0, padding: '0 2rem' }}
            >
              ABRIR CAIXA
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- TELA PRINCIPAL CLEAN (Com Abas) ---
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER: Foco no Saldo e Usuário */}
      <header style={{ background: 'white', padding: '1rem 2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h2 style={{ color: 'var(--color-primary)', margin: 0 }}>Villa Bistrô</h2>
          <div style={{ borderLeft: '1px solid #eee', paddingLeft: '2rem' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', color: '#888' }}>Saldo em Caixa</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
              R$ {Number(report.openingBalance).toFixed(2)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontWeight: 'bold', color: '#333' }}>{user?.name}</span>
            <span style={{ fontSize: '0.8rem', color: '#888' }}>Operador</span>
          </div>
          <button onClick={signOut} style={{ padding: '0.5rem 1rem', border: '1px solid #fee2e2', background: '#fff1f2', color: '#e11d48', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Sair
          </button>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* NAVEGAÇÃO POR ABAS */}
        <div className="tab-navigation">
          <button 
            className={`tab-item ${activeTab === 'BALCAO' ? 'active' : ''}`}
            onClick={() => setActiveTab('BALCAO')}
          >
            🏪 Fechamento Balcão
          </button>
          <button 
            className={`tab-item ${activeTab === 'CONVENIOS' ? 'active' : ''}`}
            onClick={() => setActiveTab('CONVENIOS')}
          >
            🏢 Convênios
          </button>
          <button 
            className={`tab-item ${activeTab === 'RESUMO' ? 'active' : ''}`}
            onClick={() => setActiveTab('RESUMO')}
          >
            📊 Resumo & Despesas
          </button>
        </div>

        {/* ÁREA DE CONTEÚDO (Só renderiza o ativo) */}
        <div className="tab-content" style={{ animation: 'fadeIn 0.3s' }}>
          
          {activeTab === 'BALCAO' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <CounterClosingPanel onSuccess={loadReport} />
            </div>
          )}

          {activeTab === 'CONVENIOS' && (
            <AgreementsPanel onSuccess={loadReport} />
          )}

          {activeTab === 'RESUMO' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Painel de Ações Rápidas (Despesa) */}
              <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>💸 Despesas e Sangrias</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Lançar valores para abater do caixa</p>
                </div>
                <button 
                  onClick={() => {
                    const v = prompt("Valor da saída (R$):");
                    const d = prompt("Descrição:");
                    if(v && d) movementsService.create({ type: MovementType.EXPENSE, amount: Number(v), quantity: 1, description: d }).then(() => { alert("Saída registrada!"); loadReport(); });
                  }}
                  className="btn-primary"
                  style={{ background: '#FECCA4', color: '#B45309', border: '1px solid #FDBA74' }}
                >
                  - LANÇAR DESPESA
                </button>
              </div>

              {/* O Novo Relatório Final */}
              <FinalReportPanel report={report} />

            </div>
          )}

        </div>

      </main>
    </div>
  );
}