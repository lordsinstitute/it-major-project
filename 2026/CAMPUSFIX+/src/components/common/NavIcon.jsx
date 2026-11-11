import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Bell,
  User,
  Settings,
  UserCheck,
  Sliders,
  Users,
  History,
  BarChart3,
  CheckSquare,
  Bot,
  Wifi,
  Eye,
  LineChart,
  HelpCircle,
} from 'lucide-react';

const ICON_MAP = {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Bell,
  User,
  Settings,
  UserCheck,
  Sliders,
  Users,
  History,
  BarChart3,
  CheckSquare,
  Bot,
  Wifi,
  Eye,
  LineChart,
};

export default function NavIcon({ name, className = 'h-5 w-5', ...props }) {
  const IconComponent = ICON_MAP[name] || HelpCircle;
  return <IconComponent className={className} aria-hidden="true" {...props} />;
}
