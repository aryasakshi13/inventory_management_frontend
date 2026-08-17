import React from 'react';
import { useEmployee } from '../hooks/useEmployee';
import { EmployeeHeader } from '../components/employeeHeader.jsx';
import { EmployeeFilter } from '../components/employeeFilter.jsx';
import { EmployeeTable } from '../components/employeeTable.jsx';
import { EmployeeModal } from '../components/EmployeeModal';
import { EmployeeViewModal } from '../components/EmployeeViewModal';

export const EmployeeListPage = () => {
  const {
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
  } = useEmployee();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      <EmployeeHeader onAddNew={() => handleOpenModal()} />

      <EmployeeFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        roles={roles}
      />

      <EmployeeTable
        employees={employees}
        loading={loading}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        onView={handleOpenViewModal}
      />

      <EmployeeModal
        isOpen={isModalOpen}
        editingId={editingId}
        formData={formData}
        formError={formError}
        submitting={submitting}
        roles={roles}
        onChange={handleFormChange}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />
      
      <EmployeeViewModal
      isOpen={isViewModalOpen}
      onClose={handleCloseViewModal}
      employee={viewingEmployee}
    />

    </div>
  );
};