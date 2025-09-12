import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { 
  HiUser, 
  HiMail, 
  HiPhone, 
  HiCalendar,
  HiShieldCheck,
  HiKey,
  HiCog,
  HiEye,
  HiBell,
  HiGlobe,
  HiSave
} from 'react-icons/hi';
import { FaEyeSlash } from 'react-icons/fa';
import { FaUserCircle } from 'react-icons/fa';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile, changePassword, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
    reset: resetProfile,
    watch: watchProfile
  } = useForm();

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
    reset: resetPassword,
    watch: watchPassword
  } = useForm();

  const {
    register: registerSettings,
    handleSubmit: handleSubmitSettings,
    formState: { errors: settingsErrors, isSubmitting: isSubmittingSettings },
    reset: resetSettings
  } = useForm({
    defaultValues: {
      notifications: {
        email: true,
        sms: false,
        marketing: true
      },
      privacy: {
        profileVisible: true,
        portfolioVisible: false
      },
      preferences: {
        theme: 'light',
        language: 'en',
        currency: 'INR'
      }
    }
  });

  const newPassword = watchPassword('newPassword');

  useEffect(() => {
    if (user) {
      resetProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        riskAppetite: user.riskAppetite || 'moderate',
        bio: user.bio || ''
      });
    }
  }, [user, resetProfile]);

  const onSubmitProfile = async (data) => {
    try {
      const result = await updateProfile(data);
      if (result.success) {
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
    }
  };

  const onSubmitPassword = async (data) => {
    try {
      const result = await changePassword(data.currentPassword, data.newPassword);
      if (result.success) {
        resetPassword();
        toast.success('Password changed successfully!');
      }
    } catch (error) {
      console.error('Password change failed:', error);
    }
  };

  const onSubmitSettings = async (data) => {
    try {
      // In a real app, this would call an API to save settings
      console.log('Settings updated:', data);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Settings update failed:', error);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: HiUser },
    { id: 'security', label: 'Security', icon: HiShieldCheck },
    { id: 'settings', label: 'Preferences', icon: HiCog }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-6">
        <div className="relative">
          {user?.avatar ? (
            <img
              className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
              src={user.avatar}
              alt={user.firstName}
            />
          ) : (
            <FaUserCircle className="h-24 w-24 text-gray-400" />
          )}
          <button className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 shadow-lg hover:bg-blue-700 transition-colors">
            <HiUser className="h-4 w-4" />
          </button>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-gray-600">{user?.email}</p>
          <div className="flex items-center space-x-4 mt-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              Risk Appetite: {user?.riskAppetite || 'Moderate'}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              ✓ Verified
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="card">
        {activeTab === 'profile' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>
            <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <HiUser className="inline h-4 w-4 mr-1" />
                    First Name
                  </label>
                  <input
                    {...registerProfile('firstName', {
                      required: 'First name is required',
                      minLength: {
                        value: 2,
                        message: 'First name must be at least 2 characters'
                      }
                    })}
                    type="text"
                    className={`input-field ${profileErrors.firstName ? 'border-red-300' : ''}`}
                    placeholder="Enter your first name"
                  />
                  {profileErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    {...registerProfile('lastName')}
                    type="text"
                    className="input-field"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <HiMail className="inline h-4 w-4 mr-1" />
                    Email Address
                  </label>
                  <input
                    {...registerProfile('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className={`input-field ${profileErrors.email ? 'border-red-300' : ''}`}
                    placeholder="Enter your email"
                    disabled
                  />
                  {profileErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <HiPhone className="inline h-4 w-4 mr-1" />
                    Phone Number
                  </label>
                  <input
                    {...registerProfile('phone', {
                      pattern: {
                        value: /^[\+]?[1-9][\d]{0,15}$/,
                        message: 'Please provide a valid phone number'
                      }
                    })}
                    type="tel"
                    className={`input-field ${profileErrors.phone ? 'border-red-300' : ''}`}
                    placeholder="Enter your phone number"
                  />
                  {profileErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.phone.message}</p>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <HiCalendar className="inline h-4 w-4 mr-1" />
                    Date of Birth
                  </label>
                  <input
                    {...registerProfile('dateOfBirth')}
                    type="date"
                    className="input-field"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Risk Appetite
                  </label>
                  <select
                    {...registerProfile('riskAppetite')}
                    className="input-field"
                  >
                    <option value="low">Low - Conservative investments</option>
                    <option value="moderate">Moderate - Balanced approach</option>
                    <option value="high">High - Aggressive growth</option>
                  </select>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  {...registerProfile('bio')}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                />
                <p className="mt-1 text-xs text-gray-500">Maximum 500 characters</p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingProfile || loading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(isSubmittingProfile || loading) ? (
                    <>
                      <LoadingSpinner size="small" className="mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <HiSave className="h-4 w-4 mr-2" />
                      Update Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-8">
            {/* Change Password */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <HiKey className="h-5 w-5 mr-2" />
                Change Password
              </h3>
              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      {...registerPassword('currentPassword', {
                        required: 'Current password is required'
                      })}
                      type={showCurrentPassword ? 'text' : 'password'}
                      className={`input-field pr-10 ${passwordErrors.currentPassword ? 'border-red-300' : ''}`}
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <FaEyeSlash className="h-4 w-4 text-gray-400" />
                      ) : (
                        <HiEye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      {...registerPassword('newPassword', {
                        required: 'New password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters'
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                          message: 'Password must contain uppercase, lowercase, number and special character'
                        }
                      })}
                      type={showNewPassword ? 'text' : 'password'}
                      className={`input-field pr-10 ${passwordErrors.newPassword ? 'border-red-300' : ''}`}
                      placeholder="Enter your new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <FaEyeSlash className="h-4 w-4 text-gray-400" />
                      ) : (
                        <HiEye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      {...registerPassword('confirmPassword', {
                        required: 'Please confirm your new password',
                        validate: value => 
                          value === newPassword || 'Passwords do not match'
                      })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`input-field pr-10 ${passwordErrors.confirmPassword ? 'border-red-300' : ''}`}
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <FaEyeSlash className="h-4 w-4 text-gray-400" />
                      ) : (
                        <HiEye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingPassword}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingPassword ? (
                      <>
                        <LoadingSpinner size="small" className="mr-2" />
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <HiKey className="h-4 w-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Security Settings */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <HiShieldCheck className="h-5 w-5 mr-2" />
                Security Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                  </div>
                  <button className="btn-outline text-sm">
                    Enable 2FA
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Login Notifications</h4>
                    <p className="text-sm text-gray-600">Get notified when someone logs into your account</p>
                  </div>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600"
                      defaultChecked
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Active Sessions</h4>
                    <p className="text-sm text-gray-600">Manage your active login sessions</p>
                  </div>
                  <button className="btn-outline text-sm">
                    View Sessions
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Preferences & Settings</h3>
            <form onSubmit={handleSubmitSettings(onSubmitSettings)} className="space-y-8">
              {/* Notification Preferences */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <HiBell className="h-5 w-5 mr-2" />
                  Notification Preferences
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Email Notifications</label>
                      <p className="text-sm text-gray-600">Receive investment updates and portfolio alerts</p>
                    </div>
                    <label className="inline-flex items-center">
                      <input
                        {...registerSettings('notifications.email')}
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">SMS Notifications</label>
                      <p className="text-sm text-gray-600">Get important alerts via text message</p>
                    </div>
                    <label className="inline-flex items-center">
                      <input
                        {...registerSettings('notifications.sms')}
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Marketing Communications</label>
                      <p className="text-sm text-gray-600">Receive product updates and investment opportunities</p>
                    </div>
                    <label className="inline-flex items-center">
                      <input
                        {...registerSettings('notifications.marketing')}
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Application Preferences */}
              <div className="border-t border-gray-200 pt-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                  <HiGlobe className="h-5 w-5 mr-2" />
                  Application Preferences
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Theme
                    </label>
                    <select
                      {...registerSettings('preferences.theme')}
                      className="input-field"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">System Default</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      {...registerSettings('preferences.language')}
                      className="input-field"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिंदी (Hindi)</option>
                      <option value="mr">मराठी (Marathi)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      {...registerSettings('preferences.currency')}
                      className="input-field"
                    >
                      <option value="INR">₹ Indian Rupee (INR)</option>
                      <option value="USD">$ US Dollar (USD)</option>
                      <option value="EUR">€ Euro (EUR)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="border-t border-gray-200 pt-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Privacy Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Profile Visibility</label>
                      <p className="text-sm text-gray-600">Allow others to see your profile information</p>
                    </div>
                    <label className="inline-flex items-center">
                      <input
                        {...registerSettings('privacy.profileVisible')}
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Portfolio Visibility</label>
                      <p className="text-sm text-gray-600">Share your portfolio performance publicly</p>
                    </div>
                    <label className="inline-flex items-center">
                      <input
                        {...registerSettings('privacy.portfolioVisible')}
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmittingSettings}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingSettings ? (
                    <>
                      <LoadingSpinner size="small" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <HiSave className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;