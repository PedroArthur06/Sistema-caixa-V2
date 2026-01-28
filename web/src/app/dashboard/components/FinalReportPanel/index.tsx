import { useMemo } from 'react';
import { MovementType } from '../../services/movements.service';
import type { DailyReport } from '../../services/daily-reports.service';
import './styles.css';

interface FinalReportPanelProps {
  report: DailyReport;
}

export function FinalReportPanel({ report }: FinalReportPanelProps) {

  const totals = useMemo(() => {
    const opening = Number(report.openingBalance) || 0;
    
    let agreements = 0;
    let counter = 0;
    let others = 0;
    let expenses = 0;

    if (report.movements) {
      for (const m of report.movements) {
        const val = Number(m.amount);
        
        switch (m.type) {
          case MovementType.INCOME_AGREEMENT:
            agreements += val;
            break;
            
          case MovementType.INCOME_CASH:
          case MovementType.INCOME_DEBIT:
          case MovementType.INCOME_CREDIT:
          case MovementType.INCOME_PIX_KEY:
          case MovementType.INCOME_QR_CODE:
            counter += val;
            break;
            
          case MovementType.INCOME_IFOOD:
            others += val; 
            break;
            
          case MovementType.EXPENSE:
            expenses += val;
            break;
        }
      }
    }

    const total = opening + agreements + counter + others - expenses;

    return { opening, agreements, counter, others, expenses, total };
  }, [report]);

  const handleCopy = () => {
    const text = `
📅 *Relatório de Fechamento*
---------------------------
1. Fundo Inicial: R$ ${totals.opening.toFixed(2)}
2. Convênios: R$ ${totals.agreements.toFixed(2)}
3. Balcão: R$ ${totals.counter.toFixed(2)}
4. Avulsos: R$ ${totals.others.toFixed(2)}
5. Despesas: - R$ ${totals.expenses.toFixed(2)}
---------------------------
💰 *TOTAL GERAL: R$ ${totals.total.toFixed(2)}*
    `.trim();

    navigator.clipboard.writeText(text);
    alert("Relatório copiado para a área de transferência!");
  };

  return (
    <div className="final-report-card">
      <div className="report-header">
        <h3>🧾 Relatório Final</h3>
      </div>

      <div className="report-grid">
        {/* 1. FUNDO INICIAL */}
        <div className="report-box">
          <label>1. FUNDO INICIAL</label>
          <span className="value">R$ {totals.opening.toFixed(2)}</span>
        </div>

        {/* 2. CONVÊNIOS */}
        <div className="report-box">
          <label>2. CONVÊNIOS</label>
          <span className="value income">+ R$ {totals.agreements.toFixed(2)}</span>
        </div>

        {/* 3. BALCÃO */}
        <div className="report-box">
          <label>3. BALCÃO (FINAN.)</label>
          <span className="value income">+ R$ {totals.counter.toFixed(2)}</span>
        </div>

        {/* 4. AVULSOS */}
        <div className="report-box">
          <label>4. AVULSOS</label>
          <span className="value income">+ R$ {totals.others.toFixed(2)}</span>
        </div>

        {/* 5. DESPESAS */}
        <div className="report-box">
          <label>5. DESPESAS</label>
          <span className="value expense">- R$ {totals.expenses.toFixed(2)}</span>
        </div>

        {/* 6. TOTAL GERAL */}
        <div className="report-box total-hl">
          <label>6. TOTAL GERAL (SOMADO)</label>
          <span className="value">R$ {totals.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="report-actions">
        <button onClick={handleCopy} className="btn-copy">
          📥 Copiar Relatório
        </button>
        <button className="btn-refresh" onClick={() => window.location.reload()} title="Recarregar">
          🔄
        </button>
      </div>
    </div>
  );
}
