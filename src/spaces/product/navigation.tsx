import { SquareTerminal, Bot, BookOpen, LayoutDashboard, PanelRight } from "lucide-react";
import { type NavSection } from "@/spaces/platform/ui/nav-types";

/**
 * Product-specific navigation sections.
 * The product team can contribute new menu items here without touching platform directories.
 */
export const productNavigation: NavSection[] = [
  {
    title: "Product",
    items: [
      {
        title: "App",
        url: "/app",
        icon: PanelRight,
      },
    ],
  },
];

