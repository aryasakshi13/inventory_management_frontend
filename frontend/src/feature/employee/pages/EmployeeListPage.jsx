import React, { useState, useEffect } from 'react';
import { useEmployee } from '../hooks/useEmployee';
import { EmployeeHeader } from '../components/employeeHeader.jsx';
import { EmployeeFilter } from '../components/employeeFilter.jsx';
import { EmployeeTable } from '../components/employeeTable.jsx';
import { EmployeeModal } from '../components/EmployeeModal';
import { EmployeeViewModal } from '../components/employeeViewModal';
import { Pagination } from '../../../components/common/pagination';

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
    handleClearFilters,
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
  } = useEmployee();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset to first page when search query, filters, or list size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, employees.length]);

  const totalItems = employees.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = employees.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <EmployeeHeader onAddNew={() => handleOpenModal()} />

      <EmployeeFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        roles={roles}
        onClearFilters={handleClearFilters}
      />

      <EmployeeTable
        employees={paginatedEmployees}
        loading={loading}
        onEdit={handleOpenModal}
        onView={handleOpenViewModal}
        onToggleStatus={handleToggleStatus}
        statusUpdatingId={statusUpdatingId}
      >
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(Math.max(1, Math.min(totalPages, page)))}
        />
      </EmployeeTable>

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