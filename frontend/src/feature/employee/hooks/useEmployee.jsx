import { useState, useCallback, useEffect } from 'react';
import { getAllEmployees, createEmployee, updateEmployee, deleteEmployee, getRoles, getNextEmployeeCode } from '../services/employeeService';

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
      setRoles(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
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

  // const handleOpenModal = useCallback((employee = null) => {
  //   if (employee) {
  //     setEditingId(employee.id || employee._id);
  //     setFormData(employee);
  //   } else {
  //     setEditingId(null);
  //     setFormData(INITIAL_FORM_DATA);
  //   }
  //   setFormError('');
  //   setIsModalOpen(true);
  // }, []);

   
  const handleOpenViewModal = useCallback((employee) => {
    setViewingEmployee(employee);
    setIsViewModalOpen(true);
  }, []);

  const handleCloseViewModal = useCallback(() => {
    setIsViewModalOpen(false);
    setViewingEmployee(null);
  }, []);






  // Updated handleOpenModal
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
        
        // Check if response contains valid JSON data or non-HTML string
        let code = 'Auto-generated';
        if (typeof res === 'object' && res?.employee_code) {
          code = res.employee_code;
        } else if (typeof res === 'string' && !res.trim().startsWith('<')) {
          code = res;
        }

        setFormData({
          ...INITIAL_FORM_DATA,
          employee_code: code,
        });
      } catch (error) {
        console.error('Error fetching next employee code:', error);
        setFormData({
          ...INITIAL_FORM_DATA,
          employee_code: 'Auto-generated',
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

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

   const mobile = formData.mobile_number?.trim() || '';

  if (!/^\d+$/.test(mobile)) {
    setFormError('Mobile number must contain only digits.');
    return;
  }

  if (mobile.length !== 10) {
    setFormError('Mobile number must be exactly 10 digits.');
    return;
  }

  const email = formData.email_id?.trim() || '';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!emailRegex.test(email)) {
    setFormError('Please enter a valid email address.');
    return;
  }

    try {
      if (editingId) {
        await updateEmployee(editingId, formData);
      } else {
        await createEmployee(formData);
      }
      handleCloseModal();
      await fetchEmployees();
    } catch (error) {
      setFormError(error.response?.data?.message || 'Error saving employee');
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  }, [editingId, formData, handleCloseModal, fetchEmployees]);

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
    handleFormChange,
    handleOpenModal,
    handleCloseModal,
    handleSubmit,
    handleDelete,
    isViewModalOpen,
     viewingEmployee,
    handleOpenViewModal,
    handleCloseViewModal,
  };
};
