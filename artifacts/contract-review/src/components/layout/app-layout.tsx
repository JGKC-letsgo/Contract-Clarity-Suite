import { ReactNode } from "react";
import { Sidebar } from "./sidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
