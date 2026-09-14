import * as XLSX from 'xlsx';
import { SaleItem, calculateRepasse, calculateLucro, calculatePorcentagem, parseDateToISO, formatDateBR } from './types';

export interface ColumnMappingResult {
  originalHeader: string;
  mappedField: keyof SaleItem | null;
  sampleValue?: string;
}

export interface ImportPreviewResult {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  identifiedColumns: ColumnMappingResult[];
  missingRequiredFields: string[];
  sampleItems: SaleItem[];
  allItems: SaleItem[];
  errors: string[];
  warnings: string[];
}

// Clean string to match header keywords
function normalizeHeader(header: string): string {
  return String(header || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function detectColumnField(rawHeader: string): keyof SaleItem | null {
  const norm = normalizeHeader(rawHeader);

  if (norm === 'id' || norm === 'codigo' || norm === 'referencia') {
    return 'id';
  }
  if (norm.includes('market') || norm.includes('canal') || norm.includes('plataforma') || norm === 'mkt') {
    return 'marketplace';
  }
  if (norm.includes('data') || norm.includes('date') || norm === 'dia') {
    return 'data';
  }
  if (norm.includes('prod') || norm.includes('item') || norm.includes('desc') || norm.includes('anuncio')) {
    return 'produto';
  }
  if (norm.includes('mat') || norm.includes('filatipo')) {
    return 'material';
  }
  if (norm.includes('energ') || norm.includes('luz')) {
    return 'energia';
  }
  if (norm.includes('fila') && !norm.includes('mat')) {
    return 'filamento';
  }
  if (norm.includes('manut') || norm.includes('hora') || norm.includes('084') || norm.includes('maquina')) {
    return 'manutencao';
  }
  if (norm === 'custo' || norm === 'custototal' || norm.includes('custoprod')) {
    return 'custo';
  }
  if (norm === 'venda' || norm === 'preco' || norm.includes('precovenda') || norm.includes('valorvenda') || norm === 'faturamento') {
    return 'venda';
  }
  if (norm.includes('taxa') || norm.includes('comis') || norm.includes('tarifa')) {
    return 'taxa';
  }
  if (norm.includes('repass') || norm.includes('liquido') || norm.includes('recebido')) {
    return 'repasse';
  }
  if (norm === 'lucro' || norm.includes('lucroliq') || norm === 'lucroliquido') {
    return 'lucro';
  }
  if (norm.includes('porcent') || norm === 'margem' || norm === 'margempercent' || norm === 'pcent' || norm === '') {
    return 'porcentagem';
  }

  return null;
}

// Convert cell value to number safely (handles Brazilian R$ 1.234,56 or 1234.56 or percentage strings)
export function parseNumberValue(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') {
    if (isNaN(val)) return 0;
    return val;
  }
  let str = String(val).trim();
  // Remove currency symbols and non-numeric except , . -
  str = str.replace(/[R$\s%]/g, '');
  
  // If format is like "1.234,56"
  if (str.includes(',') && str.includes('.')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      // Brazilian format 1.234,56 -> 1234.56
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US format 1,234.56 -> 1234.56
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Number(num.toFixed(2));
}

// Parse Excel / CSV File
export async function parseSpreadsheetFile(file: File): Promise<ImportPreviewResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Nenhuma planilha encontrada no arquivo.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!rawData || rawData.length === 0) {
    throw new Error('O arquivo está vazio.');
  }

  // Find header row (first non-empty row)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rawData.length, 5); i++) {
    if (rawData[i].some((cell: any) => String(cell).trim().length > 0)) {
      headerRowIndex = i;
      break;
    }
  }

  const rawHeaders = rawData[headerRowIndex].map((h: any) => String(h || '').trim());
  const dataRows = rawData.slice(headerRowIndex + 1).filter((row) => row.some((cell) => String(cell).trim().length > 0));

  // Map columns
  const identifiedColumns: ColumnMappingResult[] = rawHeaders.map((header, colIdx) => {
    const mapped = detectColumnField(header);
    const sample = dataRows[0] ? String(dataRows[0][colIdx] ?? '') : '';
    return {
      originalHeader: header,
      mappedField: mapped,
      sampleValue: sample,
    };
  });

  // Check required mappings
  const mappedFieldsList = identifiedColumns.map((c) => c.mappedField).filter(Boolean) as (keyof SaleItem)[];
  const required = ['marketplace', 'data', 'produto'];
  const missingRequiredFields = required.filter((req) => !mappedFieldsList.includes(req as keyof SaleItem));

  const items: SaleItem[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (missingRequiredFields.length > 0) {
    warnings.push(`Colunas essenciais não identificadas automaticamente: ${missingRequiredFields.join(', ')}. O sistema tentará inferir se houver dados posicionais.`);
  }

  dataRows.forEach((row, rowIdx) => {
    const rowNum = rowIdx + headerRowIndex + 2;
    const itemDict: Partial<Record<keyof SaleItem, any>> = {};

    identifiedColumns.forEach((col, colIdx) => {
      if (col.mappedField) {
        itemDict[col.mappedField] = row[colIdx];
      }
    });

    // Fallbacks if columns weren't by name but positional matching user's specification A-M:
    // A: ID, B: Marketplace, C: Data, D: Produto, E: Material, F: Energia, G: Filamento, H: Manutencao, I: Custo, J: Venda, K: Taxa, L: Repasse, M: Lucro, N: Porcentagem
    if (!itemDict.id && row[0]) itemDict.id = String(row[0]).trim();
    if (!itemDict.marketplace && row[1]) itemDict.marketplace = row[1];
    if (!itemDict.data && row[2]) itemDict.data = row[2];
    if (!itemDict.produto && row[3]) itemDict.produto = row[3];
    if (!itemDict.material && row[4]) itemDict.material = row[4];
    if (itemDict.energia === undefined && row[5] !== undefined) itemDict.energia = row[5];
    if (itemDict.filamento === undefined && row[6] !== undefined) itemDict.filamento = row[6];
    if (itemDict.manutencao === undefined && row[7] !== undefined) itemDict.manutencao = row[7];
    if (itemDict.custo === undefined && row[8] !== undefined) itemDict.custo = row[8];
    if (itemDict.venda === undefined && row[9] !== undefined) itemDict.venda = row[9];
    if (itemDict.taxa === undefined && row[10] !== undefined) itemDict.taxa = row[10];
    if (itemDict.repasse === undefined && row[11] !== undefined) itemDict.repasse = row[11];
    if (itemDict.lucro === undefined && row[12] !== undefined) itemDict.lucro = row[12];
    if (itemDict.porcentagem === undefined && row[13] !== undefined) itemDict.porcentagem = row[13];

    const rawMarketplace = String(itemDict.marketplace || 'SHOPEE').trim().toUpperCase();
    const marketplace = rawMarketplace.includes('MERCADO') || rawMarketplace.includes('ML') ? 'MERCADO LIVRE' : 'SHOPEE';
    
    // Parse date
    let rawDate = itemDict.data;
    if (rawDate instanceof Date) {
      rawDate = rawDate.toISOString().split('T')[0];
    }
    const isoDate = parseDateToISO(String(rawDate || ''));

    const produto = String(itemDict.produto || '').trim();
    if (!produto) {
      warnings.push(`Linha ${rowNum}: Produto não informado. Registro marcado com "Produto sem nome".`);
    }

    const material = String(itemDict.material || 'PLA').trim().toUpperCase() || 'PLA';

    const energia = parseNumberValue(itemDict.energia);
    const filamento = parseNumberValue(itemDict.filamento);
    const manutencao = parseNumberValue(itemDict.manutencao);
    
    // Custo: if explicitly provided, use it; else sum energy + filament + maintenance
    let custo = parseNumberValue(itemDict.custo);
    if (custo === 0 && (energia > 0 || filamento > 0 || manutencao > 0)) {
      custo = Number((energia + filamento + manutencao).toFixed(2));
    }

    const venda = parseNumberValue(itemDict.venda);
    const taxa = parseNumberValue(itemDict.taxa);

    // Rule: Don't alter imported values if they are already filled; otherwise auto-calculate
    let repasse = parseNumberValue(itemDict.repasse);
    if (repasse === 0 && venda > 0) {
      repasse = calculateRepasse(venda, taxa);
    }

    let lucro = parseNumberValue(itemDict.lucro);
    if (lucro === 0 && (repasse > 0 || custo > 0)) {
      lucro = calculateLucro(repasse, custo);
    }

    let porcentagem = parseNumberValue(itemDict.porcentagem);
    if (porcentagem === 0 && custo > 0) {
      porcentagem = calculatePorcentagem(lucro, custo);
    }

    const item: SaleItem = {
      id: String(itemDict.id || `imported-${Date.now().toString(36)}-${rowIdx}`).trim(),
      marketplace,
      data: isoDate,
      produto: produto || 'Produto sem nome',
      material,
      energia,
      filamento,
      manutencao,
      custo,
      venda,
      taxa,
      repasse,
      lucro,
      porcentagem,
      source: 'import',
      createdAt: new Date().toISOString(),
    };

    items.push(item);
  });

  return {
    totalRows: dataRows.length,
    validRows: items.length,
    warningRows: warnings.length,
    errorRows: errors.length,
    identifiedColumns,
    missingRequiredFields,
    sampleItems: items.slice(0, 5),
    allItems: items,
    errors,
    warnings,
  };
}

// Generate Downloadable CSV Model matching user's exact specification
export function generateCSVTemplate(): string {
  const headers = [
    'ID',
    'MARKETPLACE',
    'DATA',
    'Produto',
    'MATERIAL',
    'Energia',
    'Filamento',
    'Manutenção / hora 0,84',
    'Custo',
    'Venda',
    'Taxa',
    'Repasse',
    'Lucro',
    'Porcentagem',
  ];

  const sampleRows = [
    [
      'V001',
      'SHOPEE',
      '01/09/2026',
      '20x Porta Bombom Pomo de Ouro Harry Potter 3D',
      'PLA',
      '3,20',
      '14,50',
      '4,20',
      '21,90',
      '79,90',
      '15,98',
      '63,92',
      '42,02',
      '191,87',
    ],
    [
      'V002',
      'MERCADO LIVRE',
      '02/09/2026',
      'Adaptador Mini Bowens para Flash Speedlite',
      'PETG',
      '1,80',
      '11,20',
      '3,36',
      '16,36',
      '68,00',
      '11,56',
      '56,44',
      '40,08',
      '244,99',
    ],
    [
      'V003',
      'MERCADO LIVRE',
      '03/09/2026',
      'Suporte Articulado Câmera Web Mesa Gamer',
      'PET-G',
      '2,50',
      '18,40',
      '5,04',
      '25,94',
      '89,90',
      '15,28',
      '74,62',
      '48,68',
      '187,66',
    ],
  ];

  const csvLines = [
    headers.join(';'),
    ...sampleRows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')),
  ];

  // Include UTF-8 BOM so Excel opens it with proper Portuguese accents
  return '\uFEFF' + csvLines.join('\r\n');
}

export function downloadCSVTemplate(): void {
  const content = generateCSVTemplate();
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'modelo_controle_vendas_marketplace.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export Sales to CSV
export function exportSalesToCSV(sales: SaleItem[], filename = 'vendas_marketplace.csv'): void {
  const headers = [
    'ID',
    'MARKETPLACE',
    'DATA',
    'Produto',
    'MATERIAL',
    'Energia',
    'Filamento',
    'Manutenção / hora 0,84',
    'Custo',
    'Venda',
    'Taxa',
    'Repasse',
    'Lucro',
    'Porcentagem',
  ];

  const rows = sales.map((s) => [
    s.id,
    s.marketplace,
    formatDateBR(s.data),
    s.produto,
    s.material,
    s.energia.toFixed(2).replace('.', ','),
    s.filamento.toFixed(2).replace('.', ','),
    s.manutencao.toFixed(2).replace('.', ','),
    s.custo.toFixed(2).replace('.', ','),
    s.venda.toFixed(2).replace('.', ','),
    s.taxa.toFixed(2).replace('.', ','),
    s.repasse.toFixed(2).replace('.', ','),
    s.lucro.toFixed(2).replace('.', ','),
    s.porcentagem.toFixed(2).replace('.', ',') + '%',
  ]);

  const csvContent =
    '\uFEFF' +
    [headers.join(';'), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export Sales to Excel (.xlsx)
export function exportSalesToExcel(sales: SaleItem[], filename = 'vendas_marketplace.xlsx'): void {
  const data = sales.map((s) => ({
    ID: s.id,
    MARKETPLACE: s.marketplace,
    DATA: formatDateBR(s.data),
    Produto: s.produto,
    MATERIAL: s.material,
    Energia: s.energia,
    Filamento: s.filamento,
    'Manutenção / hora 0,84': s.manutencao,
    Custo: s.custo,
    Venda: s.venda,
    Taxa: s.taxa,
    Repasse: s.repasse,
    Lucro: s.lucro,
    Porcentagem: s.porcentagem / 100, // Excel format percentage
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  // Configure column widths
  worksheet['!cols'] = [
    { wch: 20 }, // ID
    { wch: 16 }, // MARKETPLACE
    { wch: 12 }, // DATA
    { wch: 40 }, // Produto
    { wch: 10 }, // MATERIAL
    { wch: 10 }, // Energia
    { wch: 12 }, // Filamento
    { wch: 22 }, // Manutencao
    { wch: 12 }, // Custo
    { wch: 12 }, // Venda
    { wch: 12 }, // Taxa
    { wch: 12 }, // Repasse
    { wch: 12 }, // Lucro
    { wch: 14 }, // Porcentagem
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendas');
  XLSX.writeFile(workbook, filename);
}
