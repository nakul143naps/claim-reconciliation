import React from 'react';
import { FileImportResult } from '../types';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  importResult: FileImportResult;
}

export const ImportReportCard: React.FC<Props> = ({ importResult }) => {
  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.6rem' }}>
        <CheckCircle2 size={16} />
        <span>Import Ingestion Completed: {importResult.filename}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', textAlign: 'center', fontSize: '0.8rem' }}>
        <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Rows Seen</div>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{importResult.rows_seen}</div>
        </div>
        <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: 'var(--success)', fontSize: '0.7rem' }}>Inserted</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--success)' }}>{importResult.inserted}</div>
        </div>
        <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: 'var(--primary)', fontSize: '0.7rem' }}>Duplicates Skipped</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)' }}>{importResult.duplicate_noop}</div>
        </div>
        <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: importResult.rejected > 0 ? 'var(--danger)' : 'var(--text-muted)', fontSize: '0.7rem' }}>Rejected</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: importResult.rejected > 0 ? 'var(--danger)' : 'inherit' }}>{importResult.rejected}</div>
        </div>
      </div>

      {importResult.issues.length > 0 && (
        <div style={{ marginTop: '0.75rem', maxHeight: '120px', overflowY: 'auto', fontSize: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
          <strong style={{ color: 'var(--danger)' }}>Row Warnings:</strong>
          {importResult.issues.map((issue, idx) => (
            <div key={idx} style={{ color: '#64748b', marginTop: '0.2rem' }}>
              Row {issue.row_number} {issue.record_id ? `[${issue.record_id}]` : ''}: {issue.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
