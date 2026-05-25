import { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlinePhone, HiOutlineMail } from 'react-icons/hi';
import { formatCurrency } from '../utils/helpers';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  company: '',
  address: '',
  gstNumber: '',
  notes: '',
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/customers', { params: { search, page, limit: 10 } });
      setCustomers(res.data.customers || []);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCustomer) {
        await axios.put(`/customers/${editingCustomer._id}`, formData);
        toast.success('Customer updated successfully');
      } else {
        await axios.post('/customers', formData);
        toast.success('Customer created successfully');
      }
      closeModal();
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await axios.delete(`/customers/${id}`);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch {
      toast.error('Failed to delete customer');
    }
  };

  const openModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
        address: customer.address || '',
        gstNumber: customer.gstNumber || '',
        notes: customer.notes || '',
      });
    } else {
      setEditingCustomer(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  if (loading && !customers.length) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <button onClick={() => openModal()} className="btn-primary shrink-0">
          <HiOutlinePlus className="w-5 h-5" /> Add Customer
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
              placeholder="Search customers..."
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
                <th className="table-header">Total Orders</th>
                <th className="table-header">Total Spent</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/50">
              {customers.map((customer) => (
                <tr key={customer._id} className="table-row">
                  <td className="table-cell">
                    <div className="font-medium text-white">{customer.name}</div>
                    {customer.company && (
                      <div className="text-xs text-slate-500 mt-0.5">{customer.company}</div>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-col gap-1 text-sm text-slate-400">
                      {customer.email && (
                        <div className="flex items-center gap-1.5">
                          <HiOutlineMail size={14} /> {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-1.5">
                          <HiOutlinePhone size={14} /> {customer.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="table-cell text-white font-medium">
                    {customer.totalOrders ?? 0}
                  </td>
                  <td className="table-cell text-white font-medium">
                    {formatCurrency(customer.totalSpent ?? 0)}
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal(customer)} className="btn-ghost p-2" title="Edit">
                        <HiOutlinePencil />
                      </button>
                      <button
                        onClick={() => handleDelete(customer._id)}
                        className="btn-ghost p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        title="Delete"
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-500">
                    No customers found.
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
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCustomer ? 'Edit Customer' : 'Add New Customer'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Read-only stats when editing */}
          {editingCustomer && (
            <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-surface-800/50 border border-surface-700">
              <div>
                <span className="text-xs text-slate-500">Total Orders</span>
                <p className="text-white font-semibold">{editingCustomer.totalOrders ?? 0}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Total Spent</span>
                <p className="text-white font-semibold">{formatCurrency(editingCustomer.totalSpent ?? 0)}</p>
              </div>
            </div>
          )}

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

          {/* Address */}
          <div>
            <label className="label">Address</label>
            <textarea
              className="input min-h-[80px] resize-none"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
              {submitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
