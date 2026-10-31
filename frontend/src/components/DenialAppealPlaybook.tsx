import React, { useState } from 'react';
import { ClaimDetail } from '../types';
import { Sparkles, Copy, Check } from 'lucide-react';

interface Props {
  claim: ClaimDetail;
}

export const DenialAppealPlaybook: React.FC<Props> = ({ claim }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAppealBrief = () => {
    const denialCodes = claim.remittances
      .filter((r) => r.reason_code && ['CO-16', 'CO-50', 'CO-197'].includes(r.reason_code.toUpperCase()))
      .map((r) => r.reason_code)
      .join(', ');

    const brief = `CLINICAL RECONSIDERATION & DENIAL APPEAL BRIEF
=====================================================
Claim ID:        ${claim.claim_id}
Patient Account: ${claim.patient_account}
Payer:           ${claim.payer}
Date of Service: ${claim.service_date}
CPT Procedure:   ${claim.cpt}
Billed Amount:   $${(claim.billed_cents / 100).toFixed(2)}
Denial Code(s):  ${denialCodes}
Reconciled State:${claim.status.toUpperCase()}

RECOMMENDED CLINICAL APPEAL PROTOCOL:
• Attach signed provider chart notes validating medical necessity for CPT ${claim.cpt}.
• Verify provider NPI, taxonomy coordinates, and prior authorization logs.
• Submit via electronic clearinghouse portal within standard timely filing limits.
=====================================================
Generated via Stitch Fin Claim Reconciliation Engine`;

    navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ marginTop: '1.5rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 'var(--radius)', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} style={{ color: 'var(--primary)' }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
            FDE Denial Resolution & Appeal Playbook
          </h4>
        </div>

        <button
          className="btn"
          onClick={handleCopyAppealBrief}
          style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
          title="Copy clinical appeal brief to clipboard"
        >
          {copied ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
          <span>{copied ? 'Copied Appeal Brief!' : 'Copy Appeal Brief'}</span>
        </button>
      </div>

      <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
        <p style={{ marginBottom: '0.5rem' }}>
          <strong>Clinical Reconsideration Strategy:</strong> This claim contains denial code(s) requiring active intervention under standard healthcare revenue cycle guidelines:
        </p>
        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <li>
            <strong>CO-16 (Missing Documentation)</strong>: Cross-check medical charts for signed physician order and submit corrected 837P claim.
          </li>
          <li>
            <strong>CO-50 (Medical Necessity)</strong>: Attach provider peer-to-peer review request and relevant diagnosis/clinical notes.
          </li>
          <li>
            <strong>CO-197 (Precertification Absent)</strong>: Initiate payer retro-authorization request citing medical urgency.
          </li>
        </ul>
      </div>
    </div>
  );
};
