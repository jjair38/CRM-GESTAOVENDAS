'use client';

import Image from 'next/image';
import { useCRM } from '@/lib/store';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Store,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Settings,
  Plus,
  ArrowUpRight,
  Database,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export default function Sidebar({ mobileOpen = false, setMobileOpen }: SidebarProps) {
  const { activeTab, setActiveTab, openNewSaleModal, sales, user, logout } = useCRM();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vendas', label: 'Vendas', icon: ShoppingCart, badge: sales.length },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'marketplaces', label: 'Marketplaces', icon: Store },
    { id: 'importar', label: 'Importar Dados', icon: UploadCloud },
    { id: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          id="mobile-backdrop"
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-neutral-200 bg-white transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-neutral-100 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white shadow-xs">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-neutral-900">
                MarketCRM
              </span>
              <span className="ml-1.5 rounded-sm bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                3D Print
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="p-4">
          <button
            id="sidebar-new-sale-btn"
            onClick={() => {
              openNewSaleModal();
              if (setMobileOpen) setMobileOpen(false);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-neutral-800 active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Venda</span>
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-1">
          <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
            Navegação
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleSelectTab(item.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-100 font-semibold text-neutral-900'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-neutral-900' : 'text-neutral-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-medium text-neutral-700">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section Footer */}
        <div className="border-t border-neutral-100 p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 px-1">
              {user?.photoURL ? (
                <Image 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  width={32} 
                  height={32} 
                  className="h-8 w-8 rounded-full border border-neutral-200" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                  <UserIcon className="h-4 w-4" />
                </div>
              )}
              <div className="flex flex-1 flex-col overflow-hidden text-[11px]">
                <span className="truncate font-semibold text-neutral-900">{user?.displayName || 'Usuário'}</span>
                <span className="truncate text-neutral-500">{user?.email}</span>
              </div>
            </div>
            
            <button
              onClick={() => logout()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair do Sistema</span>
            </button>
          </div>
        </div>

        {/* Channel Status Quick Footer */}
        <div className="border-t border-neutral-100 p-4">
          <div className="rounded-lg border border-neutral-200/70 bg-neutral-50/50 p-3">
            <div className="text-[11px] font-medium text-neutral-500">Canais Ativos</div>
            <div className="mt-2 flex items-center justify-between text-xs font-medium text-neutral-700">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Shopee</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                <span>Mercado Livre</span>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-neutral-200/50 pt-2 text-[11px] text-neutral-500">
              <span>Status Sistema</span>
              <span className="font-medium text-emerald-600">Online</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
