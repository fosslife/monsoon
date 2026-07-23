use std::sync::atomic::Ordering;

use serde::Serialize;
use sysinfo::{
    CpuRefreshKind, Disks, MemoryRefreshKind, Networks, ProcessRefreshKind, ProcessesToUpdate,
    RefreshKind, System, MINIMUM_CPU_UPDATE_INTERVAL,
};
use tauri::{ipc::Channel, State};

use crate::streams::{StreamName, StreamRegistry, SAMPLE_INTERVAL};

#[derive(Debug, Serialize, Clone)]
pub struct TopProcess {
    pid: u32,
    name: String,
    cpu_usage: f32,
    memory: u64,
}

/// Aggregate snapshot backing the dashboard and the status footer.
/// All rates are bytes since the previous 1-second refresh, i.e. ~bytes/sec.
#[derive(Debug, Serialize, Clone)]
pub struct OverviewSnapshot {
    cpu_global: f32,
    core_usages: Vec<f32>,
    mem_total: u64,
    mem_used: u64,
    swap_total: u64,
    swap_used: u64,
    process_count: usize,
    top_processes: Vec<TopProcess>,
    net_rx: u64,
    net_tx: u64,
    disk_read: u64,
    disk_write: u64,
}

fn is_loopback(name: &str) -> bool {
    name == "lo" || name.to_ascii_lowercase().contains("loopback")
}

#[tauri::command]
pub async fn get_overview_info(
    registry: State<'_, StreamRegistry>,
    on_event: Channel<OverviewSnapshot>,
) -> Result<(), String> {
    let cancelled = registry.begin(StreamName::Overview);

    let base_refresh = RefreshKind::nothing()
        .with_cpu(CpuRefreshKind::nothing().with_cpu_usage())
        .with_memory(MemoryRefreshKind::everything());
    let process_refresh = ProcessRefreshKind::nothing().with_cpu().with_memory();

    let mut sys = System::new_with_specifics(base_refresh);
    let mut networks = Networks::new_with_refreshed_list();
    let mut disks = Disks::new_with_refreshed_list();

    // Usage values are deltas between two refreshes.
    tokio::time::sleep(MINIMUM_CPU_UPDATE_INTERVAL).await;

    while !cancelled.load(Ordering::Relaxed) {
        sys.refresh_specifics(base_refresh);
        sys.refresh_processes_specifics(ProcessesToUpdate::All, true, process_refresh);
        networks.refresh(true);
        disks.refresh(true);

        let mut top: Vec<TopProcess> = sys
            .processes()
            .iter()
            .map(|(pid, process)| TopProcess {
                pid: pid.as_u32(),
                name: process.name().to_string_lossy().into_owned(),
                cpu_usage: process.cpu_usage(),
                memory: process.memory(),
            })
            .collect();
        let process_count = top.len();
        top.sort_by(|a, b| b.cpu_usage.total_cmp(&a.cpu_usage));
        top.truncate(5);

        let (net_rx, net_tx) = networks
            .iter()
            .filter(|(name, _)| !is_loopback(name))
            .fold((0u64, 0u64), |(rx, tx), (_, data)| {
                (rx + data.received(), tx + data.transmitted())
            });

        let (disk_read, disk_write) = disks.iter().fold((0u64, 0u64), |(read, write), disk| {
            let usage = disk.usage();
            (read + usage.read_bytes, write + usage.written_bytes)
        });

        let snapshot = OverviewSnapshot {
            cpu_global: sys.global_cpu_usage(),
            core_usages: sys.cpus().iter().map(|cpu| cpu.cpu_usage()).collect(),
            mem_total: sys.total_memory(),
            mem_used: sys.used_memory(),
            swap_total: sys.total_swap(),
            swap_used: sys.used_swap(),
            process_count,
            top_processes: top,
            net_rx,
            net_tx,
            disk_read,
            disk_write,
        };

        if on_event.send(snapshot).is_err() {
            break; // Webview is gone; nobody is listening anymore.
        }
        tokio::time::sleep(SAMPLE_INTERVAL).await;
    }
    Ok(())
}
