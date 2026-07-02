'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Files, FileText, Home, User } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useSession } from '@/shared/context/SessionContext';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Início', icon: Home },
  { href: '/templates', label: 'Templates', icon: FileText },
  { href: '/contracts', label: 'Contratos', icon: Files },
  { href: '/users/new', label: 'Equipe', icon: User, roles: ['ADMIN'] }
];

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const { user } = useSession();

  const authorizedItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <nav className="flex flex-col gap-1 px-2">
      {authorizedItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              collapsed && 'justify-center px-0',
              active && 'bg-blue-50 text-blue-600 hover:bg-blue-50 hover:text-blue-600',
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="size-4 shrink-0" />
            {!collapsed && <span>{label}</span>}             
          </Link>
        );
      })}
    </nav>
  );
}
