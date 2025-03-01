#[cfg_attr(mobile, tauri::mobile_entry_point)]
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Define menu items
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let toggle_i = MenuItem::with_id(app, "toggle", "Toggle Window", true, Some("Ctrl+`"))?; // Renamed to "Toggle Window"

            // Create the menu with both items
            let menu = Menu::with_items(app, &[&quit_i, &toggle_i])?;
            println!("Menu items created"); // Debug menu creation

            // Build the tray icon
            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(false) // Right-click to show menu
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { button, button_state, .. } = event {
                        if button == tauri::tray::MouseButton::Right && button_state == tauri::tray::MouseButtonState::Down {
                            if let Ok(()) = tray.set_visible(true) {
                                println!("Manually showed menu on right-click");
                            }
                        }
                    }
                })
                .build(app)?;

            println!("Tray icon built successfully");
            println!("Available window labels:");
            for window in app.webview_windows() {
                println!("- {}", window.0);
            }

            Ok(())
        })
        // Handle menu events globally
        .on_menu_event(|app, event| {
            println!("Menu event triggered: {:?}", event); // Log all menu events
            match event.id().as_ref() {
                "quit" => {
                    println!("Quit clicked - exiting app");
                    app.exit(0);
                }
                "toggle" => { // Changed from "minimize" to "toggle"
                    println!("Toggle Window clicked");
                    if let Some(window) = app.get_webview_window("main") {
                        if window.is_visible().unwrap_or(false) {
                            println!("Window 'main' is visible, attempting to hide");
                            if let Ok(()) = window.hide() {
                                println!("Window hidden successfully");
                            } else {
                                println!("Failed to hide window");
                            }
                        } else {
                            println!("Window 'main' is hidden, attempting to show");
                            if let Ok(()) = window.show() {
                                println!("Window shown successfully");
                                // Bring window to front
                                if let Ok(()) = window.set_focus() {
                                    println!("Window focused");
                                }
                            } else {
                                println!("Failed to show window");
                            }
                        }
                    } else {
                        println!("No window with label 'main' found");
                    }
                }
                other => {
                    println!("Unknown menu item clicked: {}", other);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}