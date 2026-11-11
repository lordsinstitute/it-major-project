/**
 * AdminComplaints — Comprehensive complaint management queue with bulk operations.
 */
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { UserCheck, Layers, RefreshCw } from 'lucide-react';
import Button from '../../components/ui/Button';
import PrototypeBanner from '../../components/ui/PrototypeBanner';
import AdminComplaintsFilterBar from './components/AdminComplaintsFilterBar';
import AdminComplaintsTable from './components/AdminComplaintsTable';
import AdminBulkAssignModal from './components/AdminBulkAssignModal';
import { getComplaints } from '../../services/complaintService';

export default function AdminComplaints() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Extract filters from URL query parameters
  const currentFilters = {
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'ALL',
    priority: searchParams.get('priority') || 'ALL',
    category: searchParams.get('category') || 'ALL',
    department: searchParams.get('department') || 'ALL',
    building: searchParams.get('building') || 'ALL',
    sort: searchParams.get('sort') || 'createdAt',
    order: searchParams.get('order') || 'desc',
    page: parseInt(searchParams.get('page') || '0', 10),
    size: 10,
  };

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getComplaints(currentFilters);
      setComplaints(res.content);
      setTotalElements(res.totalElements);
      setTotalPages(res.totalPages);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleFilterChange = (updates) => {
    const updated = { ...currentFilters, ...updates };
    const params = new URLSearchParams();
    Object.entries(updated).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
        params.set(k, String(v));
      }
    });
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allSelected = complaints.every((c) => selectedIds.includes(c.id));
    setSelectedIds(allSelected ? [] : complaints.map((c) => c.id));
  };

  const handleSort = (field) => {
    const nextOrder = currentFilters.sort === field && currentFilters.order === 'asc' ? 'desc' : 'asc';
    handleFilterChange({ sort: field, order: nextOrder, page: 0 });
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Complaint Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, triage, filter, and dispatch campus maintenance complaints across all departments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              iconLeft={UserCheck}
              onClick={() => setIsBulkModalOpen(true)}
            >
              Bulk Assign ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" size="sm" iconLeft={RefreshCw} loading={loading} onClick={fetchComplaints}>
            Refresh
          </Button>
        </div>
      </div>

      <PrototypeBanner />

      {/* Filter Toolbar */}
      <AdminComplaintsFilterBar
        filters={currentFilters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Data Table */}
      <AdminComplaintsTable
        complaints={complaints}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onSort={handleSort}
        currentSort={currentFilters.sort}
        currentOrder={currentFilters.order}
        page={currentFilters.page}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={(nextPage) => handleFilterChange({ page: nextPage })}
        onOpenDetail={(id) => navigate(`/admin/complaints/${id}`)}
      />

      {/* Bulk Assign Modal */}
      <AdminBulkAssignModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedIds={selectedIds}
        onSuccess={() => {
          setSelectedIds([]);
          fetchComplaints();
        }}
      />
    </div>
  );
}
