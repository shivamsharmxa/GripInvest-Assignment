import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { HiMail, HiArrowLeft } from 'react-icons/hi';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const ForgotPassword = () => {
  const [emailSent, setEmailSent] = useState(false);
  const { forgotPassword, loading, error } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    getValues
  } = useForm();

  const onSubmit = async (data) => {
    clearErrors();
    const result = await forgotPassword(data.email);
    
    if (result.success) {
      setEmailSent(true);
    } else {
      setError('root', { 
        type: 'manual', 
        message: result.error || 'Failed to send reset email' 
      });
    }
  };

  const resendEmail = async () => {
    const email = getValues('email');
    if (email) {
      await forgotPassword(email);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-6">
              <HiMail className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Check your email
            </h2>
            <p className="text-gray-600">
              We've sent a password reset link to your email address.
            </p>
          </div>

          {/* Email Sent Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <p className="text-sm">
                  If an account with that email exists, we've sent you a reset link.
                </p>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                
                <button
                  onClick={resendEmail}
                  disabled={loading}
                  className="w-full btn-secondary disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="small" className="mr-2" />
                      Resending...
                    </>
                  ) : (
                    'Resend email'
                  )}
                </button>
              </div>
            </div>

            {/* Back to Login */}
            <div className="text-center pt-4 border-t border-gray-200">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                <HiArrowLeft className="h-4 w-4 mr-2" />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <HiMail className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Forgot your password?
          </h2>
          <p className="text-gray-600">
            No worries! Enter your email and we'll send you a reset link.
          </p>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  autoComplete="email"
                  className={`input-field pl-10 ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter your email address"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Error Messages */}
            {errors.root && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm">{errors.root.message}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {(isSubmitting || loading) ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Sending reset link...
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="text-center pt-4 border-t border-gray-200">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              <HiArrowLeft className="h-4 w-4 mr-2" />
              Back to login
            </Link>
          </div>
        </div>

        {/* Additional Help */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Still having trouble? Contact our{' '}
            <a href="mailto:support@gripinvest.com" className="underline hover:text-gray-700">
              support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;