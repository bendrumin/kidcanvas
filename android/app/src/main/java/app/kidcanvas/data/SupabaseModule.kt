package app.kidcanvas.data

import app.kidcanvas.BuildConfig
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.storage.Storage

/**
 * One Supabase client for the app, matching how iOS and the web talk to the
 * same project: straight to Postgres, with row-level security deciding what
 * each query can see. There is no API server in between on any platform.
 */
object SupabaseModule {
    val client: SupabaseClient by lazy {
        createSupabaseClient(
            supabaseUrl = BuildConfig.SUPABASE_URL,
            supabaseKey = BuildConfig.SUPABASE_ANON_KEY,
        ) {
            install(Auth) {
                scheme = "https"
                host = "kidcanvas.app"
            }
            install(Postgrest)
            install(Storage)
        }
    }
}
