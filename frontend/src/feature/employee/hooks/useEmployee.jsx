import { useState, useCallback, useEffect } from 'react';
import { 
  getAllEmployees, 
  createEmployee, 
  updateEmployee, 
  toggleEmployeeStatus,
  deleteEmployee, 
  getRoles, 
  getNextEmployeeCode 
} from '../services/employeeService';

const INITIAL_FORM_DATA = {
  employee_code: '',
  employee_name: '',
  email_id: '',
  mobile_number: '',
  role: '',
  location_branch: '',
  department: '',
  designation: '',
  employee_status: 'Active',
  password_hash: '',
};

export const useEmployee = () => {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const data = await getAllEmployees(params);
      setEmployees(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, statusFilter]);

  // Fetch roles from backend
  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const data = await getRoles();
      const loadedRoles = Array.isArray(data) ? data : data.data || [];
      if (loadedRoles.length > 0) {
        setRoles(loadedRoles);
      } else {
        setRoles(['Super Admin', 'Admin', 'Project Incharge', 'Order Manager', 'Warehouse Manager', 'Site Engineer', 'Manager']);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles(['Super Admin', 'Admin', 'Project Incharge', 'Order Manager', 'Warehouse Manager', 'Site Engineer', 'Manager']);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  // Fetch employees on mount and when filters change
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Fetch roles on mount
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleOpenViewModal = useCallback((employee) => {
    setViewingEmployee(employee);
    setIsViewModalOpen(true);
  }, []);

  const handleCloseViewModal = useCallback(() => {
    setIsViewModalOpen(false);
    setViewingEmployee(null);
  }, []);

  // Open Add/Edit Modal
  const handleOpenModal = useCallback(async (employee = null) => {
    setFormError('');

    if (employee) {
      setEditingId(employee.id || employee._id);
      setFormData(employee);
    } else {
      setEditingId(null);
      setFormData({ ...INITIAL_FORM_DATA, employee_code: 'Loading...' });

      try {
        const res = await getNextEmployeeCode();
        let code = 'Auto-generated';
        if (typeof res === 'object' && res?.employee_code) {
          code = res.employee_code;
        } else if (typeof res === 'string' && !res.trim().startsWith('<')) {
          code = res;
        }

        setFormData({
          ...INITIAL_FORM_DATA,
          employee_code: code,
          employee_status: 'Active',
        });
      } catch (error) {
        console.error('Error fetching next employee code:', error);
        setFormData({
          ...INITIAL_FORM_DATA,
          employee_code: 'Auto-generated',
          employee_status: 'Active',
        });
      }
    }

    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(INITIAL_FORM_DATA);
    setFormError('');
  }, []);

  // Form Submission with Strict Validations
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setFormError('');

    const name = formData.employee_name?.trim() || '';
    if (!name || name.length < 2) {
      setFormError('Full Name is required (minimum 2 characters).');
      return;
    }

    const email = formData.email_id?.trim() || '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      setFormError('Please enter a valid email address (e.g. user@company.com).');
      return;
    }

    const mobile = formData.mobile_number?.trim() || '';
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      setFormError('Mobile number must contain exactly 10 digits.');
      return;
    }

    const role = formData.role?.trim() || '';
    if (!role) {
      setFormError('Please select a System Role.');
      return;
    }

    const branch = formData.location_branch?.trim() || '';
    if (!branch || branch.length < 2) {
      setFormError('Location / Branch is required (minimum 2 characters).');
      return;
    }

    const department = formData.department?.trim() || '';
    if (!department || department.length < 2) {
      setFormError('Department is required (minimum 2 characters).');
      return;
    }

    const designation = formData.designation?.trim() || '';
    if (!designation || designation.length < 2) {
      setFormError('Designation is required (minimum 2 characters).');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        employee_name: name,
        email_id: email,
        mobile_number: mobile,
        role: role,
        location_branch: branch,
        department: department,
        designation: designation,
        employee_status: 'Active', // Default to Active
      };

      if (editingId) {
        await updateEmployee(editingId, payload);
      } else {
        await createEmployee(payload);
      }
      handleCloseModal();
      await fetchEmployees();
    } catch (error) {
      setFormError(error.response?.data?.message || 'Error saving employee. Please check entered details.');
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  }, [editingId, formData, handleCloseModal, fetchEmployees]);

  // Toggle Employee Status (Active / Inactive) directly from table
  const handleToggleStatus = useCallback(async (id, currentStatus) => {
    try {
      setStatusUpdatingId(id);
      await toggleEmployeeStatus(id, currentStatus);
      await fetchEmployees();
    } catch (error) {
      console.error('Error toggling employee status:', error);
      alert(error.response?.data?.message || 'Failed to update employee status.');
    } finally {
      setStatusUpdatingId(null);
    }
  }, [fetchEmployees]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      await deleteEmployee(id);
      await fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    roles,
    rolesLoading,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    isModalOpen,
    editingId,
    formData,
    formError,
    submitting,
    statusUpdatingId,
    handleFormChange,
    handleOpenModal,
    handleCloseModal,
    handleSubmit,
    handleToggleStatus,
    handleDelete,
    isViewModalOpen,
    viewingEmployee,
    handleOpenViewModal,
    handleCloseViewModal,
  };
};
