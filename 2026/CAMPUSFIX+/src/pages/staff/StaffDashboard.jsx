/**
 * StaffDashboard — Mobile-first workspace for field technicians and maintenance staff.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, RefreshCw, ListFilter } from 'lucide-react';
import Button from '../../components/ui/Button';
import PrototypeBanner from '../../components/ui/PrototypeBanner';
import StaffStatCards from './components/StaffStatCards';
import StaffPriorityTasks from './components/StaffPriorityTasks';
import StaffWorkloadChart from './components/StaffWorkloadChart';
import { getAllComplaintsRaw } from '../../services/complaintService';
import { useAuth } from '../../context/AuthContext';

export default function StaffDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const loadTasks = async () => {
    try {
      setLoading(true);
      const all = await getAllComplaintsRaw();
      // Filter strictly to current staff member
      const myTasks = all.filter(
        (c) => c.assignedTo === user?.id || c.assignedTo === user?.name
      );
      setTasks(myTasks);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user]);

  const handleStatCardFilter = (filterParams) => {
    const params = new URLSearchParams(filterParams);
    navigate(`/staff/tasks?${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      {/* Technician Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Technician Workspace
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
              <Wrench className="w-3.5 h-3.5" /> {user?.name || 'Staff'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Fast mobile dispatch log. Track open repairs, document parts used, and upload completion proof.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            iconLeft={RefreshCw}
            loading={loading}
            onClick={loadTasks}
            className="min-h-[44px] sm:min-h-0"
          >
            Sync Tasks
          </Button>
          <Button
            variant="primary"
            size="sm"
            iconLeft={ListFilter}
            onClick={() => navigate('/staff/tasks')}
            className="min-h-[44px] sm:min-h-0"
          >
            All Tasks
          </Button>
        </div>
      </div>

      <PrototypeBanner />

      {/* 5 Field StatCards */}
      <StaffStatCards tasks={tasks} onSelectFilter={handleStatCardFilter} />

      {/* Today's Priority Work */}
      <StaffPriorityTasks tasks={tasks} />

      {/* Visual Workload Breakdown */}
      <StaffWorkloadChart tasks={tasks} />
    </div>
  );
}
