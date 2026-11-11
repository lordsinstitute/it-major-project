import React, { useState } from 'react';
import Modal from '../../../../components/ui/Modal';
import { Image as ImageIcon, ZoomIn } from 'lucide-react';

export default function ImageGalleryLightbox({ evidence = [] }) {
  const [activeImage, setActiveImage] = useState(null);

  if (!evidence || evidence.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
        <ImageIcon className="h-4 w-4 text-primary-600" />
        <span>Photographic Evidence ({evidence.length})</span>
      </h3>

      <div className="grid grid-cols-3 gap-2.5">
        {evidence.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveImage(img)}
            className="group relative rounded-xl border border-slate-200 overflow-hidden aspect-video bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-600 cursor-pointer"
          >
            <img src={img.url} alt={img.name || `Evidence ${idx + 1}`} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <ZoomIn className="h-5 w-5" />
            </div>
          </button>
        ))}
      </div>

      {activeImage && (
        <Modal
          isOpen={Boolean(activeImage)}
          onClose={() => setActiveImage(null)}
          title={activeImage.name || 'Evidence Preview'}
          maxWidth="max-w-3xl"
        >
          <div className="flex flex-col items-center">
            <img
              src={activeImage.url}
              alt={activeImage.name || 'Full view'}
              className="max-h-[75vh] w-auto rounded-xl object-contain shadow-lg"
            />
            {activeImage.name && (
              <p className="mt-2 text-xs text-slate-500 font-mono">{activeImage.name}</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
