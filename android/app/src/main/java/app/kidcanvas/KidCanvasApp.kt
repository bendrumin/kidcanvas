package app.kidcanvas

import android.app.Application
import android.content.Context
import android.content.SharedPreferences

class KidCanvasApp : Application() {
    override fun onCreate() {
        super.onCreate()
        prefs = getSharedPreferences("kidcanvas", Context.MODE_PRIVATE)
    }

    companion object {
        /**
         * Small per-install choices only, such as which family is showing. The
         * Supabase session lives in supabase-kt's own store, not here.
         */
        lateinit var prefs: SharedPreferences
            private set
    }
}
