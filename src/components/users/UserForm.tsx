import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import type { User, UserRole, UserStatus, UserType, ApplicationPermission } from '../../types/user';
// import { USER_ROLES } from '../../types/user'; // USER_ROLES is not exported, UserRole type will be used directly
// import { UserPermissionsForm } from './UserPermissionsForm'; // Commented out as not used for now
import { useToast } from '../../hooks/useToast';

// Define an array of UserRole values for the select dropdown
const availableRoles: UserRole[] = ['super_admin', 'cto', 'growth_finance', 'customer_support', 'content_manager', 'company_admin', 'company_user'];

interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  userType?: UserType;
  customerAccountId?: string;
  permissions: ApplicationPermission[]; // Correctly typed to match User.permissions
  password?: string;
  confirmPassword?: string;
}

interface UserFormProps {
  user?: User | null;
  onSubmit: (data: Partial<UserFormData>) => Promise<void>;
  onCancel: () => void;
  currentUser?: User | null;
}

export function UserForm({ user, onSubmit, onCancel, currentUser }: UserFormProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<UserFormData>(() => {
    const initialData: UserFormData = {
      name: '',
      email: '',
      role: 'company_user', // Changed default role to a valid UserRole
      status: 'active',
      userType: 'internal',
      customerAccountId: '',
      permissions: [], 
      password: '',
      confirmPassword: ''
    };
    if (user) {
      return {
        ...initialData,
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'company_user', // Ensure role is a valid UserRole
        status: user.status || 'active',
        userType: user.userType || 'internal',
        customerAccountId: user.customerAccountId || '',
        permissions: user.permissions || [],
        // Clear password fields when editing a user
        password: '', 
        confirmPassword: ''
      };
    }
    return initialData;
  });

  useEffect(() => {
    if (user) { // If editing a user, populate form with user data
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'company_user',
        status: user.status || 'active',
        userType: user.userType || 'internal',
        customerAccountId: user.customerAccountId || '',
        permissions: user.permissions || [],
        password: '', // Always clear password for editing
        confirmPassword: '', // Always clear confirm password for editing
      });
    } else { // If creating a new user, reset to initial state
      setFormData({
        name: '',
        email: '',
        role: 'company_user',
        status: 'active',
        userType: 'internal',
        customerAccountId: '',
        permissions: [],
        password: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value as UserRole | UserStatus | UserType | string })); // Cast value for type safety with select
  };

  // const handlePermissionsChange = (permissions: string[]) => { // Commented out as not used for now
  //   setFormData(prev => ({ ...prev, permissions }));
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role || !formData.status) {
      showToast('error', t('users.userForm.errors.missingRequiredFields', 'Please fill in all required fields.'));
      return;
    }

    if (formData.password !== formData.confirmPassword) { // Check password only if it is being set (new user or password change)
      showToast('error', t('users.userForm.passwordsDontMatch', 'Passwords do not match.'));
      return;
    }
    if ((!user || formData.password) && (!formData.password || formData.password.length < 8)) { // Check password length only if it is being set
        showToast('error', t('users.userForm.errors.passwordTooShort', 'Password must be at least 8 characters long.'));
        return;
    }
    // Add validation for email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast('error', t('users.userForm.errors.invalidEmail', 'Please enter a valid email address.'));
      return;
    }

    if (formData.userType === 'external' && !formData.customerAccountId) {
        showToast('error', t('users.userForm.errors.missingCustomerAccountId', 'Please provide a customer account ID for external users.'));
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...submissionData } = formData;
    if (user && !submissionData.password) { // If editing and password is not changed, remove it from submission
        delete submissionData.password;
    }
    await onSubmit(submissionData);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center overflow-y-auto z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full m-4">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {user ? t('users.userForm.titleEdit') : t('users.userForm.titleCreate')}
          </h3>
          <button onClick={onCancel} aria-label={t('common.close') || 'Close'}>
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-10rem)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('users.userForm.nameLabel')}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder={t('users.userForm.namePlaceholder')}
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
                aria-required="true"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('users.userForm.emailLabel')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder={t('users.userForm.emailPlaceholder')}
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
                aria-required="true"
              />
            </div>

            {/* Password and Confirm Password fields - only for user creation or if password is being changed */}
            {!user || formData.password ? (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('users.userForm.passwordLabel')}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder={t('users.userForm.passwordPlaceholder')}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required={!user} // Only required for new user
                    minLength={8}
                    aria-required={!user}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('users.userForm.confirmPasswordLabel')}
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder={t('users.userForm.confirmPasswordPlaceholder')}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required={!user || !!formData.password} // Required for new user or if password is being changed
                    minLength={8}
                    aria-required={!user || !!formData.password}
                  />
                </div>
              </>
            ) : (
              // Optionally, show a button to reveal password fields for editing existing user
              <div className="md:col-span-2">
                <button 
                  type="button" 
                  onClick={() => setFormData(prev => ({...prev, password: ''}))} // Set to empty to trigger display of password fields
                  className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  {t('users.userForm.changePasswordButton', 'Change Password')}
                </button>
              </div>
            )}

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('users.userForm.roleLabel')}
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
                aria-required="true"
              >
                {availableRoles.map((roleValue) => (
                  <option key={roleValue} value={roleValue}>{t(`users.roles.${roleValue}`, roleValue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('users.userForm.statusLabel')}
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
                aria-required="true"
              >
                <option value="active">{t('users.statusValues.active')}</option>
                <option value="inactive">{t('users.statusValues.inactive')}</option>
                <option value="pending">{t('users.statusValues.pending')}</option>
                <option value="suspended">{t('users.statusValues.suspended')}</option>
              </select>
            </div>
            
            {/* User Type and Customer Account ID - Conditionally rendered based on current user's role */} 
            {(currentUser?.role === 'super_admin') && (
                <>
                    <div>
                        <label htmlFor="userType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('users.userForm.userTypeLabel', 'User Type')}
                        </label>
                        <select
                            id="userType"
                            name="userType"
                            value={formData.userType}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            required={currentUser?.role === 'super_admin'}
                            aria-required={currentUser?.role === 'super_admin'}
                        >
                            <option value="internal">{t('users.userType.internal')}</option>
                            <option value="external">{t('users.userType.external')}</option>
                        </select>
                    </div>

                    {formData.userType === 'external' && (
                        <div>
                            <label htmlFor="customerAccountId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('users.userForm.customerAccountLabel')}
                            </label>
                            <input
                                id="customerAccountId"
                                name="customerAccountId"
                                type="text"
                                placeholder={t('users.userForm.customerAccountPlaceholder')}
                                value={formData.customerAccountId}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                required={formData.userType === 'external'}
                                aria-required={formData.userType === 'external'}
                            />
                        </div>
                    )}
                </>
            )}

          </div>

          {/* <div className="border-t pt-6 dark:border-gray-700"> // Commented out UserPermissionsForm
            <UserPermissionsForm
              permissions={formData.permissions}
              onChange={handlePermissionsChange}
            />
          </div> */}

          <div className="flex justify-end space-x-3 pt-6 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {user ? t('users.userForm.updateUserButton') : t('users.userForm.createUserButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}