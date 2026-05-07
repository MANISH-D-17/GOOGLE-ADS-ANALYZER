import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  Activity, 
  Settings,
  HelpCircle,
  Target,
  ImageIcon,
  ShoppingBag
} from 'lucide-react';
import { cn } from '../lib/utils';

const Sidebar: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'skus', label: 'SKU Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'keywords', label: 'Keyword Intel', icon: Target, path: '/keywords' },
    { id: 'creatives', label: 'Creative Hub', icon: ImageIcon, path: '/creatives' },
    { id: 'feed', label: 'Feed Health', icon: ShoppingBag, path: '/feed-health' },
    { id: 'campaigns', label: 'Campaigns', icon: BarChart3, path: '/campaigns' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r border-gray-100 z-50 transition-all duration-300 ease-in-out shadow-xl shadow-gray-200/50 md:block hidden",
        isHovered ? "w-64" : "w-16"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-4 border-b border-gray-50">
          <div className="flex items-center justify-center flex-shrink-0 transition-all duration-500 hover:drop-shadow-[0_0_8px_rgba(37,99,235,0.8)] hover:scale-110 cursor-pointer text-blue-600">
            <Activity size={24} strokeWidth={3} />
          </div>
          {isHovered && (
            <span className="ml-3 font-bold text-gray-900 truncate">
              Kalai <span className="text-blue-600">Works</span>
            </span>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center rounded-xl p-2 transition-all group",
                isActive(item.path)
                  ? "bg-blue-50 text-blue-600" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <div className="w-10 flex items-center justify-center flex-shrink-0">
                <item.icon size={20} className={cn(
                  "transition-colors",
                  isActive(item.path) ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                )} />
              </div>
              {isHovered && (
                <span className="ml-2 text-sm font-semibold whitespace-nowrap opacity-100 transition-opacity duration-300">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer Area */}
        <div className="p-3 border-t border-gray-50 space-y-2">
          <button className="w-full flex items-center rounded-xl p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 group">
            <div className="w-10 flex items-center justify-center flex-shrink-0">
              <Settings size={20} className="text-gray-400 group-hover:text-gray-600" />
            </div>
            {isHovered && <span className="ml-2 text-sm font-semibold">Settings</span>}
          </button>
          <button className="w-full flex items-center rounded-xl p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 group">
            <div className="w-10 flex items-center justify-center flex-shrink-0">
              <HelpCircle size={20} className="text-gray-400 group-hover:text-gray-600" />
            </div>
            {isHovered && <span className="ml-2 text-sm font-semibold">Help Center</span>}
          </button>
          <div className="h-10 flex items-center p-2 mt-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white overflow-hidden flex-shrink-0">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
            </div>
            {isHovered && (
              <div className="ml-3 overflow-hidden">
                <div className="text-xs font-bold text-gray-900 truncate">Twin Birds Admin</div>
                <div className="text-[10px] text-gray-400 truncate">admin@twinbirds.com</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
