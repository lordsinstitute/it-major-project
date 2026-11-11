/**
 * AdminUsers — User account administration with role controls and security boundaries.
 */
import { useState, useEffect } from 'react';
import { UserPlus, Search, Shield, RefreshCw, Power } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import PrototypeBanner from '../../components/ui/PrototypeBanner';
import CreateStaffModal from './components/CreateStaffModal';
import { getUsers, toggleUserStatus, changeUserRole } from '../../services/userService';
import { ROLES } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // { user, action: 'toggle' | 'role', newRole }
  const [submitting, setSubmitting] = useState(false);

  const { user: currentAdmin } = useAuth();
  const { toast } = useToast();

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers({ role: roleFilter, search });
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, search]);

  const handleConfirmAction = async () => {
    if (!confirmTarget) return;
    try {
      setSubmitting(true);
      if (confirmTarget.action === 'toggle') {
        await toggleUserStatus(confirmTarget.user.id, currentAdmin?.id);
        toast.success(`User ${confirmTarget.user.name} status updated.`);
      } else if (confirmTarget.action === 'role') {
        await changeUserRole(confirmTarget.user.id, confirmTarget.newRole, currentAdmin?.id);
        toast.success(`User ${confirmTarget.user.name} role changed to ${confirmTarget.newRole}.`);
      }
      setConfirmTarget(null);
      loadUsers();
    } catch (err) {
      toast.error(err.message || 'Operation blocked.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Account Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage student directories, administrative privileges, and staff assignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" iconLeft={RefreshCw} loading={loading} onClick={loadUsers}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" iconLeft={UserPlus} onClick={() => setIsCreateModalOpen(true)}>
            Add Staff Member
          </Button>
        </div>
      </div>

      <PrototypeBanner />

      {/* Search & Role Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, roll, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['ALL', ROLES.STUDENT, ROLES.STAFF, ROLES.ADMIN].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                roleFilter === r ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Affiliation / Dept</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isSelf = u.id === currentAdmin?.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        {u.name} {isSelf && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">You</span>}
                      </div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        disabled={isSelf}
                        onChange={(e) => setConfirmTarget({ user: u, action: 'role', newRole: e.target.value })}
                        className="text-xs rounded border border-slate-200 px-2 py-1 bg-white disabled:bg-slate-50"
                      >
                        <option value={ROLES.STUDENT}>STUDENT</option>
                        <option value={ROLES.STAFF}>STAFF</option>
                        <option value={ROLES.ADMIN}>ADMIN</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {u.department || u.assignedDepartment || u.rollNumber || 'Campus Resident'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={u.isActive ? 'success' : 'neutral'} size="sm">
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant={u.isActive ? 'danger' : 'outline'}
                        size="xs"
                        disabled={isSelf}
                        iconLeft={Power}
                        onClick={() => setConfirmTarget({ user: u, action: 'toggle' })}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        title="Confirm User Account Modification"
        description={
          confirmTarget?.action === 'toggle'
            ? `Are you sure you want to ${confirmTarget.user.isActive ? 'deactivate' : 'activate'} the account for ${confirmTarget.user.name}?`
            : `Are you sure you want to change the role for ${confirmTarget?.user?.name} to ${confirmTarget?.newRole}?`
        }
      >
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={() => setConfirmTarget(null)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmAction} loading={submitting}>
            Confirm Modification
          </Button>
        </div>
      </Modal>

      <CreateStaffModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadUsers}
      />
    </div>
  );
}
