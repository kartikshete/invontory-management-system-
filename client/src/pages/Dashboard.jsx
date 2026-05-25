import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import axios from '../api/axios';
import StatsCard from '../components/common/StatsCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  HiOutlineCube,
  HiOutlineCurrencyRupee,
  HiOutlineExclamation,
  HiOutlineUsers,
  HiOutlineTruck,
  HiOutlineTag,
  HiOutlineRefresh,
} from 'react-icons/hi';
import { formatCurrency, formatDate, orderStatusConfig, paymentStatusConfig } from '../utils/helpers';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

/* ─── Fallback dummy data if the API call fails ─── */
const DUMMY_DATA = {
  stats: {
    totalProducts: 148,
    lowStockProducts: 12,
    totalCategories: 8,
    totalSuppliers: 23,
    totalCustomers: 94,
    inventoryValueCost: 1250000,
    inventoryValueRetail: 1875000,
  },
  recentSales: [
    { _id: '1', orderNumber: 'SO-0001', customer: { name: 'Demo Customer' }, totalAmount: 45000, status: 'delivered', createdAt: new Date().toISOString() },
    { _id: '2', orderNumber: 'SO-0002', customer: { name: 'Sample Buyer' }, totalAmount: 23500, status: 'confirmed', createdAt: new Date().toISOString() },
  ],
  recentPurchases: [
    { _id: '1', orderNumber: 'PO-0001', supplier: { name: 'Demo Supplier' }, totalAmount: 67000, status: 'received', createdAt: new Date().toISOString() },
    { _id: '2', orderNumber: 'PO-0002', supplier: { name: 'Sample Vendor' }, totalAmount: 34200, status: 'ordered', createdAt: new Date().toISOString() },
  ],
  charts: {
    monthlySales: [
      { _id: 'Jan', total: 125000, count: 12 },
      { _id: 'Feb', total: 198000, count: 18 },
      { _id: 'Mar', total: 310000, count: 25 },
      { _id: 'Apr', total: 275000, count: 22 },
      { _id: 'May', total: 420000, count: 30 },
      { _id: 'Jun', total: 380000, count: 28 },
    ],
    monthlyPurchases: [
      { _id: 'Jan', total: 95000, count: 8 },
      { _id: 'Feb', total: 150000, count: 12 },
      { _id: 'Mar', total: 230000, count: 18 },
      { _id: 'Apr', total: 200000, count: 15 },
      { _id: 'May', total: 310000, count: 22 },
      { _id: 'Jun', total: 280000, count: 20 },
    ],
    topProducts: [
      { _id: 'Product A', totalQuantity: 120, totalRevenue: 360000 },
      { _id: 'Product B', totalQuantity: 95, totalRevenue: 285000 },
      { _id: 'Product C', totalQuantity: 80, totalRevenue: 240000 },
      { _id: 'Product D', totalQuantity: 65, totalRevenue: 195000 },
      { _id: 'Product E', totalQuantity: 50, totalRevenue: 150000 },
    ],
    categoryDistribution: [
      { name: 'Electronics', color: '#6366f1', count: 40, totalValue: 500000 },
      { name: 'Furniture', color: '#10b981', count: 25, totalValue: 310000 },
      { name: 'Office', color: '#f59e0b', count: 35, totalValue: 220000 },
      { name: 'Kitchen', color: '#ef4444', count: 20, totalValue: 140000 },
    ],
  },
};

/* ─── Chart defaults for dark theme ─── */
const CHART_DARK = {
  color: 'rgba(255,255,255,0.7)',
  gridColor: 'rgba(255,255,255,0.08)',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await axios.get('/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
      toast.error('Failed to load dashboard — showing sample data');
      setData(DUMMY_DATA);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  const { stats, recentSales, recentPurchases, charts } = data || DUMMY_DATA;

  /* ─── Monthly Sales & Purchases bar chart ─── */
  const monthlySalesData = {
    labels: (charts?.monthlySales || []).map((m) => m._id),
    datasets: [
      {
        label: 'Sales',
        data: (charts?.monthlySales || []).map((m) => m.total),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: 'Purchases',
        data: (charts?.monthlyPurchases || []).map((m) => m.total),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: CHART_DARK.gridColor },
        ticks: {
          color: CHART_DARK.color,
          callback: (v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`),
        },
      },
      x: {
        grid: { display: false },
        ticks: { color: CHART_DARK.color },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: CHART_DARK.color, usePointStyle: true, pointStyleWidth: 10, padding: 20 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`,
        },
      },
    },
  };

  /* ─── Category Distribution doughnut ─── */
  const categoryData = {
    labels: (charts?.categoryDistribution || []).map((c) => c.name),
    datasets: [
      {
        data: (charts?.categoryDistribution || []).map((c) => c.count),
        backgroundColor: (charts?.categoryDistribution || []).map(
          (c) => c.color || 'rgba(99,102,241,0.8)'
        ),
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: CHART_DARK.color, usePointStyle: true, padding: 16 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const item = (charts?.categoryDistribution || [])[ctx.dataIndex];
            return `${ctx.label}: ${ctx.raw} products (${formatCurrency(item?.totalValue || 0)})`;
          },
        },
      },
    },
  };

  /* ─── Top Products bar chart ─── */
  const topProductsData = {
    labels: (charts?.topProducts || []).map((p) => p._id),
    datasets: [
      {
        label: 'Revenue',
        data: (charts?.topProducts || []).map((p) => p.totalRevenue),
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 0,
        borderRadius: 6,
      },
    ],
  };

  const topProductsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: CHART_DARK.gridColor },
        ticks: {
          color: CHART_DARK.color,
          callback: (v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`),
        },
      },
      y: {
        grid: { display: false },
        ticks: { color: CHART_DARK.color },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `Revenue: ${formatCurrency(ctx.raw)}`,
        },
      },
    },
  };

  /* ─── Status badge helper ─── */
  const renderStatusBadge = (status) => {
    const cfg = orderStatusConfig[status] || { label: status, class: 'badge-neutral' };
    return <span className={cfg.class}>{cfg.label}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back — here's what's happening with your inventory
          </p>
        </div>
        <button onClick={fetchDashboard} className="btn-ghost text-sm flex items-center gap-1.5">
          <HiOutlineRefresh className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm rounded-lg px-4 py-3">
          ⚠️ Could not load live data. Displaying sample information.
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Total Products"
          value={stats?.totalProducts ?? 0}
          icon={HiOutlineCube}
          color="primary"
        />
        <StatsCard
          title="Inventory Value"
          value={formatCurrency(stats?.inventoryValueRetail ?? 0)}
          icon={HiOutlineCurrencyRupee}
          color="emerald"
          trend={`Cost: ${formatCurrency(stats?.inventoryValueCost ?? 0)}`}
        />
        <StatsCard
          title="Low Stock Alerts"
          value={stats?.lowStockProducts ?? 0}
          icon={HiOutlineExclamation}
          color="red"
          trend={stats?.lowStockProducts > 0 ? 'Needs attention' : 'All good'}
        />
        <StatsCard
          title="Total Customers"
          value={stats?.totalCustomers ?? 0}
          icon={HiOutlineUsers}
          color="amber"
        />
        <StatsCard
          title="Total Suppliers"
          value={stats?.totalSuppliers ?? 0}
          icon={HiOutlineTruck}
          color="blue"
        />
        <StatsCard
          title="Categories"
          value={stats?.totalCategories ?? 0}
          icon={HiOutlineTag}
          color="purple"
        />
      </div>

      {/* Charts Row 1: Monthly Sales & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold text-white mb-4">Monthly Sales & Purchases</h2>
          <div className="h-80">
            <Bar data={monthlySalesData} options={barOptions} />
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Category Distribution</h2>
          <div className="h-80 flex items-center justify-center">
            <Doughnut data={categoryData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Charts Row 2: Top Products */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Top Products by Revenue</h2>
        <div className="h-72">
          <Bar data={topProductsData} options={topProductsOptions} />
        </div>
      </div>

      {/* Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Sales</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Order #</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Date</th>
                </tr>
              </thead>
              <tbody>
                {(recentSales || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="table-cell text-center text-slate-500">
                      No recent sales
                    </td>
                  </tr>
                ) : (
                  (recentSales || []).map((sale) => (
                    <tr key={sale._id} className="table-row">
                      <td className="table-cell font-medium text-white">{sale.orderNumber}</td>
                      <td className="table-cell">{sale.customer?.name || '-'}</td>
                      <td className="table-cell font-medium text-emerald-400">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="table-cell">{renderStatusBadge(sale.status)}</td>
                      <td className="table-cell text-slate-400">{formatDate(sale.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Purchases</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Order #</th>
                  <th className="table-header">Supplier</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Date</th>
                </tr>
              </thead>
              <tbody>
                {(recentPurchases || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="table-cell text-center text-slate-500">
                      No recent purchases
                    </td>
                  </tr>
                ) : (
                  (recentPurchases || []).map((po) => (
                    <tr key={po._id} className="table-row">
                      <td className="table-cell font-medium text-white">{po.orderNumber}</td>
                      <td className="table-cell">{po.supplier?.name || '-'}</td>
                      <td className="table-cell font-medium text-blue-400">
                        {formatCurrency(po.totalAmount)}
                      </td>
                      <td className="table-cell">{renderStatusBadge(po.status)}</td>
                      <td className="table-cell text-slate-400">{formatDate(po.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
