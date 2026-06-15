import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store';
import { ToastProvider } from '@/components/Toast';
import Layout from '@/components/Layout';

import Dashboard from '@/pages/Dashboard';
import EmployeeList from '@/pages/EmployeeList';
import EmployeeDetail from '@/pages/EmployeeDetail';
import EmployeeImport from '@/pages/EmployeeImport';
import MaterialTemplates from '@/pages/MaterialTemplates';
import ReminderCenter from '@/pages/ReminderCenter';
import DataExport from '@/pages/DataExport';
import Settings from '@/pages/Settings';
import EmployeeSubmit from '@/pages/EmployeeSubmit';

function AppRoutes() {
  const location = useLocation();
  const isSubmitPage = location.pathname.startsWith('/submit/');

  return (
    <Routes>
      <Route path="/submit/:token" element={<EmployeeSubmit />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/employees" element={<EmployeeList />} />
        <Route path="/employees/:id" element={<EmployeeDetail />} />
        <Route path="/employees/import" element={<EmployeeImport />} />
        <Route path="/templates" element={<MaterialTemplates />} />
        <Route path="/reminders" element={<ReminderCenter />} />
        <Route path="/export" element={<DataExport />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

function AppContent() {
  const { initData } = useAppStore();

  useEffect(() => {
    initData();
  }, [initData]);

  return <AppRoutes />;
}

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </Router>
  );
}
