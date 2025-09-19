import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Products from '../Products';
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

const mockProducts = [
  {
    id: '1',
    name: 'Government Bond',
    investment_type: 'bond',
    tenure_months: 12,
    annual_yield: 7.5,
    risk_level: 'low',
    min_investment: 1000,
    max_investment: 100000,
    description: 'Secure government bond'
  },
  {
    id: '2',
    name: 'Equity Mutual Fund',
    investment_type: 'mf',
    tenure_months: 36,
    annual_yield: 12.5,
    risk_level: 'high',
    min_investment: 500,
    max_investment: 50000,
    description: 'High growth equity fund'
  }
];

describe('Products Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    api.productsAPI.getProducts.mockResolvedValue({
      data: {
        products: mockProducts,
        total: 2,
        page: 1,
        limit: 10
      }
    });

    api.productsAPI.getCategories.mockResolvedValue({
      data: {
        categories: ['bond', 'mf', 'fd', 'etf']
      }
    });
  });

  it('renders products list', async () => {
    renderWithProviders(<Products />);
    
    expect(screen.getByText('Investment Products')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Government Bond')).toBeInTheDocument();
      expect(screen.getByText('Equity Mutual Fund')).toBeInTheDocument();
    });
  });

  it('displays product details correctly', async () => {
    renderWithProviders(<Products />);
    
    await waitFor(() => {
      expect(screen.getByText('7.5%')).toBeInTheDocument();
      expect(screen.getByText('12.5%')).toBeInTheDocument();
      expect(screen.getByText('Low Risk')).toBeInTheDocument();
      expect(screen.getByText('High Risk')).toBeInTheDocument();
    });
  });

  it('filters products by search term', async () => {
    renderWithProviders(<Products />);
    
    const searchInput = screen.getByPlaceholderText(/search products/i);
    fireEvent.change(searchInput, { target: { value: 'Government' } });
    
    await waitFor(() => {
      expect(api.productsAPI.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Government'
        })
      );
    });
  });

  it('filters products by investment type', async () => {
    renderWithProviders(<Products />);
    
    const typeFilter = screen.getByLabelText(/investment type/i);
    fireEvent.change(typeFilter, { target: { value: 'bond' } });
    
    await waitFor(() => {
      expect(api.productsAPI.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'bond'
        })
      );
    });
  });

  it('filters products by risk level', async () => {
    renderWithProviders(<Products />);
    
    const riskFilter = screen.getByLabelText(/risk level/i);
    fireEvent.change(riskFilter, { target: { value: 'low' } });
    
    await waitFor(() => {
      expect(api.productsAPI.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          risk_level: 'low'
        })
      );
    });
  });

  it('sorts products by yield', async () => {
    renderWithProviders(<Products />);
    
    const sortSelect = screen.getByLabelText(/sort by/i);
    fireEvent.change(sortSelect, { target: { value: 'annual_yield' } });
    
    await waitFor(() => {
      expect(api.productsAPI.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'annual_yield'
        })
      );
    });
  });

  it('toggles filter panel', () => {
    renderWithProviders(<Products />);
    
    const filterButton = screen.getByText(/filters/i);
    fireEvent.click(filterButton);
    
    expect(screen.getByText(/price range/i)).toBeInTheDocument();
  });

  it('navigates to product details page', async () => {
    renderWithProviders(<Products />);
    
    await waitFor(() => {
      const viewButton = screen.getAllByText(/view details/i)[0];
      fireEvent.click(viewButton);
    });
    
    // Should navigate to product details page
    expect(window.location.pathname).toContain('/products/');
  });

  it('shows AI recommendations button', () => {
    renderWithProviders(<Products />);
    
    expect(screen.getByText(/ai recommendations/i)).toBeInTheDocument();
  });

  it('loads AI recommendations when button clicked', async () => {
    api.productsAPI.getRecommendations.mockResolvedValue({
      data: {
        recommendations: [mockProducts[0]]
      }
    });

    renderWithProviders(<Products />);
    
    const recommendationsButton = screen.getByText(/ai recommendations/i);
    fireEvent.click(recommendationsButton);
    
    await waitFor(() => {
      expect(api.productsAPI.getRecommendations).toHaveBeenCalled();
    });
  });

  it('handles API error gracefully', async () => {
    api.productsAPI.getProducts.mockRejectedValue(new Error('API Error'));
    
    renderWithProviders(<Products />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load products/i)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    renderWithProviders(<Products />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows empty state when no products found', async () => {
    api.productsAPI.getProducts.mockResolvedValue({
      data: {
        products: [],
        total: 0,
        page: 1,
        limit: 10
      }
    });

    renderWithProviders(<Products />);
    
    await waitFor(() => {
      expect(screen.getByText(/no products found/i)).toBeInTheDocument();
    });
  });

  it('displays product investment range', async () => {
    renderWithProviders(<Products />);
    
    await waitFor(() => {
      expect(screen.getByText(/₹1,000 - ₹1,00,000/)).toBeInTheDocument();
      expect(screen.getByText(/₹500 - ₹50,000/)).toBeInTheDocument();
    });
  });

  it('shows product tenure information', async () => {
    renderWithProviders(<Products />);
    
    await waitFor(() => {
      expect(screen.getByText(/12 months/)).toBeInTheDocument();
      expect(screen.getByText(/36 months/)).toBeInTheDocument();
    });
  });

  it('resets filters when reset button clicked', async () => {
    renderWithProviders(<Products />);
    
    // Apply some filters first
    const searchInput = screen.getByPlaceholderText(/search products/i);
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    
    const resetButton = screen.getByText(/reset filters/i);
    fireEvent.click(resetButton);
    
    expect(searchInput.value).toBe('');
    
    await waitFor(() => {
      expect(api.productsAPI.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          search: '',
          category: '',
          risk_level: ''
        })
      );
    });
  });
});