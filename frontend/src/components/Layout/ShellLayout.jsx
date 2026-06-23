import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Layers } from 'lucide-react';
import Sidebar from './Sidebar';
import useMediaQuery from '../../hooks/useMediaQuery';

export default function ShellLayout({ children }) {
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 路由切换时关闭抽屉
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-surface-base">
      {/* 移动端顶栏 */}
      {!isDesktop ? (
        <header className="fixed top-0 left-0 right-0 z-30 h-14 bg-surface-sidebar text-slate-100 flex items-center gap-3 px-4 border-b border-slate-800">
          <button
            className="btn btn-ghost btn-icon !text-slate-300 hover:!bg-slate-800"
            onClick={() => setDrawerOpen(true)}
            aria-label="打开菜单"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2 text-base font-semibold">
            <Layers size={18} className="text-brand-400" />
            <span>LangWIKI</span>
          </div>
        </header>
      ) : null}

      {/* 侧边栏：桌面端固定 / 移动端抽屉 */}
      {isDesktop ? (
        <Sidebar />
      ) : (
        <>
          {drawerOpen ? (
            <div
              className="fixed inset-0 z-40 bg-black/50 animate-fade-in"
              onClick={() => setDrawerOpen(false)}
            />
          ) : null}
          <div
            className={`fixed top-0 left-0 bottom-0 z-50 transition-transform duration-slow ${
              drawerOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <Sidebar />
          </div>
        </>
      )}

      {/* 主内容区 */}
      <main className={`flex-1 min-w-0 overflow-auto ${!isDesktop ? 'pt-14' : ''}`}>
        <div key={location.pathname} className="fade-in p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
