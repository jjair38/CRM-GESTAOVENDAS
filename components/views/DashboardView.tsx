'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { formatBRL, formatPercent } from '@/lib/types';
import {
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  Percent,
  Receipt,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  Zap,
  Activity,
  Flame,
} from 'lucide-react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export default function DashboardView() {
  const {
    kpis,
    insights,
    filteredSales,
    productSummaries,
    marketplaceSummaries,
    monthlySummaries,
    setSelectedProductForDetail,
    setActiveTab,
  } = useCRM();

  const [productRankingTab, setProductRankingTab] = useState<'vendidos' | 'lucrativos'>('lucrativos');

  // Prepare data for the chart (reversed to show chronological order)
  const chartData = [...monthlySummaries].reverse().slice(-6); // Last 6 months

  // Sort products for ranking
  const rankedProducts = [...productSummaries].sort((a, b) => {
    if (productRankingTab === 'vendidos') {
      return b.totalVendas - a.totalVendas;
    }
    return b.lucroTotal - a.lucroTotal;
  }).slice(0, 5);

  // Total cost breakdown
  const totalCusto = kpis.custos || 1;
  const pctEnergia = ((kpis.custoEnergia / totalCusto) * 100).toFixed(1);
  const pctFilamento = ((kpis.custoFilamento / totalCusto) * 100).toFixed(1);
  const pctManutencao = ((kpis.custoManutencao / totalCusto) * 100).toFixed(1);

  // Shopee vs ML comparison
  const shopee = marketplaceSummaries.find((m) => m.marketplace === 'SHOPEE');
  const ml = marketplaceSummaries.find((m) => m.marketplace === 'MERCADO LIVRE');

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Top KPI Cards - Minimalist & High-Contrast */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        {/* Faturamento */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              Faturamento
            </span>
            <DollarSign className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="mt-2 text-xl font-semibold tracking-tight text-neutral-900">
            {formatBRL(kpis.faturamento)}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-neutral-500">
            <span>{kpis.totalVendas} vendas no período</span>
          </div>
        </div>

        {/* Repasse */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              Repasse
            </span>
            <Receipt className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="mt-2 text-xl font-semibold tracking-tight text-emerald-700">
            {formatBRL(kpis.repasse)}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-neutral-500">
            <span>Líquido pós-taxa</span>
          </div>
        </div>

        {/* Custos */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              Custos
            </span>
            <Layers className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="mt-2 text-xl font-semibold tracking-tight text-neutral-800">
            {formatBRL(kpis.custos)}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-neutral-500">
            <span>Insumos & máquina</span>
          </div>
        </div>

        {/* Taxas */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              Taxas
            </span>
            <ArrowDownRight className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="mt-2 text-xl font-semibold tracking-tight text-amber-700">
            {formatBRL(kpis.taxas)}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-neutral-500">
            <span>
              {kpis.faturamento > 0
                ? `${((kpis.taxas / kpis.faturamento) * 100).toFixed(1)}% do total`
                : '0%'}
            </span>
          </div>
        </div>

        {/* Lucro */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              Lucro
            </span>
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-semibold tracking-tight text-emerald-600">
            {formatBRL(kpis.lucro)}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-emerald-700">
            <span>Repasse - Custos</span>
          </div>
        </div>

        {/* Margem Média */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              Margem
            </span>
            <Percent className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="mt-2 text-xl font-semibold tracking-tight text-neutral-900">
            {formatPercent(kpis.margemMedia)}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-neutral-500">
            <span>Sobre o custo</span>
          </div>
        </div>
      </div>

      {/* DASHBOARD INTELIGENTE: Seção INSIGHTS */}
      {insights.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-neutral-900" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                Insights Automáticos do Período
              </h2>
            </div>
            <span className="text-[11px] text-neutral-400">
              Calculado em tempo real com base nos registros
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {insights.map((insight) => {
              const isWarning = insight.type === 'warning';
              const isPositive = insight.type === 'positive';
              return (
                <div
                  key={insight.id}
                  className={`rounded-lg border p-3.5 transition-colors ${
                    isWarning
                      ? 'border-amber-200 bg-amber-50/40 text-amber-900'
                      : isPositive
                      ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
                      : 'border-neutral-200 bg-neutral-50/50 text-neutral-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold">{insight.title}</span>
                    {insight.metric && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          isWarning
                            ? 'bg-amber-200/70 text-amber-900'
                            : isPositive
                            ? 'bg-emerald-200/70 text-emerald-800'
                            : 'bg-neutral-200 text-neutral-800'
                        }`}
                      >
                        {insight.metric}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-600 leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 1. Faturamento por Mês (Chart - Left 2 cols) */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Faturamento por Mês
              </h3>
              <p className="text-xs text-neutral-500">
                Visão mensal baseada nas vendas registradas
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-neutral-900" />
                <span className="text-neutral-600 font-medium">Faturamento</span>
              </div>
            </div>
          </div>

          <div className="mt-6 h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#888' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#888' }} 
                  tickFormatter={(value) => `R$ ${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8f8f8' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '12px' }}
                  formatter={(value: any) => [formatBRL(Number(value) || 0), 'Faturamento']}
                />
                <Bar 
                  dataKey="faturamento" 
                  fill="#171717" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === chartData.length - 1 ? '#171717' : '#e5e5e5'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Consolidado Mensal (Right 1 col) */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
          <div className="border-b border-neutral-100 pb-4">
            <h3 className="text-sm font-semibold text-neutral-900">
              Consolidado por Mês
            </h3>
            <p className="text-xs text-neutral-500">
              Resumo financeiro dos últimos meses
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {monthlySummaries.slice(0, 4).map((m) => (
              <div key={m.mesAno} className="rounded-lg border border-neutral-100 bg-neutral-50/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900">{m.label}</span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    {m.margem.toFixed(0)}% Margem
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase">Fat.</span>
                    <div className="text-xs font-semibold text-neutral-800">{formatBRL(m.faturamento)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase">Lucro</span>
                    <div className="text-xs font-semibold text-emerald-600">{formatBRL(m.lucro)}</div>
                  </div>
                </div>
              </div>
            ))}
            
            {monthlySummaries.length === 0 && (
              <div className="py-8 text-center text-xs text-neutral-400">
                Sem dados mensais para exibir.
              </div>
            )}
          </div>
        </div>

        {/* Comparativo Marketplaces: Shopee x Mercado Livre */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs lg:col-span-3">
          <div className="border-b border-neutral-100 pb-4">
            <h3 className="text-sm font-semibold text-neutral-900">
              Shopee vs Mercado Livre
            </h3>
            <p className="text-xs text-neutral-500">
              Desempenho comparativo por canal
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Shopee Card */}
            <div className="rounded-lg border border-neutral-200/80 bg-neutral-50/40 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-semibold text-neutral-900">SHOPEE</span>
                </div>
                <span className="text-xs font-semibold text-neutral-700">
                  {shopee ? shopee.totalVendas : 0} vendas
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-neutral-400">Faturamento</span>
                  <div className="font-semibold text-neutral-800">
                    {formatBRL(shopee?.faturamentoTotal || 0)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-neutral-400">Lucro</span>
                  <div className="font-semibold text-emerald-600">
                    {formatBRL(shopee?.lucroTotal || 0)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-neutral-400">Taxas</span>
                  <div className="text-neutral-600">
                    {formatBRL(shopee?.taxaTotal || 0)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-neutral-400">Margem Média</span>
                  <div className="font-medium text-neutral-800">
                    {formatPercent(shopee?.margemMedia || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Mercado Livre Card */}
            <div className="rounded-lg border border-neutral-200/80 bg-neutral-50/40 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  <span className="text-xs font-semibold text-neutral-900">MERCADO LIVRE</span>
                </div>
                <span className="text-xs font-semibold text-neutral-700">
                  {ml ? ml.totalVendas : 0} vendas
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-neutral-400">Faturamento</span>
                  <div className="font-semibold text-neutral-800">
                    {formatBRL(ml?.faturamentoTotal || 0)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-neutral-400">Lucro</span>
                  <div className="font-semibold text-emerald-600">
                    {formatBRL(ml?.lucroTotal || 0)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-neutral-400">Taxas</span>
                  <div className="text-neutral-600">
                    {formatBRL(ml?.taxaTotal || 0)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-neutral-400">Margem Média</span>
                  <div className="font-medium text-neutral-800">
                    {formatPercent(ml?.margemMedia || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-neutral-100 pt-3 text-right">
            <button
              onClick={() => setActiveTab('marketplaces')}
              className="text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:underline"
            >
              Ver métricas detalhadas dos canais &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Products & Cost Composition */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 3. Top Products Ranking (2 cols) */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Ranking de Produtos
              </h3>
              <p className="text-xs text-neutral-500">
                Performance por produto no período
              </p>
            </div>
            {/* Tab switch */}
            <div className="flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-50">
              <button
                onClick={() => setProductRankingTab('lucrativos')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  productRankingTab === 'lucrativos'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Mais Lucrativos
              </button>
              <button
                onClick={() => setProductRankingTab('vendidos')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  productRankingTab === 'vendidos'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Mais Vendidos
              </button>
            </div>
          </div>

          <div className="mt-4 divide-y divide-neutral-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[11px] font-medium text-neutral-400">
                  <th className="pb-2">Produto</th>
                  <th className="pb-2 text-center">Vendas</th>
                  <th className="pb-2 text-right">Faturamento</th>
                  <th className="pb-2 text-right">Lucro Total</th>
                  <th className="pb-2 text-right">Margem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {rankedProducts.map((p, idx) => (
                  <tr
                    key={p.produto}
                    onClick={() => {
                      setSelectedProductForDetail(p.produto);
                      setActiveTab('produtos');
                    }}
                    className="cursor-pointer transition-colors hover:bg-neutral-50"
                  >
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-600">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-neutral-900 line-clamp-1">
                          {p.produto}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-center font-medium">{p.totalVendas}</td>
                    <td className="py-2.5 text-right font-medium text-neutral-900">
                      {formatBRL(p.faturamentoTotal)}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-emerald-600">
                      {formatBRL(p.lucroTotal)}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-800">
                        {p.margemMedia.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 border-t border-neutral-100 pt-3 text-right">
            <button
              onClick={() => setActiveTab('produtos')}
              className="text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:underline"
            >
              Ver todos os {productSummaries.length} produtos &rarr;
            </button>
          </div>
        </div>

        {/* 4. Custos: Composição (1 col) */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
          <div className="border-b border-neutral-100 pb-4">
            <h3 className="text-sm font-semibold text-neutral-900">
              Composição dos Custos
            </h3>
            <p className="text-xs text-neutral-500">
              Divisão por energia, filamento e máquina
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {/* Total Cost Highlight */}
            <div className="rounded-lg bg-neutral-50 p-3">
              <div className="text-[11px] font-medium text-neutral-500">Custo Operacional Total</div>
              <div className="mt-1 text-lg font-semibold text-neutral-900">
                {formatBRL(kpis.custos)}
              </div>
            </div>

            {/* Filamento */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-medium text-neutral-800">Filamento (PLA / PETG)</span>
                </div>
                <span className="font-semibold text-neutral-900">
                  {formatBRL(kpis.custoFilamento)} ({pctFilamento}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-100">
                <div
                  className="h-2 rounded-full bg-amber-500"
                  style={{ width: `${pctFilamento}%` }}
                />
              </div>
            </div>

            {/* Manutenção de Máquina */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="font-medium text-neutral-800">Manutenção (R$ 0,84/hora)</span>
                </div>
                <span className="font-semibold text-neutral-900">
                  {formatBRL(kpis.custoManutencao)} ({pctManutencao}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-100">
                <div
                  className="h-2 rounded-full bg-indigo-500"
                  style={{ width: `${pctManutencao}%` }}
                />
              </div>
            </div>

            {/* Energia */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="font-medium text-neutral-800">Energia Elétrica</span>
                </div>
                <span className="font-semibold text-neutral-900">
                  {formatBRL(kpis.custoEnergia)} ({pctEnergia}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-100">
                <div
                  className="h-2 rounded-full bg-yellow-500"
                  style={{ width: `${pctEnergia}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
