import { 
  Home, 
  Users, 
  GraduationCap, 
  DollarSign, 
  Building, 
  Bed,
  ChevronRight 
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "../components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible"

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Student Management",
    icon: Users,
    items: [
      { title: "Students", url: "/students" },
      { title: "Applicants", url: "/applicants" },
      { title: "ID Cards", url: "/id-cards" },
      { title: "Student Search", url: "/student-search" },
      { title: "Student Reporting", url: "/student-reporting" },
      { title: "Cohort Planner", url: "/cohort-planner" },
      { title: "Classes", url: "/classes" },
    ],
  },
  {
    title: "Academics",
    icon: GraduationCap,
    items: [
      { title: "Lesson Attendance", url: "/attendance/lesson" },
      { title: "Attendance Reports", url: "/attendance/reports" },
      { title: "Marks Entry", url: "/marks/entry" },
      { title: "CAT Marks", url: "/marks/cat" },
      { title: "Exam Scheduling", url: "/exams/scheduling" },
      { title: "Exam Results", url: "/exams/results" },
      { title: "Transcripts", url: "/exams/transcripts" },
      { title: "Subjects", url: "/subjects" },
      { title: "Subject Registration", url: "/subjects/registration" },
      { title: "Curriculum", url: "/curriculum" },
      { title: "Tutors", url: "/tutors" },
      { title: "Timetable", url: "/timetable" },
    ],
  },
  {
    title: "Finance",
    icon: DollarSign,
    items: [
      { title: "Fee Structure", url: "/finance/fee-structure" },
      { title: "Payments", url: "/finance/payments" },
      { title: "Invoices", url: "/finance/invoices" },
      { title: "Reports", url: "/finance/reports" },
    ],
  },
  {
    title: "Hostel",
    icon: Bed,
    items: [
      { title: "Buildings", url: "/hostel/buildings" },
      { title: "Rooms", url: "/hostel/rooms" },
      { title: "Bookings", url: "/hostel/bookings" },
    ],
  },
  {
    title: "Departments",
    url: "/departments",
    icon: Building,
  },
]

export function AppSidebar() {
  return (
    <Sidebar data-testid="sidebar-main">
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-4">
            <h2 className="text-lg font-bold">Intellimis</h2>
            <p className="text-xs text-muted-foreground">Kongoni Technical College</p>
          </div>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                item.items ? (
                  <Collapsible key={item.title} className="group/collapsible" defaultOpen>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton data-testid={`button-menu-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton 
                                asChild
                                data-testid={`link-${subItem.title.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                <a href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <a href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}