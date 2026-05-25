import { NavLink } from 'react-router-dom';
import { HiOutlineViewGrid, HiOutlineCube, HiOutlineTag, HiOutlineTruck, HiOutlineUsers, HiOutlineDocumentText, HiOutlineChartBar, HiOutlineShoppingCart, HiOutlineClipboardList, HiOutlineX } from 'react-icons/hi';

const navigation = [
  { name: 'Dashboard', path: '/', icon: HiOutlineViewGrid },
  { name: 'Products', path: '/products', icon: HiOutlineCube },
  { name: 'Categories', path: '/categories', icon: HiOutlineTag },
  { name: 'Suppliers', path: '/suppliers', icon: HiOutlineTruck },
  { name: 'Customers', path: '/customers', icon: HiOutlineUsers },
  { name: 'Purchases', path: '/purchase-orders', icon: HiOutlineShoppingCart },
  { name: 'Sales', path: '/sales-orders', icon: HiOutlineClipboardList },
  { name: 'Reports', path: '/reports', icon: HiOutlineChartBar },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />}

      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-surface-800 border-r border-surface-700/50 flex flex-col transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-surface-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">IV</div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary-400 to-primary-200 bg-clip-text text-transparent">InnoVentory</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white"><HiOutlineX className="w-5 h-5" /></button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-600/15 text-primary-400 border border-primary-500/20'
                    : 'text-slate-400 hover:bg-surface-700/50 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-surface-700/50">
          <p className="text-xs text-slate-600 text-center">InnoVentory v1.0</p>
        </div>
      </aside>
    </>
  );
}
