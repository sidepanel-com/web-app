import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { createClient } from "@/spaces/identity/supabase.server-props";
import { NoTenantSelected } from "@/spaces/platform/ui/entry/no-tenant-selected";
import { usePlatformUser } from "@/spaces/platform/contexts/platform-user.context";
import {
  getLastTenantSlug,
  saveLastTenantSlug,
} from "@/spaces/platform/ui/nav-helpers";

export default function HomePage() {
  const router = useRouter();
  const { availableTenants, tenantsLoading } = usePlatformUser();
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    if (tenantsLoading) return;
    if (availableTenants.length === 0) {
      setShowSelector(true);
      return;
    }

    const lastSlug = getLastTenantSlug();
    const match = lastSlug
      ? availableTenants.find((t) => t.slug === lastSlug)
      : null;

    const targetSlug = match ? match.slug : availableTenants[0].slug;
    saveLastTenantSlug(targetSlug);
    router.replace(`/${targetSlug}/`);
  }, [tenantsLoading, availableTenants, router]);

  if (!showSelector) return null;

  return (
    <div>
      <NoTenantSelected />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createClient(ctx);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: "/auth/login",
        permanent: false,
      },
    };
  }

  return {
    props: {
      user,
    },
  };
};
