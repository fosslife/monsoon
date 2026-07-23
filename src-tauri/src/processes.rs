use std::sync::atomic::Ordering;

use serde::Serialize;
use sysinfo::{
    Pid, ProcessRefreshKind, ProcessesToUpdate, RefreshKind, Signal, System, UpdateKind,
    MINIMUM_CPU_UPDATE_INTERVAL,
};
use tauri::{ipc::Channel, State};

use crate::streams::{StreamName, StreamRegistry, SAMPLE_INTERVAL};

#[derive(Debug, Serialize, Clone)]
pub struct ProcessInfo {
    pid: u32,
    name: String,
    cmd: Vec<String>,
    exe: Option<String>,
    cpu_usage: f32,
    memory: u64,
    virtual_memory: u64,
    run_time: u64,
    parent: Option<u32>,
    status: String,
}

fn process_refresh_kind() -> ProcessRefreshKind {
    // Only what the UI shows — everything() would also collect environ,
    // cwd, disk usage, etc. for every process on every tick.
    ProcessRefreshKind::nothing()
        .with_cpu()
        .with_memory()
        .with_cmd(UpdateKind::OnlyIfNotSet)
        .with_exe(UpdateKind::OnlyIfNotSet)
}

#[tauri::command]
pub async fn get_processes_info(
    registry: State<'_, StreamRegistry>,
    on_event: Channel<Vec<ProcessInfo>>,
) -> Result<(), String> {
    let cancelled = registry.begin(StreamName::Processes);
    let refresh = process_refresh_kind();
    let mut sys = System::new_with_specifics(RefreshKind::nothing().with_processes(refresh));

    // Per-process CPU usage is a delta between two refreshes.
    tokio::time::sleep(MINIMUM_CPU_UPDATE_INTERVAL).await;

    while !cancelled.load(Ordering::Relaxed) {
        sys.refresh_processes_specifics(ProcessesToUpdate::All, true, refresh);

        let processes: Vec<ProcessInfo> = sys
            .processes()
            .iter()
            .map(|(pid, process)| ProcessInfo {
                pid: pid.as_u32(),
                name: process.name().to_string_lossy().into_owned(),
                cmd: process
                    .cmd()
                    .iter()
                    .map(|arg| arg.to_string_lossy().into_owned())
                    .collect(),
                exe: process
                    .exe()
                    .map(|path| path.to_string_lossy().into_owned()),
                cpu_usage: process.cpu_usage(),
                memory: process.memory(),
                virtual_memory: process.virtual_memory(),
                run_time: process.run_time(),
                parent: process.parent().map(|parent| parent.as_u32()),
                status: process.status().to_string(),
            })
            .collect();

        if on_event.send(processes).is_err() {
            break; // Webview is gone; nobody is listening anymore.
        }
        tokio::time::sleep(SAMPLE_INTERVAL).await;
    }
    Ok(())
}

#[tauri::command]
pub async fn kill_process(pid: u32, force: bool) -> Result<(), String> {
    if pid == std::process::id() {
        return Err("Refusing to terminate Monsoon itself".to_string());
    }
    if pid <= 1 {
        return Err("Refusing to terminate a system-critical process".to_string());
    }

    let target = Pid::from_u32(pid);
    let mut sys = System::new();
    sys.refresh_processes(ProcessesToUpdate::Some(&[target]), false);

    let process = sys
        .process(target)
        .ok_or_else(|| format!("Process {pid} not found"))?;

    // Default to a graceful SIGTERM so the target can clean up and flush; the
    // UI offers an explicit "Force kill" escalation for SIGKILL. `kill_with`
    // returns `None` on platforms without the signal (e.g. Windows), where we
    // fall back to the platform default terminate.
    let sent = if force {
        process.kill()
    } else {
        process.kill_with(Signal::Term).unwrap_or_else(|| process.kill())
    };

    if sent {
        Ok(())
    } else {
        Err(format!("Failed to send kill signal to process {pid}"))
    }
}
