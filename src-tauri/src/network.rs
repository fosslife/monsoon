use std::sync::atomic::Ordering;

use serde::Serialize;
use sysinfo::Networks;
use tauri::{ipc::Channel, State};

use crate::streams::{StreamName, StreamRegistry, SAMPLE_INTERVAL};

#[derive(Debug, Serialize, Clone)]
pub struct NetworkInfo {
    name: String,
    /// Bytes received since the previous 1-second refresh, i.e. ~bytes/sec.
    received_rate: u64,
    transmitted_rate: u64,
    total_received: u64,
    total_transmitted: u64,
}

#[tauri::command]
pub async fn get_network_info(
    registry: State<'_, StreamRegistry>,
    on_event: Channel<Vec<NetworkInfo>>,
) -> Result<(), String> {
    let cancelled = registry.begin(StreamName::Networks);
    let mut networks = Networks::new_with_refreshed_list();

    while !cancelled.load(Ordering::Relaxed) {
        networks.refresh(true);

        let mut snapshot: Vec<NetworkInfo> = networks
            .iter()
            .map(|(name, data)| NetworkInfo {
                name: name.clone(),
                received_rate: data.received(),
                transmitted_rate: data.transmitted(),
                total_received: data.total_received(),
                total_transmitted: data.total_transmitted(),
            })
            .collect();
        snapshot.sort_by(|a, b| a.name.cmp(&b.name));

        if on_event.send(snapshot).is_err() {
            break; // Webview is gone; nobody is listening anymore.
        }
        tokio::time::sleep(SAMPLE_INTERVAL).await;
    }
    Ok(())
}
