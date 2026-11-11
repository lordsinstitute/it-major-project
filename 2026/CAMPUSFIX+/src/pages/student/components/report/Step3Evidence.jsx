import React, { useRef, useState } from 'react';
import { UploadCloud, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function Step3Evidence({ evidence = [], onAddImages, onRemoveImage, error }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');

  function processFiles(files) {
    setUploadError('');
    const valid = [];
    const countRemaining = 3 - evidence.length;

    if (files.length > countRemaining) {
      setUploadError(`Maximum 3 images allowed. Only adding the first ${countRemaining}.`);
    }

    const filesToInspect = Array.from(files).slice(0, countRemaining);

    for (const f of filesToInspect) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        setUploadError('Only JPG, PNG, or WebP images are allowed.');
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        setUploadError(`File "${f.name}" exceeds the 5MB size limit.`);
        return;
      }
      const previewUrl = URL.createObjectURL(f);
      valid.push({ file: f, url: previewUrl, name: f.name });
    }

    if (valid.length > 0) {
      onAddImages(valid);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-600">
        <p className="font-semibold text-slate-800">Visual Evidence (Optional, Up to 3)</p>
        <p className="mt-0.5">Uploading clear photographs of the breakdown assists triage and prepares technician spare parts.</p>
      </div>

      {(error || uploadError) && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error || uploadError}</span>
        </div>
      )}

      {/* Drag & Drop Area */}
      {evidence.length < 3 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-primary-500 bg-primary-50/50'
              : 'border-slate-300 hover:border-primary-400 bg-white'
          }`}
        >
          <UploadCloud className="h-9 w-9 text-slate-400 mb-2" />
          <p className="text-xs font-bold text-slate-800">
            Click to upload or drag & drop files here
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, or WebP up to 5MB each (Max 3)</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) processFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      )}

      {/* Thumbnails */}
      {evidence.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {evidence.map((img, idx) => (
            <div key={idx} className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-100 aspect-video">
              <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemoveImage(idx)}
                className="absolute right-1.5 top-1.5 rounded-full bg-slate-900/70 p-1 text-white hover:bg-rose-600 transition-colors"
                aria-label={`Remove image ${img.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 p-1 px-1.5 text-[9px] text-white truncate">
                {img.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
