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
    <Sidebar collapsible="none" className="z-30 w-16 shrink-0 border-r">
      <SidebarContent className="items-center py-3">
        <SidebarGroup className="w-full p-2">
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
                className="size-12 cursor-pointer justify-center p-0 data-active:bg-green-50 data-active:text-green-700"
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
