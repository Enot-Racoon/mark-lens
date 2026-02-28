import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { listen } from "@tauri-apps/api/event";

// Global listener for file-open events (catches events before React renders)
console.log("[main] Setting up global file-open listener");
listen<string>("file-open-requested", (event) => {
  console.log("[main] Global file-open-requested received:", event.payload);
  // Store in sessionStorage for App to pick up
  if (event.payload) {
    const pendingFiles = sessionStorage.getItem("pending-files");
    const files = pendingFiles ? JSON.parse(pendingFiles) : [];
    files.push(event.payload);
    sessionStorage.setItem("pending-files", JSON.stringify(files));
    console.log("[main] Stored pending file:", event.payload);
  }
}).catch(console.error);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
