package app.kidcanvas.ui.add

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.DocumentScanner
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import app.kidcanvas.data.Child
import app.kidcanvas.data.KidCanvasRepository
import app.kidcanvas.data.Roles
import app.kidcanvas.ui.common.Avatar
import app.kidcanvas.ui.common.CenteredMessage
import app.kidcanvas.ui.common.Formatting
import app.kidcanvas.ui.common.GradientButton
import app.kidcanvas.ui.family.AddChildDialog
import app.kidcanvas.ui.family.toPickerMillis
import app.kidcanvas.ui.story.StoryField
import coil3.compose.AsyncImage
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.format.FormatStyle

/**
 * Scan or pick, then title, artist, date and story, then upload. The scanner is
 * ML Kit's document scanner, the Android counterpart of iOS VisionKit: it runs
 * on the device inside Google Play services, finds the page edges, crops and
 * squares it. Nothing about the image is sent anywhere except our own upload.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddArtworkScreen(
    familyId: String,
    role: String?,
    children: List<Child>,
    onChildrenChanged: () -> Unit,
    onSaved: () -> Unit,
    vm: AddArtworkViewModel = viewModel(),
) {
    val state by vm.state.collectAsState()
    val context = LocalContext.current
    val repo = remember { KidCanvasRepository() }
    var addingChild by rememberSaveable { mutableStateOf(false) }

    val scanLauncher = rememberLauncherForActivityResult(ActivityResultContracts.StartIntentSenderForResult()) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            GmsDocumentScanningResult.fromActivityResultIntent(result.data)?.pages?.firstOrNull()?.imageUri?.let(vm::setImage)
        }
    }
    val pickLauncher = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        uri?.let(vm::setImage)
    }

    fun startScan() {
        val activity = context.findActivity() ?: return
        val options = GmsDocumentScannerOptions.Builder()
            // Base mode with filters: crop, straighten, optional colour filters.
            // Full mode adds ML "clean up" that can erase marks, which is the
            // wrong tool for a child's drawing and would strain the listing's
            // promise of no AI processing of artwork.
            .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_BASE_WITH_FILTER)
            .setGalleryImportAllowed(true)
            .setPageLimit(1)
            .setResultFormats(GmsDocumentScannerOptions.RESULT_FORMAT_JPEG)
            .build()
        GmsDocumentScanning.getClient(options).getStartScanIntent(activity)
            .addOnSuccessListener { sender -> scanLauncher.launch(IntentSenderRequest.Builder(sender).build()) }
            .addOnFailureListener {
                // No Play services, or the scanner module could not download.
                vm.setError("The scanner is not available on this device. Choose a photo instead.")
            }
    }

    // Preselect only when there is exactly one artist (including the first one
    // just added), so Save enables without another tap. With several, picking
    // the first by default would quietly file a piece under the wrong child.
    LaunchedEffect(children) {
        if (children.size == 1 && state.childId != children.first().id) vm.setChild(children.first().id)
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = { Text("New artwork", fontWeight = FontWeight.SemiBold) },
                actions = { if (state.imageUri != null && !state.uploading) TextButton(onClick = vm::reset) { Text("Start over") } },
            )
        },
    ) { padding ->
        if (!Roles.canUpload(role)) {
            Box(Modifier.padding(padding)) {
                CenteredMessage(
                    "You can look, react and comment",
                    "Adding artwork is for parents and family members. Ask a parent to change your role if you should be adding pieces.",
                )
            }
            return@Scaffold
        }

        val imageUri = state.imageUri
        if (imageUri == null) {
            Column(
                Modifier.fillMaxSize().padding(padding).padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
            ) {
                Text("Save a new piece", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Text(
                    "Scan it and the camera finds the page and squares it up. Or pick a photo you already took.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                SourceCard(Icons.Filled.DocumentScanner, "Scan artwork", "Camera, with automatic cropping", ::startScan)
                SourceCard(Icons.Filled.PhotoLibrary, "Choose from photos", "Any picture on this phone") {
                    pickLauncher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                }
                state.error?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
            }
            return@Scaffold
        }

        Column(
            Modifier.fillMaxSize().padding(padding).imePadding().verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            AsyncImage(
                model = imageUri,
                contentDescription = "The artwork you are saving",
                contentScale = ContentScale.Fit,
                modifier = Modifier.fillMaxWidth().heightIn(max = 260.dp).clip(RoundedCornerShape(16.dp)),
            )

            OutlinedTextField(
                value = state.title,
                onValueChange = vm::setTitle,
                label = { Text("Title") },
                placeholder = { Text("Artwork title") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences),
                modifier = Modifier.fillMaxWidth(),
            )

            ArtistPicker(children, state.childId, vm::setChild, canAdd = Roles.canManage(role), onAdd = { addingChild = true })

            DateField(state.createdDate, vm::setDate)

            StoryField(state.story, vm::setStory, children.firstOrNull { it.id == state.childId }?.name)

            state.error?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }

            GradientButton(
                text = "Save to gallery",
                enabled = vm.canSave(state),
                busy = state.uploading,
                onClick = { vm.save(familyId) { vm.reset(); onSaved() } },
            )
            Spacer(Modifier.height(16.dp))
        }
    }

    if (addingChild) {
        AddChildDialog(familyId, repo, onAdded = { addingChild = false; onChildrenChanged() }, onDismiss = { addingChild = false })
    }
}

@Composable
private fun SourceCard(icon: ImageVector, title: String, subtitle: String, onClick: () -> Unit) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
    ) {
        Row(Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(32.dp))
            Spacer(Modifier.width(16.dp))
            Column {
                Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun ArtistPicker(children: List<Child>, selectedId: String?, onSelect: (String) -> Unit, canAdd: Boolean, onAdd: () -> Unit) {
    var open by remember { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Artist", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
        if (children.isEmpty()) {
            // Save needs an artist, so with none this would be a dead end: an
            // empty picker and a grey button with no reason given.
            Text(
                if (canAdd) "Add an artist before saving. Artwork is filed under whoever made it."
                else "This family has no artists yet. Ask a parent to add one.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        } else {
            Box {
                val selected = children.firstOrNull { it.id == selectedId }
                OutlinedCard(onClick = { open = true }, modifier = Modifier.fillMaxWidth()) {
                    Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        if (selected != null) {
                            Avatar(selected.name, 28.dp)
                            Spacer(Modifier.width(10.dp))
                            Text(selected.name, modifier = Modifier.weight(1f))
                        } else {
                            Text("Select artist", color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1f))
                        }
                        Icon(Icons.Filled.ArrowDropDown, contentDescription = null)
                    }
                }
                DropdownMenu(expanded = open, onDismissRequest = { open = false }) {
                    children.forEach { c ->
                        DropdownMenuItem(text = { Text(c.name) }, onClick = { onSelect(c.id); open = false })
                    }
                }
            }
        }
        if (canAdd) TextButton(onClick = onAdd) { Text("Add an artist") }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DateField(date: LocalDate, onChange: (LocalDate) -> Unit) {
    var picking by remember { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Date created", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
        OutlinedCard(onClick = { picking = true }, modifier = Modifier.fillMaxWidth()) {
            Text(Formatting.day(date.toString(), FormatStyle.LONG) ?: date.toString(), modifier = Modifier.padding(14.dp))
        }
    }
    if (picking) {
        val state = rememberDatePickerState(
            initialSelectedDateMillis = date.toPickerMillis(),
            selectableDates = object : SelectableDates {
                override fun isSelectableDate(utcTimeMillis: Long) = utcTimeMillis <= System.currentTimeMillis()
            },
        )
        DatePickerDialog(
            onDismissRequest = { picking = false },
            confirmButton = {
                TextButton(onClick = {
                    state.selectedDateMillis?.let { onChange(Instant.ofEpochMilli(it).atZone(ZoneOffset.UTC).toLocalDate()) }
                    picking = false
                }) { Text("OK") }
            },
            dismissButton = { TextButton(onClick = { picking = false }) { Text("Cancel") } },
        ) { DatePicker(state) }
    }
}

private tailrec fun Context.findActivity(): Activity? = when (this) {
    is Activity -> this
    is ContextWrapper -> baseContext.findActivity()
    else -> null
}
