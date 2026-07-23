use std::sync::atomic::Ordering;

use serde::Serialize;
use sysinfo::{CpuRefreshKind, RefreshKind, System, MINIMUM_CPU_UPDATE_INTERVAL};
use tauri::{ipc::Channel, State};

use crate::{
    cpuid::{self, CacheInfo},
    streams::{StreamName, StreamRegistry, SAMPLE_INTERVAL},
};

#[derive(Debug, Serialize)]
pub struct CpuStatic {
    brand: String,
    physical_cores: usize,
    logical_cores: usize,
    cache_sizes: Vec<CacheInfo>,
    features: Vec<&'static str>,
}

#[tauri::command]
pub fn get_cpu_static() -> CpuStatic {
    let sys =
        System::new_with_specifics(RefreshKind::nothing().with_cpu(CpuRefreshKind::nothing()));
    CpuStatic {
        brand: sys
            .cpus()
            .first()
            .map(|cpu| cpu.brand().to_string())
            .unwrap_or_default(),
        physical_cores: sys.physical_core_count().unwrap_or(0),
        logical_cores: sys.cpus().len(),
        cache_sizes: cpuid::cache_sizes(),
        features: cpuid::features(),
    }
}

#[derive(Debug, Serialize, Clone)]
pub struct CoreSnapshot {
    name: String,
    usage: f32,
    /// Current frequency in MHz.
    frequency: u64,
}

#[derive(Debug, Serialize, Clone)]
pub struct CpuSnapshot {
    global_usage: f32,
    cores: Vec<CoreSnapshot>,
}

#[tauri::command]
pub async fn get_cpu_info(
    registry: State<'_, StreamRegistry>,
    on_event: Channel<CpuSnapshot>,
) -> Result<(), String> {
    let cancelled = registry.begin(StreamName::Cpu);
    let refresh = CpuRefreshKind::nothing().with_cpu_usage().with_frequency();
    let mut sys = System::new_with_specifics(RefreshKind::nothing().with_cpu(refresh));

    // Usage is a delta between two refreshes; wait so the first sample is real.
    tokio::time::sleep(MINIMUM_CPU_UPDATE_INTERVAL).await;

    while !cancelled.load(Ordering::Relaxed) {
        sys.refresh_cpu_specifics(refresh);

        let snapshot = CpuSnapshot {
            global_usage: sys.global_cpu_usage(),
            cores: sys
                .cpus()
                .iter()
                .map(|cpu| CoreSnapshot {
                    name: cpu.name().to_string(),
                    usage: cpu.cpu_usage(),
                    frequency: cpu.frequency(),
                })
                .collect(),
        };

        if on_event.send(snapshot).is_err() {
            break; // Webview is gone; nobody is listening anymore.
        }
        tokio::time::sleep(SAMPLE_INTERVAL).await;
    }
    Ok(())
}
