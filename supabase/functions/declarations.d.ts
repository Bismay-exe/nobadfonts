// Ambient types for Supabase Edge Functions in VS Code / TypeScript
// This provides type resolution when opening edge function files in standard editors

declare module 'jsr:@supabase/supabase-js@2' {
    export * from '@supabase/supabase-js'
    export const corsHeaders: Record<string, string>
}

declare module 'jsr:@supabase/supabase-js' {
    export * from '@supabase/supabase-js'
    export const corsHeaders: Record<string, string>
}

declare module 'npm:@supabase/supabase-js@2' {
    export * from '@supabase/supabase-js'
    export const corsHeaders: Record<string, string>
}

declare module 'npm:@supabase/supabase-js' {
    export * from '@supabase/supabase-js'
    export const corsHeaders: Record<string, string>
}

declare namespace Deno {
    export const env: {
        get(key: string): string | undefined
        set(key: string, value: string): void
    }
    export function serve(
        handler: (req: Request) => Response | Promise<Response>
    ): void
    export function serve(
        options: Record<string, unknown>,
        handler: (req: Request) => Response | Promise<Response>
    ): void
}
