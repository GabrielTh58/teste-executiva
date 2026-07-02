'use client';

import { useState } from 'react';
import { PanelLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { cn } from '@/shared/lib/utils';
import { SidebarNav } from './SidebarNav';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-r border-border bg-muted/40 py-4 transition-all duration-200 md:flex',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className={cn('flex items-center px-2', collapsed ? 'justify-center' : 'justify-end')}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <PanelLeft className="size-4" />
        </Button>
      </div>

      <div className="mt-2 flex-1">
        <SidebarNav collapsed={collapsed} />
      </div>
    </aside>
  );
}
