'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  SaleItem,
  FilterState,
  PeriodFilter,
  ProductSummary,
  MarketplaceSummary,
  MonthSummary,
  InsightItem,
  calculateRepasse,
  calculateLucro,
  calculatePorcentagem,
} from './types';
import { generateInitialSales } from './sampleData';

interface CRMContextType {
  sales: SaleItem[];
  filters: FilterState;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  
  // Modals & Drawers
  isSaleModalOpen: boolean;
  editingSale: SaleItem | null;
  openNewSaleModal: () => void;
  openEditSaleModal: (sale: SaleItem) => void;
  closeSaleModal: () => void;
  selectedProductForDetail: string | null;
  setSelectedProductForDetail: (productName: string | null) => void;

  // Actions
  addSale: (sale: Omit<SaleItem, 'id' | 'createdAt'>) => void;
  updateSale: (id: string, sale: Partial<SaleItem>) => void;
  deleteSale: (id: string) => void;
  duplicateSale: (id: string) => void;
  importSales: (newSales: SaleItem[]) => number;
  clearAllSales: () => void;
  resetDemoData: () => void;

  // Computed data
  filteredSales: SaleItem[];
  kpis: {
    faturamento: number;
    repasse: number;
    custos: number;
    taxas: number;
    lucro: number;
    margemMedia: number;
    totalVendas: number;
    ticketMedio: number;
    custoEnergia: number;
    custoFilamento: number;
    custoManutencao: number;
  };
  productSummaries: ProductSummary[];
  marketplaceSummaries: MarketplaceSummary[];
  monthlySummaries: MonthSummary[];
  insights: InsightItem[];
  allProductNames: string[];
  allMaterials: string[];
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const STORAGE_KEY = 'marketplace_crm_sales_v1';

const defaultFilters: FilterState = {
  period: 'todos',
  customStartDate: '',
  customEndDate: '',
  marketplace: 'TODOS',
  material: 'TODOS',
  produto: 'TODOS',
  searchQuery: '',
};

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [sales, setSales] = useState<SaleItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Failed to read from localStorage:', e);
      }
    }
    return generateInitialSales();
  });
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleItem | null>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<string | null>(null);

  // Save to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [sales]);

  const setFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const openNewSaleModal = () => {
    setEditingSale(null);
    setIsSaleModalOpen(true);
  };

  const openEditSaleModal = (sale: SaleItem) => {
    setEditingSale(sale);
    setIsSaleModalOpen(true);
  };

  const closeSaleModal = () => {
    setIsSaleModalOpen(false);
    setEditingSale(null);
  };

  const addSale = (saleData: Omit<SaleItem, 'id' | 'createdAt'>) => {
    const repasse = calculateRepasse(saleData.venda, saleData.taxa);
    const lucro = calculateLucro(repasse, saleData.custo);
    const porcentagem = calculatePorcentagem(lucro, saleData.custo);

    const newSale: SaleItem = {
      ...saleData,
      id: `sale-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      repasse,
      lucro,
      porcentagem,
      source: saleData.source || 'manual',
      createdAt: new Date().toISOString(),
    };

    setSales((prev) => [newSale, ...prev]);
  };

  const updateSale = (id: string, updatedFields: Partial<SaleItem>) => {
    setSales((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const merged = { ...item, ...updatedFields };
        const repasse = calculateRepasse(merged.venda, merged.taxa);
        const lucro = calculateLucro(repasse, merged.custo);
        const porcentagem = calculatePorcentagem(lucro, merged.custo);
        return {
          ...merged,
          repasse,
          lucro,
          porcentagem,
        };
      })
    );
  };

  const deleteSale = (id: string) => {
    setSales((prev) => prev.filter((item) => item.id !== id));
  };

  const duplicateSale = (id: string) => {
    const original = sales.find((s) => s.id === id);
    if (!original) return;
    const duplicated: SaleItem = {
      ...original,
      id: `sale-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setSales((prev) => [duplicated, ...prev]);
  };

  const importSales = (newSales: SaleItem[]) => {
    setSales((prev) => [...newSales, ...prev]);
    return newSales.length;
  };

  const clearAllSales = () => {
    setSales([]);
  };

  const resetDemoData = () => {
    const initial = generateInitialSales();
    setSales(initial);
  };

  // Distinct lists for filter dropdowns
  const allProductNames = useMemo(() => {
    const names = Array.from(new Set(sales.map((s) => s.produto).filter(Boolean)));
    return names.sort();
  }, [sales]);

  const allMaterials = useMemo(() => {
    const mats = Array.from(new Set(sales.map((s) => s.material).filter(Boolean)));
    return mats.sort();
  }, [sales]);

  // Filtered sales calculation
  const filteredSales = useMemo(() => {
    return sales.filter((item) => {
      // Marketplace filter
      if (filters.marketplace !== 'TODOS') {
        const itemMkt = (item.marketplace || '').toUpperCase();
        if (filters.marketplace === 'SHOPEE' && !itemMkt.includes('SHOPEE')) return false;
        if (filters.marketplace === 'MERCADO LIVRE' && !itemMkt.includes('MERCADO')) return false;
      }

      // Material filter
      if (filters.material !== 'TODOS') {
        const itemMat = (item.material || '').toUpperCase();
        if (filters.material === 'OUTROS') {
          if (['PLA', 'PETG', 'PET-G', 'ABS'].includes(itemMat)) return false;
        } else if (itemMat !== filters.material.toUpperCase()) {
          return false;
        }
      }

      // Product filter
      if (filters.produto !== 'TODOS' && item.produto !== filters.produto) {
        return false;
      }

      // Search query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchProd = item.produto.toLowerCase().includes(q);
        const matchMkt = item.marketplace.toLowerCase().includes(q);
        const matchMat = item.material.toLowerCase().includes(q);
        if (!matchProd && !matchMkt && !matchMat) return false;
      }

      // Date / Period filter
      if (filters.period !== 'todos') {
        const itemDateStr = item.data; // YYYY-MM-DD
        if (!itemDateStr) return true;

        // Current simulated context reference date is Sept 2026
        const now = new Date('2026-09-10T23:59:59Z');
        const itemDate = new Date(`${itemDateStr}T12:00:00Z`);

        if (filters.period === 'hoje') {
          const itemDay = itemDateStr;
          const todayDay = '2026-09-10';
          if (itemDay !== todayDay) return false;
        } else if (filters.period === '7dias') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (itemDate < sevenDaysAgo || itemDate > now) return false;
        } else if (filters.period === '30dias') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (itemDate < thirtyDaysAgo || itemDate > now) return false;
        } else if (filters.period === 'mes_atual') {
          // 2026-09
          if (!itemDateStr.startsWith('2026-09')) return false;
        } else if (filters.period === 'mes_anterior') {
          // 2026-08
          if (!itemDateStr.startsWith('2026-08')) return false;
        } else if (filters.period === 'personalizado') {
          if (filters.customStartDate && itemDateStr < filters.customStartDate) return false;
          if (filters.customEndDate && itemDateStr > filters.customEndDate) return false;
        }
      }

      return true;
    });
  }, [sales, filters]);

  // KPIs
  const kpis = useMemo(() => {
    let faturamento = 0;
    let repasse = 0;
    let custos = 0;
    let taxas = 0;
    let lucro = 0;
    let custoEnergia = 0;
    let custoFilamento = 0;
    let custoManutencao = 0;

    filteredSales.forEach((s) => {
      faturamento += s.venda || 0;
      repasse += s.repasse || 0;
      custos += s.custo || 0;
      taxas += s.taxa || 0;
      lucro += s.lucro || 0;
      custoEnergia += s.energia || 0;
      custoFilamento += s.filamento || 0;
      custoManutencao += s.manutencao || 0;
    });

    const totalVendas = filteredSales.length;
    const margemMedia = custos > 0 ? (lucro / custos) * 100 : 0;
    const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0;

    return {
      faturamento: Number(faturamento.toFixed(2)),
      repasse: Number(repasse.toFixed(2)),
      custos: Number(custos.toFixed(2)),
      taxas: Number(taxas.toFixed(2)),
      lucro: Number(lucro.toFixed(2)),
      margemMedia: Number(margemMedia.toFixed(2)),
      totalVendas,
      ticketMedio: Number(ticketMedio.toFixed(2)),
      custoEnergia: Number(custoEnergia.toFixed(2)),
      custoFilamento: Number(custoFilamento.toFixed(2)),
      custoManutencao: Number(custoManutencao.toFixed(2)),
    };
  }, [filteredSales]);

  // Product summaries
  const productSummaries: ProductSummary[] = useMemo(() => {
    const map = new Map<string, SaleItem[]>();
    filteredSales.forEach((s) => {
      const p = s.produto.trim();
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(s);
    });

    const list: ProductSummary[] = [];
    map.forEach((items, produto) => {
      const totalVendas = items.length;
      let faturamentoTotal = 0;
      let repasseTotal = 0;
      let custoTotal = 0;
      let taxaTotal = 0;
      let lucroTotal = 0;
      const mkts = new Set<string>();
      const mats = new Set<string>();

      items.forEach((it) => {
        faturamentoTotal += it.venda;
        repasseTotal += it.repasse;
        custoTotal += it.custo;
        taxaTotal += it.taxa;
        lucroTotal += it.lucro;
        mkts.add(it.marketplace);
        mats.add(it.material);
      });

      const margemMedia = custoTotal > 0 ? (lucroTotal / custoTotal) * 100 : 0;

      list.push({
        produto,
        marketplaces: Array.from(mkts),
        materials: Array.from(mats),
        totalVendas,
        faturamentoTotal: Number(faturamentoTotal.toFixed(2)),
        repasseTotal: Number(repasseTotal.toFixed(2)),
        custoTotal: Number(custoTotal.toFixed(2)),
        taxaTotal: Number(taxaTotal.toFixed(2)),
        lucroTotal: Number(lucroTotal.toFixed(2)),
        margemMedia: Number(margemMedia.toFixed(2)),
        precoMedioVenda: Number((faturamentoTotal / totalVendas).toFixed(2)),
        custoMedio: Number((custoTotal / totalVendas).toFixed(2)),
        taxaMedia: Number((taxaTotal / totalVendas).toFixed(2)),
        repasseMedio: Number((repasseTotal / totalVendas).toFixed(2)),
        lucroMedio: Number((lucroTotal / totalVendas).toFixed(2)),
      });
    });

    return list.sort((a, b) => b.lucroTotal - a.lucroTotal);
  }, [filteredSales]);

  // Marketplace summaries
  const marketplaceSummaries: MarketplaceSummary[] = useMemo(() => {
    const mkts = ['SHOPEE', 'MERCADO LIVRE'];
    return mkts.map((mktName) => {
      const items = filteredSales.filter((s) => s.marketplace.toUpperCase().includes(mktName.replace(' ', '')));
      let faturamentoTotal = 0;
      let taxaTotal = 0;
      let repasseTotal = 0;
      let custoTotal = 0;
      let lucroTotal = 0;

      items.forEach((it) => {
        faturamentoTotal += it.venda;
        taxaTotal += it.taxa;
        repasseTotal += it.repasse;
        custoTotal += it.custo;
        lucroTotal += it.lucro;
      });

      const totalVendas = items.length;
      const margemMedia = custoTotal > 0 ? (lucroTotal / custoTotal) * 100 : 0;
      const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;
      const taxaEfetivaPercent = faturamentoTotal > 0 ? (taxaTotal / faturamentoTotal) * 100 : 0;

      return {
        marketplace: mktName,
        totalVendas,
        faturamentoTotal: Number(faturamentoTotal.toFixed(2)),
        taxaTotal: Number(taxaTotal.toFixed(2)),
        repasseTotal: Number(repasseTotal.toFixed(2)),
        custoTotal: Number(custoTotal.toFixed(2)),
        lucroTotal: Number(lucroTotal.toFixed(2)),
        margemMedia: Number(margemMedia.toFixed(2)),
        ticketMedio: Number(ticketMedio.toFixed(2)),
        taxaEfetivaPercent: Number(taxaEfetivaPercent.toFixed(2)),
      };
    });
  }, [filteredSales]);

  // Monthly summaries
  const monthlySummaries: MonthSummary[] = useMemo(() => {
    const map = new Map<string, SaleItem[]>();
    sales.forEach((s) => {
      const mesAno = s.data.substring(0, 7); // YYYY-MM
      if (!mesAno) return;
      if (!map.has(mesAno)) map.set(mesAno, []);
      map.get(mesAno)!.push(s);
    });

    const monthNames: Record<string, string> = {
      '01': 'Janeiro',
      '02': 'Fevereiro',
      '03': 'Março',
      '04': 'Abril',
      '05': 'Maio',
      '06': 'Junho',
      '07': 'Julho',
      '08': 'Agosto',
      '09': 'Setembro',
      '10': 'Outubro',
      '11': 'Novembro',
      '12': 'Dezembro',
    };

    const sortedKeys = Array.from(map.keys()).sort().reverse();

    return sortedKeys.map((key) => {
      const items = map.get(key)!;
      const [year, month] = key.split('-');
      const label = `${monthNames[month] || month} ${year}`;

      let faturamento = 0;
      let taxas = 0;
      let custos = 0;
      let repasse = 0;
      let lucro = 0;

      items.forEach((it) => {
        faturamento += it.venda;
        taxas += it.taxa;
        custos += it.custo;
        repasse += it.repasse;
        lucro += it.lucro;
      });

      const totalVendas = items.length;
      const margem = custos > 0 ? (lucro / custos) * 100 : 0;

      return {
        mesAno: key,
        label,
        totalVendas,
        faturamento: Number(faturamento.toFixed(2)),
        taxas: Number(taxas.toFixed(2)),
        custos: Number(custos.toFixed(2)),
        repasse: Number(repasse.toFixed(2)),
        lucro: Number(lucro.toFixed(2)),
        margem: Number(margem.toFixed(2)),
      };
    });
  }, [sales]);

  // Intelligent dynamic insights
  const insights: InsightItem[] = useMemo(() => {
    if (filteredSales.length === 0) return [];
    const list: InsightItem[] = [];

    // Marketplace revenue share insight
    const mlSummary = marketplaceSummaries.find((m) => m.marketplace === 'MERCADO LIVRE');
    const shopeeSummary = marketplaceSummaries.find((m) => m.marketplace === 'SHOPEE');
    if (kpis.faturamento > 0 && mlSummary && shopeeSummary) {
      const mlShare = (mlSummary.faturamentoTotal / kpis.faturamento) * 100;
      const shopeeShare = (shopeeSummary.faturamentoTotal / kpis.faturamento) * 100;

      if (mlShare >= 50) {
        list.push({
          id: 'mkt-share',
          type: 'info',
          title: 'Canal Principal',
          description: `Mercado Livre representa ${mlShare.toFixed(1)}% do faturamento no período filtrado.`,
          metric: `${mlShare.toFixed(0)}%`,
        });
      } else {
        list.push({
          id: 'mkt-share',
          type: 'info',
          title: 'Canal Principal',
          description: `Shopee representa ${shopeeShare.toFixed(1)}% do faturamento no período filtrado.`,
          metric: `${shopeeShare.toFixed(0)}%`,
        });
      }
    }

    // Most profitable product
    if (productSummaries.length > 0) {
      const topProfitable = [...productSummaries].sort((a, b) => b.lucroTotal - a.lucroTotal)[0];
      if (topProfitable && topProfitable.lucroTotal > 0) {
        list.push({
          id: 'top-product',
          type: 'positive',
          title: 'Produto Campeão de Lucro',
          description: `Seu produto mais lucrativo foi "${topProfitable.produto}" gerando R$ ${topProfitable.lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de lucro líquido.`,
          metric: `R$ ${topProfitable.lucroTotal.toFixed(0)}`,
        });
      }
    }

    // Month-over-month margin comparison
    if (monthlySummaries.length >= 2) {
      const currMonth = monthlySummaries[0];
      const prevMonth = monthlySummaries[1];
      const diffMargin = currMonth.margem - prevMonth.margem;
      if (Math.abs(diffMargin) > 0.5) {
        list.push({
          id: 'margin-trend',
          type: diffMargin >= 0 ? 'positive' : 'warning',
          title: 'Evolução da Margem',
          description: `A margem média ${diffMargin >= 0 ? 'aumentou' : 'diminuiu'} ${Math.abs(diffMargin).toFixed(1)}% em relação ao mês anterior (${prevMonth.label}).`,
          metric: `${diffMargin >= 0 ? '+' : ''}${diffMargin.toFixed(1)}%`,
        });
      }
    }

    // High revenue but low margin alert
    const highRevLowMargin = productSummaries.find(
      (p) => p.faturamentoTotal > kpis.faturamento * 0.15 && p.margemMedia < 60
    );
    if (highRevLowMargin) {
      list.push({
        id: 'low-margin-alert',
        type: 'warning',
        title: 'Atenção à Margem',
        description: `O produto "${highRevLowMargin.produto}" possui alto volume de faturamento, mas sua margem está abaixo da média (${highRevLowMargin.margemMedia.toFixed(1)}%).`,
        metric: `${highRevLowMargin.margemMedia.toFixed(0)}%`,
      });
    }

    // Loss-making records check
    const lossSales = filteredSales.filter((s) => s.lucro < 0);
    if (lossSales.length > 0) {
      list.push({
        id: 'loss-alert',
        type: 'warning',
        title: 'Prejuízo Identificado',
        description: `Existem ${lossSales.length} venda(s) com lucro negativo no período. Verifique taxas e custos aplicados.`,
        metric: `-${lossSales.length}`,
      });
    } else {
      list.push({
        id: 'healthy-profit',
        type: 'highlight',
        title: 'Operação 100% Positiva',
        description: 'Todas as vendas no período registraram margem positiva de retorno.',
        metric: '100%',
      });
    }

    return list;
  }, [filteredSales, kpis, marketplaceSummaries, productSummaries, monthlySummaries]);

  return (
    <CRMContext.Provider
      value={{
        sales,
        filters,
        activeTab,
        setActiveTab,
        setFilter,
        resetFilters,
        isSaleModalOpen,
        editingSale,
        openNewSaleModal,
        openEditSaleModal,
        closeSaleModal,
        selectedProductForDetail,
        setSelectedProductForDetail,
        addSale,
        updateSale,
        deleteSale,
        duplicateSale,
        importSales,
        clearAllSales,
        resetDemoData,
        filteredSales,
        kpis,
        productSummaries,
        marketplaceSummaries,
        monthlySummaries,
        insights,
        allProductNames,
        allMaterials,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
