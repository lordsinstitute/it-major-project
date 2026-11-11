/**
 * StaffActionConsole — Primary mobile-first action hub for field technicians.
 */
import { useState } from 'react';
import { Play, CheckCircle, FileText, HelpCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import ProgressUpdateModal from './ProgressUpdateModal';
import ResolveTaskModal from './ResolveTaskModal';
import RequestHelpModal from './RequestHelpModal';
import { STATUSES } from '../../../../constants/statuses';
import { updateStatus } from '../../../../services/complaintService';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../hooks/useToast';

export default function StaffActionConsole({ task, onUpdated }) {
  const [starting, setStarting] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  const handleStartWork = async () => {
    try {
      setStarting(true);
      await updateStatus(task.id, {
        status: STATUSES.IN_PROGRESS,
        note: 'Technician on-site: Commenced active diagnostic and repair work.',
        by: user?.name || 'Technician',
        role: user?.role,
      });
      toast.success('Task status updated to IN_PROGRESS. Work underway!');
      onUpdated?.();
    } catch (err) {
      toast.error(err.message || 'Failed to start work.');
    } finally {
      setStarting(false);
    }
  };

  const isAssigned = task.status === STATUSES.ASSIGNED || task.status === STATUSES.REOPENED;
  const isInProgress = task.status === STATUSES.IN_PROGRESS;
  const isResolved = task.status === STATUSES.RESOLVED;
  const isVerified = task.status === STATUSES.VERIFIED;

  return (
    <Card className="p-4 sm:p-5 space-y-4 border-indigo-100 bg-gradient-to-b from-white to-slate-50/50">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Technician Dispatch Console</h3>
            <p className="text-xs text-slate-500">Live field execution actions</p>
          </div>
        </div>
      </div>

      {isAssigned && (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            This task is assigned to you. Click <strong>Start Work</strong> when on site to log the commencement timestamp.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Button
              variant="primary"
              size="sm"
              iconLeft={Play}
              loading={starting}
              onClick={handleStartWork}
              className="flex-1 min-h-[44px]"
            >
              Start Work
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconLeft={HelpCircle}
              onClick={() => setIsHelpOpen(true)}
              className="min-h-[44px] text-slate-600"
            >
              Cannot Complete
            </Button>
          </div>
        </div>
      )}

      {isInProgress && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Repair actively in progress.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Button
              variant="outline"
              size="sm"
              iconLeft={FileText}
              onClick={() => setIsProgressOpen(true)}
              className="min-h-[44px]"
            >
              Add Progress Note
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconLeft={CheckCircle}
              onClick={() => setIsResolveOpen(true)}
              className="min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Mark Resolved
            </Button>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setIsHelpOpen(true)}
            className="w-full text-slate-500 hover:text-rose-600"
          >
            Escalate / Request Assistance
          </Button>
        </div>
      )}

      {isResolved && (
        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Resolved & Submitted
          </div>
          <p className="text-emerald-700">
            Repair completed and awaiting student verification sign-off.
          </p>
        </div>
      )}

      {isVerified && (
        <div className="p-3 bg-teal-50 rounded-lg border border-teal-200 text-xs text-teal-800 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-teal-600" /> Closed & Verified
          </div>
          <p className="text-teal-700">
            Student confirmed the fix was satisfactory. Audit closed.
          </p>
        </div>
      )}

      {/* Modals */}
      <ProgressUpdateModal
        isOpen={isProgressOpen}
        onClose={() => setIsProgressOpen(false)}
        task={task}
        onSuccess={onUpdated}
      />
      <ResolveTaskModal
        isOpen={isResolveOpen}
        onClose={() => setIsResolveOpen(false)}
        task={task}
        onSuccess={onUpdated}
      />
      <RequestHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        task={task}
        onSuccess={onUpdated}
      />
    </Card>
  );
}
