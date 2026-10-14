import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import i18n from '@/app/i18n'
import { AuthProvider } from '@/features/auth'
import { BrandingProvider } from '@/features/branding'
const queryClient = new QueryClient()
export function AppProviders({ children }: { children: ReactNode }) {
    return (
        <I18nextProvider i18n={i18n}>
            <QueryClientProvider client={queryClient}>
                <BrandingProvider>
                    <AuthProvider>{children}</AuthProvider>
                </BrandingProvider>
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </I18nextProvider>
    )
}
