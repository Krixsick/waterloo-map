import { Menu } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type AppSidebarProps = {
  isMenuOpen: boolean;
  onToggleMenu: () => void;
};

export function AppSidebar({ isMenuOpen, onToggleMenu }: AppSidebarProps) {
  return (
    <Sidebar collapsible="none" className="absolute left-3 top-3 z-40 h-14 w-14 shrink-0 rounded-full border bg-white shadow-sm sm:static sm:z-30 sm:h-full sm:w-16 sm:rounded-none sm:border-0 sm:border-r sm:shadow-none">
      <SidebarContent className="items-center overflow-visible p-1 sm:px-0 sm:py-3">
        <SidebarGroup className="w-full p-0 sm:p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                type="button"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-controls="map-menu-panel"
                aria-expanded={isMenuOpen}
                title="Menu"
                isActive={isMenuOpen}
                onClick={onToggleMenu}
                className="size-12 cursor-pointer justify-center rounded-full p-0 data-active:bg-green-50 data-active:text-green-700 sm:rounded-md"
              >
                <Menu className="size-6!" />
                <span className="sr-only">Menu</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
