import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Marketplace CRM & Dashboard Financeiro',
  description: 'Sistema minimalista de CRM e Dashboard Financeiro para controle de vendas em Shopee e Mercado Livre com importação e cálculo automático.',
  openGraph: {
    title: 'Marketplace CRM & Dashboard Financeiro',
    description: 'Sistema minimalista de CRM e Dashboard Financeiro para controle de vendas em Shopee e Mercado Livre com importação e cálculo automático.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marketplace CRM & Dashboard Financeiro',
    description: 'Sistema minimalista de CRM e Dashboard Financeiro para controle de vendas em Shopee e Mercado Livre com importação e cálculo automático.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
