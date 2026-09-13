'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Settings, RotateCcw, Trash2, Database, Check, Shield } from 'lucide-react';

export default function SettingsView() {
  const { sales, resetDemoData, clearAllSales } = useCRM();
  const [hourlyRate, setHourlyRate] = useState('0,84');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveRate = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div id="settings-view" className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900">
          Configurações do Sistema
        </h2>
        <p className="text-xs text-neutral-500">
          Parâmetros de custos padrão e gerenciamento de armazenamento local
        </p>
      </div>

      {/* Machine & Production Rate Configuration */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">
          Taxas & Custos Operacionais Padrão (Impressão 3D)
        </h3>

        <div className="max-w-md space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">
              Taxa de Manutenção por Hora de Impressão (R$/h)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">R$</span>
              <input
                type="text"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-32 rounded-lg border border-neutral-200 py-1.5 px-3 text-xs text-neutral-800 focus:border-neutral-400 focus:outline-hidden"
              />
              <button
                onClick={handleSaveRate}
                className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
              >
                {savedSuccess ? 'Salvo!' : 'Salvar'}
              </button>
            </div>
            <span className="mt-1 block text-[11px] text-neutral-400">
              Valor padrão utilizado nas planilhas: <strong>R$ 0,84 por hora de impressão</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* Local Storage & Data Management */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">
          Gerenciamento de Dados Locais
        </h3>

        <div className="space-y-4 max-w-xl">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <div className="text-xs font-medium text-neutral-900">
                Total de Registros Armazenados
              </div>
              <div className="text-[11px] text-neutral-500">
                {sales.length} vendas gravadas localmente no navegador
              </div>
            </div>
            <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-mono font-semibold text-neutral-700">
              {sales.length} itens
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <div className="text-xs font-medium text-neutral-900">
                Restaurar Dados Demonstrativos
              </div>
              <div className="text-[11px] text-neutral-500">
                Recarrega as vendas de exemplo para Shopee e Mercado Livre
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('Deseja restaurar as vendas de demonstração?')) {
                  resetDemoData();
                }
              }}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restaurar Demo</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-xs font-medium text-red-600">
                Limpar Todos os Registros
              </div>
              <div className="text-[11px] text-neutral-500">
                Remove todas as vendas da base de dados local
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('Atenção: deseja realmente apagar todas as vendas cadastradas?')) {
                  clearAllSales();
                }
              }}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Limpar Base</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
