use std::{
    env,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    time::Duration,
};

use serde::Serialize;
use sysinfo::{CpuRefreshKind, RefreshKind, System};
use tauri::{
    ipc::Channel, App, AppHandle, Listener, Manager, State, WebviewUrl, WebviewWindowBuilder,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![get_system_info, get_cpu_info])
        .setup(|app| {
            WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                .title("Monsoon")
                .inner_size(1000.0, 800.0)
                .resizable(true)
                .fullscreen(false)
                .build()?;

            let process_arg: Vec<String> = env::args().collect();
            if process_arg.contains(&"--debug".to_string()) {
                // in prod build, if --debug is passed, open devtools
                app.get_webview_window("main").unwrap().open_devtools();
            }
            #[cfg(debug_assertions)]
            app.get_webview_window("main").unwrap().open_devtools();

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(Debug, Serialize)]
struct SystemInfo {
    os_name: String,
    os_version: String,
    os_kernel_version: String,
    hostname: String,
    boot_time: u64,
    distribution_id: String,
    cpu_arch: String,
}

#[tauri::command]
fn get_system_info() -> SystemInfo {
    println!("Getting system info");
    let os_name = System::name().unwrap_or_else(|| "Unknown".to_string());
    let os_version = System::os_version().unwrap_or_else(|| "Unknown".to_string());
    let os_kernel_version = System::kernel_version().unwrap_or_else(|| "Unknown".to_string());
    let hostname = System::host_name().unwrap_or_else(|| "Unknown".to_string());
    let boot_time = System::boot_time();
    let distribution_id = System::distribution_id();
    let cpu_arch = System::cpu_arch().unwrap_or_else(|| "Unknown".to_string());

    SystemInfo {
        os_name,
        os_version,
        os_kernel_version,
        hostname,
        boot_time,
        distribution_id,
        cpu_arch,
    }
}

#[derive(Debug, Serialize, Default)]
struct CPUInfo {
    cpu_name: String,
    cpu_brand: String,
    physical_cores: usize,
    logical_cores: usize,
}

#[derive(Debug, Serialize, Clone)]
struct CoreInfo {
    core_id: String,
    core_name: String,
    core_usage: f32,
    frequency: u64,
}

#[tauri::command]
async fn get_cpu_info(app: AppHandle, on_event: Channel<Vec<CoreInfo>>) -> Result<(), String> {
    let stop_cpu_flag = Arc::new(AtomicBool::new(false));
    let stop_cpu_flag_clone = stop_cpu_flag.clone();

    let mut sys =
        System::new_with_specifics(RefreshKind::new().with_cpu(CpuRefreshKind::everything()));

    app.listen("stop_cpu_info", move |_event| {
        stop_cpu_flag_clone.store(true, Ordering::SeqCst);
    });

    loop {
        if stop_cpu_flag.load(Ordering::SeqCst) {
            break Ok(());
        }
        sys.refresh_cpu_usage();

        let mut cores = vec![];

        for cpu in sys.cpus() {
            let core_id = cpu.vendor_id().to_string();
            let core_name = cpu.name().to_string();
            let core_usage = cpu.cpu_usage();
            let frequency = cpu.frequency();

            let core_info = CoreInfo {
                core_id,
                core_name,
                core_usage,
                frequency,
            };

            cores.push(core_info);
        }

        on_event.send(cores).unwrap();

        std::thread::sleep(Duration::from_secs(1))
    }
}
