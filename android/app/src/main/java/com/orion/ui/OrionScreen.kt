package com.orion.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.orion.scan.ScanEngine
import java.time.Instant

// Palette from Orion logo
private val OrionNavy = Color(0xFF081A32)
private val OrionNavyLight = Color(0xFF0F2A4D)
private val OrionBlue = Color(0xFF3E72AE)
private val OrionBlueLight = Color(0xFF6FA0D6)
private val OrionWhite = Color(0xFFF2F5FA)

private val OrionColors = darkColorScheme(
    primary = OrionBlue,
    secondary = OrionBlueLight,
    background = OrionNavy,
    surface = OrionNavyLight,
    onPrimary = OrionWhite,
    onBackground = OrionWhite,
    onSurface = OrionWhite,
)

data class Finding(
    val type: String,
    val severity: String,
    val description: String,
    val remediation: String,
)

data class ScanUiState(
    val lastScan: String = Instant.now().toString(),
    val itemsScanned: Int = 0,
    val scanning: Boolean = false,
    val findings: List<Finding> = emptyList(),
    val hourlyScan: Boolean = true,
    val networkProtection: Boolean = true,
    val clipboardWatch: Boolean = true,
)

@Composable
fun OrionApp(engine: ScanEngine? = null) {
    MaterialTheme(colorScheme = OrionColors) {
        var state by remember { mutableStateOf(ScanUiState()) }
        Surface(color = OrionNavy, modifier = Modifier.fillMaxSize()) {
            OrionScreen(
                state = state,
                onScanNow = {
                    state = state.copy(scanning = true)
                    // ScanEngine.runScan() wiring point — replace stub below with real result
                    state = state.copy(
                        scanning = false,
                        lastScan = Instant.now().toString(),
                        itemsScanned = state.itemsScanned + 128,
                    )
                },
                onToggleHourly = { state = state.copy(hourlyScan = it) },
                onToggleNetwork = { state = state.copy(networkProtection = it) },
                onToggleClipboard = { state = state.copy(clipboardWatch = it) },
            )
        }
    }
}

@Composable
private fun OrionScreen(
    state: ScanUiState,
    onScanNow: () -> Unit,
    onToggleHourly: (Boolean) -> Unit,
    onToggleNetwork: (Boolean) -> Unit,
    onToggleClipboard: (Boolean) -> Unit,
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item { Header() }
        item { StatusCard(state, onScanNow) }
        item { Text("Findings", fontWeight = FontWeight.SemiBold, fontSize = 16.sp, color = OrionWhite) }
        if (state.findings.isEmpty()) {
            item { EmptyFindings() }
        } else {
            items(state.findings) { FindingRow(it) }
        }
        item { Text("Protection", fontWeight = FontWeight.SemiBold, fontSize = 16.sp, color = OrionWhite) }
        item {
            SettingsCard(
                state = state,
                onToggleHourly = onToggleHourly,
                onToggleNetwork = onToggleNetwork,
                onToggleClipboard = onToggleClipboard,
            )
        }
    }
}

@Composable
private fun Header() {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier.size(40.dp).clip(CircleShape).background(OrionBlue),
            contentAlignment = Alignment.Center,
        ) { Text("O", color = OrionWhite, fontWeight = FontWeight.Bold, fontSize = 20.sp) }
        Spacer(Modifier.width(12.dp))
        Column {
            Text("Orion", color = OrionWhite, fontWeight = FontWeight.Bold, fontSize = 22.sp)
            Text("Protection active", color = OrionBlueLight, fontSize = 13.sp)
        }
    }
}

@Composable
private fun StatusCard(state: ScanUiState, onScanNow: () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = OrionNavyLight),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(20.dp)) {
            Text(
                if (state.findings.isEmpty()) "No threats found" else "${state.findings.size} item(s) need your attention",
                color = OrionWhite, fontWeight = FontWeight.SemiBold, fontSize = 18.sp,
            )
            Spacer(Modifier.height(4.dp))
            Text("Scanned ${state.itemsScanned} items · last scan just now", color = OrionBlueLight, fontSize = 13.sp)
            Spacer(Modifier.height(16.dp))
            Button(
                onClick = onScanNow,
                enabled = !state.scanning,
                colors = ButtonDefaults.buttonColors(containerColor = OrionBlue),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth(),
            ) { Text(if (state.scanning) "Scanning…" else "Scan now", color = OrionWhite) }
        }
    }
}

@Composable
private fun EmptyFindings() {
    Card(
        colors = CardDefaults.cardColors(containerColor = OrionNavyLight),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Text(
            "Nothing to review. Orion will notify you if that changes.",
            color = OrionBlueLight, fontSize = 14.sp, modifier = Modifier.padding(16.dp),
        )
    }
}

@Composable
private fun FindingRow(f: Finding) {
    val sevColor = when (f.severity) {
        "high" -> Color(0xFFE0645A)
        "medium" -> Color(0xFFE0B04A)
        else -> OrionBlueLight
    }
    Card(
        colors = CardDefaults.cardColors(containerColor = OrionNavyLight),
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(Modifier.padding(16.dp)) {
            Box(Modifier.size(10.dp).clip(CircleShape).background(sevColor))
            Spacer(Modifier.width(12.dp))
            Column {
                Text(f.description, color = OrionWhite, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                Spacer(Modifier.height(2.dp))
                Text(f.remediation, color = OrionBlueLight, fontSize = 12.sp)
            }
        }
    }
}

@Composable
private fun SettingsCard(
    state: ScanUiState,
    onToggleHourly: (Boolean) -> Unit,
    onToggleNetwork: (Boolean) -> Unit,
    onToggleClipboard: (Boolean) -> Unit,
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = OrionNavyLight),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(Modifier.padding(8.dp)) {
            SettingRow("Hourly scan", state.hourlyScan, onToggleHourly)
            SettingRow("Network protection", state.networkProtection, onToggleNetwork)
            SettingRow("Clipboard hijack watch", state.clipboardWatch, onToggleClipboard)
        }
    }
}

@Composable
private fun SettingRow(label: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(label, color = OrionWhite, fontSize = 14.sp)
        Switch(
            checked = checked, onCheckedChange = onChange,
            colors = SwitchDefaults.colors(checkedThumbColor = OrionWhite, checkedTrackColor = OrionBlue),
        )
    }
}
