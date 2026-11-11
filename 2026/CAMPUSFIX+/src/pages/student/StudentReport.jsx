import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { CATEGORIES } from '../../constants/categories';
import { PRIORITIES } from '../../constants/priorities';
import { CAMPUS } from '../../constants/campus';
import * as complaintService from '../../services/complaintService';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Step1Issue from './components/report/Step1Issue';
import Step2Location from './components/report/Step2Location';
import Step3Evidence from './components/report/Step3Evidence';
import Step4Review from './components/report/Step4Review';
import ReportSuccess from './components/report/ReportSuccess';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

const INITIAL_FORM = {
  title: '',
  category: CATEGORIES.ELECTRICAL,
  priority: PRIORITIES.MEDIUM,
  description: '',
  location: {
    building: CAMPUS.buildings[0].name,
    floor: CAMPUS.buildings[0].floors[0].label,
    room: CAMPUS.buildings[0].floors[0].rooms[0],
    landmark: '',
  },
};

const STEPS = ['Issue Details', 'Campus Location', 'Visual Evidence', 'Review & Submit'];

export default function StudentReport() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [evidence, setEvidence] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState(null);

  // Warn on leaving with unsaved inputs
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (!createdId && (form.title || form.description)) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [form.title, form.description, createdId]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      evidence.forEach((img) => { if (img.url) URL.revokeObjectURL(img.url); });
    };
  }, [evidence]);

  function handleChange(field, val) {
    setForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  }

  function handleAddImages(newImgs) {
    setEvidence((prev) => [...prev, ...newImgs].slice(0, 3));
  }

  function handleRemoveImage(idx) {
    const target = evidence[idx];
    if (target?.url) URL.revokeObjectURL(target.url);
    setEvidence((prev) => prev.filter((_, i) => i !== idx));
  }

  function validateStep(currentStep) {
    const errs = {};
    if (currentStep === 1) {
      if (!form.title.trim() || form.title.length < 8) errs.title = 'Title must be at least 8 characters long.';
      if (!form.description.trim() || form.description.length < 20) {
        errs.description = 'Please describe the issue in at least 20 characters.';
      }
    } else if (currentStep === 2) {
      if (!form.location.building) errs.building = 'Building block is required.';
      if (!form.location.floor) errs.floor = 'Floor level is required.';
      if (!form.location.room) errs.room = 'Room / area is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validateStep(step)) setStep((prev) => prev + 1);
  }

  function handleBack() {
    setErrors({});
    setStep((prev) => prev - 1);
  }

  async function handleSubmit() {
    if (!validateStep(1) || !validateStep(2)) {
      setStep(1);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        reportedBy: user.id,
        evidence: evidence.map((e) => ({ name: e.name, url: e.url })),
      };
      const result = await complaintService.createComplaint(payload);
      toast.success(`Complaint logged successfully as ${result.id}!`);
      setCreatedId(result.id);
    } catch (err) {
      toast.error(err.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setForm(INITIAL_FORM);
    setEvidence([]);
    setStep(1);
    setCreatedId(null);
    setErrors({});
  }

  if (createdId) {
    return <ReportSuccess complaintId={createdId} onReset={handleReset} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report Campus Issue"
        subtitle="Submit a maintenance complaint with verified spatial coordinates."
      />

      <div className="mx-auto max-w-2xl">
        {/* Step Progress Bar */}
        <div className="mb-6 flex items-center justify-between">
          {STEPS.map((label, idx) => {
            const stepNum = idx + 1;
            const isCompleted = step > stepNum;
            const isCurrent = step === stepNum;
            return (
              <div key={label} className="flex-1 flex flex-col items-center relative text-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
                </div>
                <span className={`mt-1.5 text-[10px] hidden sm:block ${isCurrent ? 'font-bold text-slate-900' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Wizard Step Form */}
        <Card className="p-6 sm:p-7 shadow-xs">
          <div className="mb-5 border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
              Step {step} of 4
            </span>
            <h2 className="text-base font-bold text-slate-900">{STEPS[step - 1]}</h2>
          </div>

          {step === 1 && <Step1Issue form={form} onChange={handleChange} errors={errors} />}
          {step === 2 && <Step2Location form={form} onChange={handleChange} errors={errors} />}
          {step === 3 && (
            <Step3Evidence
              evidence={evidence}
              onAddImages={handleAddImages}
              onRemoveImage={handleRemoveImage}
              error={errors.evidence}
            />
          )}
          {step === 4 && <Step4Review form={form} evidence={evidence} onGoToStep={(s) => setStep(s)} />}

          {/* Navigation Controls */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4">
            {step > 1 ? (
              <Button type="button" variant="outline" size="sm" onClick={handleBack} icon={<ArrowLeft className="h-4 w-4" />}>
                Back
              </Button>
            ) : <div />}

            {step < 4 ? (
              <Button type="button" variant="primary" size="sm" onClick={handleNext} icon={<ArrowRight className="h-4 w-4" />}>
                Continue
              </Button>
            ) : (
              <Button type="button" variant="primary" size="sm" loading={submitting} onClick={handleSubmit} icon={<Check className="h-4 w-4" />}>
                Submit Complaint
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
