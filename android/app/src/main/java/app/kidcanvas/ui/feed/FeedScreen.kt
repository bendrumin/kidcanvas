package app.kidcanvas.ui.feed

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import app.kidcanvas.data.Artwork
import app.kidcanvas.data.KidCanvasRepository
import app.kidcanvas.ui.common.Avatar
import app.kidcanvas.ui.common.CenteredMessage
import app.kidcanvas.ui.common.Formatting
import app.kidcanvas.ui.common.friendlyError
import app.kidcanvas.ui.social.ReactionBar
import coil3.compose.AsyncImage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ArtworkListState(
    val loading: Boolean = true,
    val refreshing: Boolean = false,
    val artworks: List<Artwork> = emptyList(),
    val error: String? = null,
)

/** Shared by the feed and the gallery: both read the same iOS artworks query. */
class ArtworkListViewModel(val repo: KidCanvasRepository = KidCanvasRepository()) : ViewModel() {
    private val _state = MutableStateFlow(ArtworkListState())
    val state: StateFlow<ArtworkListState> = _state.asStateFlow()

    fun load(familyId: String, pull: Boolean = false) {
        viewModelScope.launch {
            _state.value = _state.value.copy(refreshing = pull, error = null)
            try {
                _state.value = ArtworkListState(loading = false, artworks = repo.artworks(familyId))
            } catch (t: Throwable) {
                _state.value = _state.value.copy(loading = false, refreshing = false,
                    error = friendlyError(t, "Could not load the artwork."))
            }
        }
    }
}

/**
 * Story-first, newest-first, as iOS FeedView. The gallery answers "show me
 * everything"; the feed answers "what happened lately", so the words lead.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeedScreen(
    familyId: String,
    familyName: String?,
    artworkVersion: Int,
    onOpen: (String) -> Unit,
    vm: ArtworkListViewModel = viewModel(key = "feed"),
) {
    val state by vm.state.collectAsState()
    LaunchedEffect(familyId, artworkVersion) { vm.load(familyId) }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = { TopAppBar(title = { Text("Recently", fontWeight = FontWeight.SemiBold) }) },
    ) { padding ->
        PullToRefreshBox(
            isRefreshing = state.refreshing,
            onRefresh = { vm.load(familyId, pull = true) },
            modifier = Modifier.fillMaxSize().padding(padding),
        ) {
            when {
                state.loading -> Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator() }
                state.error != null && state.artworks.isEmpty() -> CenteredMessage(state.error!!) {
                    Button(onClick = { vm.load(familyId) }) { Text("Try again") }
                }
                state.artworks.isEmpty() -> CenteredMessage(
                    "Nothing here yet",
                    "Scan a drawing and write down what they said about it. That's the part you'll want back later.",
                )
                else -> LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(20.dp),
                    modifier = Modifier.fillMaxSize(),
                ) {
                    items(state.artworks, key = { it.id }) { art ->
                        FeedCard(art, vm.repo, onOpen = { onOpen(art.id) })
                    }
                }
            }
        }
    }
}

@Composable
private fun FeedCard(art: Artwork, repo: KidCanvasRepository, onOpen: () -> Unit) {
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.clickable(onClick = onOpen)) {
            AsyncImage(
                model = art.thumbnailUrl ?: art.imageUrl,
                contentDescription = art.title?.let { t -> t + (art.child?.name?.let { ", by $it" } ?: "") },
                contentScale = ContentScale.FillWidth,
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 180.dp, max = 360.dp)
                    .clip(RoundedCornerShape(topStart = 18.dp, topEnd = 18.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant),
            )
            Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                art.child?.name?.let {
                    Avatar(it)
                    Spacer(Modifier.width(8.dp))
                }
                Column {
                    Text(art.title ?: "Untitled", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold,
                        maxLines = 2, overflow = TextOverflow.Ellipsis)
                    val date = Formatting.day(art.createdDate)
                    Text(
                        listOfNotNull(art.child?.name, date).joinToString(" · "),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            art.story?.takeIf { it.isNotBlank() }?.let {
                Text(it, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(start = 14.dp, end = 14.dp, bottom = 12.dp))
            }
        }
        HorizontalDivider()
        ReactionBar(art.id, repo, Modifier.padding(horizontal = 12.dp, vertical = 10.dp))
    }
}
