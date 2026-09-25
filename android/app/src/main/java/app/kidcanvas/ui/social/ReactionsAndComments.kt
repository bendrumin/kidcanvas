package app.kidcanvas.ui.social

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.ui.platform.LocalContext

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.draw.clip
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import app.kidcanvas.data.ArtworkComment
import app.kidcanvas.data.COMMENT_MAX_CHARS
import app.kidcanvas.data.KidCanvasRepository
import app.kidcanvas.data.Reaction
import app.kidcanvas.data.Roles
import app.kidcanvas.ui.common.BrandGradient
import app.kidcanvas.ui.common.Formatting
import app.kidcanvas.ui.common.friendlyError
import kotlinx.coroutines.async
import kotlinx.coroutines.launch

/**
 * The five allowed reactions with counts and what this user already left.
 * Taps are optimistic like iOS: the count moves now, and a failed round trip
 * reloads the real numbers instead of leaving a lie on screen.
 */
@Composable
fun ReactionBar(artworkId: String, repo: KidCanvasRepository, modifier: Modifier = Modifier) {
    var counts by remember(artworkId) { mutableStateOf<Map<String, Long>>(emptyMap()) }
    var mine by remember(artworkId) { mutableStateOf<Set<String>>(emptySet()) }
    val scope = rememberCoroutineScope()
    val haptics = LocalHapticFeedback.current

    suspend fun load() {
        val c = scope.async { runCatching { repo.reactionCounts(artworkId) }.getOrNull() }
        val m = scope.async { runCatching { repo.myReactions(artworkId) }.getOrNull() }
        c.await()?.let { counts = it }
        m.await()?.let { mine = it }
    }

    LaunchedEffect(artworkId) { load() }

    // Scrolls rather than wraps: five chips with counts overflow a 320dp phone
    // at large font scale, and a second row would push comments down the card.
    Row(modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Reaction.entries.forEach { reaction ->
            val key = reaction.emoji
            val count = counts[key] ?: 0
            val isMine = key in mine
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .clip(RoundedCornerShape(50))
                    .then(
                        if (isMine) Modifier.background(BrandGradient, RoundedCornerShape(50))
                        else Modifier.background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.07f), RoundedCornerShape(50))
                    )
                    .clickable {
                        haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        val wasMine = isMine
                        if (wasMine) {
                            mine = mine - key
                            counts = counts + (key to maxOf(0, (counts[key] ?: 1) - 1))
                        } else {
                            mine = mine + key
                            counts = counts + (key to (counts[key] ?: 0) + 1)
                        }
                        scope.launch {
                            try {
                                if (wasMine) repo.removeReaction(reaction, artworkId) else repo.addReaction(reaction, artworkId)
                            } catch (_: Throwable) {
                                load()
                            }
                        }
                    }
                    .semantics {
                        contentDescription = reaction.label + (if (count > 0) ", $count" else "") +
                            if (isMine) ". Tap to remove your reaction" else ". Tap to react"
                    }
                    .padding(horizontal = 10.dp, vertical = 7.dp),
            ) {
                Text(reaction.emoji, style = MaterialTheme.typography.bodyLarge)
                if (count > 0) {
                    Spacer(Modifier.width(4.dp))
                    Text(
                        "$count",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = if (isMine) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

/**
 * Comments in the order they were written, with a box to add one. Authors can
 * delete their own; owners and parents can delete anyone's, which is the
 * moderation path both app stores expect from user-generated content.
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun CommentsSection(artworkId: String, role: String?, repo: KidCanvasRepository) {
    var comments by remember(artworkId) { mutableStateOf<List<ArtworkComment>>(emptyList()) }
    var draft by rememberSaveable(artworkId) { mutableStateOf("") }
    var sending by remember { mutableStateOf(false) }
    var pendingAction by remember { mutableStateOf<ArtworkComment?>(null) }
    var pendingDelete by remember { mutableStateOf<ArtworkComment?>(null) }
    var errorText by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val me = repo.currentUserId()

    suspend fun load() {
        runCatching { repo.comments(artworkId) }.onSuccess { comments = it }
    }
    LaunchedEffect(artworkId) { load() }

    fun canDelete(c: ArtworkComment) = c.userId == me || Roles.canManage(role)

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            if (comments.isEmpty()) "Comments" else "Comments (${comments.size})",
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        comments.forEach { comment ->
            Column(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.04f))
                    .combinedClickable(
                        onClick = {},
                        onLongClick = { pendingAction = comment },
                        onLongClickLabel = "Comment options",
                    )
                    .padding(12.dp),
            ) {
                Text(comment.text, style = MaterialTheme.typography.bodyMedium)
                Spacer(Modifier.height(2.dp))
                Text(
                    Formatting.relative(comment.createdAt),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        val canSend = draft.isNotBlank() && !sending
        Row(verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = draft,
                // Capped as typed so the 500 character CHECK constraint can never
                // reject a comment someone spent a while writing.
                onValueChange = { draft = it.take(COMMENT_MAX_CHARS) },
                placeholder = { Text("Add a comment") },
                maxLines = 3,
                supportingText = if (draft.length > COMMENT_MAX_CHARS - 50) {
                    { Text("${draft.length} / $COMMENT_MAX_CHARS") }
                } else null,
                modifier = Modifier.weight(1f),
            )
            IconButton(
                enabled = canSend,
                onClick = {
                    val text = draft.trim()
                    sending = true
                    scope.launch {
                        try {
                            repo.addComment(text, artworkId)
                            draft = ""
                            load()
                        } catch (t: Throwable) {
                            errorText = friendlyError(t, "Could not post that comment. Try again.")
                        } finally {
                            sending = false
                        }
                    }
                },
            ) {
                if (sending) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                else Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Post comment",
                    tint = if (canSend) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        if (comments.isNotEmpty()) {
            Text(
                if (comments.any { canDelete(it) }) "Press and hold a comment to delete or report it."
                else "Press and hold a comment to report it.",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }

    pendingAction?.let { comment ->
        AlertDialog(
            onDismissRequest = { pendingAction = null },
            title = { Text("Comment") },
            text = { Text(comment.text, maxLines = 4) },
            confirmButton = {
                Row {
                    if (comment.userId != me) {
                        TextButton(onClick = {
                            pendingAction = null
                            reportComment(context, comment)
                        }) { Text("Report") }
                    }
                    if (canDelete(comment)) {
                        TextButton(onClick = { pendingAction = null; pendingDelete = comment }) {
                            Text("Delete", color = MaterialTheme.colorScheme.error)
                        }
                    }
                }
            },
            dismissButton = { TextButton(onClick = { pendingAction = null }) { Text("Cancel") } },
        )
    }

    pendingDelete?.let { comment ->
        AlertDialog(
            onDismissRequest = { pendingDelete = null },
            title = { Text("Delete this comment?") },
            text = { Text("It will be removed for everyone in the family.") },
            confirmButton = {
                TextButton(onClick = {
                    pendingDelete = null
                    scope.launch {
                        try {
                            if (!repo.deleteComment(comment.id)) errorText = "Only the author, owners and parents can delete comments."
                            load()
                        } catch (t: Throwable) {
                            // Surface it rather than leaving the comment silently in place.
                            errorText = friendlyError(t, "Could not delete that comment.")
                        }
                    }
                }) { Text("Delete", color = MaterialTheme.colorScheme.error) }
            },
            dismissButton = { TextButton(onClick = { pendingDelete = null }) { Text("Cancel") } },
        )
    }

    errorText?.let {
        AlertDialog(
            onDismissRequest = { errorText = null },
            text = { Text(it) },
            confirmButton = { TextButton(onClick = { errorText = null }) { Text("OK") } },
        )
    }
}

/**
 * Play's user-generated content policy asks for an in-app way to report
 * content. There is no reports table in the schema, so this opens an email to
 * support with the ids filled in; the person sees and sends it themselves.
 */
private fun reportComment(context: Context, comment: ArtworkComment) {
    val body = "I want to report a comment in KidCanvas.\n\n" +
        "Comment id: ${comment.id}\nArtwork id: ${comment.artworkId}\n\nWhat is wrong with it:\n"
    val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:")).apply {
        putExtra(Intent.EXTRA_EMAIL, arrayOf(SUPPORT_EMAIL))
        putExtra(Intent.EXTRA_SUBJECT, "Report a comment")
        putExtra(Intent.EXTRA_TEXT, body)
    }
    runCatching { context.startActivity(intent) }.onFailure {
        Toast.makeText(context, "No email app found. Write to $SUPPORT_EMAIL.", Toast.LENGTH_LONG).show()
    }
}

private const val SUPPORT_EMAIL = "support@kidcanvas.app"

