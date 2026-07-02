import { ReactNode } from 'react';
import { ForceAuth } from '@/shared/components/layout/ForceAuth';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { Header } from '@/shared/components/layout/Header';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ForceAuth>
      <div className="relative flex min-h-screen w-screen bg-background">
        <Sidebar />

        <div className="flex w-full flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </ForceAuth>
  );
}
