use std::sync::atomic::Ordering;

use serde::Serialize;
use sysinfo::{DiskKind, Disks};
use tauri::{ipc::Channel, State};

use crate::streams::{StreamName, StreamRegistry, SAMPLE_INTERVAL};

#[derive(Debug, Serialize, Clone)]
pub struct DiskInfo {
    name: String,
    mount_point: String,
    file_system: String,
    kind: String,
    total_space: u64,
    available_space: u64,
    removable: bool,
    /// Bytes read since the previous 1-second refresh, i.e. ~bytes/sec.
    read_rate: u64,
    write_rate: u64,
}

#[tauri::command]
pub async fn get_disks_info(
    registry: State<'_, StreamRegistry>,
    on_event: Channel<Vec<DiskInfo>>,
) -> Result<(), String> {
    let cancelled = registry.begin(StreamName::Disks);
    let mut disks = Disks::new_with_refreshed_list();

    while !cancelled.load(Ordering::Relaxed) {
        disks.refresh(true);

        let snapshot: Vec<DiskInfo> = disks
            .iter()
            .map(|disk| {
                let usage = disk.usage();
                DiskInfo {
                    name: disk.name().to_string_lossy().into_owned(),
                    mount_point: disk.mount_point().to_string_lossy().into_owned(),
                    file_system: disk.file_system().to_string_lossy().into_owned(),
                    kind: match disk.kind() {
                        DiskKind::HDD => "HDD".to_string(),
                        DiskKind::SSD => "SSD".to_string(),
                        DiskKind::Unknown(_) => "Unknown".to_string(),
                    },
                    total_space: disk.total_space(),
                    available_space: disk.available_space(),
                    removable: disk.is_removable(),
                    read_rate: usage.read_bytes,
                    write_rate: usage.written_bytes,
                }
            })
            .collect();

        if on_event.send(snapshot).is_err() {
            break; // Webview is gone; nobody is listening anymore.
        }
        tokio::time::sleep(SAMPLE_INTERVAL).await;
    }
    Ok(())
}
