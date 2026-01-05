'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/lib/types/database';
import { signOut } from '@/app/actions/auth';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

interface LeftSidebarProps {
  currentPage: 'dashboard' | 'analytics';
  userRole: UserRole;
}

const navigationItems: Record<UserRole, NavItem[]> = {
  admin: [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Teams', href: '/teams', icon: '👥' },
    { name: 'Users', href: '/users', icon: '👤' },
    { name: 'Analytics', href: '/analytics', icon: '📊' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ],
  manager: [
    { name: 'Home', href: '/dashboard', icon: '🏠' },
    { name: 'My Team', href: '/dashboard#team', icon: '👥' },
    { name: 'Tasks', href: '/dashboard#tasks', icon: '✓' },
    { name: 'Analytics', href: '/analytics', icon: '📊' },
  ],
  developer: [
    { name: 'Home', href: '/dashboard', icon: '🏠' },
    { name: 'My 1-on-1s', href: '/dashboard#sessions', icon: '📝' },
    { name: 'Tasks', href: '/dashboard#tasks', icon: '✓' },
    { name: 'Analytics', href: '/analytics', icon: '📊' },
  ],
};

export function LeftSidebar({ currentPage, userRole }: LeftSidebarProps) {
  const pathname = usePathname();
  const navItems = navigationItems[userRole];

  const isActive = (href: string) => {
    // Handle exact match for main pages
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/analytics') return pathname === '/analytics';
    if (href === '/teams') return pathname === '/teams';
    if (href === '/users') return pathname === '/users';
    if (href === '/settings') return pathname === '/settings';
    // Handle hash links
    return false;
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside className="sidebar-left">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-4 pt-4">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            1:1
          </div>
          <span className="text-xl font-bold text-gray-900">1-on-1 Tracking</span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer Links */}
        <div className="px-4 pb-4 space-y-1">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors w-full text-left"
          >
            <span className="text-base">🚪</span>
            <span>Log out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
