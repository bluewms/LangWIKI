import React from 'react';
import Sidebar from './Sidebar';

export default function ShellLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-slate-100">
      <Sidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
