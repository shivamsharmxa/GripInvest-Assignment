import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  HiHome, 
  HiShoppingBag, 
  HiBriefcase, 
  HiUser, 
  HiChartBar,
  HiCog
} from 'react-icons/hi';

const Sidebar = () => {
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HiHome,
      description: 'Overview of your investments'
    },
    {
      name: 'Products',
      href: '/products',
      icon: HiShoppingBag,
      description: 'Browse investment products'
    },
    {
      name: 'Portfolio',
      href: '/portfolio',
      icon: HiBriefcase,
      description: 'Manage your investments'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: HiChartBar,
      description: 'Investment performance'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: HiUser,
      description: 'Account settings'
    }
  ];

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 overflow-y-auto">
        {/* Logo/Brand */}
        <div className="flex items-center flex-shrink-0 px-6 pb-4">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">GI</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Grip Invest</h1>
              <p className="text-xs text-gray-500">Investment Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={item.description}
              >
                <Icon
                  className={`mr-3 h-5 w-5 transition-colors duration-200 ${
                    active 
                      ? 'text-blue-500' 
                      : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <span className="truncate">{item.name}</span>
                </div>
                {active && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiChartBar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Portfolio Value
                </p>
                <p className="text-lg font-bold text-blue-600">
                  ₹2,45,000
                </p>
                <p className="text-xs text-green-600">
                  +12.5% this month
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="flex-shrink-0 p-3">
          <button
            className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
            title="Settings"
          >
            <HiCog className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
            Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;