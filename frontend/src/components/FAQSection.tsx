import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does the Claims Reconciliation System guarantee zero calculation or rounding errors?',
      a: 'In standard computer programs, calculating with decimals (like 0.1 + 0.2) causes tiny rounding errors that fail financial audits. Claims Reconciliation System stores and calculates all money strictly in whole integer cents (e.g., a $150.00 bill is stored as 15,000 cents). Conversion to dollars happens only on screen, guaranteeing 100% exact math with zero penny drift.',
    },
    {
      q: 'What is "Unmatched Cash", and what happens if an insurance check references a missing claim?',
      a: 'Sometimes an insurance company sends a payment check with a mistyped or missing claim number (like remittance R1012 for $50.00 pointing to claim C9999, which does not exist in our clinic). Rather than deleting the check or inventing a fake patient, Claims Reconciliation System puts this money in an "Unmatched Cash Queue" so an accountant can investigate it without corrupting the main claims ledger.',
    },
    {
      q: 'How does the system track Payer Denials, and why can a claim be Balanced with Denial History?',
      a: 'When an insurance company rejects a claim (for example, missing paperwork or an uncovered procedure), Claims Reconciliation System flags it immediately with a Denial badge so billing staff can file an appeal. If the clinic wins the appeal and gets paid in full (making the final balance $0.00), the system keeps the "Denial History" badge so managers know that claim originally had a problem and required extra follow-up to collect.',
    },
    {
      q: 'How does Automatic Underpayment Detection work?',
      a: 'When insurance pays less than what was billed and agreed upon, the system marks the claim as "Unbalanced" and highlights the exact dollar gap. For example, on claim C1004, the clinic billed $150.00, but insurance only sent $100.00 with no explanation—so the system flags a $50.00 underpayment requiring follow-up with the payer.',
    },
    {
      q: 'How is the "Amount Not Yet Received" calculated, and what does it include?',
      a: 'Out of the $1,700.00 total billed by the clinic, $990.00 has arrived as cash, leaving $710.00 in cash still pending. After factoring in pre-agreed insurance discounts ($140.00 write-offs) and patient copays ($75.00), the Net Unsettled balance is $495.00 (consisting of $435.00 across 6 unbalanced claims requiring appeal, plus $60.00 from Claim C1005 awaiting insurance adjudication).',
    },
    {
      q: 'What is the difference between a Contractual Write-Off and a Patient Copay?',
      a: 'A Contractual Write-Off (like code CO-45) is a legal discount pre-agreed between the clinic and the insurance company—nobody pays this amount, and it is simply erased from the bill so the account balances. A Patient Copay (like code PR-3) is the patient’s personal out-of-pocket share that the clinic collects directly from the patient at the front desk.',
    },
    {
      q: 'Why is the difference shown as empty (Null) for claims with No Remittance?',
