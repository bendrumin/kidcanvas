package app.kidcanvas.ui.gallery

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.kidcanvas.data.Artwork
import app.kidcanvas.data.Child
import app.kidcanvas.data.Family
import app.kidcanvas.data.KidCanvasRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class GalleryState(
    val loading: Boolean = true,
    val family: Family? = null,
    val artworks: List<Artwork> = emptyList(),
    val childNames: Map<String, String> = emptyMap(),
    val error: String? = null,
)

class GalleryViewModel(private val repo: KidCanvasRepository = KidCanvasRepository()) : ViewModel() {
    private val _state = MutableStateFlow(GalleryState())
    val state: StateFlow<GalleryState> = _state.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            try {
                val family = repo.family()
                val children: List<Child> = repo.children()
                val artworks = repo.artworks()
                _state.value = GalleryState(
                    loading = false,
                    family = family,
                    artworks = artworks,
                    childNames = children.associate { it.id to it.name },
                )
            } catch (t: Throwable) {
                _state.value = _state.value.copy(loading = false, error = t.message ?: "Could not load the gallery.")
            }
        }
    }
}
