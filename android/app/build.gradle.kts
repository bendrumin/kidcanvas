import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
}

// Public Supabase client config. supabase.properties is gitignored; the values
// are the same ones the web app ships in NEXT_PUBLIC_* and the iOS app has in
// Config.swift. RLS is the protection, not secrecy of the anon key. Environment
// variables are accepted too, so a CI machine needs no file on disk.
val supabaseProps = Properties().apply {
    val f = rootProject.file("supabase.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}
fun supabaseValue(key: String): String =
    supabaseProps.getProperty(key)
        ?: System.getenv(key)
        ?: throw GradleException("$key missing: copy supabase.properties.example to supabase.properties")

/**
 * Upload-key signing, read from Gradle properties (~/.gradle/gradle.properties,
 * never this repo) or the environment. Nothing secret is committed, and no
 * keystore lives in the repo. Without these, bundleRelease still builds, but
 * unsigned: Play Console rejects that file, which is the point of the warning.
 */
fun signingValue(name: String): String? =
    (findProperty(name) as String?)?.takeIf { it.isNotBlank() } ?: System.getenv(name)?.takeIf { it.isNotBlank() }

val releaseStoreFile = signingValue("KIDCANVAS_UPLOAD_STORE_FILE")
val hasReleaseSigning = releaseStoreFile != null &&
    signingValue("KIDCANVAS_UPLOAD_STORE_PASSWORD") != null &&
    signingValue("KIDCANVAS_UPLOAD_KEY_ALIAS") != null &&
    signingValue("KIDCANVAS_UPLOAD_KEY_PASSWORD") != null

android {
    namespace = "app.kidcanvas"
    compileSdk = 36

    defaultConfig {
        applicationId = "app.kidcanvas"
        minSdk = 26
        targetSdk = 36
        // Rises on every Play upload, independently of the iOS train. Play
        // refuses a second upload with the same code, even to internal testing.
        versionCode = 1
        versionName = "1.0.0"
        buildConfigField("String", "SUPABASE_URL", "\"${supabaseValue("SUPABASE_URL")}\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"${supabaseValue("SUPABASE_ANON_KEY")}\"")
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = file(releaseStoreFile!!)
                storePassword = signingValue("KIDCANVAS_UPLOAD_STORE_PASSWORD")
                keyAlias = signingValue("KIDCANVAS_UPLOAD_KEY_ALIAS")
                keyPassword = signingValue("KIDCANVAS_UPLOAD_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            ndk { debugSymbolLevel = "FULL" }
            if (hasReleaseSigning) signingConfig = signingConfigs.getByName("release")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlin { compilerOptions { jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17) } }
    buildFeatures { compose = true; buildConfig = true }
    packaging { resources.excludes += "/META-INF/{AL2.0,LGPL2.1}" }
}

if (!hasReleaseSigning) {
    gradle.taskGraph.whenReady {
        if (allTasks.any { it.name.contains("Release") }) {
            logger.warn(
                "WARNING: KidCanvas release is UNSIGNED. Set KIDCANVAS_UPLOAD_STORE_FILE, " +
                    "KIDCANVAS_UPLOAD_STORE_PASSWORD, KIDCANVAS_UPLOAD_KEY_ALIAS and KIDCANVAS_UPLOAD_KEY_PASSWORD " +
                    "(see android/README.md) before uploading to Play."
            )
        }
    }
}

dependencies {
    // Pinned to the newest line that compiles against SDK 36; the 2026 AndroidX
    // releases want SDK 37, which the command-line SDK here does not have.
    val composeBom = platform("androidx.compose:compose-bom:2025.12.01")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    debugImplementation("androidx.compose.ui:ui-tooling")

    implementation("androidx.core:core-ktx:1.16.0")
    implementation("androidx.activity:activity-compose:1.11.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.9.4")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.9.4")
    implementation("androidx.navigation:navigation-compose:2.9.8")
    // Reads the rotation flag on gallery photos, which BitmapFactory ignores.
    implementation("androidx.exifinterface:exifinterface:1.4.1")

    implementation(platform("io.github.jan-tennert.supabase:bom:3.8.0"))
    implementation("io.github.jan-tennert.supabase:postgrest-kt")
    implementation("io.github.jan-tennert.supabase:auth-kt")
    implementation("io.github.jan-tennert.supabase:storage-kt")
    implementation("io.ktor:ktor-client-android:3.5.1")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.10.0")

    implementation("io.coil-kt.coil3:coil-compose:3.3.0")
    implementation("io.coil-kt.coil3:coil-network-ktor3:3.3.0")

    // The scanner: iOS uses VisionKit, Android's equivalent is ML Kit's
    // document scanner, which ships through Play services rather than the apk
    // and runs on the device.
    implementation("com.google.android.gms:play-services-mlkit-document-scanner:16.0.0-beta1")
}
