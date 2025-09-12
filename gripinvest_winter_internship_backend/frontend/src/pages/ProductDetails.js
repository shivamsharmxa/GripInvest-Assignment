import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { productsAPI, investmentAPI } from '../services/api';
import { 
  HiArrowLeft, 
  HiTrendingUp, 
  HiClock, 
  HiShieldCheck,
  HiCurrencyRupee,
  HiCalculator,
  HiHeart,
  HiShare,
  HiInformationCircle
} from 'react-icons/hi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { toast } from 'react-hot-toast';

// Helper function to safely format numbers
const safeFormatNumber = (value, defaultValue = 0) => {
  const num = value !== null && value !== undefined ? value : defaultValue;
  return num.toLocaleString();
};

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [simulationData, setSimulationData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isInvesting, setIsInvesting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setValue,
    reset
  } = useForm({
    defaultValues: {
      amount: '',
      customTenure: '',
      notes: '',
      autoReinvest: false
    }
  });

  const investmentAmount = watch('amount');
  const customTenure = watch('customTenure');

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (investmentAmount && product) {
      simulateInvestment();
    }
  }, [investmentAmount, customTenure, product]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getProductById(id);
      setProduct(response.data || getSampleProduct());
    } catch (error) {
      console.error('Failed to load product:', error);
      setProduct(getSampleProduct());
    } finally {
      setLoading(false);
    }
  };

  const getSampleProduct = () => ({
    id: id,
    name: 'Corporate Bond Series A',
    category: 'Corporate Bonds',
    description: 'High-grade corporate bond issued by ABC Corporation, offering stable returns with quarterly interest payments. This bond is backed by strong fundamentals and has a proven track record of consistent performance.',
    detailedDescription: 'This corporate bond represents a debt security issued by ABC Corporation, one of the leading companies in the manufacturing sector. The bond offers investors a fixed income opportunity with regular quarterly interest payments and principal repayment at maturity. The issuer has maintained a strong credit rating and has never defaulted on any of its debt obligations.',
    expectedReturn: 12.5,
    minInvestment: 10000,
    maxInvestment: 1000000,
    tenure: 24,
    riskLevel: 'Low',
    issuer: 'ABC Corporation',
    rating: 'AAA',
    ratingAgency: 'CRISIL',
    totalSize: 50000000,
    availableSize: 25000000,
    interestPayment: 'Quarterly',
    maturityDate: '2026-12-31',
    listingExchange: 'NSE',
    isin: 'INE123456789',
    features: [
      'Quarterly Interest Payments',
      'Credit Enhancement',
      'Listed on NSE',
      'High Liquidity',
      'Investment Grade Rating',
      'Tax Efficient'
    ],
    documents: [
      { name: 'Information Memorandum', url: '#' },
      { name: 'Financial Statements', url: '#' },
      { name: 'Rating Report', url: '#' },
      { name: 'Terms & Conditions', url: '#' }
    ],
    keyHighlights: [
      'Strong credit rating of AAA from CRISIL',
      'Quarterly interest payments for regular income',
      'Listed on NSE for high liquidity',
      'Minimum investment of just ₹10,000',
      'Backed by strong corporate fundamentals'
    ],
    risks: [
      'Credit risk - Risk of issuer default',
      'Interest rate risk - Bond prices may fluctuate',
      'Liquidity risk - May face liquidity constraints',
      'Market risk - Subject to market volatility'
    ]
  });

  const simulateInvestment = async () => {
    if (!investmentAmount || investmentAmount < product.minInvestment) {
      setSimulationData(null);
      return;
    }

    try {
      const tenure = customTenure || product.tenure;
      const response = await productsAPI.simulateInvestment(id, investmentAmount, tenure);
      setSimulationData(response.data);
    } catch (error) {
      // Generate sample simulation data
      const tenure = customTenure || product.tenure;
      const monthlyReturn = (product.expectedReturn / 100) / 12;
      const totalMonths = parseInt(tenure);
      const principal = parseFloat(investmentAmount);
      
      const data = [];
      let currentValue = principal;
      
      for (let month = 0; month <= totalMonths; month++) {
        if (month === 0) {
          data.push({ month, value: principal });
        } else {
          currentValue = currentValue * (1 + monthlyReturn);
          data.push({ month, value: Math.round(currentValue) });
        }
      }
      
      setSimulationData({
        investmentAmount: principal,
        tenure: totalMonths,
        expectedReturn: product.expectedReturn,
        maturityAmount: Math.round(currentValue),
        totalReturns: Math.round(currentValue - principal),
        monthlyIncome: Math.round((currentValue - principal) / totalMonths),
        projectionData: data
      });
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsInvesting(true);
      const investmentData = {
        productId: id,
        amount: parseFloat(data.amount),
        customTenure: data.customTenure ? parseInt(data.customTenure) : undefined,
        notes: data.notes,
        autoReinvest: data.autoReinvest
      };

      const response = await investmentAPI.createInvestment(investmentData);
      
      if (response.success) {
        toast.success('Investment created successfully!');
        navigate('/portfolio');
      } else {
        toast.error(response.message || 'Investment failed');
      }
    } catch (error) {
      console.error('Investment failed:', error);
      toast.error(error.response?.data?.message || 'Investment failed');
    } finally {
      setIsInvesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" text="Loading product details..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Product not found</h3>
        <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/products')} className="btn-primary">
          Back to Products
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
    { id: 'documents', label: 'Documents' },
    { id: 'risks', label: 'Risks' }
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/products')}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <HiArrowLeft className="h-4 w-4 mr-2" />
        Back to Products
      </button>

      {/* Product Header */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <p className="text-gray-600">{product.issuer}</p>
                <div className="flex items-center space-x-4 mt-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {product.category}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    {product.riskLevel} Risk
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                    {product.rating} ({product.ratingAgency})
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <HiHeart className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                  <HiShare className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <HiTrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{product.expectedReturn}%</div>
                <div className="text-sm text-green-700">Expected Return</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <HiClock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{product.tenure}</div>
                <div className="text-sm text-blue-700">Months</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <HiCurrencyRupee className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-purple-600">₹{safeFormatNumber(product.minInvestment)}</div>
                <div className="text-sm text-purple-700">Min Investment</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <HiShieldCheck className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-yellow-600">{product.interestPayment}</div>
                <div className="text-sm text-yellow-700">Interest Payment</div>
              </div>
            </div>

            {/* Availability */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Investment Availability</span>
                <span>₹{safeFormatNumber(product.availableSize)} of ₹{safeFormatNumber(product.totalSize)} available</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${(product.availableSize / product.totalSize) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="card">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About this Investment</h3>
                  <p className="text-gray-700 leading-relaxed">{product.detailedDescription}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Highlights</h3>
                  <ul className="space-y-2">
                    {(product.keyHighlights || []).map((highlight, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {(product.features || []).map((feature, index) => (
                      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <HiShieldCheck className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ISIN:</span>
                      <span className="font-medium">{product.isin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Listing Exchange:</span>
                      <span className="font-medium">{product.listingExchange}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Maturity Date:</span>
                      <span className="font-medium">{product.maturityDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interest Payment:</span>
                      <span className="font-medium">{product.interestPayment}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Issue Size:</span>
                      <span className="font-medium">₹{safeFormatNumber(product.totalSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available for Investment:</span>
                      <span className="font-medium">₹{safeFormatNumber(product.availableSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Credit Rating:</span>
                      <span className="font-medium">{product.rating} ({product.ratingAgency})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Level:</span>
                      <span className="font-medium">{product.riskLevel}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
                <div className="space-y-3">
                  {(product.documents || []).map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="text-gray-700">{doc.name}</span>
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'risks' && (
              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <HiInformationCircle className="h-5 w-5 text-yellow-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Risk Factors</h3>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    Please carefully read and understand the following risk factors before investing.
                  </p>
                </div>
                <ul className="space-y-3">
                  {(product.risks || []).map((risk, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Investment Projection Chart */}
          {simulationData && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Projection</h3>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={simulationData.projectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`₹${safeFormatNumber(value)}`, 'Portfolio Value']}
                      labelFormatter={(month) => `Month ${month}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Investment</div>
                  <div className="text-lg font-bold text-gray-900">
                    ₹{safeFormatNumber(simulationData?.investmentAmount)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Maturity Value</div>
                  <div className="text-lg font-bold text-green-600">
                    ₹{safeFormatNumber(simulationData?.maturityAmount)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Total Returns</div>
                  <div className="text-lg font-bold text-blue-600">
                    ₹{safeFormatNumber(simulationData?.totalReturns)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Monthly Income</div>
                  <div className="text-lg font-bold text-purple-600">
                    ₹{safeFormatNumber(simulationData?.monthlyIncome)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Investment Form */}
        <div className="space-y-6">
          <div className="card sticky top-6">
            <div className="flex items-center mb-4">
              <HiCalculator className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Invest Now</h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Investment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiCurrencyRupee className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('amount', {
                      required: 'Investment amount is required',
                      min: {
                        value: product.minInvestment,
                        message: `Minimum investment is ₹${safeFormatNumber(product.minInvestment)}`
                      },
                      max: {
                        value: product.maxInvestment,
                        message: `Maximum investment is ₹${safeFormatNumber(product.maxInvestment)}`
                      }
                    })}
                    type="number"
                    className={`input-field pl-10 ${errors.amount ? 'border-red-300' : ''}`}
                    placeholder={`Min: ₹${safeFormatNumber(product.minInvestment)}`}
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Range: ₹{safeFormatNumber(product.minInvestment)} - ₹{safeFormatNumber(product.maxInvestment)}
                </p>
              </div>

              {/* Custom Tenure */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Tenure (Optional)
                </label>
                <select
                  {...register('customTenure')}
                  className="input-field"
                >
                  <option value="">Default ({product.tenure} months)</option>
                  <option value="12">12 months</option>
                  <option value="24">24 months</option>
                  <option value="36">36 months</option>
                  <option value="48">48 months</option>
                  <option value="60">60 months</option>
                </select>
              </div>

              {/* Auto Reinvest */}
              <div className="flex items-center">
                <input
                  {...register('autoReinvest')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Auto-reinvest returns
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Notes (Optional)
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Add any notes about this investment..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isInvesting || !investmentAmount}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(isSubmitting || isInvesting) ? (
                  <>
                    <LoadingSpinner size="small" className="mr-2" />
                    Processing Investment...
                  </>
                ) : (
                  <>
                    <HiCurrencyRupee className="h-4 w-4 mr-2" />
                    Invest Now
                  </>
                )}
              </button>
            </form>

            {/* Quick Investment Buttons */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Quick Amount:</p>
              <div className="grid grid-cols-3 gap-2">
                {[product.minInvestment, 50000, 100000].map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setValue('amount', amount)}
                    className="text-xs py-2 px-3 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    ₹{safeFormatNumber(amount)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;