import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { investmentAPI } from '../services/api';
import { 
  HiTrendingUp, 
  HiTrendingDown, 
  HiBriefcase, 
  HiCurrencyRupee,
  HiEye,
  HiPencil,
  HiTrash,
  HiFilter,
  HiDownload,
  HiRefresh,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiExclamationCircle
} from 'react-icons/hi';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const Portfolio = () => {
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState({
    summary: null,
    investments: [],
    insights: null
  });
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadPortfolio();
  }, [filters]);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const [portfolioRes, insightsRes] = await Promise.all([
        investmentAPI.getPortfolio({
          status: filters.status !== 'all' ? filters.status : undefined,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder
        }),
        investmentAPI.getPortfolioInsights()
      ]);

      setPortfolio({
        summary: portfolioRes.data?.summary || getSampleSummary(),
        investments: portfolioRes.data?.investments || getSampleInvestments(),
        insights: insightsRes.data || getSampleInsights()
      });
    } catch (error) {
      console.error('Failed to load portfolio:', error);
      // Fallback to sample data
      setPortfolio({
        summary: getSampleSummary(),
        investments: getSampleInvestments(),
        insights: getSampleInsights()
      });
    } finally {
      setLoading(false);
    }
  };

  const getSampleSummary = () => ({
    totalValue: 245000,
    totalInvested: 200000,
    totalReturns: 45000,
    unrealizedGains: 28000,
    realizedGains: 17000,
    activeInvestments: 8,
    maturedInvestments: 4,
    totalInvestments: 12,
    monthlyIncome: 4200,
    portfolioReturn: 22.5,
    riskScore: 6.2
  });

  const getSampleInvestments = () => [
    {
      id: '1',
      productId: '1',
      productName: 'Corporate Bond Series A',
      category: 'Corporate Bonds',
      amount: 50000,
      currentValue: 58500,
      expectedReturn: 12.5,
      actualReturn: 17.0,
      status: 'active',
      createdAt: '2024-01-15',
      maturityDate: '2025-12-15',
      tenure: 24,
      monthsRemaining: 8,
      issuer: 'ABC Corporation',
      riskLevel: 'Low'
    },
    {
      id: '2',
      productId: '2',
      productName: 'Alternative Investment Fund',
      category: 'Alternative Investment Fund',
      amount: 100000,
      currentValue: 122000,
      expectedReturn: 18.2,
      actualReturn: 22.0,
      status: 'active',
      createdAt: '2024-02-01',
      maturityDate: '2026-02-01',
      tenure: 36,
      monthsRemaining: 18,
      issuer: 'XYZ Asset Management',
      riskLevel: 'High'
    },
    {
      id: '3',
      productId: '3',
      productName: 'Real Estate Investment Trust',
      category: 'Real Estate',
      amount: 50000,
      currentValue: 46500,
      expectedReturn: 14.8,
      actualReturn: -7.0,
      status: 'active',
      createdAt: '2024-03-10',
      maturityDate: '2027-03-10',
      tenure: 60,
      monthsRemaining: 42,
      issuer: 'Property Trust Ltd',
      riskLevel: 'Moderate'
    },
    {
      id: '4',
      productId: '4',
      productName: 'Corporate Bond Series B',
      category: 'Corporate Bonds',
      amount: 25000,
      currentValue: 28750,
      expectedReturn: 11.5,
      actualReturn: 15.0,
      status: 'matured',
      createdAt: '2023-06-01',
      maturityDate: '2024-06-01',
      tenure: 12,
      monthsRemaining: 0,
      issuer: 'DEF Corporation',
      riskLevel: 'Low'
    }
  ];

  const getSampleInsights = () => ({
    allocation: [
      { name: 'Corporate Bonds', value: 40, amount: 98000, color: '#3B82F6' },
      { name: 'Alternative Investments', value: 30, amount: 73500, color: '#8B5CF6' },
      { name: 'Real Estate', value: 20, amount: 49000, color: '#10B981' },
      { name: 'Others', value: 10, amount: 24500, color: '#F59E0B' }
    ],
    performance: [
      { month: 'Jan', returns: 2.5 },
      { month: 'Feb', returns: 3.2 },
      { month: 'Mar', returns: -1.1 },
      { month: 'Apr', returns: 4.5 },
      { month: 'May', returns: 3.8 },
      { month: 'Jun', returns: 5.2 }
    ],
    riskMetrics: {
      volatility: 12.5,
      sharpeRatio: 1.8,
      maxDrawdown: -8.2,
      beta: 0.85
    }
  });

  const handleCancelInvestment = async (investmentId) => {
    if (!window.confirm('Are you sure you want to cancel this investment?')) {
      return;
    }

    try {
      const response = await investmentAPI.cancelInvestment(investmentId);
      if (response.success) {
        toast.success('Investment cancelled successfully');
        loadPortfolio();
      } else {
        toast.error(response.message || 'Failed to cancel investment');
      }
    } catch (error) {
      console.error('Failed to cancel investment:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel investment');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <HiCheckCircle className="h-5 w-5 text-green-500" />;
      case 'matured':
        return <HiCheckCircle className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <HiXCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <HiClock className="h-5 w-5 text-yellow-500" />;
      default:
        return <HiExclamationCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-700 bg-green-100';
      case 'matured':
        return 'text-blue-700 bg-blue-100';
      case 'cancelled':
        return 'text-red-700 bg-red-100';
      case 'pending':
        return 'text-yellow-700 bg-yellow-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" text="Loading your portfolio..." />
      </div>
    );
  }

  const { summary, investments, insights } = portfolio;
  const filteredInvestments = investments.filter(investment => {
    if (filters.status !== 'all' && investment.status !== filters.status) return false;
    if (filters.category !== 'all' && investment.category !== filters.category) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Portfolio</h1>
          <p className="text-gray-600 mt-1">
            Track and manage your investment portfolio
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadPortfolio}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <HiRefresh className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <HiDownload className="h-4 w-4 mr-2" />
            Export
          </button>
          <Link
            to="/products"
            className="btn-primary"
          >
            New Investment
          </Link>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HiCurrencyRupee className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{summary?.totalValue?.toLocaleString()}
              </p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <HiTrendingUp className="h-4 w-4 mr-1" />
                +{summary?.portfolioReturn || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <HiTrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Returns</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{summary?.totalReturns?.toLocaleString()}
              </p>
              <div className="text-sm text-gray-500 mt-1">
                <span className="text-green-600">₹{summary?.realizedGains?.toLocaleString()} realized</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <HiBriefcase className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Investments</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.activeInvestments}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {summary?.totalInvestments} total
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
                ₹{summary?.monthlyIncome?.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                From {summary?.activeInvestments || 0} assets
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Allocation */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Asset Allocation</h3>
            <select className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>By Value</option>
              <option>By Count</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={insights?.allocation || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({name, value}) => `${name}: ${value}%`}
                >
                  {(insights?.allocation || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}%`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {(insights?.allocation || []).map((item, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">₹{item.amount?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
            <select className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Last 6 months</option>
              <option>Last year</option>
              <option>All time</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights?.performance || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, 'Returns']} />
                <Bar dataKey="returns" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">My Investments</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <HiFilter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-4 mb-4 border-b border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="input-field"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="matured">Matured</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="input-field"
              >
                <option value="all">All Categories</option>
                <option value="Corporate Bonds">Corporate Bonds</option>
                <option value="Alternative Investment Fund">Alternative Investment Fund</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Commodities">Commodities</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="input-field"
              >
                <option value="createdAt">Date Created</option>
                <option value="amount">Investment Amount</option>
                <option value="currentValue">Current Value</option>
                <option value="actualReturn">Returns</option>
                <option value="maturityDate">Maturity Date</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
                className="input-field"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        )}

        {/* Investments List */}
        <div className="space-y-4">
          {filteredInvestments.length === 0 ? (
            <div className="text-center py-8">
              <HiBriefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No investments found</h3>
              <p className="text-gray-600 mb-4">Start your investment journey today</p>
              <Link to="/products" className="btn-primary">
                Browse Products
              </Link>
            </div>
          ) : (
            filteredInvestments.map((investment) => (
              <div key={investment.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                          {investment.productName}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">{investment.issuer}</p>
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(investment.status)}`}>
                            {getStatusIcon(investment.status)}
                            <span className="ml-1 capitalize">{investment.status}</span>
                          </span>
                          <span className="text-xs text-gray-500">{investment.category}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(investment.riskLevel)}`}>
                            {investment.riskLevel} Risk
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/products/${investment.productId}`}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="View Product"
                        >
                          <HiEye className="h-5 w-5" />
                        </Link>
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit Investment"
                        >
                          <HiPencil className="h-5 w-5" />
                        </button>
                        {investment.status === 'active' && (
                          <button
                            onClick={() => handleCancelInvestment(investment.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Cancel Investment"
                          >
                            <HiTrash className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Investment Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Investment Amount</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ₹{investment.amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Current Value</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ₹{investment.currentValue.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Returns</p>
                        <p className={`text-lg font-semibold ${
                          investment.actualReturn >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {investment.actualReturn >= 0 ? '+' : ''}{investment.actualReturn}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          {investment.status === 'active' ? 'Time Remaining' : 'Duration'}
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {investment.status === 'active' 
                            ? `${investment.monthsRemaining} months`
                            : `${investment.tenure} months`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar for Active Investments */}
                    {investment.status === 'active' && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span>Investment Progress</span>
                          <span>
                            {Math.round(((investment.tenure - investment.monthsRemaining) / investment.tenure) * 100)}% complete
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${((investment.tenure - investment.monthsRemaining) / investment.tenure) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Invested on: {new Date(investment.createdAt).toLocaleDateString()}</span>
                      <span>
                        {investment.status === 'matured' ? 'Matured on:' : 'Matures on:'} {new Date(investment.maturityDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Risk Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {insights?.riskMetrics?.volatility}%
            </div>
            <div className="text-sm text-gray-600">Volatility</div>
            <div className="text-xs text-gray-500 mt-1">Portfolio risk level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {insights?.riskMetrics?.sharpeRatio}
            </div>
            <div className="text-sm text-gray-600">Sharpe Ratio</div>
            <div className="text-xs text-gray-500 mt-1">Risk-adjusted returns</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {insights?.riskMetrics?.maxDrawdown}%
            </div>
            <div className="text-sm text-gray-600">Max Drawdown</div>
            <div className="text-xs text-gray-500 mt-1">Largest peak-to-trough decline</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {insights?.riskMetrics?.beta}
            </div>
            <div className="text-sm text-gray-600">Beta</div>
            <div className="text-xs text-gray-500 mt-1">Market correlation</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;