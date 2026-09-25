package app.kidcanvas.ui.common

import android.text.format.DateUtils
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.kidcanvas.ui.theme.BrandPink
import app.kidcanvas.ui.theme.BrandPurple
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

object Links {
    // Same URLs as iOS Config.swift.
    const val PRIVACY = "https://kidcanvas.app/privacy"
    const val SUPPORT = "https://kidcanvas.app/support"
}

val BrandGradient = Brush.horizontalGradient(listOf(BrandPink, BrandPurple))

/** The pink-to-purple call to action used across iOS; disabled goes grey, as there. */
@Composable
fun GradientButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    busy: Boolean = false,
) {
    Button(
        onClick = onClick,
        enabled = enabled && !busy,
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = Color.Transparent,
            disabledContainerColor = Color.Transparent,
        ),
        contentPadding = PaddingValues(),
        modifier = modifier.fillMaxWidth().height(54.dp),
    ) {
        Box(
            Modifier
                .fillMaxSize()
                .background(
                    if (enabled) BrandGradient else Brush.horizontalGradient(listOf(Color.Gray, Color.Gray)),
                    RoundedCornerShape(16.dp),
                ),
            contentAlignment = Alignment.Center,
        ) {
            if (busy) CircularProgressIndicator(Modifier.size(22.dp), color = Color.White, strokeWidth = 2.dp)
            else Text(text, color = Color.White, fontWeight = FontWeight.SemiBold)
        }
    }
}

/** The initial-in-a-gradient-circle iOS uses for artists. */
@Composable
fun Avatar(name: String?, size: Dp = 26.dp) {
    Box(
        Modifier
            .size(size)
            .background(Brush.linearGradient(listOf(BrandPink, BrandPurple)), CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            name?.take(1)?.uppercase() ?: "?",
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = (size.value * 0.45f).sp,
        )
    }
}

@Composable
fun CenteredMessage(title: String, body: String? = null, action: (@Composable () -> Unit)? = null) {
    Column(
        Modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        body?.let {
            Spacer(Modifier.height(8.dp))
            Text(it, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        action?.let {
            Spacer(Modifier.height(16.dp))
            it()
        }
    }
}

object Formatting {
    /**
     * created_date and birth_date are calendar days, not instants. Parsing them
     * as LocalDate keeps the day the parent picked, where treating them as UTC
     * midnight showed the day before west of Greenwich (the iOS bug fixed in
     * AuthManager's decoder).
     */
    fun day(value: String?, style: FormatStyle = FormatStyle.MEDIUM): String? =
        value?.let { runCatching { LocalDate.parse(it.take(10)).format(DateTimeFormatter.ofLocalizedDate(style)) }.getOrNull() }

    /** "3 minutes ago" style, the Android equivalent of iOS's relative date format. */
    fun relative(timestamp: String): String =
        runCatching {
            val millis = OffsetDateTime.parse(timestamp).toInstant().toEpochMilli()
            DateUtils.getRelativeTimeSpanString(millis, System.currentTimeMillis(), DateUtils.MINUTE_IN_MILLIS).toString()
        }.getOrDefault("")

    /** Same wording as iOS ArtworkDetailView.ageText. */
    fun age(months: Int): String =
        if (months >= 12) {
            val years = months / 12
            val rest = months % 12
            if (rest > 0) "${years}y ${rest}m" else "$years year${if (years == 1) "" else "s"}"
        } else {
            "$months month${if (months == 1) "" else "s"}"
        }
}

/** Human sentence for a failed request; never the raw supabase-kt message, which carries headers. */
fun friendlyError(t: Throwable, fallback: String): String {
    val raw = t.message.orEmpty()
    return when {
        listOf("UnknownHost", "timeout", "Unable to resolve host", "Connection reset", "failed to connect")
            .any { raw.contains(it, ignoreCase = true) } -> "No connection. Check your network and try again."
        raw.contains("Invalid or expired invite code") -> "That code is not valid or has expired. Ask for a new one."
        raw.contains("Already a member") -> "You are already in that family."
        raw.contains("row-level security", ignoreCase = true) || raw.contains("42501") ->
            "Your role in this family does not allow that."
        else -> fallback
    }
}
