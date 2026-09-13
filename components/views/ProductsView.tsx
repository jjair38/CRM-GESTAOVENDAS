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
  Calendar,
  Layers,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';

export default function ProductsView() {
  const {
    productSummaries,
    selectedProductForDetail,
    setSelectedProductForDetail,
    sales,
    openEditSaleModal,
  } = useCRM();

  const [search, setSearch] = useState('');

  const filteredProducts = productSummaries.filter((p) =>
    p.produto.toLowerCase().includes(search.toLowerCase())
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
      {/* Search Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">
            Catálogo & Performance de Produtos
          </h2>
          <p className="text-xs text-neutral-500">
            Métricas acumuladas e médias unitárias por produto fabricado
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por nome do produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white py-1.5 pr-3 pl-9 text-xs text-neutral-800 placeholder-neutral-400 transition-colors focus:border-neutral-400 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-50/80 text-[11px] font-medium text-neutral-600 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-3">Canais</th>
                <th className="py-3 px-3">Material</th>
                <th className="py-3 px-3 text-center">Vendas</th>
                <th className="py-3 px-3 text-right">Preço Médio</th>
                <th className="py-3 px-3 text-right">Custo Médio</th>
                <th className="py-3 px-3 text-right">Taxa Média</th>
                <th className="py-3 px-3 text-right">Lucro Médio</th>
                <th className="py-3 px-3 text-right">Margem</th>
                <th className="py-3 px-3 text-right">Faturamento</th>
                <th className="py-3 px-3 text-right">Lucro Total</th>
                <th className="py-3 pr-4 pl-2 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center text-neutral-400">
                    Nenhum produto cadastrado ou correspondente à busca.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr
                    key={p.produto}
                    className="cursor-pointer transition-colors hover:bg-neutral-50/80"
                    onClick={() => setSelectedProductForDetail(p.produto)}
                  >
                    <td className="py-3 px-4 font-medium text-neutral-900 max-w-xs truncate" title={p.produto}>
                      {p.produto}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {p.marketplaces.map((m) => (
                          <span
                            key={m}
                            className={`rounded-sm px-1.5 py-0.5 text-[9px] font-semibold ${
                              m === 'SHOPEE'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-yellow-50 text-yellow-900'
                            }`}
                          >
                            {m === 'MERCADO LIVRE' ? 'ML' : 'SHP'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-[11px] text-neutral-600">
                      {p.materials.join(', ')}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-neutral-900">
                      {p.totalVendas}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap text-neutral-800">
                      {formatBRL(p.precoMedioVenda)}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap text-neutral-600">
                      {formatBRL(p.custoMedio)}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap text-amber-700">
                      {formatBRL(p.taxaMedia)}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap font-medium text-emerald-600">
                      {formatBRL(p.lucroMedio)}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-800">
                        {p.margemMedia.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap font-semibold text-neutral-900">
                      {formatBRL(p.faturamentoTotal)}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-emerald-600">
                      {formatBRL(p.lucroTotal)}
                    </td>
                    <td className="py-3 pr-4 pl-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductForDetail(p.produto);
                        }}
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-900"
                        title="Ver histórico detalhado"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Detail Modal / Drawer */}
      {selectedProductSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-neutral-100 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                    Histórico & Detalhes do Produto
                  </span>
                  <span className="text-xs text-neutral-400">
                    {selectedProductSummary.materials.join(', ')}
                  </span>
                </div>
                <h3 className="mt-1.5 text-base font-semibold text-neutral-900">
                  {selectedProductSummary.produto}
                </h3>
              </div>

              <button
                onClick={() => setSelectedProductForDetail(null)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal KPI Grid */}
            <div className="grid grid-cols-2 gap-3 border-b border-neutral-100 bg-neutral-50/50 p-5 sm:grid-cols-4">
              <div className="rounded-lg border border-neutral-200 bg-white p-3">
                <span className="text-[10px] font-medium uppercase text-neutral-400">
                  Total de Vendas
                </span>
                <div className="mt-1 text-lg font-semibold text-neutral-900">
                  {selectedProductSummary.totalVendas} un
                </div>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-white p-3">
                <span className="text-[10px] font-medium uppercase text-neutral-400">
                  Faturamento Total
                </span>
                <div className="mt-1 text-lg font-semibold text-neutral-900">
                  {formatBRL(selectedProductSummary.faturamentoTotal)}
                </div>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-white p-3">
                <span className="text-[10px] font-medium uppercase text-neutral-400">
                  Lucro Líquido Total
                </span>
                <div className="mt-1 text-lg font-semibold text-emerald-600">
                  {formatBRL(selectedProductSummary.lucroTotal)}
                </div>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-white p-3">
                <span className="text-[10px] font-medium uppercase text-neutral-400">
                  Margem Média
                </span>
                <div className="mt-1 text-lg font-semibold text-neutral-900">
                  {selectedProductSummary.margemMedia.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Sales History List */}
            <div className="flex-1 overflow-y-auto p-5">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Histórico de Vendas Deste Produto ({selectedProductSales.length})
              </h4>

              <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 text-[10px] font-medium uppercase text-neutral-500">
                    <tr>
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">Marketplace</th>
                      <th className="py-2.5 px-3">Material</th>
                      <th className="py-2.5 px-3 text-right">Custo</th>
                      <th className="py-2.5 px-3 text-right">Venda</th>
                      <th className="py-2.5 px-3 text-right">Taxa</th>
                      <th className="py-2.5 px-3 text-right">Repasse</th>
                      <th className="py-2.5 px-3 text-right">Lucro</th>
                      <th className="py-2.5 px-3 text-right">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    {selectedProductSales.map((s) => (
                      <tr key={s.id} className="hover:bg-neutral-50/70">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-600">
                          {formatDateBR(s.data)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`rounded-sm px-1.5 py-0.5 text-[9px] font-semibold ${
                              s.marketplace === 'SHOPEE'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-yellow-50 text-yellow-900'
                            }`}
                          >
                            {s.marketplace}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-neutral-600">{s.material}</td>
                        <td className="py-2.5 px-3 text-right">{formatBRL(s.custo)}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-neutral-900">
                          {formatBRL(s.venda)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-700">{formatBRL(s.taxa)}</td>
                        <td className="py-2.5 px-3 text-right">{formatBRL(s.repasse)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                          {formatBRL(s.lucro)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {s.porcentagem.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-neutral-100 bg-neutral-50 px-5 py-3 text-right">
              <button
                onClick={() => setSelectedProductForDetail(null)}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
