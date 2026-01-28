import { useMemo } from 'react';
import { MovementType } from '../../services/movements.service';
import type { DailyReport } from '../../services/daily-reports.service';
import './styles.css';

interface FinalReportPanelProps {
  report: DailyReport;
  onCloseCaixa: () => void;
}

export function FinalReportPanel({ report, onCloseCaixa }: FinalReportPanelProps) {
  const totals = useMemo(() => {
    const opening = Number(report.openingBalance) || 0;
    let agreements = 0;
    let counter = 0;
    let expenses = 0;

    if (report.movements) {
      for (const m of report.movements) {
        const val = Number(m.amount);
        switch (m.type) {
          case MovementType.INCOME_AGREEMENT: agreements += val; break;
          case MovementType.INCOME_CASH:
          case MovementType.INCOME_DEBIT:
          case MovementType.INCOME_CREDIT:
          case MovementType.INCOME_PIX_KEY:
          case MovementType.INCOME_QR_CODE: counter += val; break;
          case MovementType.EXPENSE: expenses += val; break;
        }
      }
    }
    const total = opening + agreements + counter - expenses;
    return { opening, agreements, counter, expenses, total };
  }, [report]);

  const handleCopy = () => {
    const text = `
📅 *Relatório de Fechamento - Villa Bistrô*
---------------------------
1. Fundo Inicial: R$ ${totals.opening.toFixed(2)}
2. Convênios: R$ ${totals.agreements.toFixed(2)}
3. Balcão/Vendas: R$ ${totals.counter.toFixed(2)}
4. Despesas: - R$ ${totals.expenses.toFixed(2)}
---------------------------
💰 *TOTAL EM CAIXA: R$ ${totals.total.toFixed(2)}*
    `.trim();

    navigator.clipboard.writeText(text);
    alert("Relatório copiado!");
  };

  return (
    <div className="final-report-card">
      <div className="report-header">
        <h3>🧾 Resumo do Dia</h3>
      </div>

      <div className="report-grid">
        <div className="report-box">
          <label>Fundo Inicial</label>
          <span className="value">R$ {totals.opening.toFixed(2)}</span>
        </div>

        <div className="report-box">
          <label>Vendas (Balcão)</label>
          <span className="value income">+ R$ {totals.counter.toFixed(2)}</span>
        </div>

        <div className="report-box">
          <label>Convênios</label>
          <span className="value income">+ R$ {totals.agreements.toFixed(2)}</span>
        </div>

        <div className="report-box">
          <label>Despesas</label>
          <span className="value expense">- R$ {totals.expenses.toFixed(2)}</span>
        </div>

        <div className="report-box total-hl">
          <label style={{ color: 'white' }}>SALDO FINAL</label>
          <span className="value">R$ {totals.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="report-actions">
        <button onClick={handleCopy} className="btn-copy">📋 Copiar</button>
        <button onClick={onCloseCaixa} className="btn-close-day">🔒 Fechar</button>
      </div>
    </div>
  );
}