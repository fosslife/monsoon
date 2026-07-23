# Monsoon

A cross-platform system monitor desktop app built with Tauri 2 (Rust) and React 19 + TypeScript.

Monsoon shows live CPU, memory, and process statistics sampled once per second, streamed from the Rust backend to the UI over Tauri Channels. It can terminate processes (with confirmation) and supports light, dark, and system themes.

## Features

- **Dashboard** — dense mission-control board: CPU sparkline + per-core heat strip, memory meters, network/disk I/O rates, top processes, system info
- **CPU** — overall usage history (60 s rolling window), per-core heatmap + mini charts, cache sizes and instruction-set features (x86_64)
- **Memory** — RAM usage history plus used/available/free breakdown and swap
- **Processes** — searchable, sortable process table with heat-tinted cells, configurable columns, pause/resume, and confirmed kill
- **Disks** — per-volume capacity, filesystem/kind, and live read/write rates
- **Network** — per-interface throughput charts and totals
- Frameless window with custom titlebar, live status footer, light/dark/system themes

## Development

Prerequisites: [Rust](https://rustup.rs), [pnpm](https://pnpm.io), and the [Tauri system dependencies](https://tauri.app/start/prerequisites/).

```sh
pnpm install
pnpm tauri dev     # run the desktop app
pnpm tauri build   # build a distributable
```

Quality gates:

```sh
pnpm build         # tsc type-check + vite build
pnpm lint          # ESLint
pnpm format:check  # Prettier
cargo clippy       # in src-tauri/
```

## Architecture

- `src-tauri/src/` — Rust backend: one module per metric, a `StreamRegistry` that manages sampling-loop lifecycles, and one-shot commands for static info
- `src/` — React frontend: one page per module, a `useStream` hook owning the channel lifecycle, shared chart/meter components, and a CSS-first Tailwind 4 theme

See `CLAUDE.md` for the full architecture notes and conventions.
