/** Format a number as Indian Rupee currency */
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

/** Format a date string to a readable locale format */
export const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

/** Format a date with time */
export const formatDateTime = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

/** Map stock status to display label */
export const stockStatusLabel = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
};

/** Map order status to display properties */
export const orderStatusConfig = {
  draft: { label: 'Draft', class: 'badge-neutral' },
  ordered: { label: 'Ordered', class: 'badge-info' },
  confirmed: { label: 'Confirmed', class: 'badge-info' },
  received: { label: 'Received', class: 'badge-success' },
  shipped: { label: 'Shipped', class: 'badge-info' },
  delivered: { label: 'Delivered', class: 'badge-success' },
  partial: { label: 'Partial', class: 'badge-warning' },
  cancelled: { label: 'Cancelled', class: 'badge-danger' },
};

export const paymentStatusConfig = {
  unpaid: { label: 'Unpaid', class: 'badge-danger' },
  partial: { label: 'Partial', class: 'badge-warning' },
  paid: { label: 'Paid', class: 'badge-success' },
};
