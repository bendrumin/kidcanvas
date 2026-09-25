package app.kidcanvas.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.kidcanvas.data.KidCanvasRepository
import io.github.jan.supabase.auth.status.SessionStatus
import io.github.jan.supabase.exceptions.RestException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class AuthState { Loading, SignedOut, SignedIn }

class AuthViewModel(private val repo: KidCanvasRepository = KidCanvasRepository()) : ViewModel() {
    private val _state = MutableStateFlow(AuthState.Loading)
    val state: StateFlow<AuthState> = _state.asStateFlow()

    private val _busy = MutableStateFlow(false)
    val busy: StateFlow<Boolean> = _busy.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private var verified = false

    init {
        // supabase-kt restores the saved session asynchronously, so reading
        // currentUser once at launch reported "signed out" on a cold start for
        // someone who was signed in. The status flow is the source of truth.
        viewModelScope.launch {
            repo.sessionStatus.collect { status ->
                when (status) {
                    is SessionStatus.Initializing -> _state.value = AuthState.Loading
                    is SessionStatus.NotAuthenticated -> {
                        verified = false
                        _state.value = AuthState.SignedOut
                    }
                    // A failed refresh (usually no network) keeps the stored
                    // session; the next refresh retries. Signing out here would
                    // log people out every time they open the app offline.
                    is SessionStatus.RefreshFailure,
                    is SessionStatus.Authenticated -> {
                        _state.value = AuthState.SignedIn
                        verifyOnce()
                    }
                }
            }
        }
    }

    /**
     * Mirrors iOS checkSession: an account deleted elsewhere still has a valid
     * local token, so ask the server once per session. Only a server refusal
     * signs out; a network failure is not proof the account is gone.
     */
    private fun verifyOnce() {
        if (verified) return
        verified = true
        viewModelScope.launch {
            try {
                repo.verifySessionWithServer()
            } catch (e: RestException) {
                // 401/403/404 mean the user or token is gone. A 5xx is the
                // server having a bad minute, which must not log anyone out.
                if (e.statusCode in setOf(401, 403, 404)) runCatching { repo.signOut() } else verified = false
            } catch (_: Throwable) {
                verified = false
            }
        }
    }

    fun submit(email: String, password: String, isSignUp: Boolean, fullName: String = "", familyName: String = "") {
        if (email.isBlank() || password.isBlank()) {
            _error.value = "Enter an email and password."
            return
        }
        if (isSignUp && (fullName.isBlank() || familyName.isBlank())) {
            _error.value = "Enter your name and a name for your family."
            return
        }
        viewModelScope.launch {
            _busy.value = true
            _error.value = null
            try {
                if (isSignUp) repo.signUp(email, password, fullName, familyName) else repo.signIn(email, password)
                // Sign-up with email confirmation on returns no session; say so
                // rather than dropping the person on an empty gallery.
                if (repo.currentUserId() == null) _error.value = "Almost there. Check your email to confirm the account, then sign in."
            } catch (t: Throwable) {
                _error.value = friendlyMessage(t)
            } finally {
                _busy.value = false
            }
        }
    }

    /**
     * supabase-kt puts the whole failed request in `message`: url, headers,
     * bearer token prefix, method. Showing that to a parent is both useless and
     * a leak, so the raw text is only used to pick a sentence.
     */
    private fun friendlyMessage(t: Throwable): String {
        val raw = t.message.orEmpty()
        fun has(vararg needles: String) = needles.any { raw.contains(it, ignoreCase = true) }
        return when {
            has("invalid_credentials", "Invalid login") ->
                "That email and password do not match an account."
            has("user_already_exists", "already registered") ->
                "There is already an account with that email. Try signing in instead."
            has("weak_password", "Password should be") ->
                "Pick a longer password, at least six characters."
            has("email_address_invalid", "validation_failed") ->
                "That email address does not look right."
            has("email_not_confirmed") ->
                "Confirm your email first. Check your inbox for the link."
            has("over_email_send_rate_limit", "rate limit") ->
                "Too many tries. Wait a minute and try again."
            has("UnknownHost", "timeout", "Unable to resolve host", "Connection reset") ->
                "No connection. Check your network and try again."
            else -> "That did not work. Try again."
        }
    }
}
