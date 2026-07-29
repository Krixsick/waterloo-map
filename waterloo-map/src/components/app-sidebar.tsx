import { Menu } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [{ label: "Menu", icon: Menu }];

export function AppSidebar() {
  return (
    <Sidebar collapsible="none" className="w-16 border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {items.map(({ label, icon: Icon }) => (
              <SidebarMenuItem key={label}>
                <SidebarMenuButton
                  aria-label={label}
                  className="size-12 justify-center p-0 cursor-pointer"
                >
                  <div className="drawer">
                    <input
                      id="my-drawer-1"
                      type="checkbox"
                      className="drawer-toggle"
                    />
                    <div className="drawer-content flex justify-center">
                      {/* Page content here */}
                      <label htmlFor="my-drawer-1" className="drawer-button">
                        <Icon className="size-6!" />
                      </label>
                    </div>
                    <div className="drawer-side">
                      <label
                        htmlFor="my-drawer-1"
                        aria-label="close sidebar"
                        className="drawer-overlay"
                      ></label>
                      <ul className="menu bg-white min-h-full w-80 p-4">
                        {/* Sidebar content here */}
                        <li>
                          <a>More Coming</a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
