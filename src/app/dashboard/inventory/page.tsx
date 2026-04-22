'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Package, Search, Plus, AlertTriangle, TrendingDown, Box } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  category: string | null;
  is_active: boolean;
  image_url: string | null;
}

export default function InventoryPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*').order('name').limit(100);
      setProducts((data as unknown as Product[]) || []);
      setLoading(false);
    };
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = products.filter((p) => p.stock_quantity <= 5 && p.stock_quantity > 0);
  const outOfStock = products.filter((p) => p.stock_quantity === 0);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package size={22} className="text-[var(--color-warning)]" />
            <h1 className="text-3xl font-semibold text-[var(--color-text-primary)]">Inventory</h1>
          </div>
          <p className="text-[var(--color-text-secondary)]">Track product stock levels</p>
        </div>
        <button className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <Box size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">{products.length}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Total Products</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <TrendingDown size={20} className="text-amber-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-amber-600">{lowStock.length}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Low Stock</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-red-600">{outOfStock.length}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Out of Stock</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-glass pl-11"
        />
      </div>

      {/* Product Table */}
      {loading ? (
        <div className="glass-card overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b border-[var(--color-border-light)] animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-surface-light)]" />
              <div className="flex-1">
                <div className="h-4 bg-[var(--color-surface-light)] rounded w-1/3 mb-2" />
                <div className="h-3 bg-[var(--color-surface-light)] rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Package size={48} className="mx-auto text-[var(--color-text-muted)] mb-4" />
          <p className="text-lg font-medium text-[var(--color-text-secondary)]">No products found</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-[var(--color-border-light)] bg-[var(--color-surface-light)] text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            <div className="col-span-5">Product</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">Stock</div>
            <div className="col-span-1 text-right">Status</div>
          </div>

          {/* Rows */}
          {filtered.map((product) => (
            <div key={product.id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-[var(--color-border-light)] hover:bg-[var(--color-surface-light)]/50 transition-colors items-center cursor-pointer">
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-brand-pink-light)] flex items-center justify-center shrink-0">
                  <Package size={16} className="text-[var(--color-brand-pink-dark)]" />
                </div>
                <span className="font-medium text-sm text-[var(--color-text-primary)] truncate">{product.name}</span>
              </div>
              <div className="col-span-2 text-sm text-[var(--color-text-muted)]">{product.category || '—'}</div>
              <div className="col-span-2 text-right text-sm font-medium text-[var(--color-text-primary)]">£{product.price.toFixed(2)}</div>
              <div className="col-span-2 text-right">
                <span className={`text-sm font-bold ${product.stock_quantity === 0 ? 'text-red-500' : product.stock_quantity <= 5 ? 'text-amber-500' : 'text-[var(--color-text-primary)]'}`}>
                  {product.stock_quantity}
                </span>
              </div>
              <div className="col-span-1 text-right">
                <span className={`inline-block w-2 h-2 rounded-full ${product.is_active ? 'bg-emerald-500' : 'bg-[var(--color-text-muted)]'}`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
