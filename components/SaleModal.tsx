'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { SaleItem, calculateRepasse, calculateLucro, calculatePorcentagem, formatBRL } from '@/lib/types';
import { X, Check, Calculator } from 'lucide-react';

interface SaleFormContentProps {
  editingSale: SaleItem | null;
  onClose: () => void;
  onSave: (data: Omit<SaleItem, 'id' | 'createdAt'>) => void;
  allProductNames: string[];
}

function SaleFormContent({ editingSale, onClose, onSave, allProductNames }: SaleFormContentProps) {
  const { products } = useCRM();

  const [marketplace, setMarketplace] = useState<'SHOPEE' | 'MERCADO LIVRE'>(() => {
    if (editingSale?.marketplace) {
      return editingSale.marketplace.includes('MERCADO') ? 'MERCADO LIVRE' : 'SHOPEE';
    }
    return 'SHOPEE';
  });

  const [data, setData] = useState<string>(() => editingSale?.data || new Date().toISOString().split('T')[0]);
  const [produto, setProduto] = useState<string>(() => editingSale?.produto || '');
  const [material, setMaterial] = useState<string>(() => editingSale?.material || 'PLA');
  const [energia, setEnergia] = useState<string>(() => String(editingSale?.energia ?? ''));
  const [filamento, setFilamento] = useState<string>(() => String(editingSale?.filamento ?? ''));
  const [manutencao, setManutencao] = useState<string>(() => String(editingSale?.manutencao ?? ''));
  const [custo, setCusto] = useState<string>(() => String(editingSale?.custo ?? ''));
  const [venda, setVenda] = useState<string>(() => String(editingSale?.venda ?? ''));
  const [taxa, setTaxa] = useState<string>(() => String(editingSale?.taxa ?? ''));

  // Auto-fill from catalog
  const handleProductChange = (val: string) => {
    setProduto(val);
    const catalogProd = products.find(p => p.nome === val);
    if (catalogProd) {
      setMaterial(catalogProd.material);
      setEnergia(String(catalogProd.energia));
      setFilamento(String(catalogProd.filamento));
      setManutencao(String(catalogProd.manutencao));
      setCusto(String(catalogProd.custoTotal));
      if (catalogProd.precoSugerido && !editingSale) {
        setVenda(String(catalogProd.precoSugerido));
      }
    }
  };

  const handleCostPartChange = (field: 'energia' | 'filamento' | 'manutencao', val: string) => {
    const e = field === 'energia' ? parseFloat(val) || 0 : parseFloat(energia) || 0;
    const f = field === 'filamento' ? parseFloat(val) || 0 : parseFloat(filamento) || 0;
    const m = field === 'manutencao' ? parseFloat(val) || 0 : parseFloat(manutencao) || 0;

    if (field === 'energia') setEnergia(val);
    if (field === 'filamento') setFilamento(val);
    if (field === 'manutencao') setManutencao(val);

    const sum = Number((e + f + m).toFixed(2));
    setCusto(String(sum));
  };

  const numVenda = parseFloat(venda) || 0;
  const numTaxa = parseFloat(taxa) || 0;
  const numCusto = parseFloat(custo) || 0;

  const repasseCalc = calculateRepasse(numVenda, numTaxa);
  const lucroCalc = calculateLucro(repasseCalc, numCusto);
  const porcentagemCalc = calculatePorcentagem(lucroCalc, numCusto);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produto.trim()) {
      alert('Por favor, informe o nome do produto.');
      return;
    }

    onSave({
      marketplace,
      data: data || new Date().toISOString().split('T')[0],
      produto: produto.trim(),
      material: material.trim().toUpperCase() || 'PLA',
      energia: parseFloat(energia) || 0,
      filamento: parseFloat(filamento) || 0,
      manutencao: parseFloat(manutencao) || 0,
      custo: numCusto,
      venda: numVenda,
      taxa: numTaxa,
      repasse: repasseCalc,
      lucro: lucroCalc,
      porcentagem: porcentagemCalc,
      source: 'manual',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
      {/* Marketplace & Data */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block font-medium text-neutral-700">Marketplace</label>
          <select
            value={marketplace}
            onChange={(e) => setMarketplace(e.target.value as 'SHOPEE' | 'MERCADO LIVRE')}
            className="w-full rounded-lg border border-neutral-200 py-1.5 px-2.5 text-neutral-800 focus:border-neutral-400 focus:outline-hidden"
          >
            <option value="SHOPEE">SHOPEE</option>
            <option value="MERCADO LIVRE">MERCADO LIVRE</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block font-medium text-neutral-700">Data da Venda</label>
          <input
            type="date"
            required
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 py-1.5 px-2.5 text-neutral-800 focus:border-neutral-400 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Produto & Material */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="mb-1 block font-medium text-neutral-700">Nome do Produto</label>
          <input
            type="text"
            required
            list="product-suggestions"
            placeholder="Ex: 20x Porta Bombom Pomo de Ouro 3D"
            value={produto}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 py-1.5 px-2.5 text-neutral-800 placeholder-neutral-400 focus:border-neutral-400 focus:outline-hidden"
          />
          <datalist id="product-suggestions">
            {products.map((p) => (
              <option key={p.id} value={p.nome} />
            ))}
            {allProductNames.filter(name => !products.some(p => p.nome === name)).map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="mb-1 block font-medium text-neutral-700">Material</label>
          <select
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 py-1.5 px-2.5 text-neutral-800 focus:border-neutral-400 focus:outline-hidden"
          >
            <option value="PLA">PLA</option>
            <option value="PETG">PETG</option>
            <option value="PET-G">PET-G</option>
            <option value="ABS">ABS</option>
            <option value="Outros">Outros</option>
          </select>
        </div>
      </div>

      {/* Custos Unitários Breakdown */}
      <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-neutral-800">Composição do Custo de Fabricação</span>
          <span className="text-[10px] text-neutral-400">Soma automática no custo</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-neutral-600">Energia (R$)</label>
            <input
              type="number"
              step="0.01"
              value={energia}
              onChange={(e) => handleCostPartChange('energia', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white py-1.5 px-2.5 text-neutral-800 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="mb-1 block text-neutral-600">Filamento (R$)</label>
            <input
              type="number"
              step="0.01"
              value={filamento}
              onChange={(e) => handleCostPartChange('filamento', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white py-1.5 px-2.5 text-neutral-800 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="mb-1 block text-neutral-600">Manutenção (R$)</label>
            <input
              type="number"
              step="0.01"
              value={manutencao}
              onChange={(e) => handleCostPartChange('manutencao', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white py-1.5 px-2.5 text-neutral-800 focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block font-semibold text-neutral-800">Custo Total (R$)</label>
          <input
            type="number"
            step="0.01"
            required
            value={custo}
            onChange={(e) => setCusto(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white py-1.5 px-2.5 font-medium text-neutral-900 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Venda & Taxa */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block font-medium text-neutral-700">Preço de Venda (R$)</label>
          <input
            type="number"
            step="0.01"
            required
            value={venda}
            onChange={(e) => setVenda(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 py-1.5 px-2.5 text-neutral-800 focus:border-neutral-400 focus:outline-hidden font-medium"
          />
        </div>

        <div>
          <label className="mb-1 block font-medium text-neutral-700">Taxa Marketplace (R$)</label>
          <input
            type="number"
            step="0.01"
            required
            value={taxa}
            onChange={(e) => setTaxa(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 py-1.5 px-2.5 text-neutral-800 focus:border-neutral-400 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Automatic Calculations Box */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
        <div className="flex items-center gap-1.5 font-semibold text-emerald-950 mb-2">
          <Calculator className="h-4 w-4 text-emerald-700" />
          <span>Cálculos Automáticos</span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-white p-2.5 border border-emerald-100 shadow-2xs">
            <span className="text-[10px] uppercase text-neutral-400">Repasse (Venda - Taxa)</span>
            <div className="text-sm font-bold text-neutral-900 mt-0.5">
              {formatBRL(repasseCalc)}
            </div>
          </div>

          <div className="rounded-lg bg-white p-2.5 border border-emerald-100 shadow-2xs">
            <span className="text-[10px] uppercase text-neutral-400">Lucro (Repasse - Custo)</span>
            <div
              className={`text-sm font-bold mt-0.5 ${
                lucroCalc < 0 ? 'text-red-600' : 'text-emerald-600'
              }`}
            >
              {formatBRL(lucroCalc)}
            </div>
          </div>

          <div className="rounded-lg bg-white p-2.5 border border-emerald-100 shadow-2xs">
            <span className="text-[10px] uppercase text-neutral-400">% Margem (Lucro/Custo)</span>
            <div className="text-sm font-bold text-neutral-900 mt-0.5">
              {porcentagemCalc.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 active:scale-[0.99]"
        >
          <Check className="h-4 w-4" />
          <span>{editingSale ? 'Salvar Alterações' : 'Cadastrar Venda'}</span>
        </button>
      </div>
    </form>
  );
}

export default function SaleModal() {
  const { isSaleModalOpen, closeSaleModal, editingSale, addSale, updateSale, allProductNames } = useCRM();

  if (!isSaleModalOpen) return null;

  const handleSave = (data: Omit<SaleItem, 'id' | 'createdAt'>) => {
    if (editingSale) {
      updateSale(editingSale.id, data);
    } else {
      addSale(data);
    }
    closeSaleModal();
  };

  return (
    <div
      id="sale-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
    >
      <div className="flex max-h-[95vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 p-5">
          <div>
            <h3 className="text-base font-semibold text-neutral-900">
              {editingSale ? 'Editar Venda' : 'Cadastrar Nova Venda'}
            </h3>
            <p className="text-xs text-neutral-500">
              Preencha os dados da venda. Repasse, Lucro e Margem são calculados automaticamente.
            </p>
          </div>
          <button
            onClick={closeSaleModal}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <SaleFormContent
          key={editingSale?.id ?? 'new-sale'}
          editingSale={editingSale}
          onClose={closeSaleModal}
          onSave={handleSave}
          allProductNames={allProductNames}
        />
      </div>
    </div>
  );
}
