/**
 * DesignSystem — living style guide for CampusFix+.
 * Route: /design-system (hidden from public nav).
 * Renders every UI component with all variants, keyboard-accessible.
 */
import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import ComingSoonBadge from '../../components/ui/ComingSoonBadge';
import PrototypeBanner from '../../components/ui/PrototypeBanner';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import Checkbox from '../../components/ui/Checkbox';
import FormField from '../../components/ui/FormField';
import Modal from '../../components/ui/Modal';
import Tabs from '../../components/ui/Tabs';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Tooltip from '../../components/ui/Tooltip';
import Avatar from '../../components/ui/Avatar';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Skeleton from '../../components/ui/Skeleton';
import PageHeader from '../../components/ui/PageHeader';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import { useToast } from '../../hooks/useToast.jsx';
import {
  Zap, Search, Plus, Wrench, Users, AlertTriangle,
  Inbox, BarChart2, CheckCircle,
} from 'lucide-react';
import { STATUSES, ALL_STATUSES } from '../../constants/statuses';
import { PRIORITIES, ALL_PRIORITIES } from '../../constants/priorities';

/* ── Section wrapper ── */
function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div>
      {label && <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{label}</p>}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

/* ── Table demo data ── */
const TABLE_COLS = [
  { key: 'id', label: 'ID', sortable: true, width: 'w-28' },
  { key: 'title', label: 'Title', sortable: true },
  { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  { key: 'priority', label: 'Priority', render: (r) => <PriorityBadge priority={r.priority} /> },
];

const TABLE_DATA = [
  { id: 'CMP-001', title: 'Ceiling fan not working — Block B, Room B-204', status: STATUSES.VERIFIED, priority: PRIORITIES.HIGH },
  { id: 'CMP-002', title: 'Water leakage near washroom pipe — Block A GF', status: STATUSES.IN_PROGRESS, priority: PRIORITIES.CRITICAL },
  { id: 'CMP-003', title: 'Wi-Fi dead zone in Library First Floor',         status: STATUSES.ASSIGNED,    priority: PRIORITIES.HIGH },
];

const TAB_LIST = [
  { id: 'overview', label: 'Overview', badge: 3 },
  { id: 'components', label: 'Components' },
  { id: 'tokens', label: 'Design Tokens' },
];

export default function DesignSystem() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [activePillTab, setActivePillTab] = useState('overview');
  const [sortState, setSortState] = useState({ key: 'id', order: 'asc' });
  const [page, setPage] = useState(0);

  const handleSort = (key) =>
    setSortState((s) => ({ key, order: s.key === key && s.order === 'asc' ? 'desc' : 'asc' }));

  const SECTIONS = [
    'Banners', 'Buttons', 'Badges', 'Form Controls', 'Modal',
    'Tabs', 'Table', 'Pagination', 'Tooltip', 'Avatar',
    'StatCards', 'States', 'Skeleton', 'PageHeader', 'Breadcrumbs',
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky top nav */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-soft-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">CampusFix+ Design System</h1>
            <p className="text-xs text-slate-500">Living style guide — all components &amp; variants</p>
          </div>
          <PrototypeBanner compact />
        </div>
        {/* Jump links */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-1 overflow-x-auto">
          <div className="flex gap-1 whitespace-nowrap">
            {SECTIONS.map((s) => (
              <a
                key={s}
                href={`#${s.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-primary-600
                           hover:bg-primary-50 rounded-lg transition-colors focus-visible:ring-2
                           focus-visible:ring-primary-500"
              >
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-14">

        {/* ── Banners ── */}
        <Section id="banners" title="Banners">
          <Row label="Full banner">
            <div className="w-full"><PrototypeBanner /></div>
          </Row>
          <Row label="Compact badge">
            <PrototypeBanner compact />
          </Row>
          <Row label="Coming soon">
            <ComingSoonBadge />
            <ComingSoonBadge label="AI Prioritisation — Coming Soon" />
            <ComingSoonBadge label="IoT Sensors — Coming Soon" />
          </Row>
        </Section>

        {/* ── Buttons ── */}
        <Section id="buttons" title="Buttons">
          <Row label="Variants">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </Row>
          <Row label="Sizes">
            <Button size="xs">Extra Small</Button>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </Row>
          <Row label="States">
            <Button loading>Saving…</Button>
            <Button disabled>Disabled</Button>
            <Button icon={<Plus size={15} />}>New Complaint</Button>
            <Button variant="outline" icon={<Search size={15} />}>Search</Button>
          </Row>
          <Row label="Toast triggers">
            <Button size="sm" variant="primary"  onClick={() => toast.success('Complaint submitted successfully!')}>Success toast</Button>
            <Button size="sm" variant="danger"   onClick={() => toast.error('Failed to update status.')}>Error toast</Button>
            <Button size="sm" variant="outline"  onClick={() => toast.info('Assignment updated.')}>Info toast</Button>
            <Button size="sm" variant="secondary" onClick={() => toast.warning('Deadline approaching in 2 hours.')}>Warning toast</Button>
          </Row>
        </Section>

        {/* ── Badges ── */}
        <Section id="badges" title="Badges">
          <Row label="Status badges">
            {ALL_STATUSES.map((s) => <StatusBadge key={s} status={s} />)}
          </Row>
          <Row label="Status badges (sm)">
            {ALL_STATUSES.map((s) => <StatusBadge key={s} status={s} size="sm" />)}
          </Row>
          <Row label="Priority badges">
            {ALL_PRIORITIES.map((p) => <PriorityBadge key={p} priority={p} />)}
          </Row>
          <Row label="Generic badges">
            {['slate','indigo','teal','green','yellow','orange','red','blue','amber','violet','pink'].map((c) => (
              <Badge key={c} color={c} dot>{c.charAt(0).toUpperCase() + c.slice(1)}</Badge>
            ))}
          </Row>
        </Section>

        {/* ── Form Controls ── */}
        <Section id="form-controls" title="Form Controls">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FormField label="Complaint Title" required htmlFor="ds-title" hint="Describe the issue in one line.">
              <Input id="ds-title" placeholder="e.g. Ceiling fan not working" />
            </FormField>
            <FormField label="Description" htmlFor="ds-desc">
              <Textarea id="ds-desc" placeholder="Provide details about the issue…" rows={3} />
            </FormField>
            <FormField label="Priority" htmlFor="ds-priority" error="This field is required.">
              <Select
                id="ds-priority"
                placeholder="Select priority"
                error="This field is required."
                options={ALL_PRIORITIES.map((p) => ({ value: p, label: p.charAt(0) + p.slice(1).toLowerCase() }))}
              />
            </FormField>
            <FormField label="Search with icon" htmlFor="ds-search">
              <Input id="ds-search" placeholder="Search complaints…" icon={<Search size={15} />} />
            </FormField>
            <FormField label="Input with error" htmlFor="ds-err">
              <Input id="ds-err" placeholder="Enter value" error="Value cannot be empty." />
              <p className="text-xs text-red-600 mt-1">Value cannot be empty.</p>
            </FormField>
            <div className="flex flex-col gap-3 pt-1">
              <Checkbox label="I confirm the issue is still active" hint="Uncheck if already resolved." />
              <Checkbox label="Notify me via email" defaultChecked />
              <Checkbox label="Disabled option" disabled />
            </div>
          </div>
        </Section>

        {/* ── Modal ── */}
        <Section id="modal" title="Modal">
          <Row>
            <Button onClick={() => setModalOpen(true)} icon={<Plus size={15} />}>Open modal</Button>
          </Row>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Update Complaint Status"
            description="Change the status and add a resolution note."
            footer={
              <>
                <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button onClick={() => { toast.success('Status updated!'); setModalOpen(false); }}>Save changes</Button>
              </>
            }
          >
            <div className="space-y-4">
              <FormField label="New Status" htmlFor="modal-status">
                <Select
                  id="modal-status"
                  placeholder="Select new status"
                  options={ALL_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
                />
              </FormField>
              <FormField label="Resolution Note" htmlFor="modal-note">
                <Textarea id="modal-note" placeholder="Describe what was done…" rows={3} />
              </FormField>
            </div>
          </Modal>
        </Section>

        {/* ── Tabs ── */}
        <Section id="tabs" title="Tabs">
          <Row label="Underline variant">
            <div className="w-full">
              <Tabs tabs={TAB_LIST} active={activeTab} onChange={setActiveTab} />
              <div className="mt-4 p-4 bg-white rounded-xl border border-slate-100 text-sm text-slate-600">
                Active tab: <strong>{activeTab}</strong>
              </div>
            </div>
          </Row>
          <Row label="Pills variant">
            <Tabs tabs={TAB_LIST} active={activePillTab} onChange={setActivePillTab} variant="pills" />
          </Row>
        </Section>

        {/* ── Table ── */}
        <Section id="table" title="Table">
          <Table
            columns={TABLE_COLS}
            data={TABLE_DATA}
            sort={sortState}
            onSort={handleSort}
          />
          <p className="text-xs text-slate-400">Click column headers to sort.</p>
        </Section>

        {/* ── Pagination ── */}
        <Section id="pagination" title="Pagination">
          <Card padding="md">
            <Pagination
              page={page}
              totalPages={8}
              totalElements={75}
              pageSize={10}
              onPageChange={setPage}
            />
          </Card>
        </Section>

        {/* ── Tooltip ── */}
        <Section id="tooltip" title="Tooltip">
          <Row>
            <Tooltip content="Tooltips provide context on hover or focus" position="top">
              <Button variant="outline" size="sm">Hover me (top)</Button>
            </Tooltip>
            <Tooltip content="Right-side tooltip" position="right">
              <Button variant="outline" size="sm">Hover me (right)</Button>
            </Tooltip>
            <Tooltip content="Bottom tooltip" position="bottom">
              <Button variant="outline" size="sm">Hover me (bottom)</Button>
            </Tooltip>
          </Row>
        </Section>

        {/* ── Avatar ── */}
        <Section id="avatar" title="Avatar">
          <Row label="Sizes">
            <Avatar name="Arjun Mehta" initials="AM" color="bg-indigo-500" size="xs" />
            <Avatar name="Sneha Rao" initials="SR" color="bg-pink-500" size="sm" />
            <Avatar name="Dr. Vikram Anand" initials="VA" color="bg-teal-600" size="md" />
            <Avatar name="Ravi Shankar" initials="RS" color="bg-amber-500" size="lg" />
            <Avatar name="Mohammed Idris" initials="MI" color="bg-violet-500" size="xl" />
          </Row>
        </Section>

        {/* ── StatCards ── */}
        <Section id="statcards" title="StatCards">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Total Complaints"
              value="30"
              subtitle="All time"
              icon={<Inbox size={20} className="text-primary-600" />}
              iconColor="bg-primary-50"
              trend={{ value: '12% this month', up: true }}
            />
            <StatCard
              title="In Progress"
              value="5"
              subtitle="Being worked on"
              icon={<Wrench size={20} className="text-amber-600" />}
              iconColor="bg-amber-50"
            />
            <StatCard
              title="Resolved"
              value="18"
              subtitle="Closed successfully"
              icon={<CheckCircle size={20} className="text-green-600" />}
              iconColor="bg-green-50"
            />
            <StatCard
              title="Critical Open"
              value="3"
              subtitle="Need immediate attention"
              icon={<AlertTriangle size={20} className="text-red-500" />}
              iconColor="bg-red-50"
              trend={{ value: '2 more than last week', up: false }}
            />
            <StatCard title="Loading skeleton" value="—" loading />
          </div>
        </Section>

        {/* ── Empty / Error States ── */}
        <Section id="states" title="States">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <EmptyState
                icon={<Inbox size={48} strokeWidth={1.5} />}
                title="No complaints filed"
                message="You have not submitted any maintenance complaints yet. Use the button below to get started."
                action={<Button size="sm" icon={<Plus size={14} />}>File a complaint</Button>}
              />
            </Card>
            <Card>
              <ErrorState
                message="Unable to connect to the server. Check your network and try again."
                onRetry={() => toast.info('Retrying…')}
              />
            </Card>
          </div>
        </Section>

        {/* ── Skeleton ── */}
        <Section id="skeleton" title="Skeleton">
          <Card>
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-3 mt-4">
                <Skeleton className="h-20 w-20 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              </div>
            </div>
          </Card>
        </Section>

        {/* ── PageHeader ── */}
        <Section id="pageheader" title="PageHeader">
          <Card>
            <PageHeader
              title="Complaints Dashboard"
              subtitle="Manage and track all maintenance requests across campus."
              breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Complaints' }]}
              badge={<PrototypeBanner compact />}
              actions={
                <>
                  <Button variant="outline" size="sm" icon={<Search size={14} />}>Filter</Button>
                  <Button size="sm" icon={<Plus size={14} />}>New Complaint</Button>
                </>
              }
            />
          </Card>
        </Section>

        {/* ── Breadcrumbs ── */}
        <Section id="breadcrumbs" title="Breadcrumbs">
          <Card padding="md">
            <Breadcrumbs
              items={[
                { label: 'Admin', href: '/admin' },
                { label: 'Complaints', href: '/admin/complaints' },
                { label: 'CMP-001' },
              ]}
            />
          </Card>
        </Section>

      </div>
    </div>
  );
}
