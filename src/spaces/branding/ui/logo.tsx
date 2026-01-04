import { GalleryVerticalEnd } from "lucide-react";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 self-center font-medium">
      <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
        <GalleryVerticalEnd className="size-4" />
      </div>
      Side Panel
    </Link>
  );
}
