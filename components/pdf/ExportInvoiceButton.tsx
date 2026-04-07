'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export const ExportInvoiceButton: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);

  const downloadPDF = async () => {
    setIsExporting(true);
    const toastId = toast.loading('Generating PDF Invoice...');

    try {
      const element = document.getElementById('report-capture-zone');
      if (!element) {
        throw new Error('Report container not found');
      }

      await new Promise(resolve => setTimeout(resolve, 300)); // allow rendering to settle

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#09090b', // Match dark background explicitly
      });

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Budget_Completion_Invoice.pdf`);
      
      toast.success('Invoice downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={downloadPDF}
      disabled={isExporting}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '12px 24px', borderRadius: '14px',
        background: 'linear-gradient(135deg, #8a2be2, #4f46e5)',
        color: 'white', fontWeight: 800, border: 'none',
        cursor: isExporting ? 'wait' : 'pointer',
        boxShadow: '0 8px 25px rgba(138,43,226,0.35)',
        transition: 'all 0.2s ease',
        fontSize: '14px'
      }}
    >
      <Download size={18} />
      {isExporting ? 'Generating...' : 'Download Final Invoice'}
    </button>
  );
};
