'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Tags, CheckSquare, Users, ArrowLeft } from 'lucide-react';

const adminLinks = [
  { href: '/admin', label: '数据概览', icon: LayoutDashboard },
  { href: '/admin/categories', label: '分类管理', icon: Tags },
  { href: '/admin/items', label: '项目管理', icon: CheckSquare },
  { href: '/admin/users', label: '用户管理', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isAdmin, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      router.push('/login');
    }
  }, [isLoggedIn, isAdmin, router]);

  if (!isLoggedIn || !isAdmin || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-56 bg-white border-r border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <div>
              <div className="text-sm font-bold text-gray-900">元气日记</div>
              <div className="text-[10px] text-gray-400">管理后台</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={14} />
            返回前台
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-50 px-4 h-14 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-gray-100">
          <Tags size={20} className="text-gray-600" />
        </button>
        <span className="text-sm font-bold text-gray-900">管理后台</span>
        <Link href="/dashboard" className="text-xs text-gray-400">
          <ArrowLeft size={18} />
        </Link>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-14 bottom-0 w-56 bg-white border-r border-gray-100 z-50 md:hidden">
            <nav className="p-3 space-y-1">
              {adminLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={16} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 md:pt-0 pt-14">
        <div className="p-6 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
