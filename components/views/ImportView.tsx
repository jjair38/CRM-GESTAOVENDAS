'use client';

import React, { useState, useRef } from 'react';
import { useCRM } from '@/lib/store';
import {
  parseSpreadsheetFile,
  downloadCSVTemplate,
  ImportPreviewResult,
} from '@/lib/spreadsheet';
import { formatBRL, formatDateBR } from '@/lib/types';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export default function ImportView() {
  const { importSales, setActiveTab } = useCRM();

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewResult | null>(null);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      setErrorMessage('Por favor, selecione um arquivo válido no formato CSV ou Excel (.xlsx).');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSelectedFileName(file.name);
    setImportSuccessCount(null);

    try {
      const result = await parseSpreadsheetFile(file);
      setPreviewData(result);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Erro ao processar o arquivo. Verifique se o formato está correto.');
      setPreviewData(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!previewData || previewData.allItems.length === 0) return;
    const count = importSales(previewData.allItems);
    setImportSuccessCount(count);
    setPreviewData(null);
    setSelectedFileName(null);
  };

  const resetImport = () => {
    setPreviewData(null);
    setSelectedFileName(null);
    setImportSuccessCount(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div id="import-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">
            Importar Dados de Planilha
          </h2>
          <p className="text-xs text-neutral-500">
            Carregue sua planilha CSV ou Excel (XLSX). O sistema reconhece colunas automaticamente, mesmo fora de ordem.
          </p>
        </div>

        <button
          id="download-csv-template-btn"
          onClick={downloadCSVTemplate}
          className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-700 shadow-xs transition-colors hover:bg-neutral-50"
        >
          <Download className="h-4 w-4 text-neutral-500" />
          <span>Baixar Modelo CSV</span>
        </button>
      </div>

      {/* Success Notification */}
      {importSuccessCount !== null && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-emerald-950">
                  Importação concluída com sucesso!
                </h4>
                <p className="mt-1 text-xs text-emerald-800">
                  {importSuccessCount} novos registros foram adicionados ao seu CRM e o dashboard já foi recalculado.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('vendas')}
                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
              >
                Ver em Vendas
              </button>
              <button
                onClick={resetImport}
                className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
              >
                Nova Importação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-red-800">
            <XCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Upload Drop Zone */}
      {!previewData && (
        <div
          id="dropzone-container"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-neutral-900 bg-neutral-50'
              : 'border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50/50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden"
          />

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700 mb-4">
            {isProcessing ? (
              <RefreshCw className="h-6 w-6 animate-spin text-neutral-900" />
            ) : (
              <UploadCloud className="h-7 w-7 text-neutral-800" />
            )}
          </div>

          <h3 className="text-sm font-semibold text-neutral-900">
            {isProcessing
              ? 'Analisando colunas e dados...'
              : 'Arraste e solte sua planilha aqui, ou clique para selecionar'}
          </h3>
          <p className="mt-1 text-xs text-neutral-500 max-w-md">
            Formatos suportados: <strong>CSV (.csv)</strong> e <strong>Excel (.xlsx)</strong>. Reconhecimento automático independente da ordem das colunas.
          </p>

          <div className="mt-4 flex items-center gap-2 text-[11px] text-neutral-400">
            <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono">SHOPEE / MERCADO LIVRE</span>
            <span>•</span>
            <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono">PLA / PETG / PET-G</span>
          </div>
        </div>
      )}

      {/* PREVIEW OF SPREADSHEET BEFORE CONFIRMING */}
      {previewData && (
        <div className="space-y-5">
          {/* File summary bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-neutral-900">
                  {selectedFileName}
                </div>
                <div className="text-[11px] text-neutral-500">
                  {previewData.totalRows} linhas encontradas • {previewData.identifiedColumns.filter((c) => c.mappedField).length} colunas mapeadas
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetImport}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
              >
                Cancelar
              </button>
              <button
                id="confirm-import-btn"
                onClick={handleConfirmImport}
                className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 shadow-xs active:scale-[0.99]"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirmar Importação ({previewData.allItems.length} vendas)</span>
              </button>
            </div>
          </div>

          {/* Status / Warnings Banner */}
          {previewData.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Avisos na Leitura da Planilha:</span>
              </div>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-amber-800">
                {previewData.warnings.slice(0, 3).map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Identified Columns Mapping Table */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
              Mapeamento de Colunas Identificadas
            </h4>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {previewData.identifiedColumns.map((col, idx) => {
                const isMapped = !!col.mappedField;
                return (
                  <div
                    key={idx}
                    className={`rounded-lg border p-2.5 text-xs ${
                      isMapped
                        ? 'border-neutral-200 bg-neutral-50/70'
                        : 'border-dashed border-neutral-200 bg-neutral-50/20 text-neutral-400'
                    }`}
                  >
                    <div className="text-[10px] uppercase text-neutral-400 truncate" title={col.originalHeader}>
                      Cabeçalho Original: <strong>{col.originalHeader || `Coluna ${idx + 1}`}</strong>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[11px] text-neutral-400">&rarr;</span>
                      <span
                        className={`font-semibold ${
                          isMapped ? 'text-neutral-900' : 'text-neutral-400 italic'
                        }`}
                      >
                        {col.mappedField ? col.mappedField.toUpperCase() : 'Não identificado'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sample Data Preview Table */}
          <div className="rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
              <h4 className="text-xs font-semibold text-neutral-900">
                Prévia dos Registros (Primeiras 5 linhas)
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50/50 text-[10px] font-medium uppercase text-neutral-500">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Marketplace</th>
                    <th className="py-2.5 px-3">Produto</th>
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
                  {previewData.sampleItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-mono text-[11px]">{formatDateBR(item.data)}</td>
                      <td className="py-2 px-3 font-medium">{item.marketplace}</td>
                      <td className="py-2 px-3 truncate max-w-xs">{item.produto}</td>
                      <td className="py-2 px-3">{item.material}</td>
                      <td className="py-2 px-3 text-right">{formatBRL(item.custo)}</td>
                      <td className="py-2 px-3 text-right font-medium">{formatBRL(item.venda)}</td>
                      <td className="py-2 px-3 text-right text-amber-700">{formatBRL(item.taxa)}</td>
                      <td className="py-2 px-3 text-right">{formatBRL(item.repasse)}</td>
                      <td className="py-2 px-3 text-right font-semibold text-emerald-600">
                        {formatBRL(item.lucro)}
                      </td>
                      <td className="py-2 px-3 text-right">{item.porcentagem.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
