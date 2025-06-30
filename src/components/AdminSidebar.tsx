
import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  CreditCard, 
  Truck, 
  BarChart3, 
  Settings,
  UserCog,
  Activity,
  FolderTree
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  adminUser: any;
}

const AdminSidebar = ({ activeTab, onTabChange, adminUser }: AdminSidebarProps) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'admins', label: 'Admin Users', icon: UserCog },
    { id: 'activity', label: 'Activity Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <UserCog className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{adminUser?.full_name}</p>
            <p className="text-sm text-gray-500 capitalize">{adminUser?.role}</p>
          </div>
        </div>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default AdminSidebar;
