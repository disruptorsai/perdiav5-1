
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

const createPageUrl = (pageName) => `/${pageName}`;
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  LayoutDashboard, 
  ListChecks, 
  Tag, 
  Settings, 
  BarChart3,
  Plug,
  Sparkles,
  TrendingUp,
  Brain,
  CheckCircle2,
  Search,
  User,
  LogOut
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AutomationEngine from "@/components/automation/AutomationEngine";

const navigationGroups = [
  {
    label: "Workspace",
    items: [
      {
        title: "Dashboard",
        url: createPageUrl("Dashboard"),
        icon: LayoutDashboard,
      },
      {
        title: "Content Library",
        url: createPageUrl("ContentLibrary"),
        icon: FileText,
      },
      {
        title: "Performance",
        url: createPageUrl("PerformanceDashboard"),
        icon: BarChart3,
      },
      {
        title: "Analytics",
        url: createPageUrl("Analytics"),
        icon: TrendingUp,
      },
    ]
  },
  {
    label: "Content Tools",
    items: [
      {
        title: "Keywords & Clusters",
        url: createPageUrl("KeywordsAndClusters"),
        icon: Tag,
      },
      {
        title: "Site Catalog",
        url: createPageUrl("SiteCatalog"),
        icon: ListChecks,
      },
      {
        title: "Site Analysis",
        url: createPageUrl("SiteAnalysis"),
        icon: Search,
      },
    ]
  },
  {
    label: "Configuration",
    items: [
      {
        title: "AI Training",
        url: createPageUrl("AITraining"),
        icon: Brain,
      },
      {
        title: "Integrations",
        url: createPageUrl("Integrations"),
        icon: Plug,
      },
      {
        title: "Settings",
        url: createPageUrl("Settings"),
        icon: Settings,
      },
    ]
  }
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  // Get current page title from path
  const getCurrentPageTitle = () => {
    const path = location.pathname.split('/').pop();
    for (const group of navigationGroups) {
      const item = group.items.find(item => item.url.includes(path));
      if (item) return item.title;
    }
    return 'Dashboard';
  };

  const currentPageTitle = getCurrentPageTitle();
  
  const getCurrentIcon = () => {
    const path = location.pathname.split('/').pop();
    for (const group of navigationGroups) {
      const item = group.items.find(item => item.url.includes(path));
      if (item) return item.icon;
    }
    return LayoutDashboard;
  };
  
  const PageIcon = getCurrentIcon();

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const getInitials = () => {
    if (!user) return 'U';
    const names = user.full_name?.split(' ') || [];
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <>
      <AutomationEngine />
      <div className="min-h-screen flex flex-col w-full bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
        {/* Top Header Bar - Premium */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
                Perdia
              </h1>
            </motion.div>
            <div className="h-6 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent"></div>
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-slate-600 font-medium"
            >
              {currentPageTitle}
            </motion.span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 hover:bg-slate-50/50 px-3 py-2 rounded-xl transition-all duration-200"
              >
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-slate-900">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-slate-500">{user?.role === 'admin' ? 'Administrator' : 'User'}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30 ring-2 ring-blue-100">
                  <span className="text-white font-semibold text-sm">{getInitials()}</span>
                </div>
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-semibold">{user?.full_name || 'User'}</span>
                  <span className="text-xs text-gray-500 font-normal">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(createPageUrl('Profile'))}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>

        {/* Main Content Area - Sidebar and Content */}
        <div className="flex flex-1 overflow-hidden">
          <SidebarProvider defaultOpen={true}>
            <Sidebar collapsible="icon" className="border-r border-slate-200/50 bg-white/80 backdrop-blur-xl">
              <SidebarContent className="px-2 py-4">
                <div className="px-2 mb-6 flex items-center justify-between">
                  <SidebarTrigger />
                </div>
                
                {navigationGroups.map((group, groupIndex) => (
                  <SidebarGroup key={groupIndex} className="mb-6">
                    <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">
                      {group.label}
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.items.map((item, index) => {
                          const isActive = location.pathname === item.url;
                          return (
                            <motion.div
                              key={item.title}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: groupIndex * 0.1 + index * 0.05 }}
                            >
                              <SidebarMenuItem>
                                <SidebarMenuButton 
                                  asChild 
                                  className={`
                                    transition-all duration-300 rounded-xl mb-1 relative overflow-hidden
                                    ${isActive 
                                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium shadow-lg shadow-blue-500/30' 
                                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                                    }
                                  `}
                                >
                                  <Link to={item.url} className="flex items-center gap-3 px-3 py-3">
                                    {isActive && (
                                      <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                      />
                                    )}
                                    <item.icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-white' : ''}`} />
                                    <span className={`text-sm relative z-10 ${isActive ? 'text-white' : ''}`}>
                                      {item.title}
                                    </span>
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            </motion.div>
                          );
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                ))}
              </SidebarContent>
            </Sidebar>

            <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-blue-50/10 to-slate-50">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </main>
          </SidebarProvider>
        </div>
      </div>
    </>
  );
}
