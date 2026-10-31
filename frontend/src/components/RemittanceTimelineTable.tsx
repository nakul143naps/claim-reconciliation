import React from 'react';
import { RemittanceDetail } from '../types';
import { formatCurrency, formatDate, REASON_CODE_DESCRIPTIONS } from '../utils/formatters';

interface Props {
  remittances: RemittanceDetail[];
}

export const RemittanceTimelineTable: React.FC<Props> = ({ remittances }) => {
  return (
    <div>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: '#334155' }}>
        Remittance Audit Trail ({remittances.length} record{remittances.length !== 1 ? 's' : ''})
      </h3>

      {remittances.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No remittance transactions recorded for this claim.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Posted Date</th>
                <th>Remit ID</th>
                <th className="text-right">Paid Cash</th>
                <th className="text-right">Adjustment</th>
                <th className="text-right">Patient Resp</th>
                <th>Reason Code</th>
                <th>Explanation</th>
              </tr>
            </thead>
            <tbody>
              {remittances.map((remit) => {
                const reasonInfo = remit.reason_code ? REASON_CODE_DESCRIPTIONS[remit.reason_code] : null;
                return (
                  <tr key={remit.remit_id}>
                    <td>{formatDate(remit.posted_date)}</td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>{remit.remit_id}</td>
                    <td className="text-right font-mono" style={{ color: remit.paid_cents > 0 ? 'var(--primary)' : 'inherit' }}>
                      {formatCurrency(remit.paid_cents)}
                    </td>
                    <td className="text-right font-mono">{formatCurrency(remit.adjustment_cents)}</td>
                    <td className="text-right font-mono">{formatCurrency(remit.patient_responsibility_cents)}</td>
                    <td>
                      {remit.reason_code ? (
                        <span
                          className="font-mono"
                          style={{
                            fontWeight: 600,
                            padding: '0.15rem 0.4rem',
                            borderRadius: '4px',
                            background: reasonInfo?.isDenial ? '#fef2f2' : '#f1f5f9',
                            color: reasonInfo?.isDenial ? '#b91c1c' : '#334155',
                            border: reasonInfo?.isDenial ? '1px solid #fecaca' : '1px solid #cbd5e1',
                          }}
                        >
                          {remit.reason_code}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {reasonInfo ? reasonInfo.desc : remit.reason_code ? 'Standard adjustment code' : 'Clean cash payment without adjustment code'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
