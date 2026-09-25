package app.kidcanvas.ui.artwork

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import app.kidcanvas.data.Artwork
import app.kidcanvas.data.KidCanvasRepository
import app.kidcanvas.data.Roles
import app.kidcanvas.ui.common.Avatar
import app.kidcanvas.ui.common.CenteredMessage
import app.kidcanvas.ui.common.Formatting
import app.kidcanvas.ui.common.friendlyError
import app.kidcanvas.ui.social.CommentsSection
import app.kidcanvas.ui.social.ReactionBar
import app.kidcanvas.ui.story.AddStoryPrompt
import app.kidcanvas.ui.story.AddStorySheet
import app.kidcanvas.ui.story.StoryCard
import app.kidcanvas.ui.theme.BrandPink
import coil3.compose.AsyncImage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.format.FormatStyle

data class DetailState(
    val artwork: Artwork? = null,
    val loading: Boolean = true,
    val error: String? = null,
    val message: String? = null,
)

class ArtworkDetailViewModel(val repo: KidCanvasRepository = KidCanvasRepository()) : ViewModel() {
    private val _state = MutableStateFlow(DetailState())
    val state: StateFlow<DetailState> = _state.asStateFlow()

    fun load(id: String) {
        viewModelScope.launch {
            try {
                _state.update { it.copy(artwork = repo.artwork(id), loading = false, error = null) }
            } catch (t: Throwable) {
                _state.update { it.copy(loading = false, error = friendlyError(t, "Could not load this artwork.")) }
            }
        }
    }

    /**
     * Optimistic, then reconciled. RLS allows only owners and parents to update
     * artwork, and a refused update looks like success with no rows, so the
     * heart flips back and says why instead of quietly lying.
     */
    fun toggleFavorite(onChanged: () -> Unit) {
        val art = _state.value.artwork ?: return
        val newValue = !art.isFavorite
        _state.update { it.copy(artwork = art.copy(isFavorite = newValue)) }
        viewModelScope.launch {
            val ok = runCatching { repo.setFavorite(art.id, newValue) }.getOrElse { false }
            if (ok) onChanged()
            else _state.update {
                it.copy(artwork = it.artwork?.copy(isFavorite = !newValue),
                    message = "Could not change the favorite. Only parents can, and it needs a connection.")
            }
        }
    }

    /** Returns an error sentence, or null on success, for the add-story sheet. */
    suspend fun saveStory(story: String, onChanged: () -> Unit): String? {
        val art = _state.value.artwork ?: return null
        return try {
            if (repo.updateStory(art.id, story)) {
                _state.update { it.copy(artwork = art.copy(story = story)) }
                onChanged()
                null
            } else "Only parents can add a story to this piece."
        } catch (t: Throwable) {
            friendlyError(t, "Could not save the story. Try again.")
        }
    }

    fun clearMessage() = _state.update { it.copy(message = null) }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ArtworkDetailScreen(
    artworkId: String,
    role: String?,
    onBack: () -> Unit,
    onChanged: () -> Unit,
    vm: ArtworkDetailViewModel = viewModel(key = "detail-$artworkId"),
) {
    val state by vm.state.collectAsState()
    var addingStory by rememberSaveable { mutableStateOf(false) }
    val snackbar = remember { SnackbarHostState() }
    LaunchedEffect(artworkId) { vm.load(artworkId) }
    LaunchedEffect(state.message) {
        state.message?.let { snackbar.showSnackbar(it); vm.clearMessage() }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        snackbarHost = { SnackbarHost(snackbar) },
        topBar = {
            TopAppBar(
                title = {},
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back") }
                },
            )
        },
    ) { padding ->
        val art = state.artwork
        when {
            art == null && state.loading -> Box(Modifier.fillMaxSize().padding(padding), Alignment.Center) { CircularProgressIndicator() }
            art == null -> Box(Modifier.padding(padding)) {
                CenteredMessage(state.error ?: "This artwork is no longer here.") {
                    Button(onClick = { vm.load(artworkId) }) { Text("Try again") }
                }
            }
            else -> Column(
                Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()),
            ) {
                AsyncImage(
                    model = art.imageUrl,
                    contentDescription = art.title,
                    contentScale = ContentScale.FillWidth,
                    modifier = Modifier.fillMaxWidth().heightIn(min = 200.dp).background(MaterialTheme.colorScheme.surfaceVariant),
                )
                Column(Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
                    Row(verticalAlignment = Alignment.Top) {
                        Column(Modifier.weight(1f)) {
                            Text(art.title ?: "Untitled", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                            art.child?.name?.let {
                                Spacer(Modifier.height(4.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Avatar(it, 24.dp)
                                    Spacer(Modifier.width(6.dp))
                                    Text("by $it", style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                        IconButton(onClick = { vm.toggleFavorite(onChanged) }) {
                            Icon(
                                if (art.isFavorite) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                                contentDescription = if (art.isFavorite) "Remove from favorites" else "Add to favorites",
                                tint = if (art.isFavorite) BrandPink else MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                    HorizontalDivider()
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.CalendarToday, contentDescription = null, modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(Modifier.width(8.dp))
                        val parts = listOfNotNull(
                            Formatting.day(art.createdDate, FormatStyle.LONG),
                            art.childAgeMonths?.let { "Age: ${Formatting.age(it)}" },
                        )
                        Text(parts.joinToString("  •  "), style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }

                    val story = art.story?.takeIf { it.isNotBlank() }
                    if (story != null) StoryCard(story, art.child?.name)
                    else if (Roles.canManage(role)) AddStoryPrompt { addingStory = true }

                    ReactionBar(art.id, vm.repo)
                    CommentsSection(art.id, role, vm.repo)

                    art.description?.takeIf { it.isNotBlank() }?.let {
                        Column {
                            Text("Description", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Spacer(Modifier.height(8.dp))
                            Text(it, style = MaterialTheme.typography.bodyLarge)
                        }
                    }
                    Spacer(Modifier.height(24.dp))
                }
            }
        }
    }

    if (addingStory) {
        AddStorySheet(
            childName = state.artwork?.child?.name,
            onSave = { vm.saveStory(it, onChanged) },
            onDismiss = { addingStory = false },
        )
    }
}
