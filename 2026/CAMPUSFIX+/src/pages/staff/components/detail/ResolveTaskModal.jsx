/**
 * ResolveTaskModal — Final sign-off dialog requiring cause analysis, resolution notes, and evidence upload.
 */
import { useState, useEffect } from 'react';
import { UploadCloud, X, CheckCircle2 } from 'lucide-react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';
import { STATUSES } from '../../../../constants/statuses';
import { updateStatus } from '../../../../services/complaintService';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../hooks/useToast';

const CAUSE_CATEGORIES = [
  'Normal Wear & Tear',
  'Electrical Surge / Overload',
  'Mechanical Failure & Jamming',
  'Environmental & Moisture Exposure',
  'Accidental Damage',
  'Preventative Replacement',
  'Other Root Cause',
];

export default function ResolveTaskModal({ isOpen, onClose, task, onSuccess }) {
  const [resolutionNote, setResolutionNote] = useState('');
  const [causeCategory, setCauseCategory] = useState(CAUSE_CATEGORIES[0]);
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [evidenceImages, setEvidenceImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      evidenceImages.forEach((img) => {
        if (img.url?.startsWith('blob:')) URL.revokeObjectURL(img.url);
      });
    };
  }, [evidenceImages]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Only JPG, PNG, or WebP images are permitted.');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size cannot exceed 5 MB.');
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      setEvidenceImages((prev) => [
        ...prev,
        { id: `res-${Date.now()}-${file.name}`, name: file.name, url: previewUrl },
      ]);
    }
  };

  const handleRemoveImage = (id) => {
    setEvidenceImages((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target?.url?.startsWith('blob:')) URL.revokeObjectURL(target.url);
      return prev.filter((x) => x.id !== id);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (resolutionNote.trim().length < 15) {
      toast.error('Resolution note must be at least 15 characters.');
      return;
    }
    if (evidenceImages.length === 0) {
      toast.error('At least one completion evidence photo is required.');
      return;
    }

    try {
      setSubmitting(true);
      await updateStatus(task.id, {
        status: STATUSES.RESOLVED,
        note: `Resolved by technician: ${resolutionNote.trim()}`,
        by: user?.name || 'Technician',
        role: user?.role,
        resolutionDetails: {
          note: resolutionNote.trim(),
          causeCategory,
          materialsUsed: materialsUsed.trim() || 'None recorded',
          completedAt: new Date().toISOString(),
        },
        resolutionEvidence: evidenceImages.map((img) => ({
          name: img.name,
          url: img.url,
        })),
      });

      toast.success('Task marked as Resolved! Sent for student verification.');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to resolve task.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete & Resolve Task"
      description="Document root cause diagnostics, replacement components installed, and upload visual proof."
    >
      <form onSubmit={handleSubmit} className="space-y-3 pt-1 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Diagnosis / Root Cause Category *
          </label>
          <select
            value={causeCategory}
            onChange={(e) => setCauseCategory(e.target.value)}
            className="w-full rounded-lg border border-slate-300 p-2 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            {CAUSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Resolution Notes (Min 15 chars) *
          </label>
          <textarea
            rows={2}
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            placeholder="Describe the exact repair steps performed, checks completed, and current operational state..."
            className="w-full rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Materials & Parts Consumed (Optional)
          </label>
          <input
            type="text"
            value={materialsUsed}
            onChange={(e) => setMaterialsUsed(e.target.value)}
            placeholder="e.g. 1x 15A fuse, 2m 2.5mm copper wire, sealant"
            className="w-full rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between font-semibold text-slate-700 mb-1">
            <span>Visual Completion Evidence * (Mandatory)</span>
            <span className="text-slate-400 font-normal">{evidenceImages.length} uploaded</span>
          </div>

          <label className="flex flex-col items-center justify-center p-2.5 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
            <UploadCloud className="w-5 h-5 text-indigo-600 mb-0.5" />
            <span className="font-semibold text-slate-700">Tap to upload completion photo</span>
            <span className="text-[10px] text-slate-400">JPG, PNG, WebP up to 5MB</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" />
          </label>

          {evidenceImages.length > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {evidenceImages.map((img) => (
                <div key={img.id} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200">
                  <img src={img.url} alt="Proof" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    className="absolute top-0.5 right-0.5 p-0.5 bg-slate-900/70 text-white rounded-full hover:bg-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button variant="primary" type="submit" loading={submitting} iconLeft={CheckCircle2}>Confirm & Mark Resolved</Button>
        </div>
      </form>
    </Modal>
  );
}
