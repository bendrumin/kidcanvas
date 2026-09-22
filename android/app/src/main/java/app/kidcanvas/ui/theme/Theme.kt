package app.kidcanvas.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

/** The brand: pink into purple, on the warm paper the iOS app is built around. */
val BrandPink = Color(0xFFE91E63)
val BrandPurple = Color(0xFF9C40DD)
private val PaperLight = Color(0xFFFAF7F2)
private val PaperDark = Color(0xFF17150F)

private val Light = lightColorScheme(
    primary = BrandPink,
    secondary = BrandPurple,
    background = PaperLight,
    surface = Color(0xFFFFFDFA),
)

private val Dark = darkColorScheme(
    primary = BrandPink,
    secondary = BrandPurple,
    background = PaperDark,
    surface = Color(0xFF221F1A),
)

@Composable
fun KidCanvasTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = if (isSystemInDarkTheme()) Dark else Light, content = content)
}
