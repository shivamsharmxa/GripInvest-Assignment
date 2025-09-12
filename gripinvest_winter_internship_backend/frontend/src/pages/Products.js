import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { 
  HiSearch, 
  HiFilter, 
  HiSortAscending,
  HiEye,
  HiHeart,
  HiTrendingUp,
  HiShieldCheck,
  HiClock,
  HiCurrencyRupee
} from 'react-icons/hi';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const Products = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minReturn: '',
    maxReturn: '',
    minTenure: '',
    maxTenure: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProducts(filters);
      setProducts(response.data?.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      // Fallback to sample data
      setProducts(getSampleProducts());
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories(['Corporate Bonds', 'Alternative Investment Fund', 'Real Estate', 'Commodities']);
    }
  };

  const getSampleProducts = () => [
    {
      id: '1',
      name: 'Corporate Bond Series A',
      category: 'Corporate Bonds',
      description: 'High-grade corporate bond with steady returns and low risk profile.',
      expectedReturn: 12.5,
      minInvestment: 10000,
      maxInvestment: 1000000,
      tenure: 24,
      riskLevel: 'Low',
      issuer: 'ABC Corporation',
      rating: 'AAA',
      totalSize: 50000000,
      availableSize: 25000000,
      features: ['Quarterly Interest', 'Credit Enhancement', 'Listed on Exchange']
    },
    {
      id: '2',
      name: 'Alternative Investment Fund',
      category: 'Alternative Investment Fund',
      description: 'Diversified AIF focusing on high-growth sectors with professional management.',
      expectedReturn: 18.2,
      minInvestment: 100000,
      maxInvestment: 5000000,
      tenure: 36,
      riskLevel: 'High',
      issuer: 'XYZ Asset Management',
      rating: 'AA+',
      totalSize: 200000000,
      availableSize: 75000000,
      features: ['Professional Management', 'Tax Efficient', 'Quarterly Reports']
    },
    {
      id: '3',
      name: 'Real Estate Investment Trust',
      category: 'Real Estate',
      description: 'REIT with diversified commercial real estate portfolio.',
      expectedReturn: 14.8,
      minInvestment: 50000,
      maxInvestment: 2000000,
      tenure: 60,
      riskLevel: 'Moderate',
      issuer: 'Property Trust Ltd',
      rating: 'AA',
      totalSize: 150000000,
      availableSize: 60000000,
      features: ['Regular Dividends', 'Liquid Investment', 'Professional Management']
    },
    {
      id: '4',
      name: 'Gold Investment Fund',
      category: 'Commodities',
      description: 'Commodity fund tracking gold prices with hedging strategies.',
      expectedReturn: 11.5,
      minInvestment: 25000,
      maxInvestment: 1500000,
      tenure: 12,
      riskLevel: 'Moderate',
      issuer: 'Commodity Advisors',
      rating: 'A+',
      totalSize: 100000000,
      availableSize: 40000000,
      features: ['Inflation Hedge', 'High Liquidity', 'Global Exposure']
    }
  ];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minReturn: '',
      maxReturn: '',
      minTenure: '',
      maxTenure: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRatingColor = (rating) => {
    if (rating?.includes('AAA') || rating?.includes('AA')) {
      return 'text-green-600 bg-green-100';
    } else if (rating?.includes('A')) {
      return 'text-blue-600 bg-blue-100';
    }
    return 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" text="Loading products..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investment Products</h1>
          <p className="text-gray-600 mt-1">
            Discover and invest in curated investment opportunities
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <HiFilter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setFilters(prev => ({ ...prev, sortBy, sortOrder }));
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="expectedReturn-desc">Return (High to Low)</option>
            <option value="expectedReturn-asc">Return (Low to High)</option>
            <option value="minInvestment-asc">Min Investment (Low to High)</option>
            <option value="tenure-asc">Tenure (Short to Long)</option>
          </select>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search products by name or issuer..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input-field"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Return (%)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minReturn}
                  onChange={(e) => handleFilterChange('minReturn', e.target.value)}
                  className="input-field"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxReturn}
                  onChange={(e) => handleFilterChange('maxReturn', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tenure (Months)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minTenure}
                  onChange={(e) => handleFilterChange('minTenure', e.target.value)}
                  className="input-field"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxTenure}
                  onChange={(e) => handleFilterChange('maxTenure', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500">
              <HiSearch className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search criteria or filters
              </p>
            </div>
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="card-hover group">
              {/* Product Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {product.issuer}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(product.riskLevel)}`}>
                      {product.riskLevel} Risk
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRatingColor(product.rating)}`}>
                      {product.rating}
                    </span>
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <HiHeart className="h-5 w-5" />
                </button>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <HiTrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  </div>
                  <div className="text-xl font-bold text-green-600">
                    {product.expectedReturn}%
                  </div>
                  <div className="text-xs text-green-700">
                    Expected Return
                  </div>
                </div>
                
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <HiClock className="h-4 w-4 text-blue-600 mr-1" />
                  </div>
                  <div className="text-xl font-bold text-blue-600">
                    {product.tenure}
                  </div>
                  <div className="text-xs text-blue-700">
                    Months
                  </div>
                </div>
              </div>

              {/* Investment Range */}
              <div className="mb-4">
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <HiCurrencyRupee className="h-4 w-4 mr-1" />
                  Investment Range
                </div>
                <div className="text-sm font-medium text-gray-900">
                  ₹{product.minInvestment?.toLocaleString()} - ₹{product.maxInvestment?.toLocaleString()}
                </div>
              </div>

              {/* Availability */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Availability</span>
                  <span>
                    {Math.round((product.availableSize / product.totalSize) * 100)}% available
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(product.availableSize / product.totalSize) * 100}%` }}
                  />
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {product.description}
              </p>

              {/* Features */}
              {product.features && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {product.features.slice(0, 3).map((feature, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md"
                      >
                        {feature}
                      </span>
                    ))}
                    {product.features.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md">
                        +{product.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-4 border-t border-gray-100">
                <Link
                  to={`/products/${product.id}`}
                  className="flex-1 btn-outline text-center inline-flex items-center justify-center"
                >
                  <HiEye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
                <button
                  onClick={() => navigate(`/products/${product.id}`)}
                  className="flex-1 btn-primary"
                >
                  Invest Now
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {products.length > 0 && (
        <div className="text-center">
          <button className="btn-outline">
            Load More Products
          </button>
        </div>
      )}
    </div>
  );
};

export default Products;