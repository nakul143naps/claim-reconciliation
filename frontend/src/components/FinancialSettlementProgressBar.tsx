import React from 'react';
import { formatCurrency } from '../utils/formatters';

interface Props {
  totalBilledCents: number;
  matchedPaidCents: number;
  totalWriteOffsAndCopays: number;
  netUnsettledCents: number;
  collectedPct: string;
  writeOffsPct: string;
  unsettledPct: string;
}

export const FinancialSettlementProgressBar: React.FC<Props> = ({
  totalBilledCents,
  matchedPaidCents,
  totalWriteOffsAndCopays,
  netUnsettledCents,
  collectedPct,
  writeOffsPct,
  unsettledPct,
}) => {
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
        <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.775rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#16a34a', fontWeight: 600 }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#16a34a' }}></span>
            Cash Received: {formatCurrency(matchedPaidCents)} ({collectedPct}%)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', fontWeight: 600 }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#2563eb' }}></span>
            Contract Adjustments & Copays: {formatCurrency(totalWriteOffsAndCopays)} ({writeOffsPct}%)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ea580c', fontWeight: 700 }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ea580c' }}></span>
            Amount Not Yet Received: {formatCurrency(netUnsettledCents)} ({unsettledPct}%)
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
          style={{ width: `${collectedPct}%`, background: '#16a34a', transition: 'width 0.4s ease' }}
          title={`Cash Received: ${formatCurrency(matchedPaidCents)} (${collectedPct}%)`}
        />
        <div
          style={{ width: `${writeOffsPct}%`, background: '#2563eb', transition: 'width 0.4s ease' }}
          title={`Contract Adjustments & Copays: ${formatCurrency(totalWriteOffsAndCopays)} (${writeOffsPct}%)`}
        />
        <div
          style={{ width: `${unsettledPct}%`, background: '#ea580c', transition: 'width 0.4s ease' }}
          title={`Amount Not Yet Received: ${formatCurrency(netUnsettledCents)} (${unsettledPct}%)`}
        />
      </div>
    </div>
  );
};
