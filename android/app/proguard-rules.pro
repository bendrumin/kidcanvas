# R8 rules for the release build. Each block says why it exists, because a
# missing keep rule here does not fail the build: it crashes at runtime, on the
# first request that needs the class, on a user's phone.

# --- kotlinx.serialization ---------------------------------------------------
# The runtime ships its own rules, but they only cover classes whose serializer
# is looked up through the companion. supabase-kt decodes via serializer<T>()
# and the generated $$serializer classes, so keep those for our models,
# including the private payload classes inside KidCanvasRepository.
-keepattributes *Annotation*, InnerClasses, Signature, EnclosingMethod, RuntimeVisibleAnnotations
-dontnote kotlinx.serialization.**
-keep,includedescriptorclasses class app.kidcanvas.**$$serializer { *; }
-keepclassmembers class app.kidcanvas.** {
    *** Companion;
}
-keepclasseswithmembers class app.kidcanvas.** {
    kotlinx.serialization.KSerializer serializer(...);
}
# @SerialName values are read from the descriptor, but keeping field names on
# our models means a stack trace or a decoding error names the real column.
-keepclassmembers @kotlinx.serialization.Serializable class app.kidcanvas.** {
    <fields>;
}

# --- supabase-kt ------------------------------------------------------------
# Its plugins are installed by class and its session/user types are decoded
# from JSON by reflection-free serializers that R8 cannot always trace through
# the plugin registry. Keeping the library whole costs a few hundred KB and
# removes a whole class of "works in debug, crashes in release".
-keep class io.github.jan.supabase.** { *; }
-dontwarn io.github.jan.supabase.**

# --- Ktor -------------------------------------------------------------------
# The HTTP engine is found through ServiceLoader (META-INF/services), which R8
# only rewrites when it can see both sides; keep the Android engine and the
# container interface so HttpClient() always finds it.
-keep class io.ktor.client.engine.android.** { *; }
-keep class * implements io.ktor.client.HttpClientEngineContainer { *; }
-keepnames class io.ktor.** { *; }
# Optional JVM-only references Ktor makes that do not exist on Android.
-dontwarn org.slf4j.**
-dontwarn java.lang.management.**
-dontwarn io.ktor.util.debug.**
-dontwarn org.fusesource.jansi.**

# --- multiplatform-settings (supabase-kt's session storage on Android) -------
-keep class com.russhwolf.settings.** { *; }

# --- Coil -------------------------------------------------------------------
# coil-network-ktor3 registers its fetcher through ServiceLoader too.
-keep class * implements coil3.util.FetcherServiceLoaderTarget { *; }
-keep class * implements coil3.util.DecoderServiceLoaderTarget { *; }
