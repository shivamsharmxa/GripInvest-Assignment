import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { productsAPI, investmentAPI } from '../services/api';
import { 
  HiTrendingUp, 
  HiTrendingDown, 
  HiBriefcase, 
  HiCurrencyRupee,
  HiEye,
  HiPlusCircle,
  HiUser
} from 'react-icons/hi';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    portfolioSummary: null,
    recentInvestments: [],
    trendingProducts: [],
    portfolioInsights: null
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all dashboard data in parallel
      const [portfolioRes, trendingRes, insightsRes] = await Promise.all([
        investmentAPI.getPortfolio({ limit: 5 }),
        productsAPI.getTrending(),
        investmentAPI.getPortfolioInsights()
      ]);

      setDashboardData({
        portfolioSummary: portfolioRes.data?.summary || null,
        recentInvestments: portfolioRes.data?.investments || [],
        trendingProducts: trendingRes.data || [],
        portfolioInsights: insightsRes.data || null
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sample data for charts when API data is not available
  const performanceData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Apr', value: 4500 },
    { name: 'May', value: 6000 },
    { name: 'Jun', value: 5500 },
  ];

  const allocationData = [
    { name: 'Corporate Bonds', value: 40, color: '#3B82F6' },
    { name: 'Alternative Investments', value: 30, color: '#8B5CF6' },
    { name: 'Real Estate', value: 20, color: '#10B981' },
    { name: 'Commodities', value: 10, color: '#F59E0B' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" text="Loading dashboard..." />
      </div>
    );
  }

  const { portfolioSummary, recentInvestments, trendingProducts } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.firstName}!
            </h1>
            <p className="text-blue-100">
              Here's an overview of your investment portfolio
            </p>
          </div>
          <div className="hidden md:block">
            <Link
              to="/products"
              className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg text-white hover:bg-opacity-30 transition-all duration-200"
            >
              <HiPlusCircle className="mr-2 h-5 w-5" />
              New Investment
            </Link>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HiCurrencyRupee className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{portfolioSummary?.totalValue?.toLocaleString() || '2,45,000'}
              </p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <HiTrendingUp className="h-4 w-4 mr-1" />
                +12.5%
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <HiBriefcase className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Investments</p>
              <p className="text-2xl font-bold text-gray-900">
                {portfolioSummary?.activeInvestments || 8}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {portfolioSummary?.totalInvestments || 12} total
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <HiTrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Returns</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{portfolioSummary?.totalReturns?.toLocaleString() || '28,450'}
              </p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <HiTrendingUp className="h-4 w-4 mr-1" />
                +8.2%
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <HiCurrencyRupee className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Income</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{portfolioSummary?.monthlyIncome?.toLocaleString() || '4,200'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                From {portfolioSummary?.incomeGeneratingAssets || 5} assets
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Performance */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Portfolio Performance</h3>
            <select className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Last 6 months</option>
              <option>Last year</option>
              <option>All time</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip 
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Portfolio Value']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Asset Allocation</h3>
            <Link to="/portfolio" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
              View Details
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({name, value}) => `${name}: ${value}%`}
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity & Trending Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Investments */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Investments</h3>
            <Link to="/portfolio" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {recentInvestments.length > 0 ? (
              recentInvestments.map((investment) => (
                <div key={investment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <HiBriefcase className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {investment.productName || investment.product?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(investment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ₹{investment.amount?.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600">
                      {investment.expectedReturn}% returns
                    </p>
                  </div>
                </div>
              ))
            ) : (
              // Sample data when no recent investments
              [1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <HiBriefcase className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        Corporate Bond {i}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(Date.now() - i * 86400000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ₹{(50000 + i * 10000).toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600">
                      {8 + i}% returns
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Trending Products */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Trending Products</h3>
            <Link to="/products" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
              Explore All
            </Link>
          </div>
          <div className="space-y-4">
            {trendingProducts.length > 0 ? (
              trendingProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <HiTrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {product.expectedReturn}%
                    </p>
                    <Link
                      to={`/products/${product.id}`}
                      className="text-xs text-blue-600 hover:text-blue-500 inline-flex items-center"
                    >
                      <HiEye className="h-3 w-3 mr-1" />
                      View
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              // Sample data when no trending products
              [
                { name: 'Alternative Investment Fund', category: 'AIF', return: '15.2' },
                { name: 'Corporate Bond Series A', category: 'Bonds', return: '12.8' },
                { name: 'Real Estate Investment', category: 'REIT', return: '14.5' },
                { name: 'Commodity Fund', category: 'Commodities', return: '11.3' }
              ].map((product, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <HiTrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {product.return}%
                    </p>
                    <Link
                      to="/products"
                      className="text-xs text-blue-600 hover:text-blue-500 inline-flex items-center"
                    >
                      <HiEye className="h-3 w-3 mr-1" />
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/products"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200 group"
          >
            <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors duration-200">
              <HiPlusCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">New Investment</p>
              <p className="text-xs text-gray-600">Browse available products</p>
            </div>
          </Link>

          <Link
            to="/portfolio"
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200 group"
          >
            <div className="p-2 bg-green-600 rounded-lg group-hover:bg-green-700 transition-colors duration-200">
              <HiBriefcase className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">View Portfolio</p>
              <p className="text-xs text-gray-600">Track your investments</p>
            </div>
          </Link>

          <Link
            to="/profile"
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200 group"
          >
            <div className="p-2 bg-purple-600 rounded-lg group-hover:bg-purple-700 transition-colors duration-200">
              <HiUser className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Update Profile</p>
              <p className="text-xs text-gray-600">Manage your account</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;