import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import * as complaintService from '../../../services/complaintService';
import StatusBadge from '../../../components/ui/StatusBadge';
import PriorityBadge from '../../../components/ui/PriorityBadge';
import Pagination from '../../../components/ui/Pagination';
import Skeleton from '../../../components/ui/Skeleton';
import EmptyState from '../../../components/ui/EmptyState';
import ErrorState from '../../../components/ui/ErrorState';
import Button from '../../../components/ui/Button';
import ComplaintsFilterBar from './ComplaintsFilterBar';
import ComplaintDetailsModal from './ComplaintDetailsModal';
import { PlusCircle, Eye } from 'lucide-react';

function formatRelative(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ComplaintsTable({ userId, pageSize = 8 }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 1, page: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const statusParam = searchParams.get('status') || '';
  const categoryParam = searchParams.get('category') || '';
  const priorityParam = searchParams.get('priority') || '';
  const searchParam = searchParams.get('search') || '';
  const pageParam = parseInt(searchParams.get('page') || '0', 10);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await complaintService.getComplaints({
        reportedBy: userId,
        status: statusParam || undefined,
        category: categoryParam || undefined,
        priority: priorityParam || undefined,
        search: searchParam || undefined,
        page: pageParam,
        size: pageSize,
      });
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  }, [userId, statusParam, categoryParam, priorityParam, searchParam, pageParam, pageSize]);

  useEffect(() => { loadData(); }, [loadData]);

  function updateFilter(key, val) {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val);
    else next.delete(key);
    next.set('page', '0');
    setSearchParams(next);
  }

  function handleReset() {
    setSearchParams(new URLSearchParams());
  }

  return (
    <div className="space-y-4">
      <ComplaintsFilterBar
        search={searchParam}
        status={statusParam}
        category={categoryParam}
        priority={priorityParam}
        onUpdateFilter={updateFilter}
        onReset={handleReset}
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-full" count={4} />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : data.content.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No complaints found"
              message={
                statusParam || categoryParam || priorityParam || searchParam
                  ? "No matching records found for active filters."
                  : "You have not reported any campus maintenance complaints yet."
              }
              action={
                <Link to="/student/report">
                  <Button variant="primary" size="sm" icon={<PlusCircle className="h-4 w-4" />}>
                    Report an Issue
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3.5">ID</th>
                    <th className="p-3.5">Title & Description</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Priority</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Updated</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.content.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedComplaint(c)}
                      className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5 font-mono font-bold text-primary-700">{c.id}</td>
                      <td className="p-3.5 max-w-xs">
                        <p className="font-bold text-slate-900 truncate">{c.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">{c.description}</p>
                      </td>
                      <td className="p-3.5 font-medium text-slate-700">{c.category}</td>
                      <td className="p-3.5 text-slate-600 truncate max-w-[140px]">
                        {c.location?.building}, {c.location?.room}
                      </td>
                      <td className="p-3.5"><PriorityBadge priority={c.priority} /></td>
                      <td className="p-3.5"><StatusBadge status={c.status} /></td>
                      <td className="p-3.5 text-slate-500 text-[11px]">{formatRelative(c.updatedAt)}</td>
                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedComplaint(c)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                          aria-label={`View details for ${c.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.totalPages > 1 && (
              <div className="border-t border-slate-100 p-3.5 flex justify-end">
                <Pagination
                  page={data.page}
                  totalPages={data.totalPages}
                  onPageChange={(p) => updateFilter('page', String(p))}
                />
              </div>
            )}
          </>
        )}
      </div>

      <ComplaintDetailsModal
        complaint={selectedComplaint}
        isOpen={Boolean(selectedComplaint)}
        onClose={() => setSelectedComplaint(null)}
      />
    </div>
  );
}
