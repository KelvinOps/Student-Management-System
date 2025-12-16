// lib/export-utils.ts

// Define a generic type for exportable data
// Using index signature to allow any string keys
interface ExportableData {
  [key: string]: string | number | boolean | null | undefined;
}

// Export to Excel (CSV format)
export function exportToExcel(data: ExportableData[], filename: string = 'export'): void {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Headers
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in values
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export to PDF using browser print
export function exportToPDF(data: ExportableData[], title: string = 'Export'): void {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  
  // Create HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        h1 {
          color: #0e7490;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #0e7490;
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f2f2f2;
        }
        .print-date {
          color: #666;
          font-size: 12px;
          margin-bottom: 10px;
        }
        @media print {
          body {
            padding: 10px;
          }
          table {
            font-size: 10px;
          }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="print-date">Generated on: ${new Date().toLocaleString()}</div>
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Open new window and print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load before printing
    printWindow.onload = function() {
      printWindow.focus();
      printWindow.print();
      // Optionally close the window after printing
      // printWindow.close();
    };
  } else {
    alert('Please allow pop-ups to export PDF');
  }
}

// Alternative: Generate better formatted Excel using XLSX library
// You would need to install: npm install xlsx
// Then use this function:
/*
import * as XLSX from 'xlsx';

export function exportToExcelXLSX(data: ExportableData[], filename: string = 'export'): void {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  
  // Auto-size columns
  const maxWidth = data.reduce((w, r) => Math.max(w, Object.keys(r).length), 10);
  worksheet['!cols'] = Array(maxWidth).fill({ wch: 15 });
  
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
*/