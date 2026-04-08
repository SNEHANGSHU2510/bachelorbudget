'use client';

import React, { useState, useRef } from 'react';
import { Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Props {
  budget: any;
  expenses: any[];
  totalSpent: number;
}

export const ExportInvoiceButton: React.FC<Props> = ({ budget, expenses, totalSpent }) => {
  const [isExporting, setIsExporting] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    setIsExporting(true);
    const toastId = toast.loading('Generating Professional Invoice...');

    try {
      // Small delay to ensure the hidden template is rendered in the DOM
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const element = invoiceRef.current;
      if (!element) throw new Error('Invoice template not found');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${budget.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
      
      toast.success('Professional invoice downloaded!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate invoice', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <button
        onClick={downloadPDF}
        disabled={isExporting}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 28px', borderRadius: '16px',
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          color: 'white', fontWeight: 700, border: 'none',
          cursor: isExporting ? 'wait' : 'pointer',
          boxShadow: '0 10px 30px rgba(37,99,235,0.3)',
          transition: 'transform 0.2s',
          fontSize: '14px'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <FileText size={18} />
        {isExporting ? 'Processing...' : 'Export Professional Invoice'}
      </button>

      {/* Hidden Invoice Template - Professionally Styled */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div 
          ref={invoiceRef}
          style={{
            width: '210mm', // A4 Width
            minHeight: '297mm',
            padding: '20mm',
            background: 'white',
            color: '#1a1a1a',
            fontFamily: '"Inter", "Helvetica", sans-serif',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '30px', marginBottom: '40px' }}>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: '#7c3aed', letterSpacing: '-0.02em', marginBottom: '8px' }}>BACHELORBUDGET</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Financial Settlement Report</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>INVOICE</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>#{Math.random().toString(36).substring(2, 9).toUpperCase()}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Date: {format(new Date(), 'MMMM dd, yyyy')}</div>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '50px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>Report For</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>{budget.name}</div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Duration: {budget.duration_days} Days Balance Settlement</div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Period: {format(new Date(budget.start_date), 'MMM dd')} - {format(new Date(budget.end_date), 'MMM dd, yyyy')}</div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Settlement Status</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>COMPLETED</div>
              </div>
            </div>
          </div>

          {/* Expenses Table */}
          <div style={{ marginBottom: '50px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Description</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Category</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.slice(0, 15).map((exp, i) => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1e293b' }}>{format(new Date(exp.expense_date), 'MMM dd')}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1e293b', maxWidth: '200px' }}>{exp.description}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b', textTransform: 'capitalize' }}>{exp.category}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#1e293b', fontWeight: 600, textAlign: 'right' }}>{budget.currency}{Number(exp.amount_in_budget_currency).toLocaleString()}</td>
                  </tr>
                ))}
                {expenses.length > 15 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '14px 16px', fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>
                      ... and {expenses.length - 15} more transactions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Section */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '250px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', color: '#64748b', fontSize: '14px' }}>
                <span>Total Budget Allocation</span>
                <span>{budget.currency}{budget.total_amount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', color: '#64748b', fontSize: '14px' }}>
                <span>Total Expenditure</span>
                <span>-{budget.currency}{totalSpent.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 16px', marginTop: '10px', background: '#7c3aed', borderRadius: '12px', color: 'white' }}>
                <span style={{ fontWeight: 700, fontSize: '16px' }}>Balance Remaining</span>
                <span style={{ fontWeight: 800, fontSize: '18px' }}>{budget.currency}{(budget.total_amount - totalSpent).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ position: 'absolute', bottom: '20mm', left: '20mm', right: '20mm', borderTop: '1px solid #f1f5f9', paddingTop: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>This is an automatically generated financial settlement report from BachelorBudget.</div>
            <div style={{ fontSize: '10px', color: '#cbd5e1' }}>Authorized by AI Advisor Engine • Secure Digital Document</div>
          </div>
        </div>
      </div>
    </>
  );
};
