import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import * as complaintService from '../../services/complaintService';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import Skeleton from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import StatusTimeline from './components/detail/StatusTimeline';
import ImageGalleryLightbox from './components/detail/ImageGalleryLightbox';
import CommentsThread from './components/detail/CommentsThread';
import VerificationCard from './components/detail/VerificationCard';
import { MapPin, ShieldX, Calendar, Building, UserCheck } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function StudentComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadComplaint = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await complaintService.getComplaintById(id);
      setComplaint(data);
    } catch (err) {
      setError(err.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadComplaint(); }, [loadComplaint]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadComplaint} />;
  }

  // Ownership Check: Student cannot view another student's complaint
  if (complaint.reportedBy !== user?.id) {
    return (
      <Card className="p-8 text-center max-w-lg mx-auto mt-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <ShieldX className="h-8 w-8" />
        </div>
        <h1 className="mt-3 text-lg font-bold text-slate-900">Access Denied</h1>
        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
          You do not possess authorization to view complaint <strong>{complaint.id}</strong>. In compliance with student privacy policies, complaints can only be inspected by their original author.
        </p>
        <Link to="/student/complaints" className="mt-6 inline-block">
          <Button variant="primary" size="sm">Back to My Complaints</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
              {complaint.id}
            </span>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {complaint.category}
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">{complaint.title}</h1>
        </div>

        <div className="text-right text-xs text-slate-500">
          <p>Logged: {new Date(complaint.createdAt).toLocaleDateString()}</p>
          <p>Updated: {new Date(complaint.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Details, Evidence, Comments */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Issue Description</h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-800 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 sm:text-sm">
                {complaint.description}
              </p>
            </div>

            {/* Spatial Location Details */}
            <div className="border-t border-slate-100 pt-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary-600" /> Location Coordinates
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 text-xs text-slate-700">
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <span className="text-slate-400 block text-[10px]">Building Block</span>
                  <span className="font-bold text-slate-900">{complaint.location?.building}</span>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5">
                  <span className="text-slate-400 block text-[10px]">Floor & Room</span>
                  <span className="font-bold text-slate-900">{complaint.location?.floor}, {complaint.location?.room}</span>
                </div>
                {complaint.location?.landmark && (
                  <div className="rounded-lg bg-slate-50 p-2.5 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 block text-[10px]">Landmark</span>
                    <span className="font-medium text-slate-800 truncate block">{complaint.location.landmark}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Image Gallery Lightbox */}
            {complaint.evidence?.length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <ImageGalleryLightbox evidence={complaint.evidence} />
              </div>
            )}
          </Card>

          {/* Comments Discussion Thread */}
          <Card className="p-5 sm:p-6">
            <CommentsThread
              complaintId={complaint.id}
              comments={complaint.comments}
              onCommentAdded={(c) => setComplaint((prev) => ({ ...prev, comments: [...prev.comments, c] }))}
              userId={user.id}
            />
          </Card>
        </div>

        {/* Right Column: Actions, Metadata Sidebar, Timeline */}
        <div className="space-y-6">
          {/* Conditional Verification / Cancellation Actions */}
          <VerificationCard
            complaint={complaint}
            onStatusUpdated={(updated) => setComplaint(updated)}
            user={user}
          />

          {/* Department & Handling Assignment */}
          <Card className="p-5 space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">Handling Assignment</h3>
            <div className="space-y-2 border-t border-slate-100 pt-2 text-slate-700">
              <p><span className="text-slate-400">Department:</span> <strong>{complaint.department || 'Triage Queue'}</strong></p>
              <p><span className="text-slate-400">Technician:</span> <strong>{complaint.assignedTo || 'Unassigned'}</strong></p>
              <p><span className="text-slate-400">SLA Priority:</span> <strong>{complaint.priority}</strong></p>
            </div>
          </Card>

          {/* Status Timeline */}
          <Card className="p-5">
            <StatusTimeline timeline={complaint.timeline} />
          </Card>
        </div>
      </div>
    </div>
  );
}
