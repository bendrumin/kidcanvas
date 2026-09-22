package app.kidcanvas.data

import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Order

/**
 * Every read here is already family-scoped by row-level security, so the
 * queries do not filter by family themselves; the database refuses rows that
 * are not yours. Keeping it that way means an Android bug cannot widen access.
 */
class KidCanvasRepository(private val supabase: io.github.jan.supabase.SupabaseClient = SupabaseModule.client) {

    suspend fun signIn(email: String, password: String) {
        supabase.auth.signInWith(Email) {
            this.email = email.trim()
            this.password = password
        }
    }

    suspend fun signUp(email: String, password: String) {
        supabase.auth.signUpWith(Email) {
            this.email = email.trim()
            this.password = password
        }
    }

    suspend fun signOut() = supabase.auth.signOut()

    fun currentUserId(): String? = supabase.auth.currentUserOrNull()?.id

    suspend fun family(): Family? =
        supabase.from("families").select().decodeList<Family>().firstOrNull()

    suspend fun children(): List<Child> =
        supabase.from("children").select().decodeList<Child>()

    suspend fun artworks(): List<Artwork> =
        supabase.from("artworks").select {
            order("created_date", Order.DESCENDING)
        }.decodeList<Artwork>()
}
