use serde::Serialize;
use sysinfo::System;

#[derive(Debug, Serialize)]
pub struct SystemInfo {
    os_name: String,
    os_version: String,
    os_kernel_version: String,
    hostname: String,
    boot_time: u64,
    distribution_id: String,
    cpu_arch: String,
    uptime: u64,
}

#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    SystemInfo {
        os_name: System::name().unwrap_or_else(|| "Unknown".to_string()),
        os_version: System::os_version().unwrap_or_else(|| "Unknown".to_string()),
        os_kernel_version: System::kernel_version().unwrap_or_else(|| "Unknown".to_string()),
        hostname: System::host_name().unwrap_or_else(|| "Unknown".to_string()),
        boot_time: System::boot_time(),
        distribution_id: System::distribution_id(),
        cpu_arch: System::cpu_arch().unwrap_or_else(|| "Unknown".to_string()),
        uptime: System::uptime(),
    }
}
