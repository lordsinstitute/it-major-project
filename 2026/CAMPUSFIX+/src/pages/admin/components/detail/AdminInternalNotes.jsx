/**
 * AdminInternalNotes — Private staff discussion log invisible to students.
 */
import { useState } from 'react';
import { Lock, Send, ShieldCheck } from 'lucide-react';
import Card from '../../../../components/ui/Card';
import Button from '../../../../components/ui/Button';
import { addInternalNote } from '../../../../services/complaintService';
import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../hooks/useToast';

export default function AdminInternalNotes({ complaintId, notes = [], onNoteAdded }) {
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handlePost = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      setPosting(true);
      await addInternalNote(complaintId, {
        by: user?.name || 'Administrator',
        text: text.trim(),
      });
      toast.success('Internal note appended.');
      setText('');
      onNoteAdded?.();
    } catch (err) {
      toast.error(err.message || 'Failed to add internal note.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-50 text-amber-700">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Internal Team Notes</h3>
            <p className="text-xs text-amber-700 font-medium">Visible only to Admins & Staff</p>
          </div>
        </div>
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
          {notes.length}
        </span>
      </div>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            No internal staff notes yet. Use this channel for contractor updates or spare parts logs.
          </p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="p-3 bg-amber-50/40 rounded-lg border border-amber-100 text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold text-slate-700">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-600" /> {n.by}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {new Date(n.at).toLocaleDateString()} {new Date(n.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-slate-800 whitespace-pre-wrap">{n.text}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handlePost} className="space-y-2 pt-2 border-t border-slate-100">
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add private technical note (e.g. ordered replacement capacitor)..."
          className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <div className="flex justify-end">
          <Button variant="secondary" size="xs" type="submit" loading={posting} iconLeft={Send}>
            Post Note
          </Button>
        </div>
      </form>
    </Card>
  );
}
