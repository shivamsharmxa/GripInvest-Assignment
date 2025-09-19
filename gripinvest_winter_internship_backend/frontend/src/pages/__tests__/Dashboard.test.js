import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../Dashboard';
import { AuthContext } from '../../contexts/AuthContext';
import * as api from '../../services/api';

// Mock the API
jest.mock('../../services/api');

const MockAuthProvider = ({ children, value }) => (
  <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>
);

const renderWithProviders = (component, authValue = {}) => {
  const defaultAuthValue = {
    user: {
      id: '1',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      risk_appetite: 'moderate'
    },
    loading: false,
    ...authValue
  };

  return render(
    <BrowserRouter>
      <MockAuthProvider value={defaultAuthValue}>
        {component}
      </MockAuthProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses
    api.investmentAPI.getPortfolio.mockResolvedValue({
      data: {
        summary: {
          total_investments: 5,
          total_amount_invested: 100000,
          current_value: 110000,
          total_returns: 10000,
          return_percentage: 10
        },
        investments: [
          {
            id: '1',
            product_name: 'Government Bond',
            amount: 50000,
            current_value: 55000,
            return_percentage: 10,
            status: 'active'
          }
        ]
      }
    });

    api.productsAPI.getTrending.mockResolvedValue({
      data: {
        products: [
          {
            id: '1',
            name: 'Trending Bond',
            investment_type: 'bond',
            annual_yield: 8.5,
            risk_level: 'low'
          }
        ]
      }
    });

    api.investmentAPI.getPortfolioInsights.mockResolvedValue({
      data: {
        insights: {
          risk_analysis: 'Low risk portfolio',
          diversification_score: 8.5,
          recommendations: ['Consider adding equity funds']
        }
      }
    });
  });

  it('renders dashboard with portfolio summary', async () => {
    renderWithProviders(<Dashboard />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Total Investments')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('₹1,00,000')).toBeInTheDocument();
      expect(screen.getByText('₹1,10,000')).toBeInTheDocument();
    });
  });

  it('displays portfolio performance metrics', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('10%')).toBeInTheDocument();
      expect(screen.getByText('₹10,000')).toBeInTheDocument();
    });
  });

  it('shows recent investments section', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Recent Investments')).toBeInTheDocument();
      expect(screen.getByText('Government Bond')).toBeInTheDocument();
    });
  });

  it('displays trending products section', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Trending Products')).toBeInTheDocument();
      expect(screen.getByText('Trending Bond')).toBeInTheDocument();
    });
  });

  it('shows AI insights card', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('AI Portfolio Insights')).toBeInTheDocument();
      expect(screen.getByText('Low risk portfolio')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    api.investmentAPI.getPortfolio.mockRejectedValue(new Error('API Error'));
    
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load portfolio data')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    renderWithProviders(<Dashboard />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders chart components', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByTestId('portfolio-chart')).toBeInTheDocument();
      expect(screen.getByTestId('performance-chart')).toBeInTheDocument();
    });
  });

  it('displays welcome message with user name', async () => {
    const authValue = {
      user: {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      }
    };

    renderWithProviders(<Dashboard />, authValue);
    
    expect(screen.getByText('Welcome back, John!')).toBeInTheDocument();
  });

  it('shows empty state when no investments', async () => {
    api.investmentAPI.getPortfolio.mockResolvedValue({
      data: {
        summary: {
          total_investments: 0,
          total_amount_invested: 0,
          current_value: 0,
          total_returns: 0,
          return_percentage: 0
        },
        investments: []
      }
    });

    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('No investments yet')).toBeInTheDocument();
      expect(screen.getByText('Start investing')).toBeInTheDocument();
    });
  });
});