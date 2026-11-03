import React from 'react';
import { ReconciliationSummary } from '../types';
import { formatCurrency, formatRawCents } from '../utils/formatters';
import { FinancialSettlementProgressBar } from './FinancialSettlementProgressBar';
import {
  FileText,
  CheckCircle,
  AlertOctagon,
  DollarSign,
  HelpCircle,
  ShieldAlert,
  Clock,
  Receipt,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

interface Props {
  summary: ReconciliationSummary;
  onFilterStatus?: (status: string) => void;
  onFilterFlag?: (flag: string) => void;
  onNavigateUnmatched?: () => void;
}

interface KpiCardItemProps {
  label: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  subtext: React.ReactNode;
  labelColor?: string;
  valueColor?: string;
  subtextColor?: string;
  cardStyle?: React.CSSProperties;
  subtextClassName?: string;
  onClick?: () => void;
  title?: string;
}

const KpiCardItem: React.FC<KpiCardItemProps> = ({
  label,
  icon,
  value,
  subtext,
  labelColor,
  valueColor,
  subtextColor,
  cardStyle,
  subtextClassName = 'kpi-subtext',
  onClick,
  title,
}) => (
  <div
    className="kpi-card"
    style={{ cursor: onClick ? 'pointer' : 'default', ...cardStyle }}
    onClick={onClick}
    title={title}
  >
    <div>
      <div className="kpi-label" style={labelColor ? { color: labelColor } : undefined}>
        <span>{label}</span>
        {icon}
      </div>
      <div className="kpi-value" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
    </div>
    <div className={subtextClassName} style={subtextColor ? { color: subtextColor } : undefined}>
      {subtext}
    </div>
  </div>
);

export const SummaryCards: React.FC<Props> = ({ summary, onFilterStatus, onFilterFlag, onNavigateUnmatched }) => {
  const uncollectedCash =
    summary.uncollected_cash_cents ??
    Math.max(0, summary.total_billed_cents - summary.matched_paid_cents);

  const adjustments = summary.total_adjustment_cents ?? 0;
  const patientResp = summary.total_patient_responsibility_cents ?? 0;
  const totalWriteOffsAndCopays = adjustments + patientResp;

  const netUnsettled =
    summary.net_unsettled_cents ??
    Math.max(
      0,
      summary.total_billed_cents -
        summary.matched_paid_cents -
        totalWriteOffsAndCopays
    );

  const collectedPct =
    summary.total_billed_cents > 0
      ? ((summary.matched_paid_cents / summary.total_billed_cents) * 100).toFixed(1)
      : '0.0';

  const adjustmentsPct =
    summary.total_billed_cents > 0
      ? ((adjustments / summary.total_billed_cents) * 100).toFixed(1)
      : '0.0';

  const patientRespPct =
    summary.total_billed_cents > 0
      ? ((patientResp / summary.total_billed_cents) * 100).toFixed(1)
      : '0.0';

  const unsettledPct =
    summary.total_billed_cents > 0
      ? ((netUnsettled / summary.total_billed_cents) * 100).toFixed(1)
      : '0.0';

  return (
    <div>
      <FinancialSettlementProgressBar
        totalBilledCents={summary.total_billed_cents}
        matchedPaidCents={summary.matched_paid_cents}
        totalAdjustmentCents={adjustments}
        totalPatientRespCents={patientResp}
        netUnsettledCents={netUnsettled}
        collectedPct={collectedPct}
        adjustmentsPct={adjustmentsPct}
        patientRespPct={patientRespPct}
        unsettledPct={unsettledPct}
      />

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <KpiCardItem
          label="Total Billed"
          icon={<DollarSign size={16} className="text-slate-400" />}
          value={formatCurrency(summary.total_billed_cents)}
          subtext={`${formatRawCents(summary.total_billed_cents)} clinic charges`}
          subtextClassName="kpi-subtext font-mono"
        />

        <KpiCardItem
          label="Matched Cash Paid"
          icon={<DollarSign size={16} style={{ color: 'var(--success)' }} />}
          value={formatCurrency(summary.matched_paid_cents)}
          subtext={`${collectedPct}% of billed collected`}
          labelColor="var(--success)"
          valueColor="var(--success)"
          subtextClassName="kpi-subtext font-mono"
        />

        <KpiCardItem
          label="Amount Not Yet Received"
          icon={<Clock size={16} style={{ color: '#ea580c' }} />}
          value={formatCurrency(uncollectedCash)}
          subtext={
            <>
              <strong>{formatCurrency(netUnsettled)}</strong> net unsettled AR ({unsettledPct}%)
            </>
          }
          labelColor="#c2410c"
          valueColor="#ea580c"
          subtextColor="#7c2d12"
          cardStyle={{
            borderLeft: '4px solid #ea580c',
            background: '#fffaf5',
          }}
          onClick={() => onFilterStatus && onFilterStatus('unbalanced')}
          title="Click to view claims with pending / uncollected balances"
        />

        <KpiCardItem
          label="Contractual Adjustments"
          icon={<Receipt size={16} />}
          value={formatCurrency(adjustments)}
          subtext={`Payer fee write-offs (${adjustmentsPct}%)`}
          labelColor="#2563eb"
          valueColor="#2563eb"
          title="Contractual write-offs discounted by payer agreement (CO-*)"
        />

        <KpiCardItem
          label="Patient Responsibility"
          icon={<UserCheck size={16} />}
          value={formatCurrency(patientResp)}
          subtext={`Copays & deductibles (${patientRespPct}%)`}
          labelColor="#7c3aed"
          valueColor="#7c3aed"
          title="Patient balance owed for copay, coinsurance, and deductibles (PR-*)"
        />

        <KpiCardItem
          label="Total Claims"
          icon={<FileText size={16} className="text-slate-400" />}
          value={summary.total_claims}
          subtext="Total claims billed in system"
        />

        <KpiCardItem
          label="Balanced Claims"
          icon={<CheckCircle size={16} />}
          value={summary.balanced_claims}
          subtext="Fully accounted (difference = $0.00)"
          labelColor="var(--success)"
          valueColor="var(--success)"
          onClick={() => onFilterStatus && onFilterStatus('balanced')}
          title="Filter by Balanced Claims"
        />

        <KpiCardItem
          label="Unbalanced Claims"
          icon={<AlertOctagon size={16} />}
          value={summary.unbalanced_claims}
          subtext={`${summary.unbalanced_claims} claim${summary.unbalanced_claims === 1 ? '' : 's'} with variance`}
          labelColor="var(--warning)"
          valueColor="var(--warning)"
          onClick={() => onFilterStatus && onFilterStatus('unbalanced')}
          title="Filter by Unbalanced Claims"
        />

        <KpiCardItem
          label="No Remittance"
          icon={<HelpCircle size={16} />}
          value={summary.claims_without_remittance}
          subtext="Pending payer adjudication"
          labelColor="#64748b"
          onClick={() => onFilterStatus && onFilterStatus('no_remittance')}
          title="Filter by Claims Awaiting Remittance"
        />

        <KpiCardItem
          label="Unmatched Cash"
          icon={<HelpCircle size={16} />}
          value={formatCurrency(summary.unmatched_remittance_paid_cents)}
          subtext={`${summary.unmatched_remittance_count} orphaned remittance${summary.unmatched_remittance_count === 1 ? '' : 's'}`}
          labelColor="#d97706"
          valueColor="#d97706"
          onClick={onNavigateUnmatched}
          title="Click to view Unmatched Remittances Queue"
        />

        <KpiCardItem
          label="Denial History"
          icon={<ShieldAlert size={16} />}
          value={summary.claims_with_denial_history}
          subtext="Prior payer rejections (CO-*)"
          labelColor="#dc2626"
          valueColor="#dc2626"
          onClick={() => onFilterFlag && onFilterFlag('denial_history')}
          title="Click to filter claims with Denial History"
        />

        <KpiCardItem
          label="Review Flags"
          icon={<AlertTriangle size={16} />}
          value={summary.claims_flagged_for_review}
          subtext="Payment > Billed or payer mismatch"
          labelColor="#ea580c"
          valueColor="#ea580c"
          onClick={() => onFilterFlag && onFilterFlag('payment_exceeds_billed')}
          title="Click to filter claims flagged for review"
        />
      </div>
    </div>
  );
};
