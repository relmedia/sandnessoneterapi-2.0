import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  Newspaper,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Oversikt",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 2,
    label: "Innhold",
    items: [
      {
        title: "Behandlinger",
        url: "/dashboard/behandlinger",
        icon: HeartHandshake,
      },
      {
        title: "Kurs",
        url: "/dashboard/kurs",
        icon: GraduationCap,
      },
      {
        title: "Bøker",
        url: "/dashboard/boker",
        icon: BookOpen,
      },
      {
        title: "Artikler",
        url: "/dashboard/artikler",
        icon: Newspaper,
      },
      {
        title: "Sider",
        url: "/dashboard/sider",
        icon: FileText,
      },
    ],
  },
  {
    id: 3,
    label: "Bestillinger",
    items: [
      {
        title: "Timebestillinger",
        url: "/dashboard/bestillinger",
        icon: CalendarCheck,
      },
      {
        title: "Kurspåmeldinger",
        url: "/dashboard/kurspameldinger",
        icon: ClipboardList,
      },
      {
        title: "Ledige dager",
        url: "/dashboard/ledige-dager",
        icon: CalendarDays,
      },
    ],
  },
  {
    id: 4,
    label: "System",
    items: [
      {
        title: "Innstillinger",
        url: "/dashboard/innstillinger",
        icon: Settings,
        subItems: [
          {
            title: "Nettside",
            url: "/dashboard/innstillinger",
          },
          {
            title: "E-post",
            url: "/dashboard/innstillinger/e-post",
          },
        ],
      },
    ],
  },
];
