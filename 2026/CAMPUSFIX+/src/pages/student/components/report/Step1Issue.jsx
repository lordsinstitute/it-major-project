import React from 'react';
import FormField from '../../../../components/ui/FormField';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import Textarea from '../../../../components/ui/Textarea';
import { CATEGORIES } from '../../../../constants/categories';
import { PRIORITIES } from '../../../../constants/priorities';
import { AlertCircle } from 'lucide-react';

const CATEGORY_OPTIONS = Object.values(CATEGORIES).map((c) => ({
  value: c,
  label: c.replace(/_/g, ' '),
}));

const URGENCY_OPTIONS = [
  { value: PRIORITIES.LOW, label: 'Low — Non-disruptive convenience wear' },
  { value: PRIORITIES.MEDIUM, label: 'Medium — Normal maintenance breakdown' },
  { value: PRIORITIES.HIGH, label: 'High — Urgent discomfort or partial disruption' },
];

export default function Step1Issue({ form, onChange, errors }) {
  const charCount = form.description ? form.description.length : 0;

  return (
    <div className="space-y-4">
      <FormField label="Complaint Title" required error={errors.title} hint="Between 8 and 100 characters">
        <Input
          value={form.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="e.g. Ceiling fan humming loudly and not spinning"
          error={Boolean(errors.title)}
          maxLength={100}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Category" required error={errors.category}>
          <Select
            value={form.category}
            onChange={(e) => onChange('category', e.target.value)}
            options={CATEGORY_OPTIONS}
          />
        </FormField>

        <FormField label="Urgency Self-Assessment" required error={errors.priority}>
          <Select
            value={form.priority}
            onChange={(e) => onChange('priority', e.target.value)}
            options={URGENCY_OPTIONS}
          />
        </FormField>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
        <span>
          <strong>Priority Policy:</strong> Your self-assessment guides triage. Estate Administration verifies safety regulations and sets the final SLA deadline.
        </span>
      </div>

      <FormField
        label="Detailed Description"
        required
        error={errors.description}
        hint={`Min 20 characters (${charCount} / 1000)`}
      >
        <Textarea
          rows={5}
          value={form.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Describe the issue, when it started, and specific symptoms..."
          error={Boolean(errors.description)}
          maxLength={1000}
        />
      </FormField>
    </div>
  );
}
