'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown, LogOut, Menu, UserRound } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/Sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/Dropdown-menu';
import { useSession } from '@/shared/context/SessionContext';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { SidebarNav } from './SidebarNav';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Início',
  templates: 'Templates',
  contracts: 'Contratos',
  users: 'Usuários',
};

function usePageTitle() {
  const pathname = usePathname();
  const segment = pathname.split('/').filter(Boolean)[0] ?? 'dashboard';
  return PAGE_TITLES[segment] ?? segment;
}

export function Header() {
  const { user } = useSession();
  const { submitLogout } = useAuth();
  const title = usePageTitle();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  console.log('user', user);
  
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger
            render={
              <Button type="button" variant="ghost" size="icon-sm" className="md:hidden" />
            }
          >
            <Menu className="size-4" />
            <span className="sr-only">Abrir menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>

        <h1 className="text-base font-semibold">{title}</h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button type="button" variant="ghost" className="gap-2" />}
        >
          <UserRound className="size-4" />
          <span className="max-w-40 truncate">{user?.email}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <p className="truncate font-medium mb-2">{user?.email}</p>
              <p className="text-xs font-normal text-muted-foreground">{user?.role}</p>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={submitLogout}>
            <LogOut className="size-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
