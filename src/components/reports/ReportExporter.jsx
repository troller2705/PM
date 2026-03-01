import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Table, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';

function toCsv(data, filename) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h] ?? '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return str.includes(',') ? `"${str}"` : str;
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toExcel(data, filename) {
  // Build a simple HTML table that Excel can open
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const html = `
    <table>
      <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
      ${data.map(row => `<tr>${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`).join('')}
    </table>`;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function printPdf(reportTitle) {
  window.print();
}

export default function ReportExporter({ reportTitle, csvData, filename }) {
  const ts = format(new Date(), 'yyyy-MM-dd');
  const base = filename || reportTitle?.toLowerCase().replace(/\s+/g, '_') || 'report';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs text-slate-500">Export As</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => printPdf(reportTitle)} className="gap-2">
          <FileText className="h-4 w-4 text-red-500" />
          PDF (Print)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => csvData && toCsv(csvData, `${base}_${ts}.csv`)} className="gap-2">
          <Table className="h-4 w-4 text-emerald-500" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => csvData && toExcel(csvData, `${base}_${ts}.xls`)} className="gap-2">
          <FileSpreadsheet className="h-4 w-4 text-blue-500" />
          Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}