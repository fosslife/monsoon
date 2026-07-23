mod cpu;
mod cpuid;
mod disks;
mod memory;
mod network;
mod overview;
mod processes;
mod streams;
mod system;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(streams::StreamRegistry::default())
        .invoke_handler(tauri::generate_handler![
            system::get_system_info,
            cpu::get_cpu_static,
            cpu::get_cpu_info,
            memory::get_memory_info,
            processes::get_processes_info,
            processes::kill_process,
            overview::get_overview_info,
            disks::get_disks_info,
            network::get_network_info,
            streams::stop_stream,
        ])
        .setup(|_app| {
            #[cfg(debug_assertions)]
            {
                use tauri::Manager;
                if let Some(window) = _app.get_webview_window("main") {
                    window.open_devtools();
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
