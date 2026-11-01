'use client';

import React, { useState, useMemo } from 'react';
import { useCRM } from '@/lib/store';
import { formatBRL, formatPercent } from '@/lib/types';
import {
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  Percent,
  Receipt,
  Package,
  Layers,
  Zap,
  Activity,
  Flame,
  ShoppingBag,
  Tag,
  PieChart,
} from 'lucide-react';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Area,
  AreaChart,
} from 'recharts';

export default function DashboardView() {
  const {
    kpis,
    filters,
    filteredSales,
    productSummaries,
    marketplaceSummaries,
    monthlySummaries,
    setSelectedProductForDetail,
    setActiveTab,
  } = useCRM();

  const [productRankingTab, setProductRankingTab] = useState<'vendidos' | 'lucrativos'>('lucrativos');

  // Aggregated daily data for the trend chart
  const dailyTrendData = useMemo(() => {
    const map = new Map<string, { date: string, faturamento: number }>();
    
    // Group sales by date
    filteredSales.forEach((sale) => {
      const date = sale.data;
      if (!map.has(date)) {
        map.set(date, { date, faturamento: 0 });
      }
      map.get(date)!.faturamento += sale.venda;
    });

    // Convert to array and sort chronologically
    let data = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));

    return data.map(item => ({
      ...item,
      label: item.date.split('-').reverse().slice(0, 2).join('/'), // DD/MM
      fullDate: item.date.split('-').reverse().join('/'), // DD/MM/YYYY
    }));
  }, [filteredSales]);

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
    <div id="dashboard-view" className="space-y-8">
      {/* 1. Cards de Resumo - High Level Indicators */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Vendas Totais */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-neutral-100 p-2.5">
              <ShoppingBag className="h-5 w-5 text-neutral-600" />
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Tempo Real</div>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-medium text-neutral-500">Vendas Totais</h4>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">
                {kpis.totalVendas}
              </span>
              <span className="text-xs font-medium text-neutral-400">pedidos</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5">
            <ShoppingBag className="h-24 w-24" />
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-emerald-50 p-2.5">
              <Tag className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Eficiência</div>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-medium text-neutral-500">Ticket Médio</h4>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">
                {formatBRL(kpis.ticketMedio)}
              </span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5">
            <Tag className="h-24 w-24" />
          </div>
        </div>

        {/* Margem Líquida Total */}
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <PieChart className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Rentabilidade</div>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-medium text-neutral-500">Margem Líquida</h4>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">
                {formatPercent(kpis.margemLiquida)}
              </span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5">
            <PieChart className="h-24 w-24" />
          </div>
        </div>
      </div>

      {/* 2. Detalhamento de KPIs */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        {/* Faturamento */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Bruto
            </span>
            <DollarSign className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="mt-2 text-lg font-bold tracking-tight text-neutral-900 tabular-nums">
            {formatBRL(kpis.faturamento)}
          </div>
          <div className="mt-1 text-[10px] text-neutral-400">Faturamento total</div>
        </div>

        {/* Repasse */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Repasse
            </span>
            <Receipt className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="mt-2 text-lg font-bold tracking-tight text-emerald-700 tabular-nums">
            {formatBRL(kpis.repasse)}
          </div>
          <div className="mt-1 text-[10px] text-neutral-400">Pós-taxas mkt</div>
        </div>

        {/* Custos */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Custos
            </span>
            <Layers className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="mt-2 text-lg font-bold tracking-tight text-neutral-800 tabular-nums">
            {formatBRL(kpis.custos)}
          </div>
          <div className="mt-1 text-[10px] text-neutral-400">Insumos fixos</div>
        </div>

        {/* Taxas */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Taxas
            </span>
            <ArrowDownRight className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="mt-2 text-lg font-bold tracking-tight text-amber-700 tabular-nums">
            {formatBRL(kpis.taxas)}
          </div>
          <div className="mt-1 text-[10px] text-neutral-400">
            {kpis.faturamento > 0
              ? `${((kpis.taxas / kpis.faturamento) * 100).toFixed(1)}% fatur.`
              : '0%'}
          </div>
        </div>

        {/* Lucro */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Lucro
            </span>
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="mt-2 text-lg font-bold tracking-tight text-emerald-600 tabular-nums">
            {formatBRL(kpis.lucro)}
          </div>
          <div className="mt-1 text-[10px] text-emerald-700 font-medium">Líquido final</div>
        </div>

        {/* Markup (Margem s/ custo) */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Markup
            </span>
            <Percent className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="mt-2 text-lg font-bold tracking-tight text-neutral-900 tabular-nums">
            {formatPercent(kpis.margemMedia)}
          </div>
          <div className="mt-1 text-[10px] text-neutral-400">Margem s/ custo</div>
        </div>
      </div>

      {/* Daily Revenue Trend Chart */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              Tendência de Faturamento Diário
            </h3>
            <p className="text-xs text-neutral-500">
              Desempenho por dia no período selecionado
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-emerald-500" />
              <span className="text-neutral-600 font-medium">Faturamento</span>
            </div>
          </div>
        </div>

        <div className="mt-6 h-[300px] w-full">
          {dailyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#888' }} 
                  dy={10}
                  minTickGap={30}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#888' }} 
                  tickFormatter={(value) => `R$ ${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [formatBRL(Number(value) || 0), 'Faturamento']}
                  labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
                />
                <Area 
                  type="monotone" 
                  dataKey="faturamento" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400 italic">
              Nenhuma venda registrada no período para gerar tendência.
            </div>
          )}
        </div>
      </div>

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

        {/* 4. Custos e Resumo Financeiro (Image Style) */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Resumo Financeiro & Custos
              </h3>
              <p className="text-[11px] text-neutral-500">
                Composição baseada nos registros do período
              </p>
            </div>
            <Activity className="h-4 w-4 text-neutral-400" />
          </div>

          <div className="grid grid-cols-1 overflow-hidden border border-black font-sans uppercase md:grid-cols-2">
            {/* Left Column: Revenue & Profit */}
            <div className="flex flex-col border-b border-black md:border-b-0 md:border-r">
              <div className="bg-black py-2 text-center text-xs font-bold text-white">
                {filters.period === 'mes_atual' 
                  ? new Date().toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase()
                  : filters.period === 'mes_anterior'
                  ? (() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() - 1);
                      return d.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();
                    })()
                  : 'RESUMO'}
              </div>
              
              <div className="flex justify-between border-b border-black bg-[#FF9F1C] px-4 py-2 text-xs font-bold text-black">
                <span>Venda</span>
                <span>{formatBRL(kpis.faturamento).replace('R$', '').trim()}</span>
              </div>
              
              <div className="flex justify-between border-b border-black bg-white px-4 py-2 text-xs font-bold text-black">
                <span>REPASSE</span>
                <span>{formatBRL(kpis.repasse).replace('R$', '').trim()}</span>
              </div>
              
              <div className="flex justify-between bg-[#98D266] px-4 py-2 text-xs font-bold text-black">
                <span>LUCRO</span>
                <span>{formatBRL(kpis.lucro).replace('R$', '').trim()}</span>
              </div>
            </div>

            {/* Right Column: Costs */}
            <div className="flex flex-col">
              <div className="flex justify-between bg-[#FF0000] px-4 py-2 text-xs font-bold text-white">
                <span>CUSTOS TOTAIS</span>
                <span>{formatBRL(kpis.custos).replace('R$', '').trim()}</span>
              </div>
              
              <div className="flex justify-between border-b border-black bg-white px-4 py-2 text-xs font-bold text-black">
                <span>Energia</span>
                <span>{formatBRL(kpis.custoEnergia).replace('R$', '').trim()}</span>
              </div>
              
              <div className="flex justify-between border-b border-black bg-white px-4 py-2 text-xs font-bold text-black">
                <span>Filamento</span>
                <span>{formatBRL(kpis.custoFilamento).replace('R$', '').trim()}</span>
              </div>
              
              <div className="flex justify-between bg-white px-4 py-2 text-xs font-bold text-black">
                <span>Manutenção</span>
                <span>{formatBRL(kpis.custoManutencao).replace('R$', '').trim()}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-[10px] text-neutral-400 italic">
            * Valores em Reais (BRL). Repasse = Venda - Taxas. Lucro = Repasse - Custos.
          </div>
        </div>
      </div>
    </div>
  );
}
