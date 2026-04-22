'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShoppingBag, Search, Star, Heart, SlidersHorizontal, Package, ArrowRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  retail_price: number;
  image_url: string | null;
  category: string | null;
  stock_count: number;
  is_active: boolean;
}

const fallbackImages = [
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80&auto=format&fit=crop',
];

export default function ShopPage() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(30);

        if (fetchErr) {
          console.error('[Shop] fetch error:', fetchErr);
          setError(fetchErr.message);
        }
        console.log('[Shop] fetched products:', data?.length || 0, data);
        setProducts((data as unknown as Product[]) || []);
      } catch (err) {
        console.error('[Shop] unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      {/* Hero Banner */}
      <div style={{ position: 'relative', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', marginBottom: '40px', height: '220px' }}>
        <img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1600&q=80&auto=format&fit=crop" alt="Beauty products" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3), transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'white', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShoppingBag size={18} style={{ color: '#FCD34D' }} />
            <span style={{ fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', color: '#FCD34D', fontWeight: 700 }}>Shop</span>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 700, textShadow: '0 2px 10px rgba(0,0,0,0.3)', margin: 0 }}>Curated Beauty Products</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '8px', maxWidth: '400px' }}>Premium beauty essentials handpicked for you</p>
        </div>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', width: '100%' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-glass" style={{ paddingLeft: '44px', width: '100%', boxSizing: 'border-box' }} />
        </div>
        <button style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-light)', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
          <SlidersHorizontal size={18} style={{ color: 'var(--color-text-secondary)' }} />
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="glass-card p-4 mb-6 border-l-4 border-red-400 bg-red-50/50">
          <p className="text-sm text-red-600 font-medium">Failed to load products: {error}</p>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <div className="aspect-square shimmer" />
              <div className="p-4">
                <div className="h-4 shimmer rounded w-3/4 mb-2" />
                <div className="h-3 shimmer rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-100/50 to-transparent rounded-bl-full" />
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center mx-auto mb-4 animate-float">
            <Package size={32} className="text-amber-500" />
          </div>
          <p className="text-lg font-bold text-[var(--color-text-primary)]">No products found</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">Check back soon for new arrivals</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product, idx) => (
            <div
              key={product.id}
              className={`glass-card overflow-hidden hover:shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-pointer group animate-scale-in stagger-${Math.min(idx + 1, 6)}`}
              style={{ animationFillMode: 'both' }}
            >
              <div className="aspect-square relative overflow-hidden">
                <img src={product.image_url || fallbackImages[idx % fallbackImages.length]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <button className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 hover:bg-white hover:scale-110 transition-all shadow-md">
                  <Heart size={16} className="text-pink-400" />
                </button>
                {product.stock_count <= 5 && product.stock_count > 0 && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md">
                    Low stock
                  </span>
                )}
                {product.category && (
                  <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/90 text-[var(--color-text-primary)] shadow-sm backdrop-blur-sm">
                    {product.category}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm text-[var(--color-text-primary)] line-clamp-1 group-hover:text-gradient-pink transition-colors">{product.name}</h3>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-[var(--color-text-primary)]">£{product.retail_price?.toFixed(2)}</span>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-500">
                    <Star size={12} fill="currentColor" />
                    <span className="text-xs font-bold">5.0</span>
                  </div>
                </div>
                <button className="w-full mt-3 py-2.5 rounded-full bg-[var(--color-surface-light)] text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group/btn">
                  <span>Add to Bag</span>
                  <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
