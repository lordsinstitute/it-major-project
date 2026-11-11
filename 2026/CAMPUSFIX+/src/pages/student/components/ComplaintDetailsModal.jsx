import React from 'react';
import Modal from '../../../components/ui/Modal';
import StatusBadge from '../../../components/ui/StatusBadge';
import PriorityBadge from '../../../components/ui/PriorityBadge';
import { MapPin, Clock, Calendar, MessageSquare, CheckCircle2 } from 'lucide-react';

export default function ComplaintDetailsModal({ complaint, isOpen, onClose }) {
  if (!complaint) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Complaint ${complaint.id}`} maxWidth="max-w-2xl">
      <div className="space-y-5 text-xs text-slate-700">
        {/* Title and Badges */}
        <div className="border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
              {complaint.category}
            </span>
          </div>
          <h2 className="mt-2 text-base font-bold text-slate-900">{complaint.title}</h2>
          <p className="mt-1 text-slate-600 leading-relaxed">{complaint.description}</p>
        </div>

        {/* Location & Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5 sm:grid-cols-3">
          <div>
            <span className="font-semibold text-slate-500">Building</span>
            <p className="font-bold text-slate-900">{complaint.location?.building || 'Main Campus'}</p>
          </div>
          <div>
            <span className="font-semibold text-slate-500">Floor & Room</span>
            <p className="font-bold text-slate-900">{complaint.location?.floor}, {complaint.location?.room}</p>
          </div>
          <div>
            <span className="font-semibold text-slate-500">Reported Date</span>
            <p className="font-bold text-slate-900">{new Date(complaint.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Audit Timeline */}
        <div>
          <h3 className="font-bold text-slate-900 flex items-center gap-1.5 mb-2.5">
            <Clock className="h-4 w-4 text-primary-600" />
            <span>Audit Trail & State History</span>
          </h3>
          <div className="space-y-2 border-l-2 border-slate-200 pl-3 ml-1.5">
            {complaint.timeline?.map((step, idx) => (
              <div key={idx} className="relative text-[11px] pb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{step.status}</span>
                  <span className="text-[10px] text-slate-400">{new Date(step.at).toLocaleString()}</span>
                </div>
                {step.note && <p className="text-slate-600 mt-0.5">"{step.note}"</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Comments if any */}
        {complaint.comments?.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 mb-2">
              <MessageSquare className="h-4 w-4 text-primary-600" />
              <span>Discussion Notes ({complaint.comments.length})</span>
            </h3>
            <div className="space-y-1.5">
              {complaint.comments.map((cm) => (
                <div key={cm.id} className="rounded-lg bg-slate-50 p-2.5 text-[11px]">
                  <p className="text-slate-800">{cm.text}</p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{new Date(cm.at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
