/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function formatCurrency(amount: number): string {
  const num = Number(amount) || 0;
  return num.toLocaleString('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' ج.م';
}

export function formatNumber(val: number): string {
  const num = Number(val) || 0;
  return num.toLocaleString('ar-EG');
}

export function exportToExcel(filename: string, headers: string[], rows: (string | number)[][]) {
  // Add UTF-8 BOM for Arabic language support in Microsoft Excel
  let csvContent = '\uFEFF';
  csvContent += headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(',') + '\r\n';

  rows.forEach((row) => {
    const line = row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',');
    csvContent += line + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function triggerPrint() {
  window.print();
}
