import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 ring-1 ring-primary-200">
        <FileQuestion className="h-8 w-8" aria-hidden="true" />
      </div>
      <p className="mt-4 font-mono text-sm font-bold uppercase tracking-wider text-primary-600">404 Error</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        Page Not Found
      </h1>
      <p className="mt-3 max-w-md text-sm text-slate-600">
        The requested resource or research section does not exist or may have been repositioned in the prototype hierarchy.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Link to="/">
          <Button variant="primary" icon={<Home className="h-4 w-4" />}>
            Back to Homepage
          </Button>
        </Link>
        <Link to="/features">
          <Button variant="outline" icon={<ArrowLeft className="h-4 w-4" />}>
            Explore Features
          </Button>
        </Link>
      </div>
    </div>
  );
}
