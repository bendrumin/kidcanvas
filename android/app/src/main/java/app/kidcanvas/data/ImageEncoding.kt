package app.kidcanvas.data

import android.content.ContentResolver
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import java.io.ByteArrayOutputStream
import kotlin.math.max
import kotlin.math.roundToInt

/**
 * Turns a picked or scanned image into the two JPEGs iOS uploads: the full
 * image under the bucket's 10MB cap and a 500px thumbnail. The steps follow
 * UploadSheetView.compressedJPEG / thumbnailJPEG so both platforms store
 * images of the same shape.
 */
object ImageEncoding {
    /**
     * Anything larger is downsampled while decoding. A 50MP photo decoded at
     * full size is about 200MB of pixels, which is an out-of-memory crash on a
     * mid-range phone before compression ever runs.
     */
    private const val MAX_DECODE_EDGE = 4096

    class Encoded(val image: ByteArray, val thumbnail: ByteArray)

    fun encode(resolver: ContentResolver, uri: Uri): Encoded {
        val bitmap = decodeUpright(resolver, uri) ?: throw IllegalArgumentException("Could not read that image.")
        try {
            val image = compressedJpeg(bitmap, MAX_IMAGE_BYTES)
            val thumbnail = thumbnailJpeg(bitmap, 500) ?: image
            return Encoded(image, thumbnail)
        } finally {
            bitmap.recycle()
        }
    }

    private fun decodeUpright(resolver: ContentResolver, uri: Uri): Bitmap? {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null

        var sample = 1
        while (max(bounds.outWidth, bounds.outHeight) / (sample * 2) >= MAX_DECODE_EDGE) sample *= 2
        val decoded = resolver.openInputStream(uri)?.use {
            BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample })
        } ?: return null

        // Camera photos from the gallery are often stored sideways with an EXIF
        // flag; BitmapFactory ignores it, so without this a portrait drawing
        // would upload rotated. Scanner output is already upright (flag absent).
        val orientation = resolver.openInputStream(uri)?.use {
            ExifInterface(it).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
        } ?: ExifInterface.ORIENTATION_NORMAL
        val matrix = Matrix()
        when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
            ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
            ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
            ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.postScale(-1f, 1f)
            ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.postScale(1f, -1f)
            else -> return decoded
        }
        val rotated = Bitmap.createBitmap(decoded, 0, 0, decoded.width, decoded.height, matrix, true)
        if (rotated != decoded) decoded.recycle()
        return rotated
    }

    private fun jpeg(bitmap: Bitmap, quality: Int): ByteArray =
        ByteArrayOutputStream().use { out ->
            bitmap.compress(Bitmap.CompressFormat.JPEG, quality, out)
            out.toByteArray()
        }

    /** Descending quality, then descending size, until it fits; same ladder as iOS. */
    private fun compressedJpeg(bitmap: Bitmap, maxBytes: Int): ByteArray {
        for (quality in intArrayOf(80, 60, 45)) {
            val data = jpeg(bitmap, quality)
            if (data.size <= maxBytes) return data
        }
        var candidate = bitmap
        repeat(4) {
            val scaled = Bitmap.createScaledBitmap(
                candidate,
                (candidate.width * 0.7f).roundToInt().coerceAtLeast(1),
                (candidate.height * 0.7f).roundToInt().coerceAtLeast(1),
                true,
            )
            if (candidate != bitmap) candidate.recycle()
            candidate = scaled
            val data = jpeg(candidate, 70)
            if (data.size <= maxBytes) {
                if (candidate != bitmap) candidate.recycle()
                return data
            }
        }
        val last = jpeg(candidate, 50)
        if (candidate != bitmap) candidate.recycle()
        return last
    }

    private fun thumbnailJpeg(bitmap: Bitmap, maxDimension: Int): ByteArray? {
        val scale = minOf(1f, maxDimension.toFloat() / max(bitmap.width, bitmap.height))
        if (scale >= 1f) return jpeg(bitmap, 70)
        val resized = Bitmap.createScaledBitmap(
            bitmap,
            (bitmap.width * scale).roundToInt().coerceAtLeast(1),
            (bitmap.height * scale).roundToInt().coerceAtLeast(1),
            true,
        )
        return try { jpeg(resized, 70) } finally { resized.recycle() }
    }
}
