package app.kidcanvas.ui.add

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import app.kidcanvas.data.ImageEncoding
import app.kidcanvas.data.KidCanvasRepository
import app.kidcanvas.ui.common.friendlyError
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.LocalDate

data class AddArtworkState(
    val imageUri: Uri? = null,
    val title: String = "",
    val story: String = "",
    val childId: String? = null,
    val createdDate: LocalDate = LocalDate.now(),
    val uploading: Boolean = false,
    val error: String? = null,
    val saved: Boolean = false,
)

/**
 * Held in a ViewModel, not the composable, so rotating the phone mid-upload
 * neither loses the form nor starts a second upload.
 */
class AddArtworkViewModel(app: Application) : AndroidViewModel(app) {
    private val repo = KidCanvasRepository()
    private val _state = MutableStateFlow(AddArtworkState())
    val state: StateFlow<AddArtworkState> = _state.asStateFlow()

    fun setImage(uri: Uri) = _state.update { it.copy(imageUri = uri, error = null) }
    fun setTitle(v: String) = _state.update { it.copy(title = v) }
    fun setStory(v: String) = _state.update { it.copy(story = v) }
    fun setChild(id: String) = _state.update { it.copy(childId = id) }
    fun setDate(d: LocalDate) = _state.update { it.copy(createdDate = d) }
    fun setError(msg: String?) = _state.update { it.copy(error = msg) }
    fun reset() { _state.value = AddArtworkState() }

    /** Same requirement as iOS: a title and an artist. The story stays optional. */
    fun canSave(s: AddArtworkState = _state.value) = s.imageUri != null && s.title.isNotBlank() && s.childId != null

    fun save(familyId: String, onSaved: () -> Unit) {
        val s = _state.value
        val uri = s.imageUri ?: return
        val childId = s.childId ?: return
        if (!canSave(s) || s.uploading) return
        viewModelScope.launch {
            _state.update { it.copy(uploading = true, error = null) }
            try {
                val encoded = withContext(Dispatchers.Default) {
                    ImageEncoding.encode(getApplication<Application>().contentResolver, uri)
                }
                repo.uploadArtwork(
                    familyId = familyId,
                    childId = childId,
                    title = s.title,
                    story = s.story,
                    // LocalDate.toString is ISO yyyy-MM-dd, the calendar day
                    // picked, with no timezone to shift it.
                    createdDate = s.createdDate.toString(),
                    image = encoded.image,
                    thumbnail = encoded.thumbnail,
                )
                _state.update { it.copy(uploading = false, saved = true) }
                onSaved()
            } catch (t: Throwable) {
                _state.update { it.copy(uploading = false, error = friendlyError(t, "Upload failed. Try again.")) }
            }
        }
    }
}
