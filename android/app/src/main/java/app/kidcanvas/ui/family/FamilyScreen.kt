package app.kidcanvas.ui.family

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.PersonRemove
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.kidcanvas.data.FamilyMember
import app.kidcanvas.data.KidCanvasRepository
import app.kidcanvas.data.Roles
import app.kidcanvas.ui.SessionState
import app.kidcanvas.ui.common.GradientButton
import app.kidcanvas.ui.common.friendlyError
import kotlinx.coroutines.launch

/**
 * Port of iOS FamilyInviteView plus FamilyMembersCard. Grandparents are the
 * second audience: they get a code, not an account setup walkthrough. One code,
 * single use, expires in a week (enforced by the schema).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FamilyScreen(
    session: SessionState,
    onJoined: suspend (String?) -> Unit,
    onLeft: () -> Unit,
    onBack: () -> Unit,
) {
    val repo = remember { KidCanvasRepository() }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val family = session.family

    var code by rememberSaveable { mutableStateOf<String?>(null) }
    var working by remember { mutableStateOf(false) }
    var inviteError by remember { mutableStateOf<String?>(null) }
    var joinCode by rememberSaveable { mutableStateOf("") }
    var joinMessage by remember { mutableStateOf<Pair<Boolean, String>?>(null) }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = { Text("Family", fontWeight = FontWeight.SemiBold) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back") } },
            )
        },
    ) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding).imePadding().verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text("Invite the grandparents", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text(
                "Share a code and they'll see every new drawing. No more texting photos one at a time.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )

            if (family != null && Roles.canManage(session.role)) {
                val current = code
                if (current == null) {
                    GradientButton(
                        text = "Create an invite code",
                        busy = working,
                        onClick = {
                            working = true
                            inviteError = null
                            scope.launch {
                                try { code = repo.createInvite(family.id) }
                                catch (t: Throwable) { inviteError = friendlyError(t, "Could not create a code. Try again.") }
                                finally { working = false }
                            }
                        },
                    )
                } else {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(Modifier.fillMaxWidth().padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Their code", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(
                                current,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold,
                                fontSize = 30.sp,
                                letterSpacing = 4.sp,
                                // Read letter by letter, the way someone would say it on the phone.
                                modifier = Modifier.semantics { contentDescription = "Invite code: ${current.toList().joinToString(" ")}" },
                            )
                            Spacer(Modifier.height(12.dp))
                            OutlinedButton(onClick = {
                                val text = "Join ${family.name} on KidCanvas to see the kids' artwork. Download the app and enter code $current."
                                val send = Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text)
                                context.startActivity(Intent.createChooser(send, "Share code"))
                            }, modifier = Modifier.fillMaxWidth()) {
                                Icon(Icons.Filled.Share, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(8.dp))
                                Text("Share code")
                            }
                            Spacer(Modifier.height(8.dp))
                            Text("Single use, expires in 7 days.", style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
                inviteError?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
            } else if (family != null) {
                Text("Only owners and parents can create invite codes.", style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            HorizontalDivider()

            Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Have a code?", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                val join = {
                    val trimmed = joinCode.trim()
                    if (trimmed.isNotEmpty() && !working) {
                        working = true
                        joinMessage = null
                        scope.launch {
                            try {
                                val joinedId = repo.redeemInvite(trimmed)
                                onJoined(joinedId)
                                joinMessage = true to "You're in. The feed now shows this family."
                                joinCode = ""
                            } catch (t: Throwable) {
                                joinMessage = false to friendlyError(t, "That code did not work. Check it and try again.")
                            } finally {
                                working = false
                            }
                        }
                    }
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    OutlinedTextField(
                        value = joinCode,
                        // Codes are uppercase letters and digits; normalising as
                        // typed avoids a "wrong code" from a lowercase keyboard.
                        onValueChange = { v -> joinCode = v.uppercase().filter { it.isLetterOrDigit() }.take(12) },
                        placeholder = { Text("Enter code") },
                        singleLine = true,
                        textStyle = LocalTextStyle.current.copy(fontFamily = FontFamily.Monospace),
                        keyboardOptions = KeyboardOptions(
                            capitalization = KeyboardCapitalization.Characters,
                            autoCorrectEnabled = false,
                            imeAction = ImeAction.Go,
                        ),
                        keyboardActions = KeyboardActions(onGo = { join() }),
                        modifier = Modifier.weight(1f),
                    )
                    Spacer(Modifier.width(8.dp))
                    Button(onClick = { join() }, enabled = joinCode.isNotBlank() && !working) { Text("Join") }
                }
                joinMessage?.let { (ok, msg) ->
                    Text(msg, style = MaterialTheme.typography.bodySmall,
                        color = if (ok) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error)
                }
            }

            if (family != null) {
                HorizontalDivider()
                FamilyMembersCard(family.id, session.role, repo, onLeft)
            }
        }
    }
}

/**
 * Who else is in this family, and a way to remove them. A family feed with
 * comments needs a way to deal with a person, not only their posts (App Store
 * 1.2 on iOS; Play's user-generated content policy asks the same). The owner
 * cannot be removed; everyone can remove themselves, which is how you leave.
 */
@Composable
private fun FamilyMembersCard(familyId: String, role: String?, repo: KidCanvasRepository, onLeft: () -> Unit) {
    var members by remember(familyId) { mutableStateOf<List<FamilyMember>>(emptyList()) }
    var pending by remember { mutableStateOf<FamilyMember?>(null) }
    var errorText by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val me = repo.currentUserId()

    suspend fun load() { runCatching { repo.familyMembers(familyId) }.onSuccess { members = it } }
    LaunchedEffect(familyId) { load() }

    fun displayName(m: FamilyMember) = m.nickname?.takeIf { it.isNotBlank() } ?: if (m.userId == me) "You" else "Family member"
    fun canRemove(m: FamilyMember) = m.role != Roles.OWNER && (Roles.canManage(role) || m.userId == me)

    Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Family members", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        if (members.size <= 1) {
            Text("Just you so far. Share an invite code to add a grandparent or co-parent.",
                style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        members.forEach { m ->
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier.size(36.dp).background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f), CircleShape),
                    contentAlignment = Alignment.Center,
                ) { Text(displayName(m).take(1).uppercase(), fontWeight = FontWeight.Bold) }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(displayName(m), style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                    val roleLabel = m.role.replaceFirstChar { it.uppercase() }
                    Text(if (m.userId == me) "$roleLabel · you" else roleLabel, style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                if (canRemove(m)) {
                    IconButton(onClick = { pending = m }) {
                        Icon(Icons.Filled.PersonRemove, tint = MaterialTheme.colorScheme.error,
                            contentDescription = if (m.userId == me) "Leave family" else "Remove ${displayName(m)}")
                    }
                }
            }
        }
    }

    pending?.let { m ->
        val isSelf = m.userId == me
        AlertDialog(
            onDismissRequest = { pending = null },
            title = { Text(if (isSelf) "Leave this family?" else "Remove from family?") },
            text = {
                Text(if (isSelf) "You'll lose access to this family's gallery."
                else "They'll lose access to this family's gallery. Artwork and comments stay.")
            },
            confirmButton = {
                TextButton(onClick = {
                    pending = null
                    scope.launch {
                        try {
                            if (!repo.removeMember(m.id)) errorText = "Only owners and parents can remove someone."
                            else if (isSelf) onLeft() else load()
                        } catch (t: Throwable) {
                            errorText = friendlyError(t, "Could not remove them. Try again.")
                        }
                    }
                }) { Text(if (isSelf) "Leave" else "Remove", color = MaterialTheme.colorScheme.error) }
            },
            dismissButton = { TextButton(onClick = { pending = null }) { Text("Cancel") } },
        )
    }
    errorText?.let {
        AlertDialog(
            onDismissRequest = { errorText = null },
            title = { Text("Couldn't remove them") },
            text = { Text(it) },
            confirmButton = { TextButton(onClick = { errorText = null }) { Text("OK") } },
        )
    }
}
