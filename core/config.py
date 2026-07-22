SCAN_INTERVAL_MIN_SECONDS = 15 * 60
SCAN_INTERVAL_MAX_SECONDS = 45 * 60

# User-set interval (minutes), persisted for the UI's Settings screen.
# Read by the scheduler install step instead of the randomized range above
# when present. Default matches the UI's fixed default of 15 minutes.
USER_INTERVAL_FILE_NAME = "orion_settings.json"
DEFAULT_USER_INTERVAL_MINUTES = 15

SCRIPT_TIMEOUT_SECONDS = 60

STATE_FILE_NAME = "orion_state.json"

NOTIFY_TITLE_CLEAN = "Orion scan complete"
NOTIFY_MSG_CLEAN = "No issues found."
NOTIFY_MSG_FLAGGED = "{n} flagged, check orion_state.json"
