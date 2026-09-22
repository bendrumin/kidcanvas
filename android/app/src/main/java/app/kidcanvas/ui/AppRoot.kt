package app.kidcanvas.ui

import androidx.compose.runtime.*
import androidx.lifecycle.viewmodel.compose.viewModel
import app.kidcanvas.ui.auth.AuthScreen
import app.kidcanvas.ui.auth.AuthViewModel
import app.kidcanvas.ui.gallery.GalleryScreen

@Composable
fun AppRoot(auth: AuthViewModel = viewModel()) {
    val signedIn by auth.signedIn.collectAsState()
    if (signedIn) GalleryScreen(onSignOut = auth::signOut) else AuthScreen(auth)
}
