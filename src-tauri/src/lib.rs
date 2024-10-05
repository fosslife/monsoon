use std::{
    env,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    time::Duration,
};

use raw_cpuid::{CacheType, CpuId, CpuIdReaderNative};
use serde::Serialize;
use sysinfo::{Component, Components, CpuRefreshKind, MemoryRefreshKind, RefreshKind, System};
use tauri::{
    ipc::Channel, AppHandle, Emitter, Listener, Manager, WebviewUrl, WebviewWindowBuilder,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            get_cpu_info,
            get_memory_info
        ])
        .setup(|app| {
            WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                .title("Monsoon")
                .inner_size(800.0, 600.0)
                .resizable(true)
                .fullscreen(false)
                .build()?;

            // let process_arg: Vec<String> = env::args().collect();
            // if process_arg.contains(&"--debug".to_string()) {
            //     // in prod build, if --debug is passed, open devtools
            //     app.get_webview_window("main").unwrap().open_devtools();
            // }
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
    uptime: u64,
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
    let uptime: u64 = System::uptime();

    SystemInfo {
        os_name,
        os_version,
        os_kernel_version,
        hostname,
        boot_time,
        distribution_id,
        cpu_arch,
        uptime,
    }
}

#[derive(Debug, Serialize, Default, Clone)]
struct CPUInfo {
    cpu_brand: String,
    physical_cores: usize,
    logical_cores: usize,
    cache_sizes: Vec<(String, usize)>,
    features: Vec<&'static str>,
}

#[derive(Debug, Serialize, Clone)]
struct CoreInfo {
    core_id: String,
    core_name: String,
    core_usage: f32,
    frequency: u64,
    global_usage: f32,
}

#[tauri::command]
async fn get_cpu_info(app: AppHandle, on_event: Channel<Vec<CoreInfo>>) -> Result<(), String> {
    let stop_cpu_flag = Arc::new(AtomicBool::new(false));
    let stop_cpu_flag_clone = stop_cpu_flag.clone();
    let cpuid = CpuId::new();

    let mut sys =
        System::new_with_specifics(RefreshKind::new().with_cpu(CpuRefreshKind::everything()));

    app.listen("stop_cpu_info", move |_event| {
        stop_cpu_flag_clone.store(true, Ordering::SeqCst);
    });

    // let cpu_name =System::cp;
    let cpu_brand = sys.cpus()[0].brand().to_string();
    let physical_cores = sys.physical_core_count().unwrap_or_else(|| 0);
    let logical_cores = sys.cpus().len();

    let cache_sizes = get_cache_sizes(&cpuid);
    let features = get_cpu_features(&cpuid);

    app.emit(
        "cpu_info",
        CPUInfo {
            cpu_brand,
            physical_cores,
            logical_cores,
            cache_sizes,
            features,
        },
    )
    .unwrap();

    loop {
        if stop_cpu_flag.load(Ordering::SeqCst) {
            break Ok(());
        }
        sys.refresh_cpu_usage();

        let mut cores: Vec<CoreInfo> = vec![];
        let global_usage = sys.global_cpu_usage();

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
                global_usage,
            };

            cores.push(core_info);
        }

        on_event.send(cores).unwrap();

        std::thread::sleep(Duration::from_secs(1))
    }
}

fn get_cache_sizes(cpuid: &CpuId<CpuIdReaderNative>) -> Vec<(String, usize)> {
    //
    let mut cache_sizes = Vec::new();

    //

    if let Some(cparams) = cpuid.get_cache_parameters() {
        for cache in cparams {
            let size = cache.associativity()
                * cache.physical_line_partitions()
                * cache.coherency_line_size()
                * cache.sets();
            let level = cache.level();
            let cache_type = match cache.cache_type() {
                CacheType::Data => "Data",
                CacheType::Instruction => "Instruction",
                CacheType::Unified => "Unified",
                _ => "Unknown",
            };
            cache_sizes.push((format!("L{} {} Cache", level, cache_type), size));
        }
    }

    cache_sizes
}

fn get_cpu_features(cpuid: &CpuId<CpuIdReaderNative>) -> Vec<&'static str> {
    let mut features = Vec::with_capacity(80);
    cpuid.get_feature_info().map(|finfo| {
        if finfo.has_sse3() {
            features.push("sse3")
        }
        if finfo.has_pclmulqdq() {
            features.push("pclmulqdq")
        }
        if finfo.has_ds_area() {
            features.push("ds_area")
        }
        if finfo.has_monitor_mwait() {
            features.push("monitor_mwait")
        }
        if finfo.has_cpl() {
            features.push("cpl")
        }
        if finfo.has_vmx() {
            features.push("vmx")
        }
        if finfo.has_smx() {
            features.push("smx")
        }
        if finfo.has_eist() {
            features.push("eist")
        }
        if finfo.has_tm2() {
            features.push("tm2")
        }
        if finfo.has_ssse3() {
            features.push("ssse3")
        }
        if finfo.has_cnxtid() {
            features.push("cnxtid")
        }
        if finfo.has_fma() {
            features.push("fma")
        }
        if finfo.has_cmpxchg16b() {
            features.push("cmpxchg16b")
        }
        if finfo.has_pdcm() {
            features.push("pdcm")
        }
        if finfo.has_pcid() {
            features.push("pcid")
        }
        if finfo.has_dca() {
            features.push("dca")
        }
        if finfo.has_sse41() {
            features.push("sse41")
        }
        if finfo.has_sse42() {
            features.push("sse42")
        }
        if finfo.has_x2apic() {
            features.push("x2apic")
        }
        if finfo.has_movbe() {
            features.push("movbe")
        }
        if finfo.has_popcnt() {
            features.push("popcnt")
        }
        if finfo.has_tsc_deadline() {
            features.push("tsc_deadline")
        }
        if finfo.has_aesni() {
            features.push("aesni")
        }
        if finfo.has_xsave() {
            features.push("xsave")
        }
        if finfo.has_oxsave() {
            features.push("oxsave")
        }
        if finfo.has_avx() {
            features.push("avx")
        }
        if finfo.has_f16c() {
            features.push("f16c")
        }
        if finfo.has_rdrand() {
            features.push("rdrand")
        }
        if finfo.has_fpu() {
            features.push("fpu")
        }
        if finfo.has_vme() {
            features.push("vme")
        }
        if finfo.has_de() {
            features.push("de")
        }
        if finfo.has_pse() {
            features.push("pse")
        }
        if finfo.has_tsc() {
            features.push("tsc")
        }
        if finfo.has_msr() {
            features.push("msr")
        }
        if finfo.has_pae() {
            features.push("pae")
        }
        if finfo.has_mce() {
            features.push("mce")
        }
        if finfo.has_cmpxchg8b() {
            features.push("cmpxchg8b")
        }
        if finfo.has_apic() {
            features.push("apic")
        }
        if finfo.has_sysenter_sysexit() {
            features.push("sysenter_sysexit")
        }
        if finfo.has_mtrr() {
            features.push("mtrr")
        }
        if finfo.has_pge() {
            features.push("pge")
        }
        if finfo.has_mca() {
            features.push("mca")
        }
        if finfo.has_cmov() {
            features.push("cmov")
        }
        if finfo.has_pat() {
            features.push("pat")
        }
        if finfo.has_pse36() {
            features.push("pse36")
        }
        if finfo.has_psn() {
            features.push("psn")
        }
        if finfo.has_clflush() {
            features.push("clflush")
        }
        if finfo.has_ds() {
            features.push("ds")
        }
        if finfo.has_acpi() {
            features.push("acpi")
        }
        if finfo.has_mmx() {
            features.push("mmx")
        }
        if finfo.has_fxsave_fxstor() {
            features.push("fxsave_fxstor")
        }
        if finfo.has_sse() {
            features.push("sse")
        }
        if finfo.has_sse2() {
            features.push("sse2")
        }
        if finfo.has_ss() {
            features.push("ss")
        }
        if finfo.has_htt() {
            features.push("htt")
        }
        if finfo.has_tm() {
            features.push("tm")
        }
        if finfo.has_pbe() {
            features.push("pbe")
        }
    });

    cpuid.get_extended_feature_info().map(|finfo| {
        if finfo.has_bmi1() {
            features.push("bmi1")
        }
        if finfo.has_hle() {
            features.push("hle")
        }
        if finfo.has_avx2() {
            features.push("avx2")
        }
        if finfo.has_fdp() {
            features.push("fdp")
        }
        if finfo.has_smep() {
            features.push("smep")
        }
        if finfo.has_bmi2() {
            features.push("bmi2")
        }
        if finfo.has_rep_movsb_stosb() {
            features.push("rep_movsb_stosb")
        }
        if finfo.has_invpcid() {
            features.push("invpcid")
        }
        if finfo.has_rtm() {
            features.push("rtm")
        }
        if finfo.has_rdtm() {
            features.push("rdtm")
        }
        if finfo.has_fpu_cs_ds_deprecated() {
            features.push("fpu_cs_ds_deprecated")
        }
        if finfo.has_mpx() {
            features.push("mpx")
        }
        if finfo.has_rdta() {
            features.push("rdta")
        }
        if finfo.has_rdseed() {
            features.push("rdseed")
        }
        if finfo.has_adx() {
            features.push("adx")
        }
        if finfo.has_smap() {
            features.push("smap")
        }
        if finfo.has_clflushopt() {
            features.push("clflushopt")
        }
        if finfo.has_processor_trace() {
            features.push("processor_trace")
        }
        if finfo.has_sha() {
            features.push("sha")
        }
        if finfo.has_sgx() {
            features.push("sgx")
        }
        if finfo.has_avx512f() {
            features.push("avx512f")
        }
        if finfo.has_avx512dq() {
            features.push("avx512dq")
        }
        if finfo.has_avx512_ifma() {
            features.push("avx512_ifma")
        }
        if finfo.has_avx512pf() {
            features.push("avx512pf")
        }
        if finfo.has_avx512er() {
            features.push("avx512er")
        }
        if finfo.has_avx512cd() {
            features.push("avx512cd")
        }
        if finfo.has_avx512bw() {
            features.push("avx512bw")
        }
        if finfo.has_avx512vl() {
            features.push("avx512vl")
        }
        if finfo.has_clwb() {
            features.push("clwb")
        }
        if finfo.has_prefetchwt1() {
            features.push("prefetchwt1")
        }
        if finfo.has_umip() {
            features.push("umip")
        }
        if finfo.has_pku() {
            features.push("pku")
        }
        if finfo.has_ospke() {
            features.push("ospke")
        }
        if finfo.has_rdpid() {
            features.push("rdpid")
        }
        if finfo.has_sgx_lc() {
            features.push("sgx_lc")
        }
    });

    features
}

#[derive(Debug, Serialize, Clone)]
struct MemInfo {
    total: u64,
    free: u64,
    available: u64,
    buffers: u64,
    cached: u64,
    swap_total: u64,
    swap_free: u64,
}

#[tauri::command]
async fn get_memory_info(app: AppHandle, on_event: Channel<Vec<CoreInfo>>) -> Result<(), String> {
    let mut sys =
        System::new_with_specifics(RefreshKind::new().with_memory(MemoryRefreshKind::everything()));

    // test
    let components = Components::new_with_refreshed_list();
    println!("Components:");
    for component in &components {
        println!("{component:?}");
    }

    Ok(())

    // loop {
    //     let total_memory = sys.total_memory();
    //     let available_memory = sys.available_memory();
    //     let free_swap = sys.free_swap();
    //     let total_swap = sys.total_swap();
    //     let used_memory = sys.used_memory();
    //     let used_swap = sys.used_swap();
    // }
}
