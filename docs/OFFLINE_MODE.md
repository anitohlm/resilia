# Resilia — Local Caching Architecture & Testing Guide

**Core Message:** *Maintaining vital lifelines when networks fail.*

---

## 1. Local Caching Architectural Principles

Resilia treats offline capability as a fundamental system architecture, not a visual badge:

1. **Application Shell Precaching**:
   - `vite-plugin-pwa` service worker caches all compiled JavaScript, CSS, HTML, SVG brand assets, and Leaflet styles.
   - The application opens and renders when the device has zero internet connectivity.

2. **Durable Local-First IndexedDB Storage**:
   - Every write operation (creating an incident, submitting an assistance request, updating shelter capacity, recording inventory movements) commits to IndexedDB first.
   - A corresponding `SyncEvent` record with a unique UUID (`evt_...`) is placed in the `pendingSyncEvents` store with status `PENDING`.
   - Data persists across browser tab closure and device reboots.

3. **Grounded Offline Information Honesty (Principle 4)**:
   - When offline, Resilia **never** fabricates AI responses or pretends that Gemini cloud inference is running.
   - It runs deterministic local search and extraction over cached IndexedDB records and NDRRMC emergency knowledge.
   - Answers explicitly state: *"Generated using local offline retrieval over cached community records. Cloud Gemini API is unavailable (Offline Mode)."*

4. **Zero-Network Interactive Map**:
   - Bundles embedded vector coordinates and cartographic paths for Marikina City, Marikina River, and Barangay Tumana & Malanday.
   - Renders roads, bridges, evacuation centers, and hazard markers without making live HTTP tile requests.

---

## 2. Step-by-Step Offline Disconnection Test Procedure

You can test Resilia's offline behavior in two ways:

### Method A: Built-in In-App Offline Toggle (Instant Test)
1. Open the application.
2. In the top header bar next to the status chip, click **"Test Offline"**.
3. Notice:
   - Status switches immediately to **OFFLINE (Local Database Active)**.
   - An amber notification banner appears: *"Offline Mode Active — Local IndexedDB operational."*
4. Go to **"Report Incident"**:
   - Submit a new flood report (e.g. "Water rising in Alley 4").
   - Click **Submit Incident Report**.
   - Notice the save status displays: `⏳ Saved Locally (Pending Sync)` with record ID.
5. Go to **"Get Help"**:
   - Submit an emergency evacuation request for 4 people with an infant.
   - Request is prioritized using deterministic rules and queued in IndexedDB.
6. Go to **"Ask Resilia"**:
   - Ask: *"Which evacuation center is accessible to wheelchair users?"*
   - Notice the answer is generated instantly by the local offline retrieval engine, citing shelter IDs.
7. Click **"Simulating Offline"** again to restore connectivity.
8. Click **"Sync Center"** or observe the queue automatically upload and receive server acknowledgements!

### Method B: Real Hardware Network Disconnection (Full PWA Test)
1. Open the application in Google Chrome or Edge.
2. Open Developer Tools (F12) → **Application** tab → **Service Workers**.
3. Confirm the service worker is active and running.
4. Turn off your computer's Wi-Fi or set Network to **Offline** in DevTools.
5. Hard reload the page (Ctrl + Shift + R or Cmd + Shift + R).
6. Verify the application reloads completely and all cached data, map layers, and forms are fully functional!
