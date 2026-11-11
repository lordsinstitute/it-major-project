/**
 * AdminComplaintDetail — 2-column detailed operational manager view with full triage controls.
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Building, Calendar, User, RefreshCw } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import PrototypeBanner from '../../components/ui/PrototypeBanner';
import StatusTimeline from '../student/components/detail/StatusTimeline';
import ImageGalleryLightbox from '../student/components/detail/ImageGalleryLightbox';
import CommentsThread from '../student/components/detail/CommentsThread';
import AdminActionPanel from './components/detail/AdminActionPanel';
import AdminInternalNotes from './components/detail/AdminInternalNotes';
import { getComplaintById } from '../../services/complaintService';

export default function AdminComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getComplaintById(id);
      setComplaint(data);
    } catch {
      navigate('/admin/complaints');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading complaint dossier...
      </div>
    );
  }

  if (!complaint) return null;

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/admin/complaints">
          <Button variant="ghost" size="sm" iconLeft={ArrowLeft}>
            Back to Complaints Queue
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-500">{complaint.id}</span>
          <StatusBadge status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
        </div>
      </div>

      <PrototypeBanner />

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Complaint Details & Discourse */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                {complaint.category}
              </span>
              <h1 className="text-xl font-bold text-slate-900 mt-1">{complaint.title}</h1>
            </div>

            {/* Spatial Location Block */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Building className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong className="text-slate-900">Building:</strong>{' '}
                  {complaint.location?.buildingName || complaint.location?.building}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong className="text-slate-900">Room / Floor:</strong>{' '}
                  {complaint.location?.room || 'General Area'} (Floor {complaint.location?.floor || 'Ground'})
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong className="text-slate-900">Reported By:</strong>{' '}
                  {complaint.reportedBy || 'Student Resident'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong className="text-slate-900">Reported At:</strong>{' '}
                  {new Date(complaint.createdAt).toLocaleString()}
                </span>
              </div>
              {complaint.location?.landmark && (
                <div className="sm:col-span-2 text-slate-600 italic">
                  Landmark: &quot;{complaint.location.landmark}&quot;
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {complaint.description}
              </p>
            </div>

            {/* Image Gallery Lightbox */}
            <ImageGalleryLightbox images={complaint.evidence} />
          </Card>

          {/* Student-facing Comments Thread */}
          <CommentsThread
            complaintId={complaint.id}
            comments={complaint.comments}
            onCommentAdded={fetchDetail}
          />
        </div>

        {/* Right Column: Actions, Internal Notes & Audit Timeline */}
        <div className="space-y-6">
          <AdminActionPanel complaint={complaint} onUpdated={fetchDetail} />
          <AdminInternalNotes
            complaintId={complaint.id}
            notes={complaint.internalNotes}
            onNoteAdded={fetchDetail}
          />
          <StatusTimeline timeline={complaint.timeline} />
        </div>
      </div>
    </div>
  );
}
