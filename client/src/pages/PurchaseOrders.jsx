import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi';
import { formatCurrency, formatDate, orderStatusConfig, paymentStatusConfig } from '../utils/helpers';

const EMPTY_ITEM = { product: '', productName: '', quantity: 1, unitPrice: 0, total: 0 };

const INITIAL_FORM = {
  supplier: '',
  items: [{ ...EMPTY_ITEM }],
  tax: 0,
  discount: 0,
  notes: '',
  expectedDelivery: '',
};

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [formData, setFormData] = useState({ ...INITIAL_FORM });

  /* ────────────────────── Fetch helpers ────────────────────── */

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/purchase-orders', { params: { search, page, limit: 10 } });
      setOrders(res.data.orders || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch {
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data.suppliers || []);
    } catch {
      /* silent */
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.products || []);
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
  }, []);

  /* ────────────────────── Item helpers ────────────────────── */

  const recalcItem = (item) => ({ ...item, total: (item.quantity || 0) * (item.unitPrice || 0) });

  const updateItem = (index, field, value) => {
    setFormData((prev) => {
      const items = [...prev.items];
      items[index] = recalcItem({ ...items[index], [field]: value });

      // When product is selected, fill productName and default unitPrice from catalog
      if (field === 'product') {
        const found = products.find((p) => p._id === value);
        if (found) {
          items[index].productName = found.name;
          items[index].unitPrice = found.costPrice || 0;
          items[index] = recalcItem(items[index]);
        }
      }
      return { ...prev, items };
    });
  };

  const addItem = () => setFormData((prev) => ({ ...prev, items: [...prev.items, { ...EMPTY_ITEM }] }));

  const removeItem = (index) =>
    setFormData((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

  const subtotal = formData.items.reduce((s, i) => s + (i.total || 0), 0);
  const totalAmount = subtotal + Number(formData.tax || 0) - Number(formData.discount || 0);

  /* ────────────────────── CRUD ────────────────────── */

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplier) return toast.error('Supplier is required');
    if (!formData.items.length || !formData.items[0].product) return toast.error('Add at least one item');

    const payload = {
      ...formData,
      subtotal,
      totalAmount,
      items: formData.items.map((i) => ({
        product: i.product,
        productName: i.productName,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        total: Number(i.total),
      })),
    };

    try {
      if (editingOrder) {
        await api.put(`/purchase-orders/${editingOrder._id}`, payload);
        toast.success('Purchase order updated');
      } else {
        await api.post('/purchase-orders', payload);
        toast.success('Purchase order created');
      }
      closeModal();
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase order?')) return;
    try {
      await api.delete(`/purchase-orders/${id}`);
      toast.success('Purchase order deleted');
      fetchOrders();
    } catch {
      toast.error('Failed to delete order');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/purchase-orders/${id}/status`, { status });
      toast.success('Status updated');
      fetchOrders();
    } catch {
      toast.error('Failed to update status');
    }
  };

  /* ────────────────────── Modal ────────────────────── */

  const openModal = (order = null) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        supplier: order.supplier?._id || order.supplier || '',
        items: (order.items || []).map((i) => ({
          product: i.product?._id || i.product || '',
          productName: i.productName || '',
          quantity: i.quantity || 1,
          unitPrice: i.unitPrice || 0,
          total: i.total || 0,
        })),
        tax: order.tax || 0,
        discount: order.discount || 0,
        notes: order.notes || '',
        expectedDelivery: order.expectedDelivery
          ? new Date(order.expectedDelivery).toISOString().split('T')[0]
          : '',
      });
    } else {
      setEditingOrder(null);
      setFormData({ ...INITIAL_FORM, items: [{ ...EMPTY_ITEM }] });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOrder(null);
  };

  /* ────────────────────── Render ────────────────────── */

  if (loading && !orders.length) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Purchase Orders</h1>
        <button onClick={() => openModal()} className="btn-primary shrink-0">
          <HiOutlinePlus className="w-5 h-5" /> New Order
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
              placeholder="Search by order number or supplier..."
              className="input pl-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-800 border-b border-surface-700">
              <tr>
                <th className="table-header">Order #</th>
                <th className="table-header">Supplier</th>
                <th className="table-header">Items</th>
                <th className="table-header">Total Amount</th>
                <th className="table-header">Status</th>
                <th className="table-header">Payment</th>
                <th className="table-header">Date</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/50">
              {orders.map((order) => {
                const osCfg = orderStatusConfig[order.status] || orderStatusConfig.draft;
                const psCfg = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig.unpaid;
                return (
                  <tr key={order._id} className="table-row">
                    <td className="table-cell font-medium text-white">{order.orderNumber}</td>
                    <td className="table-cell">
                      <div>
                        <p className="text-white">{order.supplier?.name || '-'}</p>
                        {order.supplier?.company && (
                          <p className="text-xs text-slate-400">{order.supplier.company}</p>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">{order.items?.length || 0}</td>
                    <td className="table-cell font-medium text-white">{formatCurrency(order.totalAmount)}</td>
                    <td className="table-cell">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className={`${osCfg.class} text-xs font-medium rounded-full px-2.5 py-1 border-0 cursor-pointer bg-opacity-20`}
                      >
                        {['draft', 'ordered', 'received', 'partial', 'cancelled'].map((s) => (
                          <option key={s} value={s}>{orderStatusConfig[s]?.label || s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="table-cell">
                      <span className={psCfg.class}>{psCfg.label}</span>
                    </td>
                    <td className="table-cell text-slate-400">{formatDate(order.createdAt)}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openModal(order)} className="btn-ghost p-2" title="Edit">
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(order._id)}
                          className="btn-ghost p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          title="Delete"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500">
                    No purchase orders found.
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
              Page {pagination.page} of {pagination.pages} &middot; {pagination.total} total
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-ghost p-2 disabled:opacity-40"
              >
                <HiOutlineChevronLeft className="w-5 h-5" />
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-ghost p-2 disabled:opacity-40"
              >
                <HiOutlineChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Create / Edit Modal ─── */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingOrder ? 'Edit Purchase Order' : 'New Purchase Order'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Supplier + Delivery Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Supplier *</label>
              <select
                className="input"
                required
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} {s.company ? `(${s.company})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Expected Delivery</label>
              <input
                type="date"
                className="input"
                value={formData.expectedDelivery}
                onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })}
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label !mb-0">Line Items *</label>
              <button type="button" onClick={addItem} className="btn-ghost text-sm text-indigo-400">
                <HiOutlinePlus className="w-4 h-4" /> Add Item
              </button>
            </div>

            <div className="border border-surface-700 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-800 border-b border-surface-700">
                  <tr>
                    <th className="px-3 py-2 text-slate-400 font-medium">Product</th>
                    <th className="px-3 py-2 text-slate-400 font-medium w-24">Qty</th>
                    <th className="px-3 py-2 text-slate-400 font-medium w-32">Unit Price</th>
                    <th className="px-3 py-2 text-slate-400 font-medium w-28 text-right">Total</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-700/50">
                  {formData.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">
                        <select
                          className="input !py-1.5 text-sm"
                          value={item.product}
                          onChange={(e) => updateItem(idx, 'product', e.target.value)}
                          required
                        >
                          <option value="">Select product</option>
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          className="input !py-1.5 text-sm"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="input !py-1.5 text-sm"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-white font-medium">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="px-3 py-2">
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tax, Discount, Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Tax (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={formData.tax}
                onChange={(e) => setFormData({ ...formData, tax: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Discount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col justify-end">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-white font-semibold text-base">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-700">
            <button type="button" onClick={closeModal} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingOrder ? 'Update Order' : 'Create Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
