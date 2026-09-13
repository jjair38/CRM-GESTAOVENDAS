'use client';

import React from 'react';
import { useCRM } from '@/lib/store';
import { LogIn, ShieldCheck, Database, Cloud } from 'lucide-react';

export default function LoginScreen() {
  const { login, isLoadingAuth } = useCRM();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 text-white">
            <Database className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-neutral-900">
            Marketplace CRM
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Gerencie suas vendas com persistência na nuvem
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 gap-4 text-xs text-neutral-600">
            <div className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
              <Cloud className="h-5 w-5 text-neutral-800" />
              <span>Dados sincronizados automaticamente entre dispositivos</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
              <ShieldCheck className="h-5 w-5 text-neutral-800" />
              <span>Sua alimentação protegida mesmo ao limpar o histórico</span>
            </div>
          </div>

          <button
            onClick={login}
            disabled={isLoadingAuth}
            className="group relative flex w-full justify-center rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <LogIn className="h-5 w-5 text-neutral-400 group-hover:text-neutral-300" />
            </span>
            {isLoadingAuth ? 'Carregando...' : 'Entrar com Google'}
          </button>
        </div>

        <div className="text-center text-[10px] text-neutral-400">
          Ao entrar, você concorda em armazenar seus dados comercialmente em nossa infraestrutura de nuvem segura.
        </div>
      </div>
    </div>
  );
}
