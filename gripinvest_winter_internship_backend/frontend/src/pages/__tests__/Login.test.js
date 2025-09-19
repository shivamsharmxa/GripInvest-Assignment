import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Auth/Login';
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
    user: null,
    loading: false,
    login: jest.fn(),
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

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('displays validation errors for empty fields', async () => {
    renderWithProviders(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('displays validation error for invalid email', async () => {
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid credentials', async () => {
    const mockLogin = jest.fn().mockResolvedValue({
      success: true,
      user: { id: '1', email: 'test@example.com' },
      token: 'mock-token'
    });

    renderWithProviders(<Login />, { login: mockLogin });
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('displays error message for invalid credentials', async () => {
    const mockLogin = jest.fn().mockRejectedValue({
      response: {
        data: { error: 'Invalid credentials' }
      }
    });

    renderWithProviders(<Login />, { login: mockLogin });
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during login', async () => {
    const mockLogin = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderWithProviders(<Login />, { login: mockLogin });
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('contains link to signup page', () => {
    renderWithProviders(<Login />);
    
    const signupLink = screen.getByText(/don't have an account/i);
    expect(signupLink).toBeInTheDocument();
    expect(signupLink.closest('a')).toHaveAttribute('href', '/signup');
  });

  it('contains link to forgot password page', () => {
    renderWithProviders(<Login />);
    
    const forgotPasswordLink = screen.getByText(/forgot password/i);
    expect(forgotPasswordLink).toBeInTheDocument();
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password');
  });

  it('shows password visibility toggle', () => {
    renderWithProviders(<Login />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByLabelText(/toggle password visibility/i);
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('remembers user preference with remember me checkbox', () => {
    renderWithProviders(<Login />);
    
    const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
    expect(rememberMeCheckbox).toBeInTheDocument();
    expect(rememberMeCheckbox).not.toBeChecked();
    
    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).toBeChecked();
  });

  it('redirects authenticated users to dashboard', () => {
    const authValue = {
      user: {
        id: '1',
        email: 'test@example.com'
      },
      loading: false
    };

    renderWithProviders(<Login />, authValue);
    
    // Should redirect to dashboard
    expect(window.location.pathname).toBe('/');
  });
});