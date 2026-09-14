'use client';

import React, { useState } from 'react';
import { CRMProvider, useCRM } from '@/lib/store';
import Sidebar from '@/components/Sidebar';
import FilterBar from '@/components/FilterBar';
import SaleModal from '@/components/SaleModal';
import ProductModal from '@/components/ProductModal';
import LoginScreen from '@/components/LoginScreen';
import DashboardView from '@/components/views/DashboardView';
import SalesView from '@/components/views/SalesView';
import ProductsView from '@/components/views/ProductsView';
import MarketplacesView from '@/components/views/MarketplacesView';
import ImportView from '@/components/views/ImportView';
import GoogleSheetsView from '@/components/views/GoogleSheetsView';
import ReportsView from '@/components/views/ReportsView';
import SettingsView from '@/components/views/SettingsView';
import { Menu, Plus, Bell, RefreshCw, Layers, Loader2 } from 'lucide-react';

function MainApp() {
  const { activeTab, openNewSaleModal, user, isLoadingAuth } = useCRM();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Dashboard Financeiro',
          subtitle: 'Visão geral automatizada das vendas em marketplaces',
        };
      case 'vendas':
        return {
          title: 'Tabela de Vendas',
          subtitle: 'Histórico de lançamentos, custos, taxas e margens',
        };
      case 'produtos':
        return {
          title: 'Controle por Produto',
          subtitle: 'Desempenho individual, margens unitárias e histórico',
        };
      case 'marketplaces':
        return {
          title: 'Controle por Marketplace',
          subtitle: 'Comparativo Shopee vs Mercado Livre em tempo real',
        };
      case 'importar':
        return {
          title: 'Importar Dados',
          subtitle: 'Carregamento de planilhas CSV e Excel com auto-detecção de colunas',
        };
      case 'sheets':
        return {
          title: 'Integração Google Sheets',
          subtitle: 'Sincronização contínua com prevenção de duplicidade',
        };
      case 'relatorios':
        return {
          title: 'Relatórios Mensais',
          subtitle: 'Demonstrativos contábeis e exportação em CSV, Excel e PDF',
        };
      case 'configuracoes':
        return {
          title: 'Configurações',
          subtitle: 'Custos padrão de máquina e gerenciamento de armazenamento',
        };
      default:
        return {
          title: 'Dashboard',
          subtitle: 'Gestão comercial e financeira',
        };
    }
  };

  const currentTabInfo = getTabTitle();

  return (
    <div className="min-h-screen bg-neutral-100/60 font-sans text-neutral-900 antialiased">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Top Navbar */}
        <header
          id="main-topbar"
          className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/95 px-5 backdrop-blur-xs print:hidden"
        >
          <div className="flex items-center gap-3">
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-1.5 text-neutral-600 hover:bg-neutral-100 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <h1 className="text-sm font-semibold tracking-tight text-neutral-900">
                {currentTabInfo.title}
              </h1>
              <p className="hidden text-[11px] text-neutral-500 sm:block">
                {currentTabInfo.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="topbar-new-sale-btn"
              onClick={openNewSaleModal}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-neutral-800 active:scale-[0.99]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nova Venda</span>
            </button>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Show global filter bar on analytical views */}
            {['dashboard', 'vendas', 'produtos', 'marketplaces', 'relatorios'].includes(
              activeTab
            ) && <FilterBar />}

            {/* Active view renderer */}
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'vendas' && <SalesView />}
            {activeTab === 'produtos' && <ProductsView />}
            {activeTab === 'marketplaces' && <MarketplacesView />}
            {activeTab === 'importar' && <ImportView />}
            {activeTab === 'sheets' && <GoogleSheetsView />}
            {activeTab === 'relatorios' && <ReportsView />}
            {activeTab === 'configuracoes' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Global Sale Modal (New / Edit) */}
      <SaleModal />
      <ProductModal />
    </div>
  );
}

export default function Page() {
  return (
    <CRMProvider>
      <MainApp />
    </CRMProvider>
  );
}
