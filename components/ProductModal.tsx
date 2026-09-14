'use client';

import React, { useState, useEffect } from 'react';
import { useCRM } from '@/lib/store';
import { X, Save, Trash2, Package } from 'lucide-react';
import { Product } from '@/lib/types';

export default function ProductModal() {
  const { isProductModalOpen, closeProductModal, addProduct, updateProduct, deleteProduct, editingProduct } = useCRM();

  const [formData, setFormData] = useState<Omit<Product, 'id' | 'createdAt'>>({
    nome: '',
    material: 'PLA',
    energia: 0,
    filamento: 0,
    manutencao: 0,
    custoTotal: 0,
    precoSugerido: 0,
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        nome: editingProduct.nome,
        material: editingProduct.material,
        energia: editingProduct.energia,
        filamento: editingProduct.filamento,
        manutencao: editingProduct.manutencao,
        custoTotal: editingProduct.custoTotal,
        precoSugerido: editingProduct.precoSugerido || 0,
      });
    } else {
      setFormData({
        nome: '',
        material: 'PLA',
        energia: 0,
        filamento: 0,
        manutencao: 0,
        custoTotal: 0,
        precoSugerido: 0,
      });
    }
  }, [editingProduct, isProductModalOpen]);

  useEffect(() => {
    const total = Number(formData.energia) + Number(formData.filamento) + Number(formData.manutencao);
    setFormData(prev => ({ ...prev, custoTotal: Number(total.toFixed(2)) }));
  }, [formData.energia, formData.filamento, formData.manutencao]);

  if (!isProductModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      addProduct(formData);
    }
    closeProductModal();
  };

  const handleDelete = () => {
    if (editingProduct && confirm('Deseja excluir este produto do catálogo?')) {
      deleteProduct(editingProduct.id);
      closeProductModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <p className="text-xs text-neutral-500">Cadastre o custo base do seu produto</p>
            </div>
          </div>
          <button
            onClick={closeProductModal}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
                Nome do Produto
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Vaso Decorativo"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm focus:border-neutral-900 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
                  Material Base
                </label>
                <select
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm focus:border-neutral-900 focus:bg-white focus:outline-none transition-all"
                >
                  <option value="PLA">PLA</option>
                  <option value="PETG">PETG</option>
                  <option value="ABS">ABS</option>
                  <option value="Resina">Resina</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
                  Preço Sugerido (Venda)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precoSugerido || ''}
                    onChange={(e) => setFormData({ ...formData, precoSugerido: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-4 py-2.5 text-sm focus:border-neutral-900 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-100 bg-neutral-50/50 p-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">Composição de Custos</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-medium text-neutral-500 mb-1">Energia</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.energia || ''}
                    onChange={(e) => setFormData({ ...formData, energia: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-neutral-500 mb-1">Filamento</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.filamento || ''}
                    onChange={(e) => setFormData({ ...formData, filamento: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-neutral-500 mb-1">Manut.</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.manutencao || ''}
                    onChange={(e) => setFormData({ ...formData, manutencao: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs focus:border-neutral-900 focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                <span className="text-xs font-medium text-neutral-600">Custo Total de Produção:</span>
                <span className="text-sm font-bold text-neutral-900">R$ {formData.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {editingProduct && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition-all active:scale-95 shadow-lg shadow-neutral-200"
            >
              <Save className="h-4 w-4" />
              {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
