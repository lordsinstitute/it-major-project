import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import ComplaintsTable from './components/ComplaintsTable';
import { PlusCircle } from 'lucide-react';

export default function StudentComplaints() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Complaints Directory"
        subtitle="Filter, inspect, and track every campus maintenance issue you have submitted."
        actions={
          <Link to="/student/report">
            <Button variant="primary" size="sm" icon={<PlusCircle className="h-4 w-4" />}>
              Report an Issue
            </Button>
          </Link>
        }
      />

      <ComplaintsTable userId={user?.id} pageSize={10} />
    </div>
  );
}
