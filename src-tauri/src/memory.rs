use std::sync::atomic::Ordering;

use serde::Serialize;
use sysinfo::{MemoryRefreshKind, RefreshKind, System};
use tauri::{ipc::Channel, State};

use crate::streams::{StreamName, StreamRegistry, SAMPLE_INTERVAL};

#[derive(Debug, Serialize, Clone)]
pub struct MemorySnapshot {
    total: u64,
    used: u64,
    free: u64,
    available: u64,
    swap_total: u64,
    swap_used: u64,
    swap_free: u64,
}

#[tauri::command]
pub async fn get_memory_info(
    registry: State<'_, StreamRegistry>,
    on_event: Channel<MemorySnapshot>,
) -> Result<(), String> {
    let cancelled = registry.begin(StreamName::Memory);
    let mut sys =
        System::new_with_specifics(RefreshKind::new().with_memory(MemoryRefreshKind::everything()));

    while !cancelled.load(Ordering::Relaxed) {
        sys.refresh_memory();

        let snapshot = MemorySnapshot {
            total: sys.total_memory(),
            used: sys.used_memory(),
            free: sys.free_memory(),
            available: sys.available_memory(),
            swap_total: sys.total_swap(),
            swap_used: sys.used_swap(),
            swap_free: sys.free_swap(),
        };

        if on_event.send(snapshot).is_err() {
            break; // Webview is gone; nobody is listening anymore.
        }
        tokio::time::sleep(SAMPLE_INTERVAL).await;
    }
    Ok(())
}
