'use client';

import React, { useState, useMemo } from 'react';
import { useCRM } from '@/lib/store';
import { SaleItem, formatBRL, formatPercent, formatDateBR } from '@/lib/types';
import { exportSalesToCSV, exportSalesToExcel, parseSpreadsheetFile, downloadCSVTemplate } from '@/lib/spreadsheet';
import {
  Search,
  Plus,
  Download,
  Copy,
  Edit2,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react';

type SortColumn = 'data' | 'marketplace' | 'produto' | 'material' | 'custo' | 'venda' | 'taxa' | 'repasse' | 'lucro' | 'porcentagem';
type SortOrder = 'asc' | 'desc';

export default function SalesView() {
  const {
    filteredSales,
    deleteSale,
    duplicateSale,
    openEditSaleModal,
    openNewSaleModal,
    filters,
    setFilter,
    importSales,
  } = useCRM();

  const [sortColumn, setSortColumn] = useState<SortColumn>('data');
  const [isImporting, setIsImporting] = useState(false);

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const result = await parseSpreadsheetFile(file);
      if (result.allItems.length > 0) {
        const count = importSales(result.allItems);
        alert(`${count} vendas importadas/atualizadas com sucesso!`);
      } else {
        alert('Nenhuma venda válida encontrada no arquivo.');
      }
    } catch (err: any) {
      console.error('Import error:', err);
      alert('Erro ao importar arquivo: ' + (err.message || 'Verifique o formato do arquivo.'));
    } finally {
      setIsImporting(false);
      e.target.value = ''; // clear input
    }
  };
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sorting handler
  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortOrder('desc');
    }
  };

  const sortedSales = useMemo(() => {
    return [...filteredSales].sort((a, b) => {
      let valA: any = a[sortColumn];
      let valB: any = b[sortColumn];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredSales, sortColumn, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedSales.length / itemsPerPage) || 1;
  const paginatedSales = sortedSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedSales.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedSales.map((s) => s.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteSelected = () => {
    if (confirm(`Deseja realmente excluir ${selectedIds.size} venda(s)?`)) {
      selectedIds.forEach((id) => deleteSale(id));
      setSelectedIds(new Set());
    }
  };

  const renderSortIcon = (col: SortColumn) => {
    if (sortColumn !== col) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-neutral-300 group-hover:text-neutral-500" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3 text-neutral-900" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-neutral-900" />
    );
  };

  return (
    <div id="sales-view" className="space-y-4">
      {/* Header Actions & Search Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Pesquisar produto, marketplace, material..."
            value={filters.searchQuery}
            onChange={(e) => {
              setFilter('searchQuery', e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-9 text-xs text-neutral-800 placeholder-neutral-400 transition-colors focus:border-neutral-400 focus:outline-hidden"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Excluir ({selectedIds.size})</span>
            </button>
          )}

          <button
            id="export-csv-btn"
            onClick={() => exportSalesToCSV(filteredSales)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            title="Exportar para arquivo CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV</span>
          </button>

          <button
            id="export-excel-btn"
            onClick={() => exportSalesToExcel(filteredSales)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            title="Exportar para arquivo Excel .xlsx"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Excel</span>
          </button>

          <div className="h-6 w-px bg-neutral-200 mx-1 hidden sm:block" />

          <button
            onClick={() => downloadCSVTemplate()}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            title="Baixar modelo de CSV para importação"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Modelo</span>
          </button>

          <label className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer transition-colors">
            {isImporting ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            <span>Importar CSV</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleImportCSV}
              disabled={isImporting}
            />
          </label>

          <button
            id="new-sale-main-btn"
            onClick={openNewSaleModal}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-neutral-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova Venda</span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-50/80 text-[11px] font-medium text-neutral-600 uppercase tracking-wider">
              <tr>
                <th className="w-8 py-3 pl-4 pr-1">
                  <input
                    type="checkbox"
                    checked={paginatedSales.length > 0 && selectedIds.size === paginatedSales.length}
                    onChange={toggleSelectAll}
                    className="rounded-sm border-neutral-300 text-neutral-900"
                  />
                </th>
                <th className="py-3 px-3 text-left">ID</th>
                <th
                  onClick={() => handleSort('data')}
                  className="group cursor-pointer py-3 px-3 hover:text-neutral-900"
                >
                  <div className="flex items-center">
                    Data {renderSortIcon('data')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('marketplace')}
                  className="group cursor-pointer py-3 px-3 hover:text-neutral-900"
                >
                  <div className="flex items-center">
                    Marketplace {renderSortIcon('marketplace')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('produto')}
                  className="group cursor-pointer py-3 px-3 hover:text-neutral-900"
                >
                  <div className="flex items-center">
                    Produto {renderSortIcon('produto')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('material')}
                  className="group cursor-pointer py-3 px-3 hover:text-neutral-900"
                >
                  <div className="flex items-center">
                    Material {renderSortIcon('material')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('custo')}
                  className="group cursor-pointer py-3 px-3 text-right hover:text-neutral-900"
                >
                  <div className="flex items-center justify-end">
                    Custo {renderSortIcon('custo')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('venda')}
                  className="group cursor-pointer py-3 px-3 text-right hover:text-neutral-900"
                >
                  <div className="flex items-center justify-end">
                    Venda {renderSortIcon('venda')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('taxa')}
                  className="group cursor-pointer py-3 px-3 text-right hover:text-neutral-900"
                >
                  <div className="flex items-center justify-end">
                    Taxa {renderSortIcon('taxa')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('repasse')}
                  className="group cursor-pointer py-3 px-3 text-right hover:text-neutral-900"
                >
                  <div className="flex items-center justify-end">
                    Repasse {renderSortIcon('repasse')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('lucro')}
                  className="group cursor-pointer py-3 px-3 text-right hover:text-neutral-900"
                >
                  <div className="flex items-center justify-end">
                    Lucro {renderSortIcon('lucro')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('porcentagem')}
                  className="group cursor-pointer py-3 px-3 text-right hover:text-neutral-900"
                >
                  <div className="flex items-center justify-end">
                    % Margem {renderSortIcon('porcentagem')}
                  </div>
                </th>
                <th className="py-3 pr-4 pl-3 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-neutral-400">
                    Nenhuma venda encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedSales.map((sale) => {
                  // Subtle visual highlight rules
                  // Prejuízo: lucro < 0
                  // Lucro baixo: porcentagem < 20%
                  // Lucro positivo: normal/verde suave
                  const isPrejuizo = sale.lucro < 0;
                  const isLucroBaixo = sale.lucro >= 0 && sale.porcentagem < 30;

                  return (
                    <tr
                      key={sale.id}
                      className={`transition-colors hover:bg-neutral-50/80 ${
                        selectedIds.has(sale.id) ? 'bg-neutral-50' : ''
                      }`}
                    >
                      <td className="py-3 pl-4 pr-1">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(sale.id)}
                          onChange={() => toggleSelectOne(sale.id)}
                          className="rounded-sm border-neutral-300 text-neutral-900"
                        />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-[10px] text-neutral-400 font-mono max-w-[60px] truncate" title={sale.id}>
                        {sale.id}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-neutral-600 font-mono text-[11px]">
                        {formatDateBR(sale.data)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-semibold ${
                            sale.marketplace === 'SHOPEE'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                              : 'bg-yellow-50 text-yellow-900 border border-yellow-200/60'
                          }`}
                        >
                          {sale.marketplace}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate font-medium text-neutral-900" title={sale.produto}>
                        {sale.produto}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-[11px] text-neutral-600">
                        {sale.material}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap text-neutral-600">
                        {formatBRL(sale.custo)}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap font-medium text-neutral-900">
                        {formatBRL(sale.venda)}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap text-amber-700">
                        {formatBRL(sale.taxa)}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap font-medium text-neutral-800">
                        {formatBRL(sale.repasse)}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            isPrejuizo
                              ? 'text-red-600'
                              : isLucroBaixo
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {formatBRL(sale.lucro)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                            isPrejuizo
                              ? 'bg-red-50 text-red-700 border border-red-200/60'
                              : isLucroBaixo
                              ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                          }`}
                        >
                          {sale.porcentagem.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 pr-4 pl-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditSaleModal(sale)}
                            title="Editar venda"
                            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => duplicateSale(sale.id)}
                            title="Duplicar lançamento"
                            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Deseja excluir este lançamento de venda?')) {
                                deleteSale(sale.id);
                              }
                            }}
                            title="Excluir"
                            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Pagination & Counts */}
        <div className="flex flex-col gap-2 border-t border-neutral-200 bg-neutral-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between text-xs text-neutral-500">
          <div>
            Mostrando{' '}
            <span className="font-semibold text-neutral-800">
              {Math.min(filteredSales.length, (currentPage - 1) * itemsPerPage + 1)}
            </span>{' '}
            a{' '}
            <span className="font-semibold text-neutral-800">
              {Math.min(filteredSales.length, currentPage * itemsPerPage)}
            </span>{' '}
            de <span className="font-semibold text-neutral-800">{filteredSales.length}</span> registros
          </div>

          <div className="flex items-center gap-2">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded border border-neutral-200 bg-white py-1 px-2 text-xs text-neutral-700 focus:outline-hidden"
            >
              <option value={10}>10 por página</option>
              <option value={15}>15 por página</option>
              <option value={30}>30 por página</option>
              <option value={50}>50 por página</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded border border-neutral-200 bg-white px-2.5 py-1 text-neutral-700 disabled:opacity-40 hover:bg-neutral-50"
              >
                Anterior
              </button>
              <span className="px-2 text-neutral-700 font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded border border-neutral-200 bg-white px-2.5 py-1 text-neutral-700 disabled:opacity-40 hover:bg-neutral-50"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
