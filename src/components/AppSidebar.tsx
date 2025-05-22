import { Link, useLocation } from '@tanstack/solid-router';
import { For, createMemo, children } from 'solid-js';
import { Icon, type IconName } from './ui/icon';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from './ui/sidebar';
// import { useQueryClient } from '@tanstack/solid-query';
// import { fetchAlbums, fetchSongs } from '../lib/apiService';
// Tooltip components are not directly used by AppSidebar itself, but by its parent in main.tsx
// However, SidebarMenuButton can accept a tooltip prop, which is used here.
// So, if SidebarMenuButton itself internally uses Tooltip, these might not be needed here directly,
// but it's safer to keep them if the button relies on context or specific imports.
// For now, assuming SidebarMenuButton handles its tooltip internally or it's passed as a simple string.
// If Tooltip components are needed here directly for <SidebarMenuButton tooltip={...}> to function,
// they would need to be imported. Let's assume they are not for now and can be removed if unused.

export const navRoutes: { path: string; name: string; iconName: IconName }[] = [
  { path: '/', name: 'Home', iconName: 'house' },
  { path: '/tts', name: 'Text & Article TTS', iconName: 'speaker' },
];

// export const adminRoutes: { path: string; name: string; iconName: IconName }[] = [
//   { path: '/albums', name: 'Albums', iconName: 'music' },
//   { path: '/songs', name: 'Songs', iconName: 'musicNote' },
// ];

export function AppSidebar() {
  const { setOpenMobile, isMobile, state } = useSidebar();
  const location = useLocation();
  // const queryClient = useQueryClient();
  
  const currentPath = createMemo(() => location().pathname);

  const handleLinkClick = () => {
    if (isMobile()) {
      setOpenMobile(false);
    }
  };

  // const prefetchData = (path: string) => {
  //   // Prefetch data based on the route being hovered
  //   if (path === '/albums') {
  //     queryClient.prefetchQuery({
  //       queryKey: ['albums'],
  //       queryFn: fetchAlbums,
  //     });
  //   } else if (path === '/songs') {
  //     queryClient.prefetchQuery({
  //       queryKey: ['songs'],
  //       queryFn: fetchSongs,
  //     });
  //   }
  // };

  const renderNavItem = (route: { path: string; name: string; iconName: IconName }) => {
    const isActive = createMemo(() => currentPath() === route.path);
    
    const linkContent = createMemo(() => (
      <div class="flex items-center gap-2 relative w-full">
        <Icon 
          name={route.iconName} 
          class="h-5 w-5 absolute transition-[left] duration-[var(--sidebar-animation-duration)] ease-in-out" 
          classList={{
            "left-0": state() === "expanded",
            "-left-0.5": state() === "collapsed"
          }} 
        />
        <span 
          class="pl-7 transition-[opacity] duration-[var(--sidebar-animation-duration)] ease-in-out" 
          classList={{ 
            "opacity-0 pointer-events-none absolute": state() === "collapsed",
            "opacity-100": state() === "expanded"
          }}
        >
          {route.name}
        </span>
      </div>
    ));

    const linkChildren = children(() => linkContent());

    return (
      <SidebarMenuItem>
        <SidebarMenuButton 
          as={Link} 
          to={route.path} 
          preload="intent"
          class="w-full text-left"
          onClick={handleLinkClick}
          // onMouseEnter={() => prefetchData(route.path)}
          tooltip={route.name}
          isActive={isActive()}
        >
          {linkChildren()} 
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <For each={navRoutes}>
                {renderNavItem}
              </For>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <For each={adminRoutes}>
                {renderNavItem}
              </For>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}
      </SidebarContent>
    </Sidebar>
  );
} 