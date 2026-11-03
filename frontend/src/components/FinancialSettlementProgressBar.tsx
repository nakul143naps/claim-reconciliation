import React from 'react';
import { formatCurrency } from '../utils/formatters';

interface Props {
  totalBilledCents: number;
  matchedPaidCents: number;
  totalAdjustmentCents: number;
  totalPatientRespCents: number;
  netUnsettledCents: number;
  collectedPct: string;
  adjustmentsPct: string;
  patientRespPct: string;
  unsettledPct: string;
}

export const FinancialSettlementProgressBar: React.FC<Props> = ({
  totalBilledCents,
  matchedPaidCents,
  totalAdjustmentCents,
  totalPatientRespCents,
  netUnsettledCents,
  collectedPct,
  adjustmentsPct,
  patientRespPct,
  unsettledPct,
}) => {
  const numericCollected = Math.max(0, parseFloat(collectedPct) || 0);
  const numericAdjustments = Math.max(0, parseFloat(adjustmentsPct) || 0);
  const numericPatientResp = Math.max(0, parseFloat(patientRespPct) || 0);
  const numericUnsettled = Math.max(0, parseFloat(unsettledPct) || 0);

  // Normalize segments so cumulative display width never exceeds 100%
  const totalPct = numericCollected + numericAdjustments + numericPatientResp + numericUnsettled;
  const scale = totalPct > 100 ? 100 / totalPct : 1;
  const barCollected = (numericCollected * scale).toFixed(1);
  const barAdjustments = (numericAdjustments * scale).toFixed(1);
  const barPatientResp = (numericPatientResp * scale).toFixed(1);
  const barUnsettled = (numericUnsettled * scale).toFixed(1);

  return (
    <div
      style={{
        marginBottom: '1.75rem',
        background: '#f8fafc',
        padding: '1.15rem 1.35rem',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.6rem',
        }}
      >
        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Financial Settlement Breakdown of Total Billed ({formatCurrency(totalBilledCents)})
        </div>
        <div style={{ display: 'flex', gap: '1.15rem', fontSize: '0.775rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#16a34a', fontWeight: 600 }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#16a34a' }}></span>
            Cash Received: {formatCurrency(matchedPaidCents)} ({collectedPct}%)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', fontWeight: 600 }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#2563eb' }}></span>
            Contract Adjustments: {formatCurrency(totalAdjustmentCents)} ({adjustmentsPct}%)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#7c3aed', fontWeight: 600 }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#7c3aed' }}></span>
            Patient Resp: {formatCurrency(totalPatientRespCents)} ({patientRespPct}%)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ea580c', fontWeight: 700 }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ea580c' }}></span>
            Unsettled: {formatCurrency(netUnsettledCents)} ({unsettledPct}%)
          </span>
        </div>
      </div>

      {/* Multi-segment stacked progress bar */}
      <div
        style={{
          height: '11px',
          width: '100%',
          background: '#e2e8f0',
          borderRadius: '9999px',
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        <div
          style={{ width: `${barCollected}%`, background: '#16a34a', transition: 'width 0.4s ease' }}
          title={`Cash Received: ${formatCurrency(matchedPaidCents)} (${collectedPct}%)`}
        />
        <div
          style={{ width: `${barAdjustments}%`, background: '#2563eb', transition: 'width 0.4s ease' }}
          title={`Contractual Adjustments: ${formatCurrency(totalAdjustmentCents)} (${adjustmentsPct}%)`}
        />
        <div
          style={{ width: `${barPatientResp}%`, background: '#7c3aed', transition: 'width 0.4s ease' }}
          title={`Patient Responsibility: ${formatCurrency(totalPatientRespCents)} (${patientRespPct}%)`}
        />
        <div
          style={{ width: `${barUnsettled}%`, background: '#ea580c', transition: 'width 0.4s ease' }}
          title={`Amount Not Yet Received: ${formatCurrency(netUnsettledCents)} (${unsettledPct}%)`}
        />
      </div>
    </div>
  );
};
