/**
 * StaffTaskDetail — Operational dossier for field technicians with ownership boundaries.
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Building, Calendar, ShieldAlert, RefreshCw, Wrench } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import PrototypeBanner from '../../components/ui/PrototypeBanner';
import StatusTimeline from '../student/components/detail/StatusTimeline';
import ImageGalleryLightbox from '../student/components/detail/ImageGalleryLightbox';
import CommentsThread from '../student/components/detail/CommentsThread';
import StaffActionConsole from './components/detail/StaffActionConsole';
import AdminInternalNotes from '../admin/components/detail/AdminInternalNotes';
import { getComplaintById } from '../../services/complaintService';
import { useAuth } from '../../context/AuthContext';
import { isComplaintOverdue, getRemainingHours } from '../../utils/sla';

export default function StaffTaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTask = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getComplaintById(id);
      setTask(data);
    } catch {
      navigate('/staff/tasks');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading task specifications...
      </div>
    );
  }

  if (!task) return null;

  // Ownership Guardrail: Staff can only inspect tasks assigned to them
  const isAssignedToMe = task.assignedTo === user?.id || task.assignedTo === user?.name;
  if (!isAssignedToMe) {
    return (
      <Card className="p-8 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="p-3 rounded-full bg-rose-50 text-rose-600 w-12 h-12 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Task Access Restricted</h2>
        <p className="text-xs text-slate-600">
          This maintenance task is assigned to another staff technician or has not yet been routed to your queue.
        </p>
        <Link to="/staff/tasks">
          <Button variant="primary" size="sm">Return to My Tasks</Button>
        </Link>
      </Card>
    );
  }

  const overdue = isComplaintOverdue(task);
  const remaining = getRemainingHours(task);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/staff/tasks">
          <Button variant="ghost" size="sm" iconLeft={ArrowLeft} className="min-h-[44px] sm:min-h-0">
            Back to Task Queue
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-500">{task.id}</span>
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
      </div>

      <PrototypeBanner />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Task Info, Location, Evidence, Discourse */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5 space-y-4">
            <div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                {task.category}
              </span>
              <h1 className="text-xl font-bold text-slate-900 mt-1">{task.title}</h1>
            </div>

            {/* Spatial Coordinates Block */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Building className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong className="text-slate-900">Building:</strong>{' '}
                  {task.location?.buildingName || task.location?.building}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong className="text-slate-900">Room / Floor:</strong>{' '}
                  {task.location?.room || 'General Area'} (Floor {task.location?.floor || 'Ground'})
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong className="text-slate-900">Reported:</strong>{' '}
                  {new Date(task.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Wrench className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong className="text-slate-900">SLA Target:</strong>{' '}
                  {overdue ? <span className="text-rose-600 font-semibold">Overdue by {Math.abs(remaining)}h</span> : `~${Math.max(0, remaining)}h remaining`}
                </span>
              </div>
              {task.location?.landmark && (
                <div className="sm:col-span-2 text-slate-600 italic">
                  Landmark: &quot;{task.location.landmark}&quot;
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Student Description</h3>
              <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            </div>

            <ImageGalleryLightbox images={task.evidence} />

            {/* Completion Evidence if already resolved */}
            {task.resolutionDetails && (
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-2">
                <h3 className="font-bold text-emerald-900">Recorded Technician Resolution Proof</h3>
                <p className="text-emerald-800">
                  <strong>Cause:</strong> {task.resolutionDetails.causeCategory} • <strong>Materials:</strong> {task.resolutionDetails.materialsUsed}
                </p>
                <p className="text-emerald-700 whitespace-pre-wrap">{task.resolutionDetails.note}</p>
                {task.resolutionEvidence && <ImageGalleryLightbox images={task.resolutionEvidence} />}
              </div>
            )}
          </Card>

          <CommentsThread
            complaintId={task.id}
            comments={task.comments}
            onCommentAdded={fetchTask}
          />
        </div>

        {/* Right Column: Actions, Internal Notes, Timeline */}
        <div className="space-y-5">
          <StaffActionConsole task={task} onUpdated={fetchTask} />
          <AdminInternalNotes
            complaintId={task.id}
            notes={task.internalNotes}
            onNoteAdded={fetchTask}
          />
          <StatusTimeline timeline={task.timeline} />
        </div>
      </div>
    </div>
  );
}
