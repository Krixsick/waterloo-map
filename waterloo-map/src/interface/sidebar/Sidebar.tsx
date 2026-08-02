import { useState, type ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

type SideBarProps = {
  children: ReactNode;
  renderMenuPanel: (closeMenu: () => void) => ReactNode;
};

export function SideBar({ children, renderMenuPanel }: SideBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <SidebarProvider className="relative h-svh overflow-hidden">
      <AppSidebar
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => setIsMenuOpen((current) => !current)}
      />

      <button
        type="button"
        aria-label="Close menu"
        aria-hidden={!isMenuOpen}
        inert={!isMenuOpen}
        tabIndex={isMenuOpen ? 0 : -1}
        onClick={() => setIsMenuOpen(false)}
        className={`fixed inset-0 z-[100001] cursor-default bg-slate-950/25 transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="map-menu-panel"
        aria-label="Map menu"
        aria-hidden={!isMenuOpen}
        inert={!isMenuOpen}
        className={`fixed inset-y-0 left-0 z-[100002] w-80 max-w-full overflow-hidden border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-out ${
          isMenuOpen
            ? "translate-x-0"
            : "pointer-events-none -translate-x-full"
        }`}
      >
        <div
          className={`h-full w-80 max-w-full transition-transform duration-300 ease-out ${
            isMenuOpen ? "translate-x-0" : "-translate-x-4"
          }`}
        >
          {renderMenuPanel(() => setIsMenuOpen(false))}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
    </SidebarProvider>
  );
}
