package app.kidcanvas.ui.story

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import app.kidcanvas.data.StoryTemplate
import app.kidcanvas.data.StoryTemplates
import app.kidcanvas.ui.common.GradientButton
import kotlinx.coroutines.launch

/**
 * The story field is the point of the app: what the child said about the
 * artwork, captured before it is forgotten. Same copy and prompt as iOS.
 */
@Composable
fun StoryField(story: String, onStoryChange: (String) -> Unit, childName: String?) {
    var showTemplates by rememberSaveable { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("The story", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.width(6.dp))
            Text("optional", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.weight(1f))
            TextButton(onClick = { showTemplates = true }) {
                Icon(Icons.Filled.Lightbulb, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(4.dp))
                Text("Need a nudge?", style = MaterialTheme.typography.labelMedium)
            }
        }
        OutlinedTextField(
            value = story,
            onValueChange = onStoryChange,
            placeholder = { Text(childName?.let { "What did $it say about this?" } ?: "What did they say about this?") },
            minLines = 4,
            maxLines = 8,
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
            modifier = Modifier.fillMaxWidth().semantics { contentDescription = "The story behind this artwork" },
        )
        Text(
            "A sentence or two. It's the part you'll be glad you wrote down.",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
    if (showTemplates) {
        StoryTemplatePicker(
            onPick = { opener ->
                onStoryChange(StoryTemplates.apply(opener, story))
                showTemplates = false
            },
            onDismiss = { showTemplates = false },
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StoryTemplatePicker(onPick: (String) -> Unit, onDismiss: () -> Unit) {
    var category by rememberSaveable { mutableStateOf(StoryTemplate.Category.Milestone) }
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Text("Story prompts", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 20.dp))
        Row(
            Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            StoryTemplate.Category.entries.forEach { c ->
                FilterChip(selected = c == category, onClick = { category = c }, label = { Text(c.label) })
            }
        }
        LazyColumn(Modifier.fillMaxWidth().heightIn(max = 420.dp), contentPadding = PaddingValues(bottom = 24.dp)) {
            items(StoryTemplates.templates(category), key = { it.id }) { t ->
                Row(
                    Modifier.fillMaxWidth().clickable { onPick(t.opener) }.padding(horizontal = 20.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(t.icon, style = MaterialTheme.typography.titleLarge)
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text(t.title, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.SemiBold)
                        Text(t.opener.trimEnd() + "…", style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2)
                    }
                }
            }
        }
    }
}

/** The story as it appears on the detail screen: a tinted card, never a caption. */
@Composable
fun StoryCard(story: String, childName: String?) {
    Column(
        Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.06f), RoundedCornerShape(16.dp))
            .padding(16.dp)
            .semantics(mergeDescendants = true) {
                contentDescription = "Story" + (childName?.let { " about $it's artwork" } ?: "") + ": $story"
            },
    ) {
        Text("The story", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(8.dp))
        Text(story, style = MaterialTheme.typography.bodyLarge)
    }
}

/** For artwork saved without a story: the app has months of images with no words attached. */
@Composable
fun AddStoryPrompt(onAdd: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.04f), RoundedCornerShape(16.dp))
            .clickable(onClick = onAdd)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text("No story yet", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
            Text("Add what they said about it", style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddStorySheet(childName: String?, onSave: suspend (String) -> String?, onDismiss: () -> Unit) {
    var story by rememberSaveable { mutableStateOf("") }
    var saving by remember { mutableStateOf(false) }
    var errorText by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)) {
        Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 24.dp).imePadding(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Text("Add the story", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
            StoryField(story, { story = it }, childName)
            errorText?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
            GradientButton(
                text = "Save story",
                enabled = story.isNotBlank(),
                busy = saving,
                onClick = {
                    saving = true
                    scope.launch {
                        errorText = onSave(story.trim())
                        saving = false
                        if (errorText == null) onDismiss()
                    }
                },
            )
        }
    }
}
