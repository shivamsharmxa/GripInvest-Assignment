import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area - Add left margin to account for fixed sidebar */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        {/* Top Navigation */}
        <Navbar />
        
        {/* Main Content */}
        <main className="flex-1 bg-white">
          <div className="container mx-auto px-6 py-8 max-w-7xl min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;