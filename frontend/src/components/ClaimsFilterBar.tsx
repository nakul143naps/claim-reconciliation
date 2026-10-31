import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';
import { Download, RotateCcw, Search, ChevronDown, FileText, Printer, Upload } from 'lucide-react';

interface Props {
  claimIdFilter: string;
  payerFilter: string;
  statusFilter: string;
  flagFilter: string;
  pageSize: number;
  total: number;
  claimsCount: number;
  onClaimIdChange: (claimId: string) => void;
  onPayerChange: (payer: string) => void;
  onStatusChange: (status: string) => void;
  onFlagChange: (flag: string) => void;
  onResetFilters: () => void;
  onPageSizeChange: (newPageSize: number) => void;
  onOpenImportModal: () => void;
}

export const ClaimsFilterBar: React.FC<Props> = ({
  claimIdFilter,
  payerFilter,
  statusFilter,
  flagFilter,
  pageSize,
  total,
  claimsCount,
  onClaimIdChange,
  onPayerChange,
  onStatusChange,
  onFlagChange,
  onResetFilters,
  onPageSizeChange,
  onOpenImportModal,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportCsv = () => {
    setIsExportMenuOpen(false);
    window.open(api.getExportUrl('csv'), '_blank');
  };

  const handleExportJson = () => {
    setIsExportMenuOpen(false);
    window.open(api.getExportUrl('json'), '_blank');
  };

  const handlePrintPdf = () => {
    setIsExportMenuOpen(false);
    window.print();
  };

  return (
    <div className="filter-bar">
      <div className="filter-inputs">
        {/* Claim ID & Patient search */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '8px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search ID/Patient..."
            value={claimIdFilter}
            onChange={(e) => onClaimIdChange(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '28px', width: '160px', height: '32px', fontSize: '0.825rem' }}
          />
        </div>

        {/* Payer Filter */}
        <select
          value={payerFilter}
          onChange={(e) => onPayerChange(e.target.value)}
          className="select-field"
          style={{ height: '32px', fontSize: '0.825rem', padding: '0.2rem 0.5rem' }}
        >
          <option value="">All Payers</option>
          <option value="Northwind Health">Northwind Health</option>
          <option value="Cedar Mutual">Cedar Mutual</option>
          <option value="Harbor Plan">Harbor Plan</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="select-field"
          style={{ height: '32px', fontSize: '0.825rem', padding: '0.2rem 0.5rem' }}
        >
          <option value="">All Statuses</option>
          <option value="balanced">Balanced</option>
          <option value="unbalanced">Unbalanced</option>
          <option value="no_remittance">No Remittance</option>
        </select>

        {/* Operational Flag Filter */}
        <select
          value={flagFilter}
          onChange={(e) => onFlagChange(e.target.value)}
          className="select-field"
          style={{ height: '32px', fontSize: '0.825rem', padding: '0.2rem 0.5rem' }}
        >
          <option value="">All Flags</option>
          <option value="denial_history">Denial History (CO-*)</option>
          <option value="payment_exceeds_billed">Payment &gt; Billed</option>
          <option value="payer_mismatch">Payer Mismatch</option>
        </select>

        {/* Reset Filters */}
        {(payerFilter || statusFilter || flagFilter || claimIdFilter) && (
          <button
            className="btn"
            onClick={onResetFilters}
            title="Reset all active filters"
            style={{ height: '32px', padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'nowrap', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {/* Entries per page selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="select-field"
            style={{ padding: '0.2rem 0.4rem', fontSize: '0.825rem', height: '32px' }}
            title="Select number of entries per page"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Showing <strong>{claimsCount}</strong> of <strong>{total}</strong> claims
        </div>

        {/* Import CSV Modal Trigger Button */}
        <button
          className="btn"
          onClick={onOpenImportModal}
          title="Import custom Claims or Remittances CSV file"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '32px', padding: '0.25rem 0.75rem', fontSize: '0.825rem' }}
        >
          <Upload size={13} />
          <span>Import CSV</span>
        </button>

        {/* Multi-Format Export Dropdown */}
        <div style={{ position: 'relative' }} ref={exportDropdownRef}>
          <button
            className="btn btn-primary"
            onClick={() => setIsExportMenuOpen((prev) => !prev)}
            title="Export complete reconciliation audit ledger in multiple formats"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', height: '32px', padding: '0.25rem 0.75rem', fontSize: '0.825rem' }}
          >
            <Download size={13} />
            <span>Export Ledger</span>
            <ChevronDown size={13} style={{ transform: isExportMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
          </button>

          {isExportMenuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 6px)',
                background: '#ffffff',
                border: '1px solid var(--neutral-border)',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                width: '230px',
                zIndex: 40,
                overflow: 'hidden',
                padding: '0.4rem',
              }}
            >
              <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                Select Export Format
              </div>

              <button
                onClick={handleExportCsv}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.6rem 0.75rem',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <FileText size={16} style={{ color: 'var(--success)' }} />
                <div>
                  <div style={{ fontWeight: 600 }}>CSV Format (.csv)</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Excel & Sheets audit trail</div>
                </div>
              </button>

              <button
                onClick={handleExportJson}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.6rem 0.75rem',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Download size={16} style={{ color: 'var(--primary)' }} />
                <div>
                  <div style={{ fontWeight: 600 }}>JSON Format (.json)</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ERP & clearinghouse integration</div>
                </div>
              </button>

              <button
                onClick={handlePrintPdf}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.6rem 0.75rem',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Printer size={16} style={{ color: '#6366f1' }} />
                <div>
                  <div style={{ fontWeight: 600 }}>Print / Save PDF</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Formatted clinical ledger</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
