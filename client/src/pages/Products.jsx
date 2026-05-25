import { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import { formatCurrency } from '../utils/helpers';

const UNIT_OPTIONS = ['pcs', 'kg', 'ltr', 'box', 'pack', 'dozen', 'meter', 'unit'];

const stockBadge = (status) => {
  const map = {
    in_stock: { label: 'In Stock', cls: 'badge-success' },
    low_stock: { label: 'Low Stock', cls: 'badge-warning' },
    out_of_stock: { label: 'Out of Stock', cls: 'badge-danger' },
  };
  const cfg = map[status] || map.in_stock;
  return <span className={cfg.cls}>{cfg.label}</span>;
};

const emptyForm = {
  name: '', sku: '', description: '', category: '', supplier: '',
  costPrice: '', sellingPrice: '', quantity: '', minStockLevel: '', unit: 'pcs',
  barcode: '',
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  // Dropdown data
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/products', { params: { search, page, limit: 10 } });
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Fetch categories & suppliers for form dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [catRes, supRes] = await Promise.all([
          axios.get('/categories'),
          axios.get('/suppliers'),
        ]);
        setCategories(catRes.data.categories);
        setSuppliers(supRes.data.suppliers);
      } catch {
        // silent — dropdowns will just be empty
      }
    };
    fetchDropdowns();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        quantity: Number(formData.quantity),
        minStockLevel: Number(formData.minStockLevel),
        category: formData.category || undefined,
        supplier: formData.supplier || undefined,
      };

      if (editingProduct) {
        await axios.put(`/products/${editingProduct._id}`, payload);
        toast.success('Product updated successfully');
      } else {
        await axios.post('/products', payload);
        toast.success('Product created successfully');
      }
      closeModal();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        description: product.description || '',
        category: product.category?._id || '',
        supplier: product.supplier?._id || '',
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        quantity: product.quantity,
        minStockLevel: product.minStockLevel,
        unit: product.unit || 'pcs',
        barcode: product.barcode || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({ ...emptyForm });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const profitMargin = (cost, sell) => {
    if (!cost || !sell || sell === 0) return '—';
    const margin = ((sell - cost) / sell) * 100;
    return `${margin.toFixed(1)}%`;
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  if (loading && !products.length) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Products</h1>
        <button onClick={() => openModal()} className="btn-primary shrink-0">
          <HiOutlinePlus className="w-5 h-5" /> Add Product
        </button>
      </div>

      {/* Table Card */}
      <div className="card !p-0 overflow-hidden flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-surface-700">
          <div className="relative max-w-md">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-800 border-b border-surface-700">
              <tr>
                <th className="table-header">Product</th>
                <th className="table-header">Category</th>
                <th className="table-header">Supplier</th>
                <th className="table-header">Stock</th>
                <th className="table-header">Cost / Sell</th>
                <th className="table-header">Margin</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/50">
              {products.map((product) => (
                <tr key={product._id} className="table-row">
                  {/* Product name & SKU */}
                  <td className="table-cell">
                    <div className="font-medium text-white">{product.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{product.sku}</div>
                  </td>

                  {/* Category badge with color */}
                  <td className="table-cell">
                    {product.category ? (
                      <span className="inline-flex items-center gap-1.5 badge-neutral">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: product.category.color || '#6b7280' }}
                        />
                        {product.category.name}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>

                  {/* Supplier */}
                  <td className="table-cell">
                    {product.supplier ? (
                      <div>
                        <div className="text-white text-sm">{product.supplier.name}</div>
                        {product.supplier.company && (
                          <div className="text-xs text-slate-500">{product.supplier.company}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>

                  {/* Stock status */}
                  <td className="table-cell">
                    <div className="flex flex-col gap-1">
                      {stockBadge(product.stockStatus)}
                      <span className="text-xs text-slate-400">
                        {product.quantity} {product.unit || 'pcs'}
                      </span>
                    </div>
                  </td>

                  {/* Cost / Selling price */}
                  <td className="table-cell">
                    <div className="text-slate-400 text-sm">{formatCurrency(product.costPrice)}</div>
                    <div className="text-white font-medium">{formatCurrency(product.sellingPrice)}</div>
                  </td>

                  {/* Profit margin */}
                  <td className="table-cell">
                    <span className={`text-sm font-medium ${product.sellingPrice > product.costPrice ? 'text-emerald-400' : 'text-red-400'}`}>
                      {profitMargin(product.costPrice, product.sellingPrice)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal(product)} className="btn-ghost p-2" title="Edit">
                        <HiOutlinePencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="btn-ghost p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        title="Delete"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-700">
            <span className="text-sm text-slate-400">
              Page {pagination.page} of {pagination.pages} &middot; {pagination.total} products
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-ghost p-2 disabled:opacity-40"
              >
                <HiOutlineChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="btn-ghost p-2 disabled:opacity-40"
              >
                <HiOutlineChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingProduct ? 'Edit Product' : 'Add New Product'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1 — Name & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input type="text" name="name" className="input" required value={formData.name} onChange={handleChange} />
            </div>
            <div>
              <label className="label">SKU</label>
              <input type="text" name="sku" className="input" required value={formData.sku} onChange={handleChange} />
            </div>
          </div>

          {/* Row 2 — Category & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select name="category" className="input" value={formData.category} onChange={handleChange}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Supplier</label>
              <select name="supplier" className="input" value={formData.supplier} onChange={handleChange}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}{s.company ? ` — ${s.company}` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3 — Cost & Selling price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Cost Price (₹)</label>
              <input type="number" step="0.01" min="0" name="costPrice" className="input" required value={formData.costPrice} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Selling Price (₹)</label>
              <input type="number" step="0.01" min="0" name="sellingPrice" className="input" required value={formData.sellingPrice} onChange={handleChange} />
            </div>
          </div>

          {/* Row 4 — Quantity, Min Stock Level, Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Quantity</label>
              <input type="number" min="0" name="quantity" className="input" required value={formData.quantity} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Min Stock Level</label>
              <input type="number" min="0" name="minStockLevel" className="input" required value={formData.minStockLevel} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Unit</label>
              <select name="unit" className="input" value={formData.unit} onChange={handleChange}>
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5 — Barcode */}
          <div>
            <label className="label">Barcode</label>
            <input type="text" name="barcode" className="input" value={formData.barcode} onChange={handleChange} />
          </div>

          {/* Row 6 — Description */}
          <div>
            <label className="label">Description</label>
            <textarea name="description" className="input min-h-[80px] resize-none" value={formData.description} onChange={handleChange} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-700">
            <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
              {submitting ? 'Saving…' : editingProduct ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
