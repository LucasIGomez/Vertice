import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50 print:bg-white">
      <Sidebar />
      <main className="flex-1 lg:pl-0 min-w-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 lg:pt-8 print:p-0 print:max-w-none">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
