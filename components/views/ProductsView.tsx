'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { ProductSummary, formatBRL, formatPercent, formatDateBR } from '@/lib/types';
import {
  Package,
  Search,
  ArrowRight,
  TrendingUp,
  X,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';

export default function ProductsView() {
  const {
    productSummaries,
    selectedProductForDetail,
    setSelectedProductForDetail,
    sales,
    products,
    openNewProductModal,
    openEditProductModal,
  } = useCRM();

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'performance' | 'catalog'>('catalog');

  const filteredSummaries = productSummaries.filter((p) =>
    p.produto.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCatalog = products.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

  // Selected product detail data
  const selectedProductSummary = productSummaries.find(
    (p) => p.produto === selectedProductForDetail
  );

  const selectedProductSales = sales
    .filter((s) => s.produto === selectedProductForDetail)
    .sort((a, b) => (a.data < b.data ? 1 : -1));

  return (
    <div id="products-view" className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-neutral-400" />
            Gestão de Produtos
          </h2>
          <p className="text-xs text-neutral-500">
            Cadastre seus custos fixos e acompanhe a performance de cada item
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-1">
            <button
              onClick={() => setViewMode('catalog')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === 'catalog'
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Catálogo
            </button>
            <button
              onClick={() => setViewMode('performance')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === 'performance'
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Performance
            </button>
          </div>
          
          <button
            onClick={openNewProductModal}
            className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-neutral-200 hover:bg-neutral-800 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            Cadastrar Produto
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder={viewMode === 'catalog' ? "Buscar no catálogo..." : "Buscar performance..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2 pr-3 pl-9 text-xs text-neutral-800 placeholder-neutral-400 transition-all focus:border-neutral-900 focus:bg-white focus:outline-none"
          />
        </div>

        {viewMode === 'catalog' ? (
          <div className="flex items-center gap-4 text-xs font-medium text-neutral-500">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider opacity-60">Total Itens</span>
              <span className="text-neutral-900 font-bold">{products.length}</span>
            </div>
            <div className="h-6 w-px bg-neutral-100" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider opacity-60">Materiais</span>
              <span className="text-neutral-900 font-bold">{new Set(products.map(p => p.material)).size}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-xs font-medium text-neutral-500">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider opacity-60">Produtos com Venda</span>
              <span className="text-neutral-900 font-bold">{productSummaries.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {viewMode === 'catalog' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCatalog.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200">
              <Package className="h-12 w-12 text-neutral-300 mb-3" />
              <p className="text-sm font-medium text-neutral-500">Nenhum produto cadastrado no catálogo.</p>
              <button 
                onClick={openNewProductModal}
                className="mt-4 text-xs font-bold text-neutral-900 underline underline-offset-4"
              >
                Clique aqui para cadastrar o primeiro
              </button>
            </div>
          ) : (
            filteredCatalog.map((p) => (
              <div 
                key={p.id}
                onClick={() => openEditProductModal(p)}
                className="group relative flex flex-col rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm transition-all hover:border-neutral-900 hover:shadow-md cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-50 text-neutral-900 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                    <Package className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
                    {p.material}
                  </span>
                </div>
                
                <h3 className="text-sm font-bold text-neutral-900 mb-1 truncate">{p.nome}</h3>
                
                <div className="mt-auto space-y-2 pt-4">
                  <div className="flex items-center justify-between text-[11px] text-neutral-500">
                    <span>Custo Total:</span>
                    <span className="font-bold text-neutral-900">{formatBRL(p.custoTotal)}</span>
                  </div>
                  {p.precoSugerido && p.precoSugerido > 0 && (
                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span>Preço Sugerido:</span>
                      <span className="font-bold text-neutral-900">{formatBRL(p.precoSugerido)}</span>
                    </div>
                  )}
                </div>

                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit2 className="h-4 w-4 text-neutral-400" />
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Performance View - Original Table */
        <div className="rounded-2xl border border-neutral-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-100 bg-neutral-50/50 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                <tr>
                  <th className="py-4 px-6">Produto</th>
                  <th className="py-4 px-4 text-center">Vendas</th>
                  <th className="py-4 px-4 text-right">Média Lucro</th>
                  <th className="py-4 px-4 text-right">Margem %</th>
                  <th className="py-4 px-4 text-right">Total Lucro</th>
                  <th className="py-4 pr-6 pl-2 text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-700">
                {filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-neutral-400">
                      Aguardando vendas para gerar performance.
                    </td>
                  </tr>
                ) : (
                  filteredSummaries.map((p) => (
                    <tr
                      key={p.produto}
                      className="cursor-pointer transition-colors hover:bg-neutral-50/50"
                      onClick={() => setSelectedProductForDetail(p.produto)}
                    >
                      <td className="py-4 px-6 font-bold text-neutral-900 max-w-xs truncate">
                        {p.produto}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-neutral-900">
                        {p.totalVendas}
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap font-medium text-emerald-600">
                        {formatBRL(p.lucroMedio)}
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                          {p.margemMedia.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap font-bold text-emerald-600">
                        {formatBRL(p.lucroTotal)}
                      </td>
                      <td className="py-4 pr-6 pl-2 text-right">
                        <ArrowRight className="h-4 w-4 text-neutral-300 ml-auto" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Detail Modal (Performance) */}
      {selectedProductSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 p-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  {selectedProductSummary.produto}
                </h3>
                <p className="text-xs text-neutral-500">Métricas detalhadas e histórico de vendas</p>
              </div>
              <button
                onClick={() => setSelectedProductForDetail(null)}
                className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50/50 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Vendas</span>
                  <div className="mt-1 text-xl font-bold text-neutral-900">{selectedProductSummary.totalVendas}</div>
                </div>
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50/50 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Faturamento</span>
                  <div className="mt-1 text-xl font-bold text-neutral-900">{formatBRL(selectedProductSummary.faturamentoTotal)}</div>
                </div>
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50/50 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Lucro Total</span>
                  <div className="mt-1 text-xl font-bold text-emerald-600">{formatBRL(selectedProductSummary.lucroTotal)}</div>
                </div>
                <div className="rounded-2xl border border-neutral-100 bg-neutral-50/50 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Margem Média</span>
                  <div className="mt-1 text-xl font-bold text-neutral-900">{selectedProductSummary.margemMedia.toFixed(1)}%</div>
                </div>
              </div>

              <div>
                <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-neutral-400">Histórico de Transações</h4>
                <div className="overflow-hidden rounded-2xl border border-neutral-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 text-[10px] font-bold uppercase text-neutral-400">
                      <tr>
                        <th className="py-3 px-4">Data</th>
                        <th className="py-3 px-4">Canal</th>
                        <th className="py-3 px-4 text-right">Venda</th>
                        <th className="py-3 px-4 text-right">Taxa</th>
                        <th className="py-3 px-4 text-right">Lucro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50 text-neutral-600">
                      {selectedProductSales.map((s) => (
                        <tr key={s.id} className="hover:bg-neutral-50/50">
                          <td className="py-3 px-4 font-mono">{formatDateBR(s.data)}</td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                              {s.marketplace}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-neutral-900">{formatBRL(s.venda)}</td>
                          <td className="py-3 px-4 text-right text-red-500">{formatBRL(s.taxa)}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatBRL(s.lucro)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-100 bg-neutral-50 p-6 flex justify-end">
              <button
                onClick={() => setSelectedProductForDetail(null)}
                className="rounded-xl bg-neutral-900 px-6 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition-all"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
