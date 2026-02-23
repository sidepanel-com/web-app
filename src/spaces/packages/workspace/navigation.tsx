import { Eye, LayoutGrid, Shield } from "lucide-react";
import type { NavSection } from "@/spaces/platform/ui/nav-types";

export const appNavigation: NavSection[] = [
  {
    title: "App",
    items: [
      {
        title: "Preview",
        url: "/",
        icon: Eye,
      },
      {
        title: "Manage",
        icon: LayoutGrid,
        url: "#",
        items: [
          {
            title: "API",
            url: "/api",
          },
          { title: "Org Units", url: "/permissions/org-units" },
          { title: "Members", url: "/permissions/members" },
        ],
      },

    ],
  },
];

