//! CPU cache/feature detection via `cpuid`.
//!
//! Only meaningful on x86_64; other architectures get empty results and the
//! frontend hides the corresponding sections.

use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct CacheInfo {
    pub label: String,
    pub bytes: usize,
}

#[cfg(target_arch = "x86_64")]
mod x86 {
    use raw_cpuid::{CacheType, CpuId};

    use super::CacheInfo;

    pub fn cache_sizes() -> Vec<CacheInfo> {
        let Some(cparams) = CpuId::new().get_cache_parameters() else {
            return Vec::new();
        };
        cparams
            .map(|cache| {
                let bytes = cache.associativity()
                    * cache.physical_line_partitions()
                    * cache.coherency_line_size()
                    * cache.sets();
                let kind = match cache.cache_type() {
                    CacheType::Data => "Data",
                    CacheType::Instruction => "Instruction",
                    CacheType::Unified => "Unified",
                    _ => "Unknown",
                };
                CacheInfo {
                    label: format!("L{} {kind} Cache", cache.level()),
                    bytes,
                }
            })
            .collect()
    }

    macro_rules! collect_features {
        ($info:expr, $features:ident, [$(($has:ident, $name:literal)),* $(,)?]) => {
            $( if $info.$has() { $features.push($name); } )*
        };
    }

    pub fn features() -> Vec<&'static str> {
        let cpuid = CpuId::new();
        let mut features = Vec::with_capacity(96);

        if let Some(info) = cpuid.get_feature_info() {
            collect_features!(
                info,
                features,
                [
                    (has_sse3, "sse3"),
                    (has_pclmulqdq, "pclmulqdq"),
                    (has_ds_area, "ds_area"),
                    (has_monitor_mwait, "monitor_mwait"),
                    (has_cpl, "cpl"),
                    (has_vmx, "vmx"),
                    (has_smx, "smx"),
                    (has_eist, "eist"),
                    (has_tm2, "tm2"),
                    (has_ssse3, "ssse3"),
                    (has_cnxtid, "cnxtid"),
                    (has_fma, "fma"),
                    (has_cmpxchg16b, "cmpxchg16b"),
                    (has_pdcm, "pdcm"),
                    (has_pcid, "pcid"),
                    (has_dca, "dca"),
                    (has_sse41, "sse41"),
                    (has_sse42, "sse42"),
                    (has_x2apic, "x2apic"),
                    (has_movbe, "movbe"),
                    (has_popcnt, "popcnt"),
                    (has_tsc_deadline, "tsc_deadline"),
                    (has_aesni, "aesni"),
                    (has_xsave, "xsave"),
                    (has_oxsave, "oxsave"),
                    (has_avx, "avx"),
                    (has_f16c, "f16c"),
                    (has_rdrand, "rdrand"),
                    (has_fpu, "fpu"),
                    (has_vme, "vme"),
                    (has_de, "de"),
                    (has_pse, "pse"),
                    (has_tsc, "tsc"),
                    (has_msr, "msr"),
                    (has_pae, "pae"),
                    (has_mce, "mce"),
                    (has_cmpxchg8b, "cmpxchg8b"),
                    (has_apic, "apic"),
                    (has_sysenter_sysexit, "sysenter_sysexit"),
                    (has_mtrr, "mtrr"),
                    (has_pge, "pge"),
                    (has_mca, "mca"),
                    (has_cmov, "cmov"),
                    (has_pat, "pat"),
                    (has_pse36, "pse36"),
                    (has_psn, "psn"),
                    (has_clflush, "clflush"),
                    (has_ds, "ds"),
                    (has_acpi, "acpi"),
                    (has_mmx, "mmx"),
                    (has_fxsave_fxstor, "fxsave_fxstor"),
                    (has_sse, "sse"),
                    (has_sse2, "sse2"),
                    (has_ss, "ss"),
                    (has_htt, "htt"),
                    (has_tm, "tm"),
                    (has_pbe, "pbe"),
                ]
            );
        }

        if let Some(info) = cpuid.get_extended_feature_info() {
            collect_features!(
                info,
                features,
                [
                    (has_bmi1, "bmi1"),
                    (has_hle, "hle"),
                    (has_avx2, "avx2"),
                    (has_fdp, "fdp"),
                    (has_smep, "smep"),
                    (has_bmi2, "bmi2"),
                    (has_rep_movsb_stosb, "rep_movsb_stosb"),
                    (has_invpcid, "invpcid"),
                    (has_rtm, "rtm"),
                    (has_rdtm, "rdtm"),
                    (has_fpu_cs_ds_deprecated, "fpu_cs_ds_deprecated"),
                    (has_mpx, "mpx"),
                    (has_rdta, "rdta"),
                    (has_rdseed, "rdseed"),
                    (has_adx, "adx"),
                    (has_smap, "smap"),
                    (has_clflushopt, "clflushopt"),
                    (has_processor_trace, "processor_trace"),
                    (has_sha, "sha"),
                    (has_sgx, "sgx"),
                    (has_avx512f, "avx512f"),
                    (has_avx512dq, "avx512dq"),
                    (has_avx512_ifma, "avx512_ifma"),
                    (has_avx512pf, "avx512pf"),
                    (has_avx512er, "avx512er"),
                    (has_avx512cd, "avx512cd"),
                    (has_avx512bw, "avx512bw"),
                    (has_avx512vl, "avx512vl"),
                    (has_clwb, "clwb"),
                    (has_prefetchwt1, "prefetchwt1"),
                    (has_umip, "umip"),
                    (has_pku, "pku"),
                    (has_ospke, "ospke"),
                    (has_rdpid, "rdpid"),
                    (has_sgx_lc, "sgx_lc"),
                ]
            );
        }

        features
    }
}

#[cfg(target_arch = "x86_64")]
pub use x86::{cache_sizes, features};

#[cfg(not(target_arch = "x86_64"))]
pub fn cache_sizes() -> Vec<CacheInfo> {
    Vec::new()
}

#[cfg(not(target_arch = "x86_64"))]
pub fn features() -> Vec<&'static str> {
    Vec::new()
}
