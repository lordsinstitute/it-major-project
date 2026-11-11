/**
 * AdminDashboard — Command center for facilities administrators.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, RefreshCw, Layers } from 'lucide-react';
import Button from '../../components/ui/Button';
import PrototypeBanner from '../../components/ui/PrototypeBanner';
import AdminStatCards from './components/AdminStatCards';
import AdminCharts from './components/AdminCharts';
import AdminNeedsAction from './components/AdminNeedsAction';
import { getAllComplaintsRaw } from '../../services/complaintService';

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAllComplaintsRaw();
      setComplaints(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatCardFilter = (filterParams) => {
    const searchParams = new URLSearchParams(filterParams);
    navigate(`/admin/complaints?${searchParams.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Operations Console</h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
              <ShieldCheck className="w-3.5 h-3.5" /> Facilities Admin
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time campus maintenance monitoring, automated SLA tracking, and staff dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" iconLeft={RefreshCw} loading={loading} onClick={loadData}>
            Sync Feed
          </Button>
          <Button variant="primary" size="sm" iconLeft={Layers} onClick={() => navigate('/admin/assignments')}>
            Dispatch Queue
          </Button>
        </div>
      </div>

      <PrototypeBanner />

      {/* 6 Key StatCards */}
      <AdminStatCards complaints={complaints} onSelectFilter={handleStatCardFilter} />

      {/* Urgent Action List */}
      <AdminNeedsAction complaints={complaints} />

      {/* Recharts Visual Breakdown */}
      <AdminCharts complaints={complaints} />
    </div>
  );
}
