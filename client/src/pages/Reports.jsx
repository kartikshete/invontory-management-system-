import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  HiOutlineDocumentDownload,
  HiOutlineCube,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineCalendar,
  HiOutlineCurrencyRupee,
  HiOutlineExclamation,
  HiOutlineClipboardList,
} from 'react-icons/hi';
import { formatCurrency, formatDate, orderStatusConfig, paymentStatusConfig } from '../utils/helpers';

const TABS = [
  { key: 'inventory', label: 'Inventory Report', icon: HiOutlineCube },
  { key: 'sales', label: 'Sales Report', icon: HiOutlineTrendingUp },
  { key: 'purchases', label: 'Purchase Report', icon: HiOutlineTrendingDown },
];

const defaultDates = () => {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 1);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [dates, setDates] = useState(defaultDates);

  /* ────────────────────── Fetch ────────────────────── */

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'inventory') {
        params.startDate = dates.startDate;
        params.endDate = dates.endDate;
      }
      const res = await api.get(`/reports/${activeTab}`, { params });
      setReportData(res.data);
    } catch {
      toast.error(`Failed to load ${activeTab} report`);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [activeTab, dates]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  /* ────────────────────── Export ────────────────────── */

  const handleExport = async (format) => {
    const toastId = toast.loading(`Preparing ${format.toUpperCase()} export...`);
    try {
      const params = { type: activeTab };
      if (activeTab !== 'inventory') {
        params.startDate = dates.startDate;
        params.endDate = dates.endDate;
      }
      const res = await api.get(`/reports/export/${format}`, {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const ext = format === 'excel' ? 'xlsx' : 'pdf';
      link.setAttribute('download', `${activeTab}_report_${new Date().toISOString().split('T')[0]}.${ext}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Export downloaded successfully', { id: toastId });
    } catch {
      toast.error('Export failed. Check your permissions.', { id: toastId });
    }
  };

  /* ────────────────────── Summary Cards ────────────────────── */

  const renderSummaryCards = () => {
    if (!reportData) return null;

    if (activeTab === 'inventory') {
      const summary = reportData.summary || {};
      const cards = [
        { label: 'Total Products', value: summary.totalProducts ?? 0, icon: HiOutlineCube, color: 'text-indigo-400' },
        { label: 'Total Value', value: formatCurrency(summary.totalValue ?? 0), icon: HiOutlineCurrencyRupee, color: 'text-green-400' },
        { label: 'Low Stock Items', value: summary.lowStockItems ?? 0, icon: HiOutlineExclamation, color: 'text-amber-400' },
        { label: 'Out of Stock', value: summary.outOfStockItems ?? 0, icon: HiOutlineExclamation, color: 'text-red-400' },
      ];
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="card">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-surface-700 ${c.color}`}>
                  <c.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">{c.label}</p>
                  <p className="text-xl font-bold text-white">{c.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'sales') {
      const summary = reportData.summary || {};
      const cards = [
        { label: 'Total Orders', value: summary.totalOrders ?? 0, icon: HiOutlineClipboardList, color: 'text-indigo-400' },
        { label: 'Total Revenue', value: formatCurrency(summary.totalRevenue ?? 0), icon: HiOutlineCurrencyRupee, color: 'text-green-400' },
        { label: 'Delivered', value: summary.deliveredOrders ?? 0, icon: HiOutlineTrendingUp, color: 'text-emerald-400' },
        { label: 'Pending', value: summary.pendingOrders ?? 0, icon: HiOutlineCalendar, color: 'text-amber-400' },
      ];
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="card">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-surface-700 ${c.color}`}>
                  <c.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">{c.label}</p>
                  <p className="text-xl font-bold text-white">{c.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'purchases') {
      const summary = reportData.summary || {};
      const cards = [
        { label: 'Total Orders', value: summary.totalOrders ?? 0, icon: HiOutlineClipboardList, color: 'text-indigo-400' },
        { label: 'Total Spent', value: formatCurrency(summary.totalSpent ?? 0), icon: HiOutlineCurrencyRupee, color: 'text-red-400' },
        { label: 'Received', value: summary.receivedOrders ?? 0, icon: HiOutlineTrendingDown, color: 'text-emerald-400' },
        { label: 'Pending', value: summary.pendingOrders ?? 0, icon: HiOutlineCalendar, color: 'text-amber-400' },
      ];
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="card">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-surface-700 ${c.color}`}>
                  <c.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">{c.label}</p>
                  <p className="text-xl font-bold text-white">{c.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  /* ────────────────────── Tables ────────────────────── */

  const renderInventoryTable = () => {
    const items = reportData?.products || reportData?.items || [];
    return (
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface-800 border-b border-surface-700">
          <tr>
            <th className="table-header">Product</th>
            <th className="table-header">SKU</th>
            <th className="table-header">Category</th>
            <th className="table-header text-right">Quantity</th>
            <th className="table-header text-right">Cost Price</th>
            <th className="table-header text-right">Selling Price</th>
            <th className="table-header text-right">Stock Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-700/50">
          {items.map((item, idx) => (
            <tr key={item._id || idx} className="table-row">
              <td className="table-cell font-medium text-white">{item.name}</td>
              <td className="table-cell text-slate-400">{item.sku}</td>
              <td className="table-cell text-slate-400">{item.category?.name || '-'}</td>
              <td className="table-cell text-right">
                <span className={item.quantity <= (item.minStockLevel || 0) ? 'text-amber-400 font-medium' : ''}>
                  {item.quantity} {item.unit || ''}
                </span>
              </td>
              <td className="table-cell text-right">{formatCurrency(item.costPrice)}</td>
              <td className="table-cell text-right">{formatCurrency(item.sellingPrice)}</td>
              <td className="table-cell text-right font-medium text-indigo-400">
                {formatCurrency((item.quantity || 0) * (item.costPrice || 0))}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan="7" className="text-center py-12 text-slate-500">No inventory data available.</td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  const renderSalesTable = () => {
    const items = reportData?.orders || reportData?.items || [];
    return (
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface-800 border-b border-surface-700">
          <tr>
            <th className="table-header">Order #</th>
            <th className="table-header">Date</th>
            <th className="table-header">Customer</th>
            <th className="table-header">Items</th>
            <th className="table-header">Status</th>
            <th className="table-header">Payment</th>
            <th className="table-header text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-700/50">
          {items.map((order, idx) => {
            const osCfg = orderStatusConfig[order.status] || orderStatusConfig.draft;
            const psCfg = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig.unpaid;
            return (
              <tr key={order._id || idx} className="table-row">
                <td className="table-cell font-medium text-white">{order.orderNumber}</td>
                <td className="table-cell text-slate-400">{formatDate(order.createdAt)}</td>
                <td className="table-cell">{order.customer?.name || '-'}</td>
                <td className="table-cell">{order.items?.length || 0}</td>
                <td className="table-cell"><span className={osCfg.class}>{osCfg.label}</span></td>
                <td className="table-cell"><span className={psCfg.class}>{psCfg.label}</span></td>
                <td className="table-cell text-right font-medium text-green-400">
                  {formatCurrency(order.totalAmount)}
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan="7" className="text-center py-12 text-slate-500">No sales data for this period.</td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  const renderPurchasesTable = () => {
    const items = reportData?.orders || reportData?.items || [];
    return (
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface-800 border-b border-surface-700">
          <tr>
            <th className="table-header">Order #</th>
            <th className="table-header">Date</th>
            <th className="table-header">Supplier</th>
            <th className="table-header">Items</th>
            <th className="table-header">Status</th>
            <th className="table-header">Payment</th>
            <th className="table-header text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-700/50">
          {items.map((order, idx) => {
            const osCfg = orderStatusConfig[order.status] || orderStatusConfig.draft;
            const psCfg = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig.unpaid;
            return (
              <tr key={order._id || idx} className="table-row">
                <td className="table-cell font-medium text-white">{order.orderNumber}</td>
                <td className="table-cell text-slate-400">{formatDate(order.createdAt)}</td>
                <td className="table-cell">{order.supplier?.name || '-'}</td>
                <td className="table-cell">{order.items?.length || 0}</td>
                <td className="table-cell"><span className={osCfg.class}>{osCfg.label}</span></td>
                <td className="table-cell"><span className={psCfg.class}>{psCfg.label}</span></td>
                <td className="table-cell text-right font-medium text-red-400">
                  {formatCurrency(order.totalAmount)}
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan="7" className="text-center py-12 text-slate-500">No purchase data for this period.</td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  /* ────────────────────── Main Render ────────────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Reports &amp; Analytics</h1>
        <div className="flex gap-2">
          <button onClick={() => handleExport('pdf')} className="btn-secondary">
            <HiOutlineDocumentDownload className="w-5 h-5" /> Export PDF
          </button>
          <button onClick={() => handleExport('excel')} className="btn-primary">
            <HiOutlineDocumentDownload className="w-5 h-5" /> Export Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-700 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab.key
                ? 'bg-indigo-500/10 text-indigo-400'
                : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Date Range Filters (for sales and purchases) */}
      {activeTab !== 'inventory' && (
        <div className="card">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input"
                value={dates.startDate}
                onChange={(e) => setDates((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                className="input"
                value={dates.endDate}
                onChange={(e) => setDates((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <button onClick={fetchReport} className="btn-primary h-[42px]">
              <HiOutlineCalendar className="w-4 h-4" /> Apply
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && renderSummaryCards()}

      {/* Data Table */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'inventory' && renderInventoryTable()}
            {activeTab === 'sales' && renderSalesTable()}
            {activeTab === 'purchases' && renderPurchasesTable()}
          </div>
        )}
      </div>
    </div>
  );
}
