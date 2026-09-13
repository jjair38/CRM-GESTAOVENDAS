'use client';

import React from 'react';
import { useCRM } from '@/lib/store';
import { formatBRL, formatPercent } from '@/lib/types';
import { Store, TrendingUp, DollarSign, Percent, ArrowDownRight, Receipt, Layers } from 'lucide-react';

export default function MarketplacesView() {
  const { marketplaceSummaries, kpis } = useCRM();

  const shopee = marketplaceSummaries.find((m) => m.marketplace === 'SHOPEE');
  const ml = marketplaceSummaries.find((m) => m.marketplace === 'MERCADO LIVRE');

  const totalFat = (shopee?.faturamentoTotal || 0) + (ml?.faturamentoTotal || 0) || 1;
  const shopeeShare = (((shopee?.faturamentoTotal || 0) / totalFat) * 100).toFixed(1);
  const mlShare = (((ml?.faturamentoTotal || 0) / totalFat) * 100).toFixed(1);

  const totalLucro = (shopee?.lucroTotal || 0) + (ml?.lucroTotal || 0) || 1;
  const shopeeLucroShare = (((shopee?.lucroTotal || 0) / totalLucro) * 100).toFixed(1);
  const mlLucroShare = (((ml?.lucroTotal || 0) / totalLucro) * 100).toFixed(1);

  return (
    <div id="marketplaces-view" className="space-y-6">
      {/* Overview Banner */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-900">
          Análise Comparativa de Canais
        </h2>
        <p className="text-xs text-neutral-500">
          Avaliação de lucratividade, taxas e faturamento entre Shopee e Mercado Livre
        </p>
      </div>

      {/* Share Progress Comparison */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-amber-500" />
            <span className="font-semibold text-neutral-900">Shopee ({shopeeShare}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900">Mercado Livre ({mlShare}%)</span>
            <span className="h-3 w-3 rounded-sm bg-yellow-400" />
          </div>
        </div>

        {/* Distribution bar */}
        <div className="mt-3 flex h-4 w-full overflow-hidden rounded-full bg-neutral-100 p-0.5">
          <div
            className="h-full rounded-l-full bg-amber-500 transition-all duration-500"
            style={{ width: `${shopeeShare}%` }}
          />
          <div
            className="h-full rounded-r-full bg-yellow-400 transition-all duration-500"
            style={{ width: `${mlShare}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-center text-xs text-neutral-500 border-t border-neutral-100 pt-3">
          <div>
            Participação no Lucro Líquido:{' '}
            <strong className="text-neutral-900">{shopeeLucroShare}%</strong>
          </div>
          <div>
            Participação no Lucro Líquido:{' '}
            <strong className="text-neutral-900">{mlLucroShare}%</strong>
          </div>
        </div>
      </div>

      {/* Side-by-Side Detailed Marketplace Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* SHOPEE */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 font-bold text-sm">
                SHP
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">SHOPEE</h3>
                <span className="text-xs text-neutral-500">
                  {shopee?.totalVendas || 0} pedidos confirmados
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="rounded bg-amber-50 border border-amber-200/60 px-2 py-0.5 text-xs font-semibold text-amber-800">
                Margem {formatPercent(shopee?.margemMedia || 0)}
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-neutral-50 p-3">
              <span className="text-[10px] font-medium uppercase text-neutral-400">
                Faturamento Bruto
              </span>
              <div className="mt-1 text-base font-semibold text-neutral-900">
                {formatBRL(shopee?.faturamentoTotal || 0)}
              </div>
            </div>

            <div className="rounded-lg bg-neutral-50 p-3">
              <span className="text-[10px] font-medium uppercase text-neutral-400">
                Repasse Líquido
              </span>
              <div className="mt-1 text-base font-semibold text-emerald-700">
                {formatBRL(shopee?.repasseTotal || 0)}
              </div>
            </div>

            <div className="rounded-lg bg-neutral-50 p-3">
              <span className="text-[10px] font-medium uppercase text-neutral-400">
                Custos de Fabricação
              </span>
              <div className="mt-1 text-base font-semibold text-neutral-800">
                {formatBRL(shopee?.custoTotal || 0)}
              </div>
            </div>

            <div className="rounded-lg bg-neutral-50 p-3">
              <span className="text-[10px] font-medium uppercase text-neutral-400">
                Taxas da Plataforma
              </span>
              <div className="mt-1 text-base font-semibold text-amber-700">
                {formatBRL(shopee?.taxaTotal || 0)}
              </div>
            </div>

            <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-3 col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-emerald-800">
                    Lucro Líquido Real
                  </span>
                  <div className="mt-0.5 text-xl font-bold text-emerald-600">
                    {formatBRL(shopee?.lucroTotal || 0)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-500 block">Ticket Médio</span>
                  <span className="text-xs font-semibold text-neutral-800">
                    {formatBRL(shopee?.ticketMedio || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-neutral-100 pt-3 text-xs text-neutral-500 flex justify-between">
            <span>Taxa média efetiva:</span>
            <span className="font-semibold text-neutral-800">
              {shopee?.taxaEfetivaPercent.toFixed(1)}% do faturamento
            </span>
          </div>
        </div>

        {/* MERCADO LIVRE */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/15 text-yellow-700 font-bold text-sm">
                ML
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">MERCADO LIVRE</h3>
                <span className="text-xs text-neutral-500">
                  {ml?.totalVendas || 0} pedidos confirmados
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="rounded bg-yellow-50 border border-yellow-200/60 px-2 py-0.5 text-xs font-semibold text-yellow-900">
                Margem {formatPercent(ml?.margemMedia || 0)}
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-neutral-50 p-3">
              <span className="text-[10px] font-medium uppercase text-neutral-400">
                Faturamento Bruto
              </span>
              <div className="mt-1 text-base font-semibold text-neutral-900">
                {formatBRL(ml?.faturamentoTotal || 0)}
              </div>
            </div>

            <div className="rounded-lg bg-neutral-50 p-3">
              <span className="text-[10px] font-medium uppercase text-neutral-400">
                Repasse Líquido
              </span>
              <div className="mt-1 text-base font-semibold text-emerald-700">
                {formatBRL(ml?.repasseTotal || 0)}
              </div>
            </div>

            <div className="rounded-lg bg-neutral-50 p-3">
              <span className="text-[10px] font-medium uppercase text-neutral-400">
                Custos de Fabricação
              </span>
              <div className="mt-1 text-base font-semibold text-neutral-800">
                {formatBRL(ml?.custoTotal || 0)}
              </div>
            </div>

            <div className="rounded-lg bg-neutral-50 p-3">
              <span className="text-[10px] font-medium uppercase text-neutral-400">
                Taxas da Plataforma
              </span>
              <div className="mt-1 text-base font-semibold text-amber-700">
                {formatBRL(ml?.taxaTotal || 0)}
              </div>
            </div>

            <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-3 col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-emerald-800">
                    Lucro Líquido Real
                  </span>
                  <div className="mt-0.5 text-xl font-bold text-emerald-600">
                    {formatBRL(ml?.lucroTotal || 0)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-500 block">Ticket Médio</span>
                  <span className="text-xs font-semibold text-neutral-800">
                    {formatBRL(ml?.ticketMedio || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-neutral-100 pt-3 text-xs text-neutral-500 flex justify-between">
            <span>Taxa média efetiva:</span>
            <span className="font-semibold text-neutral-800">
              {ml?.taxaEfetivaPercent.toFixed(1)}% do faturamento
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
