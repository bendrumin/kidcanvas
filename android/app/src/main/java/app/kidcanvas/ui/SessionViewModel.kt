package app.kidcanvas.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.kidcanvas.KidCanvasApp
import app.kidcanvas.data.Child
import app.kidcanvas.data.Family
import app.kidcanvas.data.FamilyMember
import app.kidcanvas.data.KidCanvasRepository
import app.kidcanvas.ui.common.friendlyError
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

data class SessionState(
    val loading: Boolean = true,
    val userName: String = "",
    val email: String = "",
    val family: Family? = null,
    val role: String? = null,
    val children: List<Child> = emptyList(),
    val memberships: List<FamilyMember> = emptyList(),
    /** Bumped whenever artwork changes, so the feed and gallery know to reload. */
    val artworkVersion: Int = 0,
    val error: String? = null,
)

/**
 * The Android side of iOS AuthManager's family state: which family is showing,
 * this user's role in it, and its artists. One instance per signed-in session,
 * shared by every screen.
 */
class SessionViewModel(private val repo: KidCanvasRepository = KidCanvasRepository()) : ViewModel() {
    private val _state = MutableStateFlow(SessionState())
    val state: StateFlow<SessionState> = _state.asStateFlow()

    /**
     * loadFamily can run twice at once (launch plus a join, say). Without the
     * lock both could see "no family" and each create one.
     */
    private val loadLock = Mutex()

    fun load() {
        viewModelScope.launch { loadFamily() }
    }

    private suspend fun loadFamily() = loadLock.withLock {
        _state.update { it.copy(loading = true, error = null, userName = repo.currentUserName(), email = repo.currentUser()?.email.orEmpty()) }
        try {
            var memberships = repo.myMemberships()
            if (memberships.isEmpty() && repo.currentUserId() != null) {
                // Same self-heal as iOS: signed in with no family (sign-up
                // confirmed by email, or an earlier RPC failure) gets one.
                repo.createFamilyForUser()
                memberships = repo.myMemberships()
            }
            // iOS takes the first membership. Someone in two families (a
            // grandparent with their own, then a daughter's) would then flip
            // between them unpredictably, so the chosen one is remembered.
            val preferred = KidCanvasApp.prefs.getString(PREF_FAMILY, null)
            val membership = memberships.firstOrNull { it.familyId == preferred } ?: memberships.firstOrNull()
            val family = membership?.family
            val children = family?.let { repo.children(it.id) }.orEmpty()
            _state.update {
                it.copy(
                    loading = false,
                    family = family,
                    role = membership?.role,
                    children = children,
                    memberships = memberships,
                    artworkVersion = it.artworkVersion + 1,
                )
            }
        } catch (t: Throwable) {
            _state.update { it.copy(loading = false, error = friendlyError(t, "Could not load your family.")) }
        }
    }

    fun switchFamily(familyId: String) {
        KidCanvasApp.prefs.edit().putString(PREF_FAMILY, familyId).apply()
        load()
    }

    fun reloadChildren() {
        val familyId = _state.value.family?.id ?: return
        viewModelScope.launch {
            runCatching { repo.children(familyId) }.onSuccess { kids -> _state.update { it.copy(children = kids) } }
        }
    }

    fun artworkChanged() = _state.update { it.copy(artworkVersion = it.artworkVersion + 1) }

    /** After joining, show the family just joined rather than whichever sorts first. */
    suspend fun joined(familyId: String?) {
        if (familyId != null) KidCanvasApp.prefs.edit().putString(PREF_FAMILY, familyId).apply()
        loadFamily()
    }

    /** After leaving a family, fall back to another one (or a fresh one, via self-heal). */
    fun leftFamily() {
        KidCanvasApp.prefs.edit().remove(PREF_FAMILY).apply()
        load()
    }

    fun signOut() {
        viewModelScope.launch {
            runCatching { repo.signOut() }
            KidCanvasApp.prefs.edit().remove(PREF_FAMILY).apply()
            _state.value = SessionState()
        }
    }

    /** Throws so the screen can show why it failed; the account is only gone on success. */
    suspend fun deleteAccount() {
        // Only families this user owns are deleted by delete_my_account, so
        // only their files go. iOS clears the current family's folder whatever
        // the role, which for a grandparent would erase a family they merely
        // belong to; storage policy lets any member delete, so it would work.
        val owned = _state.value.memberships.filter { it.role == app.kidcanvas.data.Roles.OWNER }.map { it.familyId }
        repo.deleteAccount(owned)
        KidCanvasApp.prefs.edit().remove(PREF_FAMILY).apply()
        _state.value = SessionState()
    }

    private companion object {
        const val PREF_FAMILY = "current_family_id"
    }
}
