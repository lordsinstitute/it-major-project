import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import * as complaintService from '../../../../services/complaintService';
import { useToast } from '../../../../hooks/useToast';
import Button from '../../../../components/ui/Button';

export default function CommentsThread({ complaintId, comments = [], onCommentAdded, userId }) {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;

    setSubmitting(true);
    try {
      const newComment = await complaintService.addComment(complaintId, {
        by: userId,
        text: text.trim(),
      });
      setText('');
      toast.success('Comment posted successfully.');
      if (onCommentAdded) onCommentAdded(newComment);
    } catch (err) {
      toast.error(err.message || 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
        <MessageSquare className="h-4 w-4 text-primary-600" />
        <span>Discussion & Clarification Notes ({comments.length})</span>
      </h3>

      <div className="space-y-2.5">
        {comments.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No notes posted yet. Use the box below to message the maintenance team.</p>
        ) : (
          comments.map((cm) => (
            <div key={cm.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs">
              <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1 border-b border-slate-200/50">
                <span className="font-semibold text-slate-700">{cm.by}</span>
                <span>{new Date(cm.at).toLocaleString()}</span>
              </div>
              <p className="mt-1.5 text-slate-800 leading-relaxed">{cm.text}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2 pt-2">
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask a question or provide additional details to the handling team..."
          className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          required
        />
        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="sm" loading={submitting} icon={<Send className="h-3.5 w-3.5" />}>
            Post Note
          </Button>
        </div>
      </form>
    </div>
  );
}
