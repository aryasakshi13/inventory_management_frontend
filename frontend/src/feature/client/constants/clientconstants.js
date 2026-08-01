export const CLIENT_STATUSES = [
  { value: 'active', label: 'Active', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'inactive', label: 'Inactive', badgeClass: 'bg-gray-100 text-gray-700 border-gray-200' },
//   { value: 'lead', label: 'Lead', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
 ];

export const EMPTY_CLIENT_FORM = {
  companyName: '',
  gstIn: '',
  contactPerson: '',
  emailId: '',
  Phone: '',
  status: 'active',
  Address: "",
};

// Role-based tab definitions
export const CLIENT_TAB_CONFIG = [
  { id: 'overview', label: 'Overview', allowedRoles: ['sales', 'admin', 'accounts'] },
  { id: 'orders', label: 'Sales Orders', allowedRoles: ['sales', 'admin', 'inventory'] },
  { id: 'addresses', label: 'Addresses', allowedRoles: ['sales', 'admin'] },
  { id: 'notes', label: 'Internal Notes', allowedRoles: ['sales', 'admin'] },
  { id: 'activity', label: 'Activity Timeline', allowedRoles: ['sales', 'admin'] },
];