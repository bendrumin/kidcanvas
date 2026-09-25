package app.kidcanvas.ui.gallery

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import app.kidcanvas.data.Artwork
import app.kidcanvas.ui.common.CenteredMessage
import app.kidcanvas.ui.feed.ArtworkListViewModel
import app.kidcanvas.ui.theme.BrandPink
import coil3.compose.AsyncImage

/**
 * Everything, as a grid. iOS splits favorites into their own tab; here it is a
 * filter on the gallery so the bottom bar keeps four destinations.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GalleryScreen(
    familyId: String,
    familyName: String?,
    artworkVersion: Int,
    onOpen: (String) -> Unit,
    vm: ArtworkListViewModel = viewModel(key = "gallery"),
) {
    val state by vm.state.collectAsState()
    var favoritesOnly by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(familyId, artworkVersion) { vm.load(familyId) }
    val shown = if (favoritesOnly) state.artworks.filter { it.isFavorite } else state.artworks

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = { TopAppBar(title = { Text(familyName ?: "Gallery", fontWeight = FontWeight.SemiBold) }) },
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
                else -> LazyVerticalGrid(
                    columns = GridCells.Adaptive(minSize = 150.dp),
                    contentPadding = PaddingValues(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxSize(),
                ) {
                    item(span = { GridItemSpan(maxLineSpan) }) {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            FilterChip(selected = !favoritesOnly, onClick = { favoritesOnly = false }, label = { Text("All") })
                            FilterChip(selected = favoritesOnly, onClick = { favoritesOnly = true }, label = { Text("Favorites") })
                        }
                    }
                    if (shown.isEmpty()) {
                        item(span = { GridItemSpan(maxLineSpan) }) {
                            Box(Modifier.height(320.dp)) {
                                if (favoritesOnly) CenteredMessage("No favorites yet", "Tap the heart on a piece to keep it here.")
                                else CenteredMessage(
                                    "Nothing here yet",
                                    "Scan a drawing and write down what they said about it. That's the part you'll want back later.",
                                )
                            }
                        }
                    }
                    items(shown, key = { it.id }) { art -> GalleryTile(art, onClick = { onOpen(art.id) }) }
                }
            }
        }
    }
}

@Composable
private fun GalleryTile(art: Artwork, onClick: () -> Unit) {
    Column(Modifier.clip(RoundedCornerShape(14.dp)).clickable(onClick = onClick)) {
        Box {
            AsyncImage(
                model = art.thumbnailUrl ?: art.imageUrl,
                contentDescription = art.title?.let { t -> t + (art.child?.name?.let { ", by $it" } ?: "") },
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f)
                    .clip(RoundedCornerShape(14.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant),
            )
            if (art.isFavorite) {
                Icon(
                    Icons.Filled.Favorite, contentDescription = "Favorite", tint = BrandPink,
                    modifier = Modifier.align(Alignment.TopEnd).padding(8.dp)
                        .background(Color.White.copy(alpha = 0.85f), RoundedCornerShape(50)).padding(4.dp).size(16.dp),
                )
            }
        }
        Spacer(Modifier.height(6.dp))
        Text(art.title ?: "Untitled", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold,
            maxLines = 1, overflow = TextOverflow.Ellipsis)
        art.child?.name?.let {
            Text(it, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
