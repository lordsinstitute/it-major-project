import React from 'react';
import Card from '../../../../components/ui/Card';
import PriorityBadge from '../../../../components/ui/PriorityBadge';
import { Edit2, MapPin, FileText, Image as ImageIcon } from 'lucide-react';

export default function Step4Review({ form, evidence = [], onGoToStep }) {
  return (
    <div className="space-y-4">
      {/* 1. Issue Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <FileText className="h-4 w-4 text-primary-600" />
            <span>Issue Details</span>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(1)}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:text-primary-700"
          >
            <Edit2 className="h-3 w-3" /> Edit
          </button>
        </div>
        <div className="mt-3 space-y-1.5 text-xs text-slate-700">
          <p><span className="font-semibold text-slate-900">Title:</span> {form.title}</p>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-900">Category:</span>
            <span className="rounded bg-slate-100 px-2 py-0.5 font-medium">{form.category}</span>
            <span className="font-semibold text-slate-900 ml-2">Urgency:</span>
            <PriorityBadge priority={form.priority} />
          </div>
          <p className="mt-2 text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            {form.description}
          </p>
        </div>
      </Card>

      {/* 2. Location Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <MapPin className="h-4 w-4 text-primary-600" />
            <span>Location Coordinates</span>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(2)}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:text-primary-700"
          >
            <Edit2 className="h-3 w-3" /> Edit
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700 sm:grid-cols-3">
          <div><span className="font-semibold text-slate-500">Building:</span> <p className="font-bold text-slate-900">{form.location.building}</p></div>
          <div><span className="font-semibold text-slate-500">Floor:</span> <p className="font-bold text-slate-900">{form.location.floor}</p></div>
          <div><span className="font-semibold text-slate-500">Room:</span> <p className="font-bold text-slate-900">{form.location.room}</p></div>
        </div>
        {form.location.landmark && (
          <p className="mt-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Landmark:</span> {form.location.landmark}
          </p>
        )}
      </Card>

      {/* 3. Evidence Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <ImageIcon className="h-4 w-4 text-primary-600" />
            <span>Attachments ({evidence.length})</span>
          </div>
          <button
            type="button"
            onClick={() => onGoToStep(3)}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:text-primary-700"
          >
            <Edit2 className="h-3 w-3" /> Edit
          </button>
        </div>
        {evidence.length === 0 ? (
          <p className="mt-3 text-xs text-slate-400 italic">No photographic attachments provided.</p>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {evidence.map((img, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 overflow-hidden aspect-video bg-slate-100">
                <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
