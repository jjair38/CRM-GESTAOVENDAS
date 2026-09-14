'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  SaleItem,
  FilterState,
  PeriodFilter,
  ProductSummary,
  MarketplaceSummary,
  MonthSummary,
  InsightItem,
  Product,
  calculateRepasse,
  calculateLucro,
  calculatePorcentagem,
} from './types';
import { generateInitialSales } from './sampleData';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged, 
  browserPopupRedirectResolver,
  collection, 
  doc, 
  getDoc,
  setDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot,
  User,
  writeBatch,
  getDocFromServer
} from './firebase';

interface CRMContextType {
  sales: SaleItem[];
  products: Product[];
  filters: FilterState;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  
  // Auth
  user: User | null;
  isLoadingAuth: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;

  // Modals & Drawers
  isSaleModalOpen: boolean;
  editingSale: SaleItem | null;
  openNewSaleModal: () => void;
  openEditSaleModal: (sale: SaleItem) => void;
  closeSaleModal: () => void;

  isProductModalOpen: boolean;
  editingProduct: Product | null;
  openNewProductModal: () => void;
  openEditProductModal: (product: Product) => void;
  closeProductModal: () => void;

  selectedProductForDetail: string | null;
  setSelectedProductForDetail: (productName: string | null) => void;

  // Actions
  addSale: (sale: Omit<SaleItem, 'id' | 'createdAt'>) => void;
  updateSale: (id: string, sale: Partial<SaleItem>) => void;
  deleteSale: (id: string) => void;
  deleteSalesBatch: (ids: string[]) => Promise<void>;
  duplicateSale: (id: string) => void;
  importSales: (newSales: SaleItem[]) => number;
  clearAllSales: () => void;
  clearAllProducts: () => void;
  resetDemoData: () => void;

  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Computed data
  filteredSales: SaleItem[];
  kpis: {
    faturamento: number;
    repasse: number;
    custos: number;
    taxas: number;
    lucro: number;
    margemMedia: number;
    totalVendas: number;
    ticketMedio: number;
    custoEnergia: number;
    custoFilamento: number;
    custoManutencao: number;
  };
  productSummaries: ProductSummary[];
  marketplaceSummaries: MarketplaceSummary[];
  monthlySummaries: MonthSummary[];
  insights: InsightItem[];
  allProductNames: string[];
  allMaterials: string[];
  catalogProducts: Product[];
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const STORAGE_KEY = 'marketplace_crm_sales_v1';
const PRODUCTS_STORAGE_KEY = 'marketplace_crm_products_v1';

const defaultFilters: FilterState = {
  period: 'todos',
  customStartDate: '',
  customEndDate: '',
  marketplace: 'TODOS',
  material: 'TODOS',
  produto: 'TODOS',
  searchQuery: '',
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleItem | null>(null);
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [selectedProductForDetail, setSelectedProductForDetail] = useState<string | null>(null);

  // Auth Listener
  useEffect(() => {
    // Verificar resultado de redirecionamento (caso o popup tenha falhado e tentamos redirect)
    getRedirectResult(auth).catch((error) => {
      console.error('Error getting redirect result:', error);
    });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync Data with Firestore
  useEffect(() => {
    if (isLoadingAuth) return;

    let isMounted = true;

    // Test Connection (Critical Constraint)
    const testConnection = async () => {
      if (user) {
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (error) {
          if (error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration.");
          }
        }
      }
    };
    testConnection();

    if (user) {
      // User is logged in, fetch from Firestore
      const salesRef = collection(db, 'users', user.uid, 'sales');
      const productsRef = collection(db, 'users', user.uid, 'products');
      
      const qSales = query(salesRef, orderBy('createdAt', 'desc'));
      const qProducts = query(productsRef, orderBy('createdAt', 'desc'));
      
      const unsubscribeSales = onSnapshot(qSales, (snapshot) => {
        if (!isMounted) return;
        const fetchedSales: SaleItem[] = [];
        snapshot.forEach((doc) => {
          fetchedSales.push({ ...doc.data(), id: doc.id } as SaleItem);
        });
        setSales(fetchedSales);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user?.uid}/sales`);
      });

      const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
        if (!isMounted) return;
        const fetchedProducts: Product[] = [];
        snapshot.forEach((doc) => {
          fetchedProducts.push({ ...doc.data(), id: doc.id } as Product);
        });
        setProducts(fetchedProducts);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user?.uid}/products`);
      });

      return () => {
        isMounted = false;
        unsubscribeSales();
        unsubscribeProducts();
      };
    } else {
      // User is NOT logged in, use LocalStorage
      const storedSales = localStorage.getItem(STORAGE_KEY);
      const storedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      
      if (storedSales) {
        try {
          const parsed = JSON.parse(storedSales);
          if (Array.isArray(parsed)) {
            setTimeout(() => {
              if (isMounted) setSales(parsed);
            }, 0);
          }
        } catch (e) { console.warn('Failed to parse sales'); }
      } else {
        // Start empty
        setTimeout(() => {
          if (isMounted) setSales([]);
        }, 0);
      }
      
      if (storedProducts) {
        try {
          const parsed = JSON.parse(storedProducts);
          if (Array.isArray(parsed)) {
            setTimeout(() => {
              if (isMounted) setProducts(parsed);
            }, 0);
          }
        } catch (e) { console.warn('Failed to parse products'); }
      } else {
        setTimeout(() => {
          if (isMounted) setProducts([]);
        }, 0);
      }

      return () => { isMounted = false; };
    }
  }, [user, isLoadingAuth]);

  // Save to LocalStorage ONLY if not logged in
  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
    }
  }, [sales, products, user]);

  const login = async () => {
    try {
      setIsLoadingAuth(true);
      // Tentamos o Popup primeiro com o Resolver
      await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    } catch (error: any) {
      console.error('Error signing in with popup:', error);
      
      // Se o popup fechar imediatamente ou for bloqueado, tentamos o Redirect como fallback automático
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        console.log('Popup failed, trying redirect...');
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError) {
          console.error('Error signing in with redirect:', redirectError);
          alert('Erro ao tentar login via redirecionamento. Verifique suas configurações de cookies.');
        }
      } else if (error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        alert(`Este domínio (${domain}) não está autorizado no seu projeto Firebase.\n\nPara corrigir:\n1. Acesse o Console do Firebase\n2. Vá em Autenticação > Configurações > Domínios Autorizados\n3. Adicione o domínio: ${domain}`);
      } else {
        alert('Erro ao fazer login: ' + (error.message || 'Erro desconhecido'));
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setSales(generateInitialSales());
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const setFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const openNewSaleModal = () => {
    setEditingSale(null);
    setIsSaleModalOpen(true);
  };

  const openEditSaleModal = (sale: SaleItem) => {
    setEditingSale(sale);
    setIsSaleModalOpen(true);
  };

  const closeSaleModal = () => {
    setIsSaleModalOpen(false);
    setEditingSale(null);
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const addSale = async (saleData: Omit<SaleItem, 'id' | 'createdAt'>) => {
    const repasse = calculateRepasse(saleData.venda, saleData.taxa);
    const lucro = calculateLucro(repasse, saleData.custo);
    const porcentagem = calculatePorcentagem(lucro, saleData.custo);

    const id = `sale-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newSale: SaleItem = {
      ...saleData,
      id,
      repasse,
      lucro,
      porcentagem,
      source: saleData.source || 'manual',
      createdAt: new Date().toISOString(),
    };

    if (user) {
      const path = `users/${user.uid}/sales/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'sales', id), newSale);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    } else {
      setSales((prev) => [newSale, ...prev]);
    }
  };

  const updateSale = async (id: string, updatedFields: Partial<SaleItem>) => {
    const item = sales.find(s => s.id === id);
    if (!item) return;

    const merged = { ...item, ...updatedFields };
    const repasse = calculateRepasse(merged.venda, merged.taxa);
    const lucro = calculateLucro(repasse, merged.custo);
    const porcentagem = calculatePorcentagem(lucro, merged.custo);
    
    const updatedSale = {
      ...merged,
      repasse,
      lucro,
      porcentagem,
    };

    if (user) {
      const path = `users/${user.uid}/sales/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'sales', id), updatedSale);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    } else {
      setSales((prev) => prev.map((s) => (s.id === id ? updatedSale : s)));
    }
  };

  const deleteSale = async (id: string) => {
    if (user) {
      const path = `users/${user.uid}/sales/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'sales', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, path);
      }
    } else {
      setSales((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const deleteSalesBatch = async (ids: string[]) => {
    if (ids.length === 0) return;
    
    if (user) {
      const path = `users/${user.uid}/sales`;
      try {
        const chunks = [];
        for (let i = 0; i < ids.length; i += 500) {
          chunks.push(ids.slice(i, i + 500));
        }

        for (const chunk of chunks) {
          const batch = writeBatch(db);
          chunk.forEach(id => {
            batch.delete(doc(db, 'users', user.uid, 'sales', id));
          });
          await batch.commit();
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, path);
      }
    } else {
      setSales((prev) => prev.filter((item) => !ids.includes(item.id)));
    }
  };

  const duplicateSale = async (id: string) => {
    const original = sales.find((s) => s.id === id);
    if (!original) return;
    
    const newId = `sale-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const duplicated: SaleItem = {
      ...original,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    if (user) {
      const path = `users/${user.uid}/sales/${newId}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'sales', newId), duplicated);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    } else {
      setSales((prev) => [duplicated, ...prev]);
    }
  };

  const importSales = (newSales: SaleItem[]) => {
    if (user) {
      const batch = writeBatch(db);
      newSales.forEach((sale) => {
        const id = sale.id || `sale-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        const saleWithId = { ...sale, id, createdAt: sale.createdAt || new Date().toISOString() };
        const docRef = doc(db, 'users', user.uid, 'sales', id);
        batch.set(docRef, saleWithId); // set with merge or just set? Batch set is fine for upsert if we want to overwrite
      });
      batch.commit().catch(e => console.error('Error batch importing:', e));
    } else {
      setSales((prev) => {
        const updatedSales = [...prev];
        newSales.forEach(newSale => {
          const index = updatedSales.findIndex(s => s.id === newSale.id);
          if (index !== -1) {
            updatedSales[index] = { ...updatedSales[index], ...newSale };
          } else {
            updatedSales.unshift({ ...newSale, createdAt: newSale.createdAt || new Date().toISOString() });
          }
        });
        return updatedSales;
      });
    }
    return newSales.length;
  };

  const clearAllSales = async () => {
    if (sales.length === 0) return;
    await deleteSalesBatch(sales.map(s => s.id));
  };

  const clearAllProducts = async () => {
    if (products.length === 0) return;
    
    if (user) {
      try {
        const chunks = [];
        for (let i = 0; i < products.length; i += 500) {
          chunks.push(products.slice(i, i + 500));
        }

        for (const chunk of chunks) {
          const batch = writeBatch(db);
          chunk.forEach(p => {
            batch.delete(doc(db, 'users', user.uid, 'products', p.id));
          });
          await batch.commit();
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/products`);
      }
    } else {
      setProducts([]);
    }
  };

  const resetDemoData = async () => {
    const initial = generateInitialSales();
    if (user) {
      const batch = writeBatch(db);
      initial.forEach(s => {
        batch.set(doc(db, 'users', user.uid, 'sales', s.id), s);
      });
      await batch.commit();
    } else {
      setSales(initial);
    }
  };

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
    const id = `prod-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newProduct: Product = {
      ...productData,
      id,
      createdAt: new Date().toISOString(),
    };

    if (user) {
      const path = `users/${user.uid}/products/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'products', id), newProduct);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    } else {
      setProducts((prev) => [newProduct, ...prev]);
    }
  };

  const updateProduct = async (id: string, updatedFields: Partial<Product>) => {
    const item = products.find(p => p.id === id);
    if (!item) return;

    const updatedProduct = { ...item, ...updatedFields };

    if (user) {
      const path = `users/${user.uid}/products/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'products', id), updatedProduct);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
    } else {
      setProducts((prev) => prev.map((p) => (p.id === id ? updatedProduct : p)));
    }
  };

  const deleteProduct = async (id: string) => {
    if (user) {
      const path = `users/${user.uid}/products/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'products', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, path);
      }
    } else {
      setProducts((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Distinct lists for filter dropdowns
  const allProductNames = useMemo(() => {
    const names = Array.from(new Set(sales.map((s) => s.produto).filter(Boolean)));
    return names.sort();
  }, [sales]);

  const allMaterials = useMemo(() => {
    const mats = Array.from(new Set(sales.map((s) => s.material).filter(Boolean)));
    return mats.sort();
  }, [sales]);

  // Filtered sales calculation
  const filteredSales = useMemo(() => {
    return sales.filter((item) => {
      // Marketplace filter
      if (filters.marketplace !== 'TODOS') {
        const itemMkt = (item.marketplace || '').toUpperCase();
        if (filters.marketplace === 'SHOPEE' && !itemMkt.includes('SHOPEE')) return false;
        if (filters.marketplace === 'MERCADO LIVRE' && !itemMkt.includes('MERCADO')) return false;
      }

      // Material filter
      if (filters.material !== 'TODOS') {
        const itemMat = (item.material || '').toUpperCase();
        if (filters.material === 'OUTROS') {
          if (['PLA', 'PETG', 'PET-G', 'ABS'].includes(itemMat)) return false;
        } else if (itemMat !== filters.material.toUpperCase()) {
          return false;
        }
      }

      // Product filter
      if (filters.produto !== 'TODOS' && item.produto !== filters.produto) {
        return false;
      }

      // Search query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchProd = item.produto.toLowerCase().includes(q);
        const matchMkt = item.marketplace.toLowerCase().includes(q);
        const matchMat = item.material.toLowerCase().includes(q);
        if (!matchProd && !matchMkt && !matchMat) return false;
      }

      // Date / Period filter
      if (filters.period !== 'todos') {
        const itemDateStr = item.data; // YYYY-MM-DD
        if (!itemDateStr) return true;

        const now = new Date();
        const itemDate = new Date(`${itemDateStr}T12:00:00Z`);

        if (filters.period === 'hoje') {
          const itemDay = itemDateStr;
          const todayDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          if (itemDay !== todayDay) return false;
        } else if (filters.period === '7dias') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (itemDate < sevenDaysAgo) return false;
        } else if (filters.period === '30dias') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (itemDate < thirtyDaysAgo) return false;
        } else if (filters.period === 'mes_atual') {
          const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          if (!itemDateStr.startsWith(currentMonthPrefix)) return false;
        } else if (filters.period === 'mes_anterior') {
          const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
          if (!itemDateStr.startsWith(lastMonthPrefix)) return false;
        } else if (filters.period === 'personalizado') {
          if (filters.customStartDate && itemDateStr < filters.customStartDate) return false;
          if (filters.customEndDate && itemDateStr > filters.customEndDate) return false;
        }
      }

      return true;
    });
  }, [sales, filters]);

  // KPIs
  const kpis = useMemo(() => {
    let faturamento = 0;
    let repasse = 0;
    let custos = 0;
    let taxas = 0;
    let lucro = 0;
    let custoEnergia = 0;
    let custoFilamento = 0;
    let custoManutencao = 0;

    filteredSales.forEach((s) => {
      faturamento += s.venda || 0;
      repasse += s.repasse || 0;
      custos += s.custo || 0;
      taxas += s.taxa || 0;
      lucro += s.lucro || 0;
      custoEnergia += s.energia || 0;
      custoFilamento += s.filamento || 0;
      custoManutencao += s.manutencao || 0;
    });

    const totalVendas = filteredSales.length;
    const margemMedia = custos > 0 ? (lucro / custos) * 100 : 0;
    const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0;

    return {
      faturamento: Number(faturamento.toFixed(2)),
      repasse: Number(repasse.toFixed(2)),
      custos: Number(custos.toFixed(2)),
      taxas: Number(taxas.toFixed(2)),
      lucro: Number(lucro.toFixed(2)),
      margemMedia: Number(margemMedia.toFixed(2)),
      totalVendas,
      ticketMedio: Number(ticketMedio.toFixed(2)),
      custoEnergia: Number(custoEnergia.toFixed(2)),
      custoFilamento: Number(custoFilamento.toFixed(2)),
      custoManutencao: Number(custoManutencao.toFixed(2)),
    };
  }, [filteredSales]);

  // Product summaries
  const productSummaries: ProductSummary[] = useMemo(() => {
    const map = new Map<string, SaleItem[]>();
    filteredSales.forEach((s) => {
      const p = s.produto.trim();
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(s);
    });

    const list: ProductSummary[] = [];
    map.forEach((items, produto) => {
      const totalVendas = items.length;
      let faturamentoTotal = 0;
      let repasseTotal = 0;
      let custoTotal = 0;
      let taxaTotal = 0;
      let lucroTotal = 0;
      const mkts = new Set<string>();
      const mats = new Set<string>();

      items.forEach((it) => {
        faturamentoTotal += it.venda;
        repasseTotal += it.repasse;
        custoTotal += it.custo;
        taxaTotal += it.taxa;
        lucroTotal += it.lucro;
        mkts.add(it.marketplace);
        mats.add(it.material);
      });

      const margemMedia = custoTotal > 0 ? (lucroTotal / custoTotal) * 100 : 0;

      list.push({
        produto,
        marketplaces: Array.from(mkts),
        materials: Array.from(mats),
        totalVendas,
        faturamentoTotal: Number(faturamentoTotal.toFixed(2)),
        repasseTotal: Number(repasseTotal.toFixed(2)),
        custoTotal: Number(custoTotal.toFixed(2)),
        taxaTotal: Number(taxaTotal.toFixed(2)),
        lucroTotal: Number(lucroTotal.toFixed(2)),
        margemMedia: Number(margemMedia.toFixed(2)),
        precoMedioVenda: Number((faturamentoTotal / totalVendas).toFixed(2)),
        custoMedio: Number((custoTotal / totalVendas).toFixed(2)),
        taxaMedia: Number((taxaTotal / totalVendas).toFixed(2)),
        repasseMedio: Number((repasseTotal / totalVendas).toFixed(2)),
        lucroMedio: Number((lucroTotal / totalVendas).toFixed(2)),
      });
    });

    return list.sort((a, b) => b.lucroTotal - a.lucroTotal);
  }, [filteredSales]);

  // Marketplace summaries
  const marketplaceSummaries: MarketplaceSummary[] = useMemo(() => {
    const mkts = ['SHOPEE', 'MERCADO LIVRE'];
    return mkts.map((mktName) => {
      const items = filteredSales.filter((s) => {
        const itemMkt = (s.marketplace || '').toUpperCase();
        if (mktName === 'SHOPEE') return itemMkt.includes('SHOPEE');
        if (mktName === 'MERCADO LIVRE') return itemMkt.includes('MERCADO');
        return itemMkt.includes(mktName.toUpperCase());
      });
      let faturamentoTotal = 0;
      let taxaTotal = 0;
      let repasseTotal = 0;
      let custoTotal = 0;
      let lucroTotal = 0;

      items.forEach((it) => {
        faturamentoTotal += it.venda;
        taxaTotal += it.taxa;
        repasseTotal += it.repasse;
        custoTotal += it.custo;
        lucroTotal += it.lucro;
      });

      const totalVendas = items.length;
      const margemMedia = custoTotal > 0 ? (lucroTotal / custoTotal) * 100 : 0;
      const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;
      const taxaEfetivaPercent = faturamentoTotal > 0 ? (taxaTotal / faturamentoTotal) * 100 : 0;

      return {
        marketplace: mktName,
        totalVendas,
        faturamentoTotal: Number(faturamentoTotal.toFixed(2)),
        taxaTotal: Number(taxaTotal.toFixed(2)),
        repasseTotal: Number(repasseTotal.toFixed(2)),
        custoTotal: Number(custoTotal.toFixed(2)),
        lucroTotal: Number(lucroTotal.toFixed(2)),
        margemMedia: Number(margemMedia.toFixed(2)),
        ticketMedio: Number(ticketMedio.toFixed(2)),
        taxaEfetivaPercent: Number(taxaEfetivaPercent.toFixed(2)),
      };
    });
  }, [filteredSales]);

  // Monthly summaries
  const monthlySummaries: MonthSummary[] = useMemo(() => {
    const map = new Map<string, SaleItem[]>();
    // Base on filteredSales to react to marketplace/product/material filters
    filteredSales.forEach((s) => {
      const mesAno = s.data.substring(0, 7); // YYYY-MM
      if (!mesAno) return;
      if (!map.has(mesAno)) map.set(mesAno, []);
      map.get(mesAno)!.push(s);
    });

    const monthNames: Record<string, string> = {
      '01': 'Janeiro',
      '02': 'Fevereiro',
      '03': 'Março',
      '04': 'Abril',
      '05': 'Maio',
      '06': 'Junho',
      '07': 'Julho',
      '08': 'Agosto',
      '09': 'Setembro',
      '10': 'Outubro',
      '11': 'Novembro',
      '12': 'Dezembro',
    };

    const sortedKeys = Array.from(map.keys()).sort().reverse();

    const summaries = sortedKeys.map((key) => {
      const items = map.get(key)!;
      const [year, month] = key.split('-');
      const label = `${monthNames[month] || month} ${year}`;

      let faturamento = 0;
      let taxas = 0;
      let custos = 0;
      let repasse = 0;
      let lucro = 0;

      items.forEach((it) => {
        faturamento += it.venda;
        taxas += it.taxa;
        custos += it.custo;
        repasse += it.repasse;
        lucro += it.lucro;
      });

      const totalVendas = items.length;
      const margem = custos > 0 ? (lucro / custos) * 100 : 0;

      return {
        mesAno: key,
        label,
        totalVendas,
        faturamento: Number(faturamento.toFixed(2)),
        taxas: Number(taxas.toFixed(2)),
        custos: Number(custos.toFixed(2)),
        repasse: Number(repasse.toFixed(2)),
        lucro: Number(lucro.toFixed(2)),
        margem: Number(margem.toFixed(2)),
      };
    });

    // Only show months that have actual revenue and are not in the future
    // unless they have data (which shouldn't happen but just in case)
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    return summaries.filter(s => {
      // Must have revenue
      if (s.faturamento <= 0) return false;
      // Must not be in the future (relative to the system's current date)
      // but if the user explicitly added data there, we show it?
      // User said "mostre apenas o que foi alimentado".
      // If faturamento > 0, it WAS fed.
      return true;
    });
  }, [filteredSales]);

  // Intelligent dynamic insights
  const insights: InsightItem[] = useMemo(() => {
    if (filteredSales.length === 0) return [];
    const list: InsightItem[] = [];

    // Marketplace revenue share insight
    const mlSummary = marketplaceSummaries.find((m) => m.marketplace === 'MERCADO LIVRE');
    const shopeeSummary = marketplaceSummaries.find((m) => m.marketplace === 'SHOPEE');
    if (kpis.faturamento > 0 && mlSummary && shopeeSummary) {
      const mlShare = (mlSummary.faturamentoTotal / kpis.faturamento) * 100;
      const shopeeShare = (shopeeSummary.faturamentoTotal / kpis.faturamento) * 100;

      if (mlShare >= 50) {
        list.push({
          id: 'mkt-share',
          type: 'info',
          title: 'Canal Principal',
          description: `Mercado Livre representa ${mlShare.toFixed(1)}% do faturamento no período filtrado.`,
          metric: `${mlShare.toFixed(0)}%`,
        });
      } else {
        list.push({
          id: 'mkt-share',
          type: 'info',
          title: 'Canal Principal',
          description: `Shopee representa ${shopeeShare.toFixed(1)}% do faturamento no período filtrado.`,
          metric: `${shopeeShare.toFixed(0)}%`,
        });
      }
    }

    // Most profitable product
    if (productSummaries.length > 0) {
      const topProfitable = [...productSummaries].sort((a, b) => b.lucroTotal - a.lucroTotal)[0];
      if (topProfitable && topProfitable.lucroTotal > 0) {
        list.push({
          id: 'top-product',
          type: 'positive',
          title: 'Produto Campeão de Lucro',
          description: `Seu produto mais lucrativo foi "${topProfitable.produto}" gerando R$ ${topProfitable.lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de lucro líquido.`,
          metric: `R$ ${topProfitable.lucroTotal.toFixed(0)}`,
        });
      }
    }

    // Month-over-month margin comparison
    if (monthlySummaries.length >= 2) {
      const currMonth = monthlySummaries[0];
      const prevMonth = monthlySummaries[1];
      const diffMargin = currMonth.margem - prevMonth.margem;
      if (Math.abs(diffMargin) > 0.5) {
        list.push({
          id: 'margin-trend',
          type: diffMargin >= 0 ? 'positive' : 'warning',
          title: 'Evolução da Margem',
          description: `A margem média ${diffMargin >= 0 ? 'aumentou' : 'diminuiu'} ${Math.abs(diffMargin).toFixed(1)}% em relação ao mês anterior (${prevMonth.label}).`,
          metric: `${diffMargin >= 0 ? '+' : ''}${diffMargin.toFixed(1)}%`,
        });
      }
    }

    // High revenue but low margin alert
    const highRevLowMargin = productSummaries.find(
      (p) => p.faturamentoTotal > kpis.faturamento * 0.15 && p.margemMedia < 60
    );
    if (highRevLowMargin) {
      list.push({
        id: 'low-margin-alert',
        type: 'warning',
        title: 'Atenção à Margem',
        description: `O produto "${highRevLowMargin.produto}" possui alto volume de faturamento, mas sua margem está abaixo da média (${highRevLowMargin.margemMedia.toFixed(1)}%).`,
        metric: `${highRevLowMargin.margemMedia.toFixed(0)}%`,
      });
    }

    // Loss-making records check
    const lossSales = filteredSales.filter((s) => s.lucro < 0);
    if (lossSales.length > 0) {
      list.push({
        id: 'loss-alert',
        type: 'warning',
        title: 'Prejuízo Identificado',
        description: `Existem ${lossSales.length} venda(s) com lucro negativo no período. Verifique taxas e custos aplicados.`,
        metric: `-${lossSales.length}`,
      });
    } else {
      list.push({
        id: 'healthy-profit',
        type: 'highlight',
        title: 'Operação 100% Positiva',
        description: 'Todas as vendas no período registraram margem positiva de retorno.',
        metric: '100%',
      });
    }

    return list;
  }, [filteredSales, kpis, marketplaceSummaries, productSummaries, monthlySummaries]);

  return (
    <CRMContext.Provider
      value={{
        sales,
        filters,
        activeTab,
        setActiveTab,
        setFilter,
        resetFilters,
        user,
        isLoadingAuth,
        login,
        logout,
        isSaleModalOpen,
        editingSale,
        openNewSaleModal,
        openEditSaleModal,
        closeSaleModal,
        selectedProductForDetail,
        setSelectedProductForDetail,
        addSale,
        updateSale,
        deleteSale,
        deleteSalesBatch,
        duplicateSale,
        importSales,
        clearAllSales,
        clearAllProducts,
        resetDemoData,
        filteredSales,
        kpis,
        productSummaries,
        marketplaceSummaries,
        monthlySummaries,
        insights,
        allProductNames,
        allMaterials,
        products,
        isProductModalOpen,
        editingProduct,
        openNewProductModal,
        openEditProductModal,
        closeProductModal,
        addProduct,
        updateProduct,
        deleteProduct,
        catalogProducts: products,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
