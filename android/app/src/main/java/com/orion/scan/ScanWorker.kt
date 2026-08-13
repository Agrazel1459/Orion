package com.orion.scan

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.work.*
import java.util.concurrent.TimeUnit

class ScanWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val engine = ScanEngine(applicationContext, loadCachedMaliciousHashes(), loadCachedWalletPublishers())
        val result = engine.scanInstalledApps()
        notifyResult(result)
        return Result.success()
    }

    private fun notifyResult(result: ScanResult) {
        val nm = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            nm.createNotificationChannel(
                NotificationChannel("orion_scans", "Scan results", NotificationManager.IMPORTANCE_DEFAULT)
            )
        }
        val text = if (result.findings.isEmpty())
            "Scan complete — no threats found"
        else
            "Scan complete — ${result.findings.size} item(s) need your attention"

        val notification = NotificationCompat.Builder(applicationContext, "orion_scans")
            .setContentTitle("Orion")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock) // placeholder icon
            .setAutoCancel(true)
            .build()
        nm.notify(1001, notification)
    }

    private fun loadCachedMaliciousHashes(): Set<String> = SignatureStore.get(applicationContext).maliciousHashes
    private fun loadCachedWalletPublishers(): Map<String, String> = SignatureStore.get(applicationContext).knownWalletPublishers

    companion object {
        private const val WORK_NAME = "orion_hourly_scan"

        fun schedule(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiresBatteryNotLow(true)
                .build()
            val request = PeriodicWorkRequestBuilder<ScanWorker>(60, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .build()
            WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork(WORK_NAME, ExistingPeriodicWorkPolicy.KEEP, request)
        }
    }
}
