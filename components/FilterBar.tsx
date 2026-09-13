'use client';

import React from 'react';
import { useCRM } from '@/lib/store';
import { PeriodFilter } from '@/lib/types';
import { Calendar, Filter, X, RefreshCcw } from 'lucide-react';

export default function FilterBar() {
  const {
    filters,
    setFilter,
    resetFilters,
    allProductNames,
    allMaterials,
    filteredSales,
    sales,
  } = useCRM();

  const periodOptions: { id: PeriodFilter; label: string }[] = [
    { id: 'todos', label: 'Todo o histórico' },
    { id: 'hoje', label: 'Hoje' },
    { id: '7dias', label: 'Últimos 7 dias' },
    { id: '30dias', label: 'Últimos 30 dias' },
    { id: 'mes_atual', label: 'Este mês (Setembro)' },
    { id: 'mes_anterior', label: 'Mês anterior (Agosto)' },
    { id: 'personalizado', label: 'Personalizado' },
  ];

  const isFiltered =
    filters.period !== 'todos' ||
    filters.marketplace !== 'TODOS' ||
    filters.material !== 'TODOS' ||
    filters.produto !== 'TODOS' ||
    filters.searchQuery !== '';

  return (
    <div
      id="global-filter-bar"
      className="mb-6 rounded-xl border border-neutral-200 bg-white p-4 shadow-xs"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Filter Controls Grid */}
        <div className="grid flex-1 grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4">
          {/* Period Filter */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-neutral-500">
              Período
            </label>
            <div className="relative">
              <select
                id="filter-period-select"
                value={filters.period}
                onChange={(e) => setFilter('period', e.target.value as PeriodFilter)}
                className="w-full appearance-none rounded-lg border border-neutral-200 bg-neutral-50/50 py-1.5 pr-8 pl-2.5 text-xs text-neutral-800 transition-colors focus:border-neutral-400 focus:bg-white focus:outline-hidden"
              >
                {periodOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Calendar className="pointer-events-none absolute top-2 right-2.5 h-3.5 w-3.5 text-neutral-400" />
            </div>
          </div>

          {/* Marketplace Filter */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-neutral-500">
              Marketplace
            </label>
            <select
              id="filter-marketplace-select"
              value={filters.marketplace}
              onChange={(e) => setFilter('marketplace', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50/50 py-1.5 px-2.5 text-xs text-neutral-800 transition-colors focus:border-neutral-400 focus:bg-white focus:outline-hidden"
            >
              <option value="TODOS">Todos os canais</option>
              <option value="SHOPEE">Shopee</option>
              <option value="MERCADO LIVRE">Mercado Livre</option>
            </select>
          </div>

          {/* Material Filter */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-neutral-500">
              Material
            </label>
            <select
              id="filter-material-select"
              value={filters.material}
              onChange={(e) => setFilter('material', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50/50 py-1.5 px-2.5 text-xs text-neutral-800 transition-colors focus:border-neutral-400 focus:bg-white focus:outline-hidden"
            >
              <option value="TODOS">Todos os materiais</option>
              <option value="PLA">PLA</option>
              <option value="PETG">PETG</option>
              <option value="PET-G">PET-G</option>
              {allMaterials
                .filter((m) => !['PLA', 'PETG', 'PET-G'].includes(m.toUpperCase()))
                .map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-neutral-500">
              Produto
            </label>
            <select
              id="filter-product-select"
              value={filters.produto}
              onChange={(e) => setFilter('produto', e.target.value)}
              className="w-full truncate rounded-lg border border-neutral-200 bg-neutral-50/50 py-1.5 px-2.5 text-xs text-neutral-800 transition-colors focus:border-neutral-400 focus:bg-white focus:outline-hidden"
            >
              <option value="TODOS">Todos os produtos ({allProductNames.length})</option>
              {allProductNames.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right side: Results count & Reset action */}
        <div className="flex items-center justify-between gap-3 border-t border-neutral-100 pt-2.5 lg:border-t-0 lg:pt-0">
          <div className="text-xs text-neutral-500">
            Mostrando{' '}
            <span className="font-semibold text-neutral-900">
              {filteredSales.length}
            </span>{' '}
            de {sales.length} vendas
          </div>

          {isFiltered && (
            <button
              id="filter-clear-btn"
              onClick={resetFilters}
              className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-100/70 px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
            >
              <X className="h-3 w-3" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Custom Date Inputs when 'personalizado' selected */}
      {filters.period === 'personalizado' && (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-3 text-xs">
          <span className="text-neutral-500 font-medium">Intervalo de datas:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.customStartDate}
              onChange={(e) => setFilter('customStartDate', e.target.value)}
              className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-800 focus:outline-hidden"
            />
            <span className="text-neutral-400">até</span>
            <input
              type="date"
              value={filters.customEndDate}
              onChange={(e) => setFilter('customEndDate', e.target.value)}
              className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-800 focus:outline-hidden"
            />
          </div>
        </div>
      )}
    </div>
  );
}
