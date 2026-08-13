import BackgroundTasks
import UserNotifications

/// iOS cannot guarantee exact hourly timing; document to the user that scans run
/// "about once an hour when the OS allows it." No deep/system-wide scanning is
/// possible in the App Store sandbox — this only scans files the user explicitly
/// picked and Orion's own sandbox.
enum ScanScheduler {
    static let taskId = "com.orion.hourlyscan"

    static func register() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: taskId, using: nil) { task in
            handle(task: task as! BGAppRefreshTask)
        }
    }

    static func scheduleNext() {
        let request = BGAppRefreshTaskRequest(identifier: taskId)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 60 * 60)
        try? BGTaskScheduler.shared.submit(request)
    }

    private static func handle(task: BGAppRefreshTask) {
        scheduleNext()
        let operation = ScanOperation()
        task.expirationHandler = { operation.cancel() }
        operation.completionBlock = {
            postResultNotification(result: operation.result)
            task.setTaskCompleted(success: !operation.isCancelled)
        }
        OperationQueue().addOperation(operation)
    }

    private static func postResultNotification(result: ScanResult?) {
        let content = UNMutableNotificationContent()
        content.title = "Orion"
        content.body = (result?.findings.isEmpty ?? true)
            ? "Scan complete — no threats found"
            : "Scan complete — \(result!.findings.count) item(s) need your attention"
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }
}
