//! Lifecycle management for streaming commands.
//!
//! Every streaming command registers itself here under a [`StreamName`].
//! Starting a stream cancels any previous stream with the same name, so a
//! remount (or React StrictMode double-mount) can never leave two sampling
//! loops running. The frontend stops a stream explicitly via [`stop_stream`].

use std::{
    collections::HashMap,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    time::Duration,
};

use serde::Deserialize;
use tauri::State;

/// How often streaming commands sample the system.
pub const SAMPLE_INTERVAL: Duration = Duration::from_secs(1);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StreamName {
    Cpu,
    Memory,
    Processes,
}

#[derive(Default)]
pub struct StreamRegistry(Mutex<HashMap<StreamName, Arc<AtomicBool>>>);

impl StreamRegistry {
    /// Cancels any live stream with the same name and returns a fresh
    /// cancellation flag for the new one.
    pub fn begin(&self, name: StreamName) -> Arc<AtomicBool> {
        let flag = Arc::new(AtomicBool::new(false));
        if let Some(previous) = self.lock().insert(name, flag.clone()) {
            previous.store(true, Ordering::Relaxed);
        }
        flag
    }

    pub fn stop(&self, name: StreamName) {
        if let Some(flag) = self.lock().get(&name) {
            flag.store(true, Ordering::Relaxed);
        }
    }

    fn lock(&self) -> std::sync::MutexGuard<'_, HashMap<StreamName, Arc<AtomicBool>>> {
        // A poisoned lock only means another sampler panicked; the map of
        // flags is still valid, so keep going instead of propagating.
        self.0
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
    }
}

#[tauri::command]
pub fn stop_stream(registry: State<'_, StreamRegistry>, stream: StreamName) {
    registry.stop(stream);
}
