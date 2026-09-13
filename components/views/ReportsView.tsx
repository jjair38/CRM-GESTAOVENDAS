'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { formatBRL, formatPercent } from '@/lib/types';
import { exportSalesToCSV, exportSalesToExcel } from '@/lib/spreadsheet';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Percent,
} from 'lucide-react';

export default function ReportsView() {
  const {
    monthlySummaries,
    filteredSales,
    marketplaceSummaries,
    productSummaries,
    kpis,
    filters,
  } = useCRM();

  const handlePrint = () => {
    window.print();
  };

  const currentMonth = monthlySummaries[0];
  const previousMonth = monthlySummaries[1];

  const shopee = marketplaceSummaries.find((m) => m.marketplace === 'SHOPEE');
  const ml = marketplaceSummaries.find((m) => m.marketplace === 'MERCADO LIVRE');

  return (
    <div id="reports-view" className="space-y-6">
      {/* Header & Export Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">
            Relatórios Financeiros & Demonstrativos
          </h2>
          <p className="text-xs text-neutral-500">
            Demonstrativo de resultados mensais, comparativos de canais e exportação
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportSalesToCSV(filteredSales, 'relatorio_vendas_marketplace.csv')}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => exportSalesToExcel(filteredSales, 'relatorio_vendas_marketplace.xlsx')}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Month vs Previous Month Comparison Cards */}
      {currentMonth && previousMonth && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">
            Comparativo Mensal: {currentMonth.label} vs {previousMonth.label}
          </h3>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {/* Faturamento */}
            <div className="rounded-lg bg-neutral-50 p-3">
              <span className="text-[10px] font-medium uppercase text-neutral-400">
                Faturamento
              </span>
              <div className="mt-1 text-base font-semibold text-neutral-900">
                {formatBRL(currentMonth.faturamento)}
              </div>
              <div className="mt-1 text-[11px] text-neutral-500">
                Anterior: {formatBRL(previousMonth.faturamento)}
              </div>
            </div>

            {/* Repasse */}
            <div className="rounded-lg bg-neutral-50 p-3">
              <span className="text-[10px] font-medium uppercase text-neutral-400">
                Repasse Líquido
              </span>
              <div className="mt-1 text-base font-semibold text-emerald-700">
                {formatBRL(currentMonth.repasse)}
              </div>
              <div className="mt-1 text-[11px] text-neutral-500">
                Anterior: {formatBRL(previousMonth.repasse)}
              </div>
            </div>

            {/* Lucro Líquido */}
            <div className="rounded-lg bg-neutral-50 p-3">
              <span className="text-[10px] font-medium uppercase text-neutral-400">
                Lucro Líquido
              </span>
              <div className="mt-1 text-base font-semibold text-emerald-600">
                {formatBRL(currentMonth.lucro)}
              </div>
              <div className="mt-1 text-[11px] text-neutral-500">
                Anterior: {formatBRL(previousMonth.lucro)}
              </div>
            </div>

            {/* Margem */}
            <div className="rounded-lg bg-neutral-50 p-3">
              <span className="text-[10px] font-medium uppercase text-neutral-400">
                Margem Média
              </span>
              <div className="mt-1 text-base font-semibold text-neutral-900">
                {formatPercent(currentMonth.margem)}
              </div>
              <div className="mt-1 text-[11px] text-neutral-500">
                Anterior: {formatPercent(previousMonth.margem)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Summary Table */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
          <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
            Fechamento Mensal Consolidado
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/50 text-[10px] font-medium uppercase text-neutral-500">
              <tr>
                <th className="py-3 px-4">Mês / Ano</th>
                <th className="py-3 px-3 text-center">Vendas</th>
                <th className="py-3 px-3 text-right">Faturamento</th>
                <th className="py-3 px-3 text-right">Taxas</th>
                <th className="py-3 px-3 text-right">Custos</th>
                <th className="py-3 px-3 text-right">Repasse</th>
                <th className="py-3 px-3 text-right">Lucro</th>
                <th className="py-3 pr-4 pl-3 text-right">Margem %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {monthlySummaries.map((m) => (
                <tr key={m.mesAno} className="hover:bg-neutral-50">
                  <td className="py-3 px-4 font-semibold text-neutral-900">
                    {m.label.toUpperCase()}
                  </td>
                  <td className="py-3 px-3 text-center font-medium">{m.totalVendas}</td>
                  <td className="py-3 px-3 text-right font-medium text-neutral-900">
                    {formatBRL(m.faturamento)}
                  </td>
                  <td className="py-3 px-3 text-right text-amber-700">{formatBRL(m.taxas)}</td>
                  <td className="py-3 px-3 text-right text-neutral-600">{formatBRL(m.custos)}</td>
                  <td className="py-3 px-3 text-right font-medium text-emerald-700">{formatBRL(m.repasse)}</td>
                  <td className="py-3 px-3 text-right font-semibold text-emerald-600">
                    {formatBRL(m.lucro)}
                  </td>
                  <td className="py-3 pr-4 pl-3 text-right font-medium">
                    <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-800">
                      {m.margem.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
