import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does Claims Reconciliation System guarantee zero calculation or rounding errors?',
      a: 'In standard computer programs, calculating with decimals (like 0.1 + 0.2) causes tiny rounding errors that fail financial audits. Claims Reconciliation System stores and calculates all money strictly in whole integer cents (e.g., a $150.00 bill is stored as 15,000 cents). Conversion to dollars happens only on screen, guaranteeing 100% exact math with zero penny drift.',
    },
    {
      q: 'What is "Unmatched Cash", and what happens if an insurance check references a missing claim?',
      a: 'Sometimes an insurance company sends a payment check with a mistyped or missing claim number (like remittance R1012 for $50.00 pointing to claim C9999, which does not exist in our clinic ledger). Claims Reconciliation System preserves the source reference and quarantines the remittance without fabricating phantom claims.',
    },
    {
      q: 'How does the system track Payer Denials, and why can a claim be Balanced with Denial History?',
      a: 'When an insurance company rejects a claim (for example, missing paperwork or an uncovered procedure), Claims Reconciliation System flags it immediately with a Denial badge so billing staff can file an appeal while still keeping the true financial status visible.',
    },
    {
      q: 'How does Automatic Underpayment Detection work?',
      a: 'When insurance pays less than what was billed and agreed upon, the system marks the claim as "Unbalanced" and highlights the exact dollar gap. For example, on claim C1004, the clinic billed $200.00 but payer cash remains below expectation, which the ledger flags for review.',
    },
    {
      q: 'How is the "Amount Not Yet Received" calculated, and what does it include?',
      a: 'Out of the $1,700.00 total billed by the clinic, $990.00 has arrived as cash, leaving $710.00 in cash still pending. After factoring in pre-agreed insurance discounts ($140.00 write-offs and $75.00 patient responsibility), the remaining balance remains visible for operational review.',
    },
    {
      q: 'What is the difference between a Contractual Write-Off and a Patient Copay?',
      a: 'A Contractual Write-Off (like code CO-45) is a legal discount pre-agreed between the clinic and the insurance company—nobody pays this amount, and it is simply erased from the bill so claims can be reconciled accurately.',
    },
    {
      q: 'Why is the difference shown as empty (Null) for claims with No Remittance?',
      a: 'If an insurance company has not responded to a claim yet (like Claim C1005 for $60.00), we do not know yet how much they will pay or discount. Marking it as an overdue debt right away would create a false financial claim.',
    },
    {
      q: 'What formats can the reconciliation audit ledger be exported in?',
      a: 'The platform supports one-click export in CSV format (for Excel and spreadsheet audits), structured JSON (for automated hospital software integration), and formatted Print / PDF view for executive review.',
    },
  ];

  return (
    <section id="faq" style={{ margin: '4rem 0 3rem 0', background: '#ffffff', border: '1px solid var(--neutral-border)', borderRadius: '12px', padding: '3rem 2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 2.5rem auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <HelpCircle size={15} />
          <span>Frequently Asked Questions</span>
        </div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
          Everything You Need to Know
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          Simple, plain-English explanations of how Claims Reconciliation System reconciles claims, catches underpayments, and protects clinic revenue.
        </p>
      </div>

      <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              style={{
                border: '1px solid var(--neutral-border)',
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'border-color 0.15s ease',
              }}
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                style={{
                  width: '100%',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: isOpen ? '#f8fafc' : '#ffffff',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: 'var(--text-main)',
                }}
              >
                <span>{faq.q}</span>
                {isOpen ? <ChevronUp size={18} style={{ color: 'var(--primary)' }} /> : <ChevronDown size={18} style={{ color: '#94a3b8' }} />}
              </button>

              {isOpen && (
                <div style={{ padding: '1.25rem 1.5rem', background: '#ffffff', borderTop: '1px solid #f1f5f9', fontSize: '0.875rem', color: '#475569', lineHeight: 1.65 }}>
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
