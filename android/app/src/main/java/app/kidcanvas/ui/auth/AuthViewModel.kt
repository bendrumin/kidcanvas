package app.kidcanvas.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.kidcanvas.data.KidCanvasRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AuthViewModel(private val repo: KidCanvasRepository = KidCanvasRepository()) : ViewModel() {
    private val _signedIn = MutableStateFlow(repo.currentUserId() != null)
    val signedIn: StateFlow<Boolean> = _signedIn.asStateFlow()

    private val _busy = MutableStateFlow(false)
    val busy: StateFlow<Boolean> = _busy.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun submit(email: String, password: String, isSignUp: Boolean) {
        if (email.isBlank() || password.isBlank()) {
            _error.value = "Enter an email and password."
            return
        }
        viewModelScope.launch {
            _busy.value = true
            _error.value = null
            try {
                if (isSignUp) repo.signUp(email, password) else repo.signIn(email, password)
                // Sign-up with email confirmation on returns no session; say so
                // rather than dropping the person on an empty gallery.
                _signedIn.value = repo.currentUserId() != null
                if (!_signedIn.value) _error.value = "Check your email to confirm the account, then sign in."
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

    fun signOut() {
        viewModelScope.launch {
            runCatching { repo.signOut() }
            _signedIn.value = false
        }
    }
}
