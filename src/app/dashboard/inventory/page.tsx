'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Search, Plus, AlertTriangle, TrendingDown, Box, X, Trash2, History, Loader2 } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useModal } from '@/contexts/ModalContext';

interface Product {
  id: string;
  name: string;
  retail_price: number | string | null;
  wholesale_price: number | string | null;
  stock_count: number | null;
  low_stock_threshold: number | null;
  category: string | null;
  is_active: boolean | null;
  image_url: string | null;
  description?: string | null;
}

type EditDraft = {
  name: string;
  description: string;
  image_url: string;
  category: string;
  retail_price: string;
  wholesale_price: string;
  stock_count: string;
  low_stock_threshold: string;
  is_active: boolean;
  supplier_name?: string;
};

const formatMoney = (value: number | string | null | undefined) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
};

const getStockCount = (product: Product) => product.stock_count ?? 0;

export default function InventoryPage() {
  const supabase = createClient();
  const { role } = useAuth();
  const isOwner = role === 'owner';

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { showConfirm } = useModal();
  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [saving, setSaving] = useState(false);

  // Add Product modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    image_url: '',
    retail_price: '',
    wholesale_price: '',
    stock_count: '',
    low_stock_threshold: '5',
    category: 'Nails',
    is_active: true,
    supplier_name: 'Meraki Distribution',
  });

  // Uploading state
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (file: File, isEdit: boolean) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB', 'error');
      return;
    }
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `products/${Date.now()}_${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      if (isEdit && draft) {
        setDraft({ ...draft, image_url: urlData.publicUrl });
      } else if (!isEdit) {
        setNewProduct(prev => ({ ...prev, image_url: urlData.publicUrl }));
      }
      showToast('Image uploaded successfully', 'success');
    } catch (err: unknown) {
      console.error('[Upload] error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to upload image';
      showToast(msg, 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file, true);
  };

  const handleAddImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file, false);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setDraft({
      name: p.name || '',
      description: p.description || '',
      image_url: p.image_url || '',
      category: p.category || '',
      retail_price: p.retail_price == null ? '' : String(p.retail_price),
      wholesale_price: p.wholesale_price == null ? '' : String(p.wholesale_price),
      stock_count: p.stock_count == null ? '' : String(p.stock_count),
      low_stock_threshold: p.low_stock_threshold == null ? '5' : String(p.low_stock_threshold),
      is_active: !!p.is_active,
      supplier_name: 'Meraki Distribution', // Mock for now
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setDraft(null);
  };

  const saveEdit = async () => {
    if (!editing || !draft) return;
    const priceNum = Number(draft.retail_price);
    const stockNum = Number(draft.stock_count);
    if (!draft.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    const wholesaleNum = priceNum;
    const thresholdNum = draft.low_stock_threshold.trim() ? Number(draft.low_stock_threshold) : null;
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      showToast('Invalid retail price', 'error');
      return;
    }
    if (thresholdNum !== null && (!Number.isFinite(thresholdNum) || thresholdNum < 0)) {
      showToast('Invalid low stock threshold', 'error');
      return;
    }
    if (!Number.isFinite(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
      showToast('Stock must be a non-negative integer', 'error');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: draft.name.trim(),
          description: draft.description.trim() || null,
          image_url: draft.image_url || null,
          category: draft.category.trim() || null,
          retail_price: priceNum,
          wholesale_price: wholesaleNum,
          stock_count: stockNum,
          low_stock_threshold: thresholdNum,
          is_active: draft.is_active,
        })
        .eq('id', editing.id);
      if (error) throw error;
      setProducts((prev) => prev.map((p) => p.id === editing.id ? {
        ...p,
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        image_url: draft.image_url || null,
        category: draft.category.trim() || null,
        retail_price: priceNum,
        wholesale_price: wholesaleNum,
        stock_count: stockNum,
        low_stock_threshold: thresholdNum,
        is_active: draft.is_active,
      } : p));
      showToast('Product updated', 'success');
      closeEdit();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update product';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!(await showConfirm('Are you sure you want to delete this product?', 'Delete Product', 'Delete', 'Cancel', 'danger'))) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast('Product deleted', 'success');
      closeEdit();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete product';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.retail_price) {
      showToast('Please fill in all required fields (Name, Retail Price)', 'error');
      return;
    }
    const priceNum = Number(newProduct.retail_price);
    const wholesaleNum = priceNum;
    const stockNum = Number(newProduct.stock_count) || 0;
    const thresholdNum = newProduct.low_stock_threshold.trim() ? Number(newProduct.low_stock_threshold) : 5;

    if (!Number.isFinite(priceNum) || priceNum < 0) {
      showToast('Invalid retail price', 'error');
      return;
    }
    if (!Number.isFinite(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
      showToast('Stock must be a non-negative integer', 'error');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.from('products').insert({
        name: newProduct.name.trim(),
        description: newProduct.description.trim() || null,
        image_url: newProduct.image_url || null,
        retail_price: priceNum,
        wholesale_price: wholesaleNum,
        stock_count: stockNum,
        low_stock_threshold: thresholdNum,
        category: newProduct.category || null,
        is_active: newProduct.is_active,
      }).select();

      if (error) throw error;
      if (data && data[0]) {
        setProducts(prev => [data[0] as unknown as Product, ...prev]);
      } else {
        const { data: refreshed } = await supabase.from('products').select('*').order('name').limit(100);
        setProducts((refreshed as unknown as Product[]) || []);
      }

      showToast('Product added successfully!', 'success');
      setShowAddModal(false);
      setNewProduct({
        name: '',
        description: '',
        image_url: '',
        retail_price: '',
        wholesale_price: '',
        stock_count: '',
        low_stock_threshold: '5',
        category: 'Nails',
        is_active: true,
        supplier_name: 'Meraki Distribution',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add product';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !p.is_active;
    const { error } = await supabase.from('products').update({ is_active: next }).eq('id', p.id);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: next } : x));
    showToast(next ? 'Product enabled' : 'Product disabled', 'success');
  };

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

  const lowStock = products.filter((p) => {
    const count = getStockCount(p);
    const threshold = p.low_stock_threshold ?? 5;
    return count > 0 && count <= threshold;
  });
  const outOfStock = products.filter((p) => getStockCount(p) === 0);

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
        {isOwner && (
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm cursor-pointer">
            <Plus size={16} />
            Add Product
          </button>
        )}
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
          {filtered.map((product) => {
            const stockCount = getStockCount(product);
            return (
              <div
                key={product.id}
                onClick={() => { if (isOwner) openEdit(product); }}
                className={`grid grid-cols-12 gap-4 px-5 py-4 border-b border-[var(--color-border-light)] hover:bg-[var(--color-surface-light)]/50 transition-colors items-center ${isOwner ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="col-span-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-brand-pink-light)] flex items-center justify-center shrink-0 overflow-hidden border border-[var(--color-border-light)]">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={16} className="text-[var(--color-brand-pink-dark)]" />
                    )}
                  </div>
                  <span className="font-medium text-sm text-[var(--color-text-primary)] truncate">{product.name}</span>
                </div>
                <div className="col-span-2 text-sm text-[var(--color-text-muted)]">{product.category || '—'}</div>
                <div className="col-span-2 text-right text-sm font-medium text-[var(--color-text-primary)]">£{formatMoney(product.retail_price)}</div>
                <div className="col-span-2 text-right">
                  <span className={`text-sm font-bold ${stockCount === 0 ? 'text-red-500' : stockCount <= (product.low_stock_threshold ?? 5) ? 'text-amber-500' : 'text-[var(--color-text-primary)]'}`}>
                    {stockCount}
                  </span>
                </div>
                <div className="col-span-1 text-right">
                  <button
                    onClick={(e) => toggleActive(product, e)}
                    title={product.is_active ? 'Disable product' : 'Enable product'}
                    className={`relative inline-flex w-9 h-5 rounded-full transition-colors cursor-pointer ${product.is_active ? 'bg-emerald-500' : 'bg-[var(--color-text-muted)]/40'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${product.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto" onClick={closeEdit}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Edit Product</h2>
              <button onClick={closeEdit} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-light)] cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Product Image</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-[var(--color-border-light)] hover:border-pink-300 transition-colors rounded-xl relative overflow-hidden bg-[var(--color-surface-light)]/30">
                  {uploadingImage ? (
                    <div className="flex flex-col items-center justify-center py-4">
                      <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)] mb-2" />
                      <span className="text-xs text-[var(--color-text-muted)] font-medium">Uploading image...</span>
                    </div>
                  ) : draft.image_url ? (
                    <div className="w-full relative flex flex-col items-center">
                      <img src={draft.image_url} alt="Product preview" className="w-full max-h-40 object-cover rounded-lg shadow-sm" />
                      <button
                        type="button"
                        onClick={() => setDraft({ ...draft, image_url: '' })}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 text-center py-2">
                      <div className="flex justify-center text-[var(--color-text-muted)]">
                        <Package size={36} className="text-[var(--color-text-muted)]/50 mb-1" />
                      </div>
                      <div className="flex text-sm text-[var(--color-text-secondary)] justify-center">
                        <label
                          htmlFor="edit-image-upload"
                          className="relative cursor-pointer rounded-md font-semibold text-[var(--color-primary)] hover:text-pink-600 focus-within:outline-none"
                        >
                          <span>Upload a file</span>
                          <input
                            id="edit-image-upload"
                            name="edit-image-upload"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleEditImageSelect}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)]">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Name</label>
                <input className="input-glass" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Description</label>
                <textarea
                  className="input-glass resize-none"
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Product description"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Category</label>
                <select
                  className="input-glass"
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                >
                  {['Nails', 'Lashes', 'Brows', 'Skincare', 'Equipment'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Retail Price</label>
                <input type="number" min="0" step="0.01" className="input-glass" value={draft.retail_price} onChange={(e) => setDraft({ ...draft, retail_price: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Stock</label>
                  <input type="number" min="0" step="1" className="input-glass" value={draft.stock_count} onChange={(e) => setDraft({ ...draft, stock_count: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Low Stock Alert</label>
                  <input type="number" min="0" step="1" className="input-glass" value={draft.low_stock_threshold} onChange={(e) => setDraft({ ...draft, low_stock_threshold: e.target.value })} placeholder="5" />
                </div>
              </div>
              <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-light)] cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Active</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Visible to customers in the shop</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, is_active: !draft.is_active })}
                  className={`relative inline-flex w-11 h-6 rounded-full transition-colors cursor-pointer ${draft.is_active ? 'bg-emerald-500' : 'bg-[var(--color-text-muted)]/40'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${draft.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => showToast('Stock history logging will be implemented in v2', 'info')} className="flex-1 flex justify-center items-center gap-2 p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-semibold">
                  <History size={16} /> View History
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-6">
              <button onClick={() => deleteProduct(editing.id)} disabled={saving} className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50">
                <Trash2 size={16} />
              </button>
              <div className="flex items-center gap-2">
                <button onClick={closeEdit} className="px-4 py-2 rounded-full text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-light)] cursor-pointer">Cancel</button>
                <button onClick={saveEdit} disabled={saving} className="btn-primary px-5 py-2 text-sm cursor-pointer disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Add Product</h2>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-light)] cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Product Image</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-[var(--color-border-light)] hover:border-pink-300 transition-colors rounded-xl relative overflow-hidden bg-[var(--color-surface-light)]/30">
                  {uploadingImage ? (
                    <div className="flex flex-col items-center justify-center py-4">
                      <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)] mb-2" />
                      <span className="text-xs text-[var(--color-text-muted)] font-medium">Uploading image...</span>
                    </div>
                  ) : newProduct.image_url ? (
                    <div className="w-full relative flex flex-col items-center">
                      <img src={newProduct.image_url} alt="Product preview" className="w-full max-h-40 object-cover rounded-lg shadow-sm" />
                      <button
                        type="button"
                        onClick={() => setNewProduct({ ...newProduct, image_url: '' })}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 text-center py-2">
                      <div className="flex justify-center text-[var(--color-text-muted)]">
                        <Package size={36} className="text-[var(--color-text-muted)]/50 mb-1" />
                      </div>
                      <div className="flex text-sm text-[var(--color-text-secondary)] justify-center">
                        <label
                          htmlFor="add-image-upload"
                          className="relative cursor-pointer rounded-md font-semibold text-[var(--color-primary)] hover:text-pink-600 focus-within:outline-none"
                        >
                          <span>Upload a file</span>
                          <input
                            id="add-image-upload"
                            name="add-image-upload"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleAddImageSelect}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)]">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Name *</label>
                <input className="input-glass" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Product name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Description</label>
                <textarea
                  className="input-glass resize-none"
                  rows={3}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Product description"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Category</label>
                <select
                  className="input-glass"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                >
                  {['Nails', 'Lashes', 'Brows', 'Skincare', 'Equipment'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Retail Price *</label>
                <input type="number" min="0" step="0.01" className="input-glass" value={newProduct.retail_price} onChange={(e) => setNewProduct({ ...newProduct, retail_price: e.target.value })} placeholder="0.00" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Stock</label>
                  <input type="number" min="0" step="1" className="input-glass" value={newProduct.stock_count} onChange={(e) => setNewProduct({ ...newProduct, stock_count: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Low Stock Alert</label>
                  <input type="number" min="0" step="1" className="input-glass" value={newProduct.low_stock_threshold} onChange={(e) => setNewProduct({ ...newProduct, low_stock_threshold: e.target.value })} placeholder="5" />
                </div>
              </div>
              <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-light)] cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Active</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Visible to customers in the shop</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewProduct({ ...newProduct, is_active: !newProduct.is_active })}
                  className={`relative inline-flex w-11 h-6 rounded-full transition-colors cursor-pointer ${newProduct.is_active ? 'bg-emerald-500' : 'bg-[var(--color-text-muted)]/40'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${newProduct.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-full text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-light)] cursor-pointer">Cancel</button>
              <button onClick={handleAddProduct} disabled={saving || uploadingImage} className="btn-primary px-5 py-2 text-sm cursor-pointer disabled:opacity-50">
                {saving ? 'Adding…' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
