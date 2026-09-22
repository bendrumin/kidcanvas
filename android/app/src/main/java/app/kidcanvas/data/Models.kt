package app.kidcanvas.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Columns mirror the shared Postgres schema; see supabase/schema_baseline.sql. */
@Serializable
data class Artwork(
    val id: String,
    @SerialName("family_id") val familyId: String,
    @SerialName("child_id") val childId: String? = null,
    @SerialName("image_url") val imageUrl: String,
    @SerialName("thumbnail_url") val thumbnailUrl: String? = null,
    val title: String? = null,
    /** What the child said about it. The reason this app exists. */
    val story: String? = null,
    @SerialName("created_date") val createdDate: String? = null,
    @SerialName("child_age_months") val childAgeMonths: Int? = null,
    @SerialName("is_favorite") val isFavorite: Boolean = false,
)

@Serializable
data class Child(
    val id: String,
    @SerialName("family_id") val familyId: String,
    val name: String,
    @SerialName("birth_date") val birthDate: String? = null,
)

@Serializable
data class Family(
    val id: String,
    val name: String,
)

@Serializable
data class FamilyMember(
    @SerialName("family_id") val familyId: String,
    @SerialName("user_id") val userId: String,
    val role: String? = null,
)
