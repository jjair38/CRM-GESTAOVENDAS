import { SaleItem, calculateRepasse, calculateLucro, calculatePorcentagem, parseDateToISO } from './types';
import { detectColumnField, parseNumberValue } from './spreadsheet';

export interface GoogleSheetsConfig {
  sheetUrl: string;
  sheetId: string;
  sheetName: string;
  lastSyncTime: string | null;
  autoSync: boolean;
  connected: boolean;
}

export interface SyncResult {
  success: boolean;
  totalFound: number;
  newRowsAdded: number;
  duplicatesSkipped: number;
  errors: string[];
  newItems: SaleItem[];
}

// Extract Sheet ID from varied Google Sheets URLs
export function extractSheetId(url: string): string {
  if (!url) return '';
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // If user pasted just the ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(url.trim())) {
    return url.trim();
  }
  return '';
}

// Generate fingerprint for sale deduplication
export function getSaleFingerprint(item: Pick<SaleItem, 'marketplace' | 'data' | 'produto' | 'venda' | 'taxa'>): string {
  const mkt = (item.marketplace || '').trim().toUpperCase();
  const date = (item.data || '').trim();
  const prod = (item.produto || '').trim().toLowerCase();
  const v = Number(item.venda || 0).toFixed(2);
  const t = Number(item.taxa || 0).toFixed(2);
  return `${mkt}|${date}|${prod}|${v}|${t}`;
}

// Synchronize from Google Sheets
export async function syncFromGoogleSheets(
  sheetUrl: string,
  existingSales: SaleItem[],
  sheetName: string = 'Vendas'
): Promise<SyncResult> {
  const sheetId = extractSheetId(sheetUrl);
  if (!sheetId) {
    return {
      success: false,
      totalFound: 0,
      newRowsAdded: 0,
      duplicatesSkipped: 0,
      errors: ['URL ou ID do Google Sheets inválido. Cole o link completo da sua planilha.'],
      newItems: [],
    };
  }

  // Construct CSV export URL from Google Sheets GViz endpoint
  const targetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${
    sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : ''
  }`;

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(
        `Não foi possível acessar a planilha (HTTP ${response.status}). Certifique-se de que a planilha está pública ou com acesso de leitura para 'Qualquer pessoa com o link'.`
      );
    }

    const csvText = await response.text();
    if (!csvText || csvText.includes('<!DOCTYPE html>') || csvText.includes('<html')) {
      throw new Error(
        'A planilha retornou uma página de login. Por favor, acesse o menu "Compartilhar" no Google Sheets e defina o acesso geral para "Qualquer pessoa com o link pode ler".'
      );
    }

    return parseGoogleSheetsCSV(csvText, existingSales);
  } catch (err: any) {
    // If CORS or network blocks direct client fetch, provide detailed informative error with workaround
    return {
      success: false,
      totalFound: 0,
      newRowsAdded: 0,
      duplicatesSkipped: 0,
      errors: [
        err.message || 'Erro ao sincronizar com Google Sheets.',
        'Dica: No Google Sheets, clique em "Arquivo" > "Compartilhar" > "Publicar na Web" e selecione "Valores separados por vírgula (.csv)".',
      ],
      newItems: [],
    };
  }
}

// Parse Google Sheets CSV string and deduplicate
export function parseGoogleSheetsCSV(csvText: string, existingSales: SaleItem[]): SyncResult {
  const lines = csvText.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return {
      success: false,
      totalFound: 0,
      newRowsAdded: 0,
      duplicatesSkipped: 0,
      errors: ['A planilha está vazia ou contém apenas cabeçalhos.'],
      newItems: [],
    };
  }

  // Split CSV line respecting quoted commas
  const parseCSVLine = (text: string): string[] => {
    const re = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
    const result: string[] = [];
    let match;
    while ((match = re.exec(text)) !== null) {
      result.push(match[1] || match[2] || match[3] || '');
    }
    return result;
  };

  const headers = parseCSVLine(lines[0]);
  const columnMap = headers.map((h) => detectColumnField(h));

  const existingFingerprints = new Set(existingSales.map(getSaleFingerprint));
  const newItems: SaleItem[] = [];
  let duplicatesSkipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length === 0 || row.every((c) => !c.trim())) continue;

    const rowDict: Partial<Record<keyof SaleItem, any>> = {};
    columnMap.forEach((field, colIdx) => {
      if (field) {
        rowDict[field] = row[colIdx];
      }
    });

    // Fallbacks
    if (!rowDict.marketplace && row[0]) rowDict.marketplace = row[0];
    if (!rowDict.data && row[1]) rowDict.data = row[1];
    if (!rowDict.produto && row[2]) rowDict.produto = row[2];
    if (!rowDict.material && row[3]) rowDict.material = row[3];
    if (rowDict.energia === undefined && row[4] !== undefined) rowDict.energia = row[4];
    if (rowDict.filamento === undefined && row[5] !== undefined) rowDict.filamento = row[5];
    if (rowDict.manutencao === undefined && row[6] !== undefined) rowDict.manutencao = row[6];
    if (rowDict.custo === undefined && row[7] !== undefined) rowDict.custo = row[7];
    if (rowDict.venda === undefined && row[8] !== undefined) rowDict.venda = row[8];
    if (rowDict.taxa === undefined && row[9] !== undefined) rowDict.taxa = row[9];
    if (rowDict.repasse === undefined && row[10] !== undefined) rowDict.repasse = row[10];
    if (rowDict.lucro === undefined && row[11] !== undefined) rowDict.lucro = row[11];
    if (rowDict.porcentagem === undefined && row[12] !== undefined) rowDict.porcentagem = row[12];

    const rawMarketplace = String(rowDict.marketplace || 'SHOPEE').trim().toUpperCase();
    const marketplace = rawMarketplace.includes('MERCADO') || rawMarketplace.includes('ML') ? 'MERCADO LIVRE' : 'SHOPEE';
    const isoDate = parseDateToISO(String(rowDict.data || ''));
    const produto = String(rowDict.produto || 'Produto sem nome').trim();
    const material = String(rowDict.material || 'PLA').trim().toUpperCase() || 'PLA';

    const energia = parseNumberValue(rowDict.energia);
    const filamento = parseNumberValue(rowDict.filamento);
    const manutencao = parseNumberValue(rowDict.manutencao);
    
    let custo = parseNumberValue(rowDict.custo);
    if (custo === 0 && (energia > 0 || filamento > 0 || manutencao > 0)) {
      custo = Number((energia + filamento + manutencao).toFixed(2));
    }

    const venda = parseNumberValue(rowDict.venda);
    const taxa = parseNumberValue(rowDict.taxa);

    let repasse = parseNumberValue(rowDict.repasse);
    if (repasse === 0 && venda > 0) {
      repasse = calculateRepasse(venda, taxa);
    }

    let lucro = parseNumberValue(rowDict.lucro);
    if (lucro === 0 && (repasse > 0 || custo > 0)) {
      lucro = calculateLucro(repasse, custo);
    }

    let porcentagem = parseNumberValue(rowDict.porcentagem);
    if (porcentagem === 0 && custo > 0) {
      porcentagem = calculatePorcentagem(lucro, custo);
    }

    const fingerprint = getSaleFingerprint({
      marketplace,
      data: isoDate,
      produto,
      venda,
      taxa,
    });

    if (existingFingerprints.has(fingerprint)) {
      duplicatesSkipped++;
    } else {
      existingFingerprints.add(fingerprint);
      newItems.push({
        id: `sheets-${Date.now().toString(36)}-${i}`,
        marketplace,
        data: isoDate,
        produto,
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
        source: 'sheets',
        createdAt: new Date().toISOString(),
      });
    }
  }

  return {
    success: true,
    totalFound: lines.length - 1,
    newRowsAdded: newItems.length,
    duplicatesSkipped,
    errors: [],
    newItems,
  };
}
