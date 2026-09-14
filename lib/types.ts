export interface SaleItem {
  id: string;
  marketplace: 'SHOPEE' | 'MERCADO LIVRE' | string;
  data: string; // YYYY-MM-DD
  produto: string;
  material: 'PLA' | 'PETG' | 'PET-G' | 'ABS' | 'Outros' | string;
  energia: number;
  filamento: number;
  manutencao: number;
  custo: number;
  venda: number;
  taxa: number;
  repasse: number;
  lucro: number;
  porcentagem: number;
  source?: 'manual' | 'import' | 'sheets';
  createdAt?: string;
}

export interface Product {
  id: string;
  nome: string;
  material: string;
  energia: number;
  filamento: number;
  manutencao: number;
  custoTotal: number;
  precoSugerido?: number;
  createdAt?: string;
}

export type PeriodFilter = 'hoje' | '7dias' | '30dias' | 'mes_atual' | 'mes_anterior' | 'personalizado' | 'todos';

export interface FilterState {
  period: PeriodFilter;
  customStartDate: string;
  customEndDate: string;
  marketplace: string;
  material: string;
  produto: string;
  searchQuery: string;
}

export interface ProductSummary {
  produto: string;
  marketplaces: string[];
  materials: string[];
  totalVendas: number;
  faturamentoTotal: number;
  repasseTotal: number;
  custoTotal: number;
  taxaTotal: number;
  lucroTotal: number;
  margemMedia: number;
  precoMedioVenda: number;
  custoMedio: number;
  taxaMedia: number;
  repasseMedio: number;
  lucroMedio: number;
}

export interface MarketplaceSummary {
  marketplace: string;
  totalVendas: number;
  faturamentoTotal: number;
  taxaTotal: number;
  repasseTotal: number;
  custoTotal: number;
  lucroTotal: number;
  margemMedia: number;
  ticketMedio: number;
  taxaEfetivaPercent: number;
}

export interface MonthSummary {
  mesAno: string; // YYYY-MM
  label: string;  // e.g. "Setembro 2026"
  totalVendas: number;
  faturamento: number;
  taxas: number;
  custos: number;
  repasse: number;
  lucro: number;
  margem: number;
}

export interface InsightItem {
  id: string;
  type: 'positive' | 'warning' | 'info' | 'highlight';
  title: string;
  description: string;
  metric?: string;
}

// Helpers for currency and numbers
export function formatBRL(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  if (isNaN(value) || value === null || value === undefined || !isFinite(value)) return '0,00%';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + '%';
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  // If already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  
  // If YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

export function parseDateToISO(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const clean = String(dateStr).trim();
  
  // Handle DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  
  // Handle YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  // Handle Date parse
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

export function calculateRepasse(venda: number, taxa: number): number {
  return Number((venda - taxa).toFixed(2));
}

export function calculateLucro(repasse: number, custo: number): number {
  return Number((repasse - custo).toFixed(2));
}

export function calculatePorcentagem(lucro: number, custo: number): number {
  if (!custo || custo === 0) return 0;
  return Number(((lucro / custo) * 100).toFixed(2));
}
