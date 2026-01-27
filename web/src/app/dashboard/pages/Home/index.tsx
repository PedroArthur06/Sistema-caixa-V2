import { useEffect, useState } from "react";
import { useAuth } from "../../../../shared/contexts/AuthContext";
import { type DailyReport, dailyReportsService } from "../../services/daily-reports.service";
import { NewMovementModal } from "../../components/NewMovementModal";

export function Dashboard() {
  const { signOut, user } = useAuth();

  const [report, setReport] = useState<DailyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openingValue, setOpeningValue] = useState('')

  useEffect(() => {
    loadReport();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);

  async function loadReport() {
    try {
      const data = await dailyReportsService.getToday();
      setReport(data);
    } catch (error) {
      console.error("Erro ao buscar caixa:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOpenCaixa() {
    if (!openingValue) return;
    
    try {
      const value = Number(openingValue);
      const newReport = await dailyReportsService.startDay(value);
      setReport(newReport);
    } catch (error) {
      alert("Erro ao abrir caixa");
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* CABEÇALHO */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '1rem'
      }}>
        <div>
          <h1 style={{ color: 'var(--color-primary)', fontSize: '1.5rem' }}>📊 Villa Bistrô</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {isLoading ? 'Carregando...' : (report ? 'Caixa Aberto' : 'Caixa Fechado')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontWeight: '600', color: 'var(--color-primary)' }}>{user?.name}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Operador</span>
          </div>
          
          <button 
            onClick={signOut}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-error)',
              color: 'var(--color-error)',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Sair
          </button>
        </div>
      </header>
      
      <main>
        {isLoading ? (
          <p>Verificando sistema...</p>
        ) : !report ? (
          <div style={{ 
            backgroundColor: 'var(--color-surface)', 
            padding: '3rem', 
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            textAlign: 'center',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <h2 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>O Caixa está Fechado</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--color-text-muted)' }}>Informe o valor em dinheiro na gaveta para iniciar as operações do dia.</p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <input 
                type="number" 
                placeholder="R$ 0,00"
                value={openingValue}
                onChange={e => setOpeningValue(e.target.value)}
                style={{
                  padding: '1rem',
                  fontSize: '1.2rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  width: '150px'
                }}
              />
              <button 
                onClick={handleOpenCaixa}
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  padding: '0 2rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                ABRIR CAIXA
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            
            {/* Cartão de Saldo */}
            <div style={{ 
              backgroundColor: 'var(--color-surface)', 
              padding: '2rem', 
              borderRadius: '12px',
              borderLeft: '5px solid var(--color-primary)'
            }}>
              <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Saldo Inicial</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                R$ {Number(report.openingBalance).toFixed(2)}
              </p>
            </div>

            <div style={{ 
              backgroundColor: 'var(--color-surface)', 
              padding: '2rem', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed var(--color-border)'
            }}>
              <p style={{ color: 'var(--color-text-muted)' }}>Área de Lançamentos (Em construção)</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}