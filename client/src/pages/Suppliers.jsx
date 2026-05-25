import { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlinePhone, HiOutlineMail } from 'react-icons/hi';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  company: '',
  gstNumber: '',
  address: { street: '', city: '', state: '', zipCode: '', country: '' },
  notes: '',
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/suppliers', { params: { search, page, limit: 10 } });
      setSuppliers(res.data.suppliers || []);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSupplier) {
        await axios.put(`/suppliers/${editingSupplier._id}`, formData);
        toast.success('Supplier updated successfully');
      } else {
        await axios.post('/suppliers', formData);
        toast.success('Supplier created successfully');
      }
      closeModal();
      fetchSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await axios.delete(`/suppliers/${id}`);
      toast.success('Supplier deleted');
      fetchSuppliers();
    } catch {
      toast.error('Failed to delete supplier');
    }
  };

  const openModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        company: supplier.company || '',
        gstNumber: supplier.gstNumber || '',
        address: {
          street: supplier.address?.street || '',
          city: supplier.address?.city || '',
          state: supplier.address?.state || '',
          zipCode: supplier.address?.zipCode || '',
          country: supplier.address?.country || '',
        },
        notes: supplier.notes || '',
      });
    } else {
      setEditingSupplier(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const updateAddress = (field, value) => {
    setFormData((prev) => ({ ...prev, address: { ...prev.address, [field]: value } }));
  };

  if (loading && !suppliers.length) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Suppliers</h1>
        <button onClick={() => openModal()} className="btn-primary shrink-0">
          <HiOutlinePlus className="w-5 h-5" /> Add Supplier
        </button>
      </div>

      {/* Table Card */}
      <div className="card !p-0 overflow-hidden flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-surface-700">
          <div className="relative max-w-md">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search suppliers..."
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
                <th className="table-header">Name / Company</th>
                <th className="table-header">Contact</th>
                <th className="table-header">Location</th>
                <th className="table-header">GST</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/50">
              {suppliers.map((supplier) => (
                <tr key={supplier._id} className="table-row">
                  <td className="table-cell">
                    <div className="font-medium text-white">{supplier.name}</div>
                    {supplier.company && (
                      <div className="text-xs text-slate-500 mt-0.5">{supplier.company}</div>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-col gap-1 text-sm text-slate-400">
                      {supplier.email && (
                        <div className="flex items-center gap-1.5">
                          <HiOutlineMail size={14} /> {supplier.email}
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-1.5">
                          <HiOutlinePhone size={14} /> {supplier.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="table-cell text-slate-400">
                    {supplier.address?.city || supplier.address?.state
                      ? [supplier.address.city, supplier.address.state].filter(Boolean).join(', ')
                      : '-'}
                  </td>
                  <td className="table-cell text-slate-400 font-mono text-sm">
                    {supplier.gstNumber || '-'}
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal(supplier)} className="btn-ghost p-2" title="Edit">
                        <HiOutlinePencil />
                      </button>
                      <button
                        onClick={() => handleDelete(supplier._id)}
                        className="btn-ghost p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        title="Delete"
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-500">
                    No suppliers found.
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
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-secondary text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="btn-secondary text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input
                type="text"
                className="input"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Company</label>
              <input
                type="text"
                className="input"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                className="input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {/* GST Number */}
          <div>
            <label className="label">GST Number</label>
            <input
              type="text"
              className="input"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
            />
          </div>

          {/* Address Fields */}
          <div className="space-y-3">
            <label className="label">Address</label>
            <input
              type="text"
              className="input"
              placeholder="Street"
              value={formData.address.street}
              onChange={(e) => updateAddress('street', e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                className="input"
                placeholder="City"
                value={formData.address.city}
                onChange={(e) => updateAddress('city', e.target.value)}
              />
              <input
                type="text"
                className="input"
                placeholder="State"
                value={formData.address.state}
                onChange={(e) => updateAddress('state', e.target.value)}
              />
              <input
                type="text"
                className="input"
                placeholder="ZIP Code"
                value={formData.address.zipCode}
                onChange={(e) => updateAddress('zipCode', e.target.value)}
              />
            </div>
            <input
              type="text"
              className="input"
              placeholder="Country"
              value={formData.address.country}
              onChange={(e) => updateAddress('country', e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input min-h-[80px] resize-none"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-700">
            <button type="button" onClick={closeModal} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
