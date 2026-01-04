import React from "react";
import { cn } from "@/ui-primitives/utils";

interface MobileDeviceProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileDevice({ children, className }: MobileDeviceProps) {
  return (
    <div className={cn("flex items-center justify-center p-4", className)}>
      <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[3rem] h-[750px] w-[375px] shadow-xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 inset-x-0 h-6 bg-gray-800 rounded-b-2xl w-40 mx-auto z-10 flex items-center justify-center">
          <div className="w-12 h-1.5 bg-gray-900 rounded-full"></div>
        </div>

        {/* Speaker/Camera detail (optional) */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          <div className="w-1 h-1 rounded-full bg-gray-700"></div>
        </div>

        {/* Content Area */}
        <div className="h-full w-full bg-background overflow-hidden relative">
          {children}
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-1 inset-x-0 h-1 w-20 bg-gray-800/30 rounded-full mx-auto z-10"></div>
      </div>
    </div>
  );
}

