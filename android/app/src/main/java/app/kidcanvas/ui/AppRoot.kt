package app.kidcanvas.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddAPhoto
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import app.kidcanvas.ui.add.AddArtworkScreen
import app.kidcanvas.ui.artwork.ArtworkDetailScreen
import app.kidcanvas.ui.auth.AuthScreen
import app.kidcanvas.ui.auth.AuthState
import app.kidcanvas.ui.auth.AuthViewModel
import app.kidcanvas.ui.common.CenteredMessage
import app.kidcanvas.ui.family.FamilyScreen
import app.kidcanvas.ui.feed.FeedScreen
import app.kidcanvas.ui.gallery.GalleryScreen
import app.kidcanvas.ui.profile.ProfileScreen

@Composable
fun AppRoot(auth: AuthViewModel = viewModel()) {
    val state by auth.state.collectAsState()
    when (state) {
        AuthState.Loading -> Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator() }
        AuthState.SignedOut -> AuthScreen(auth)
        AuthState.SignedIn -> MainScreen()
    }
}

private enum class Tab(val route: String, val label: String, val icon: ImageVector) {
    Feed("feed", "Recently", Icons.Filled.AutoAwesome),
    Gallery("gallery", "Gallery", Icons.Filled.GridView),
    Add("add", "Add", Icons.Filled.AddAPhoto),
    Profile("profile", "Profile", Icons.Filled.Person),
}

/**
 * The iOS tab bar, minus Favorites (a filter on Gallery here), so four
 * destinations fit Material's bottom bar comfortably.
 */
@Composable
private fun MainScreen(session: SessionViewModel = viewModel()) {
    val s by session.state.collectAsState()
    val nav = rememberNavController()
    val backStack by nav.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route

    LaunchedEffect(Unit) { session.load() }

    Scaffold(
        // Each screen has its own Scaffold that handles the status and
        // navigation bars. This outer one only reserves the bottom bar's height,
        // and consumes it below, so nothing gets padded twice.
        contentWindowInsets = WindowInsets(0),
        bottomBar = {
            if (Tab.entries.any { it.route == currentRoute }) {
                NavigationBar {
                    Tab.entries.forEach { tab ->
                        NavigationBarItem(
                            selected = currentRoute == tab.route,
                            onClick = {
                                nav.navigate(tab.route) {
                                    popUpTo(nav.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = null) },
                            label = { Text(tab.label) },
                        )
                    }
                }
            }
        },
    ) { padding ->
        val family = s.family
        if (family == null) {
            Box(Modifier.fillMaxSize().padding(padding).systemBarsPadding()) {
                if (s.loading) Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator() }
                else CenteredMessage(s.error ?: "Could not load your family.") {
                    Button(onClick = session::load) { Text("Try again") }
                }
            }
            return@Scaffold
        }

        NavHost(nav, startDestination = Tab.Feed.route, modifier = Modifier.padding(padding).consumeWindowInsets(padding)) {
            composable(Tab.Feed.route) {
                FeedScreen(family.id, family.name, s.artworkVersion, onOpen = { nav.navigate("artwork/$it") })
            }
            composable(Tab.Gallery.route) {
                GalleryScreen(family.id, family.name, s.artworkVersion, onOpen = { nav.navigate("artwork/$it") })
            }
            composable(Tab.Add.route) {
                AddArtworkScreen(
                    familyId = family.id,
                    role = s.role,
                    children = s.children,
                    onChildrenChanged = session::reloadChildren,
                    onSaved = {
                        session.artworkChanged()
                        nav.navigate(Tab.Feed.route) {
                            popUpTo(nav.graph.findStartDestination().id)
                            launchSingleTop = true
                        }
                    },
                )
            }
            composable(Tab.Profile.route) {
                ProfileScreen(
                    session = s,
                    onOpenFamily = { nav.navigate("family") },
                    onSwitchFamily = session::switchFamily,
                    onChildrenChanged = session::reloadChildren,
                    onSignOut = session::signOut,
                    onDeleteAccount = session::deleteAccount,
                )
            }
            composable("family") {
                FamilyScreen(
                    session = s,
                    onJoined = session::joined,
                    onLeft = { session.leftFamily(); nav.popBackStack() },
                    onBack = { nav.popBackStack() },
                )
            }
            composable("artwork/{id}", arguments = listOf(navArgument("id") { type = NavType.StringType })) { entry ->
                val id = entry.arguments?.getString("id").orEmpty()
                ArtworkDetailScreen(
                    artworkId = id,
                    role = s.role,
                    onBack = { nav.popBackStack() },
                    onChanged = session::artworkChanged,
                )
            }
        }
    }
}
