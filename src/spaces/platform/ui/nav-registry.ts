import type { NavSection } from "./nav-types";

interface RegisteredSection extends NavSection {
  packageId: string | null;
}

const sections: RegisteredSection[] = [];

/**
 * Register navigation sections.
 * Pass a packageId to tie sections to a toggleable package,
 * or omit it to make sections always visible.
 */
export function registerNavigation(items: NavSection[], packageId?: string) {
  sections.push(...items.map((item) => ({ ...item, packageId: packageId ?? null })));
}

/**
 * Return nav sections, optionally filtered to only enabled packages.
 * Sections without a packageId (always-visible) are never filtered out.
 * When no filter is provided, all registered sections are returned.
 */
export function getRegisteredNavigation(
  enabledPackageIds?: string[],
): NavSection[] {
  if (!enabledPackageIds) return sections;
  return sections.filter(
    (s) => s.packageId === null || enabledPackageIds.includes(s.packageId),
  );
}
