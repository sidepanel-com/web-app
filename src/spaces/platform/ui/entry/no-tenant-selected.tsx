'use client'


import { useClientUserSDK } from '@/lib/contexts/client-user-sdk.context'
import { useClientTenantSDK } from '@/lib/contexts/client-tenant-sdk.context'

import { TenantCreateForm } from '../tenant/tenant-create-form'
import { Loading } from '../shared/loading'
import { TenantSelector } from '../tenant/tenant-selector'
import { LogoutButton } from '../shared/logout-button'


export function NoTenantSelected() {
  const { availableTenants, tenantsLoading, isLoading: userLoading } = useClientUserSDK()
  const { tenant, isLoading: tenantLoading } = useClientTenantSDK()

  const isLoading = tenantsLoading || userLoading || tenantLoading

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md flex flex-col gap-4">
        {isLoading ? <Loading /> : null}
        {!isLoading && availableTenants.length < 1 ? <TenantCreateForm /> : null}
        {!isLoading && availableTenants.length > 0 ? <TenantSelector /> : null}
        <div className="flex justify-end">
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
