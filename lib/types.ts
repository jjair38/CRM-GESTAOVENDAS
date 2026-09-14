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
  
  // Se já estiver no formato DD/MM/YYYY, apenas retorna
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  
  // Se for formato ISO YYYY-MM-DD (com ou sem tempo)
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}/${month}/${year}`;
  }
  
  // Fallback seguro usando split se houver traços
  const parts = dateStr.split('-');
  if (parts.length >= 3) {
    const [year, month, dayPart] = parts;
    const day = dayPart.substring(0, 2);
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  
  // Fallback para objeto Date, mas evitando fuso horário
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }
  
  return dateStr;
}

export function parseDateToISO(dateStr: string): string {
  if (!dateStr) {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  
  const clean = String(dateStr).trim();
  
  // Prioridade Total para DD/MM/YYYY ou DD-MM-YYYY
  const brMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  
  // Se já for YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    return clean.substring(0, 10);
  }

  // Parse de Date evitando inversão MM/DD
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getUTCFullYear();
    const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
    const day = String(parsed.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
