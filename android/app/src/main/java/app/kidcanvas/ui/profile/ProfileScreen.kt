package app.kidcanvas.ui.profile

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import app.kidcanvas.BuildConfig
import app.kidcanvas.data.KidCanvasRepository
import app.kidcanvas.data.Roles
import app.kidcanvas.ui.SessionState
import app.kidcanvas.ui.common.Avatar
import app.kidcanvas.ui.common.Formatting
import app.kidcanvas.ui.common.Links
import app.kidcanvas.ui.common.friendlyError
import app.kidcanvas.ui.family.AddChildDialog
import kotlinx.coroutines.launch

/**
 * Port of iOS ProfileView and SettingsView's account section: who you are,
 * which family, its artists, the family screen, and the two ways out (sign out,
 * and permanent deletion, which Play requires in-app just as Apple does).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    session: SessionState,
    onOpenFamily: () -> Unit,
    onSwitchFamily: (String) -> Unit,
    onChildrenChanged: () -> Unit,
    onSignOut: () -> Unit,
    onDeleteAccount: suspend () -> Unit,
) {
    val uriHandler = LocalUriHandler.current
    val repo = remember { KidCanvasRepository() }
    val scope = rememberCoroutineScope()
    var addingChild by rememberSaveable { mutableStateOf(false) }
    var confirmDelete by remember { mutableStateOf(false) }
    var deleting by remember { mutableStateOf(false) }
    var deleteError by remember { mutableStateOf<String?>(null) }
    val family = session.family

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = { TopAppBar(title = { Text("Profile", fontWeight = FontWeight.SemiBold) }) },
    ) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                Avatar(session.userName, 88.dp)
                Spacer(Modifier.height(12.dp))
                Text(session.userName, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Text(session.email, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            if (family != null) {
                SectionCard {
                    Text(family.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    session.role?.let {
                        Text("Your role: ${it.replaceFirstChar { c -> c.uppercase() }}", style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    HorizontalDivider(Modifier.padding(vertical = 8.dp))
                    Text("Artists", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    if (session.children.isEmpty()) {
                        Text("No artists yet", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    session.children.forEach { child ->
                        Row(Modifier.padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                            Avatar(child.name, 32.dp)
                            Spacer(Modifier.width(10.dp))
                            Column {
                                Text(child.name, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                                Formatting.day(child.birthDate)?.let {
                                    Text("Born $it", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                    if (Roles.canManage(session.role)) {
                        TextButton(onClick = { addingChild = true }, contentPadding = PaddingValues(0.dp)) { Text("Add artist") }
                    }
                    HorizontalDivider(Modifier.padding(vertical = 8.dp))
                    NavRow("Invite family", onOpenFamily)
                }
            }

            // Only shown to someone in more than one family, such as a grandparent
            // who signed up before being invited.
            if (session.memberships.size > 1) {
                SectionCard {
                    Text("Your families", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                    session.memberships.forEach { m ->
                        Row(
                            Modifier.fillMaxWidth().clickable { onSwitchFamily(m.familyId) }.padding(vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(m.family?.name ?: "Family", modifier = Modifier.weight(1f))
                            if (m.familyId == family?.id) Icon(Icons.Filled.Check, contentDescription = "Showing now",
                                tint = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
            }

            SectionCard {
                NavRow("Privacy policy") { uriHandler.openUri(Links.PRIVACY) }
                HorizontalDivider()
                NavRow("Help and support") { uriHandler.openUri(Links.SUPPORT) }
            }

            OutlinedButton(onClick = onSignOut, modifier = Modifier.fillMaxWidth().height(50.dp), shape = RoundedCornerShape(16.dp)) {
                Text("Sign out")
            }

            Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                TextButton(onClick = { confirmDelete = true }, enabled = !deleting) {
                    if (deleting) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                    else Text("Delete account", color = MaterialTheme.colorScheme.error, fontWeight = FontWeight.SemiBold)
                }
                Text(
                    "Permanently deletes your account, your family's gallery, and every artwork you've saved.",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                )
                deleteError?.let {
                    Spacer(Modifier.height(6.dp))
                    Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall, textAlign = TextAlign.Center)
                }
            }

            Text("KidCanvas ${BuildConfig.VERSION_NAME}", style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.align(Alignment.CenterHorizontally))
        }
    }

    if (addingChild && family != null) {
        AddChildDialog(family.id, repo, onAdded = { addingChild = false; onChildrenChanged() }, onDismiss = { addingChild = false })
    }

    if (confirmDelete) {
        AlertDialog(
            onDismissRequest = { confirmDelete = false },
            title = { Text("Delete account?") },
            text = {
                Text("This permanently deletes your account, any family you own, every child profile in it, and all saved artwork. This cannot be undone.")
            },
            confirmButton = {
                TextButton(onClick = {
                    confirmDelete = false
                    deleting = true
                    deleteError = null
                    scope.launch {
                        try { onDeleteAccount() }
                        catch (t: Throwable) { deleteError = friendlyError(t, "Could not delete the account. Try again, or contact support.") }
                        finally { deleting = false }
                    }
                }) { Text("Delete everything", color = MaterialTheme.colorScheme.error) }
            },
            dismissButton = { TextButton(onClick = { confirmDelete = false }) { Text("Cancel") } },
        )
    }
}

@Composable
private fun SectionCard(content: @Composable ColumnScope.() -> Unit) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth(),
    ) { Column(Modifier.padding(16.dp), content = content) }
}

@Composable
private fun NavRow(title: String, onClick: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().clickable(onClick = onClick).padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(title, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
        Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
