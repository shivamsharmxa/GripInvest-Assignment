import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../Layout/Layout';
import { AuthContext } from '../../contexts/AuthContext';

const MockAuthProvider = ({ children, value }) => (
  <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>
);

const renderWithRouter = (component, authValue = {}) => {
  const defaultAuthValue = {
    user: {
      id: '1',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      risk_appetite: 'moderate'
    },
    loading: false,
    logout: jest.fn(),
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

describe('Layout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders layout with navbar and sidebar', () => {
    renderWithRouter(<Layout />);
    
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('Grip Invest')).toBeInTheDocument();
  });

  it('displays user name in navbar', () => {
    const authValue = {
      user: {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      },
      loading: false,
      logout: jest.fn()
    };

    renderWithRouter(<Layout />, authValue);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows navigation links', () => {
    renderWithRouter(<Layout />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('calls logout when logout button is clicked', () => {
    const mockLogout = jest.fn();
    const authValue = {
      user: {
        id: '1',
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com'
      },
      loading: false,
      logout: mockLogout
    };

    renderWithRouter(<Layout />, authValue);
    
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('toggles sidebar on mobile', () => {
    renderWithRouter(<Layout />);
    
    const menuButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(menuButton);
    
    // Check if sidebar visibility changes
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('translate-x-0');
  });

  it('renders outlet for child components', () => {
    renderWithRouter(
      <Layout>
        <div data-testid="child-component">Child Content</div>
      </Layout>
    );
    
    expect(screen.getByTestId('child-component')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('shows loading state when user is loading', () => {
    const authValue = {
      user: null,
      loading: true,
      logout: jest.fn()
    };

    renderWithRouter(<Layout />, authValue);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    const authValue = {
      user: null,
      loading: false,
      logout: jest.fn()
    };

    renderWithRouter(<Layout />, authValue);
    
    // Should redirect to login page
    expect(window.location.pathname).toBe('/');
  });
});