import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
}

export const ClaimsPaginationBar: React.FC<Props> = ({
  page,
  totalPages,
  total,
  pageSize,
  isLoading,
  onPageChange,
  onPageSizeChange,
}) => {
  return (
    <div className="pagination-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div>
          Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total claims)
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>Entries per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="select-field"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.825rem', height: '30px' }}
            title="Change number of claims displayed per page"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className="btn"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={14} />
          <span>Previous</span>
        </button>
        <button
          className="btn"
          disabled={page >= totalPages || isLoading}
          onClick={() => onPageChange(page + 1)}
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
