import React from 'react';
import { ClaimListItem } from '../types';
import { formatCurrency, formatRawCents } from '../utils/formatters';
import { StatusBadge } from './StatusBadge';
import { FlagBadge } from './FlagBadge';
import { ClaimsFilterBar } from './ClaimsFilterBar';
import { ClaimsPaginationBar } from './ClaimsPaginationBar';
import { Eye } from 'lucide-react';

interface Props {
  claims: ClaimListItem[];
  total: number;
  page: number;
  pageSize: number;
  payerFilter: string;
  statusFilter: string;
  flagFilter: string;
  claimIdFilter: string;
  isLoading: boolean;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  onPayerChange: (payer: string) => void;
  onStatusChange: (status: string) => void;
  onFlagChange: (flag: string) => void;
  onClaimIdChange: (claimId: string) => void;
  onResetFilters: () => void;
  onSelectClaim: (claimId: string) => void;
  onOpenImportModal: () => void;
}

export const ClaimsTable: React.FC<Props> = ({
  claims,
  total,
  page,
  pageSize,
  payerFilter,
  statusFilter,
  flagFilter,
  claimIdFilter,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onPayerChange,
  onStatusChange,
  onFlagChange,
  onClaimIdChange,
  onResetFilters,
  onSelectClaim,
  onOpenImportModal,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="card">
      <ClaimsFilterBar
        claimIdFilter={claimIdFilter}
        payerFilter={payerFilter}
        statusFilter={statusFilter}
        flagFilter={flagFilter}
        pageSize={pageSize}
        total={total}
        claimsCount={claims.length}
        onClaimIdChange={onClaimIdChange}
        onPayerChange={onPayerChange}
        onStatusChange={onStatusChange}
        onFlagChange={onFlagChange}
        onResetFilters={onResetFilters}
        onPageSizeChange={onPageSizeChange}
        onOpenImportModal={onOpenImportModal}
      />

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid #cbd5e1', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>Loading claims data...</p>
        </div>
      ) : claims.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>No matching claims found</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>Try clearing or adjusting your search filters above.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Claim ID</th>
                <th>Payer</th>
                <th className="text-right">Billed</th>
                <th className="text-right">Paid Cash</th>
                <th className="text-right">Adjusted</th>
                <th className="text-right">Patient Resp</th>
                <th className="text-right">Difference</th>
                <th className="text-center">Status</th>
                <th>Flags</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr key={claim.claim_id} onClick={() => onSelectClaim(claim.claim_id)}>
                  <td className="font-mono" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {claim.claim_id}
                  </td>
                  <td>{claim.payer}</td>
                  <td className="text-right font-mono">
                    <div>{formatCurrency(claim.billed_cents)}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{formatRawCents(claim.billed_cents)}</div>
                  </td>
                  <td className="text-right font-mono" style={{ color: claim.paid_cents > 0 ? 'var(--primary)' : 'inherit' }}>
                    {formatCurrency(claim.paid_cents)}
                  </td>
                  <td className="text-right font-mono" style={{ color: claim.adjustment_cents > 0 ? '#475569' : 'inherit' }}>
                    {formatCurrency(claim.adjustment_cents)}
                  </td>
                  <td className="text-right font-mono">
                    {formatCurrency(claim.patient_responsibility_cents)}
                  </td>
                  <td className="text-right font-mono">
                    {claim.difference_cents === null ? (
                      <span style={{ color: '#94a3b8' }} title="No remittance received: difference is undefined">—</span>
                    ) : (
                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            claim.difference_cents === 0
                              ? 'var(--success)'
                              : claim.difference_cents < 0
                              ? 'var(--danger)'
                              : 'var(--warning)',
                        }}
                      >
                        {formatCurrency(claim.difference_cents)}
                      </span>
                    )}
                  </td>
                  <td className="text-center">
                    <StatusBadge status={claim.status} />
                  </td>
                  <td>
                    {claim.flags.length > 0 ? (
                      <div>
                        {claim.flags.map((f) => (
                          <FlagBadge key={f} flag={f} />
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>None</span>
                    )}
                  </td>
                  <td className="text-center">
                    <button
                      className="btn"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectClaim(claim.claim_id);
                      }}
                    >
                      <Eye size={12} />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ClaimsPaginationBar
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        isLoading={isLoading}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
};
