package app.kidcanvas.ui.family

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import app.kidcanvas.data.KidCanvasRepository
import app.kidcanvas.ui.common.friendlyError
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

/**
 * Port of iOS AddChildView: a name and an optional birth date. The birth date
 * is what lets the database work out the child's age on every piece.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddChildDialog(familyId: String, repo: KidCanvasRepository, onAdded: () -> Unit, onDismiss: () -> Unit) {
    var name by rememberSaveable { mutableStateOf("") }
    var birthDate by rememberSaveable { mutableStateOf<String?>(null) }
    var pickingDate by remember { mutableStateOf(false) }
    var saving by remember { mutableStateOf(false) }
    var errorText by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add artist") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Artist's name") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words),
                    modifier = Modifier.fillMaxWidth(),
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        birthDate?.let { "Born ${app.kidcanvas.ui.common.Formatting.day(it)}" } ?: "Birth date (optional)",
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.weight(1f),
                    )
                    TextButton(onClick = { pickingDate = true }) { Text(if (birthDate == null) "Add" else "Change") }
                }
                errorText?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
            }
        },
        confirmButton = {
            TextButton(
                enabled = name.isNotBlank() && !saving,
                onClick = {
                    saving = true
                    scope.launch {
                        try {
                            repo.addChild(familyId, name, birthDate)
                            onAdded()
                        } catch (t: Throwable) {
                            errorText = friendlyError(t, "Could not add that artist. Try again.")
                        } finally {
                            saving = false
                        }
                    }
                },
            ) { Text(if (saving) "Adding…" else "Add artist") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )

    if (pickingDate) {
        val state = rememberDatePickerState(
            // The picker works in UTC midnights, so convert as UTC both ways;
            // using the local zone here is what shifts a birthday by a day.
            selectableDates = object : SelectableDates {
                override fun isSelectableDate(utcTimeMillis: Long) = utcTimeMillis <= System.currentTimeMillis()
            },
        )
        DatePickerDialog(
            onDismissRequest = { pickingDate = false },
            confirmButton = {
                TextButton(onClick = {
                    state.selectedDateMillis?.let {
                        birthDate = Instant.ofEpochMilli(it).atZone(ZoneOffset.UTC).toLocalDate().toString()
                    }
                    pickingDate = false
                }) { Text("OK") }
            },
            dismissButton = { TextButton(onClick = { pickingDate = false }) { Text("Cancel") } },
        ) { DatePicker(state) }
    }
}

/** UTC-midnight millis for a LocalDate, the form Material's DatePicker expects. */
fun LocalDate.toPickerMillis(): Long = atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()
