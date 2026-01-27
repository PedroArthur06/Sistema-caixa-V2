import { useAuth } from "../../../../shared/contexts/AuthContext";

export function Dashboard() {
  // 1. Pegamos a função signOut do nosso contexto
  const { signOut, user } = useAuth();

  return (
    <div style={{ padding: '2rem' }}>
      {/* Cabeçalho Provisório */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '1rem'
      }}>
        <div>
          <h1 style={{ color: 'var(--color-primary)' }}>📊 Villa Bistrô</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Dashboard Operacional</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span>Olá, <strong>{user?.name}</strong></span>
          
          {/* 2. O Botão de Sair */}
          <button 
            onClick={signOut}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-error)',
              color: 'var(--color-error)',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            // Efeito de hover simples inline (num projeto maior, iria pro CSS)
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-error-bg)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Sair do Sistema
          </button>
        </div>
      </header>
      
      <main>
        <div style={{ 
          backgroundColor: 'var(--color-surface)', 
          padding: '2rem', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h2>Bem-vindo ao Caixa</h2>
          <p>O sistema está pronto para receber os componentes do dashboard.</p>
        </div>
      </main>
    </div>
  );
}