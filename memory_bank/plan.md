# Project Plan: Web-Based Drum Machine

This document outlines the development plan for our project.

## Core Concept

A web-based drum machine with a dynamic grid interface. Users can create drum loops by clicking on the grid, control playback, tempo, and the number of steps in the loop.

## Core Features

1.  **Dynamic Grid Interface:**
    *   **Rows for Sounds:** Kick, Snare, Hi-Hat, Crash, Toms, Clap.
    *   **Dynamic Columns:** The number of columns (steps) will be controlled by a slider (e.g., from 4 to 32).
    *   The grid will be visually updated when the number of steps changes.

2.  **Interactive Controls:**
    *   **Grid Cells:** Click to activate/deactivate a sound.
    *   **Playback:** A "Play/Stop" button.
    *   **Tempo:** A slider to control the speed (BPM).
    *   **Steps:** A slider to set the number of steps in the loop.
    *   **Master Volume:** A slider to control the overall output volume.
    *   **Clear Button:** A button to reset the entire grid.
    *   **Visual Feedback:** Display the current numerical value for Tempo and Steps sliders.

3.  **Audio Playback:**
    *   A visual indicator (playhead) will sweep across the grid columns.
    *   Plays all active sounds in the current column using the Web Audio API for precise timing.

## Visual Style

*   **Theme:** Clean, modern, dark-mode theme.
*   **Grid:**
    *   Inactive Cells: Muted, dark gray squares.
    *   Active Cells: Bright, glowing color (e.g., electric blue or pink).
    *   Playhead: A sweeping highlight bar.
*   **Controls:** Modern, sleek sliders and buttons with clear hover/active states.
*   **Layout:** Centered, organized layout using CSS Grid/Flexbox.
*   **Typography:** Simple, readable sans-serif font.

## Technology Stack

*   **HTML:** For the page structure.
*   **CSS:** For the dark-mode styling and layout.
*   **JavaScript:** For all logic, using the **Web Audio API**.

## Assets

*   Audio files (.wav or .mp3) for the 6 drum sounds: Kick, Snare, Hi-Hat, Crash, Toms, Clap. We will need to source these.

## Development Tasks

-   [x] **Phase 1: HTML Structure**
    -   [x] Create the main `index.html` file.
    -   [x] Add container elements for the grid, controls, and title.
    -   [x] Add the buttons (Play/Stop, Clear).
    -   [x] Add the sliders (Tempo, Steps, Volume).
    -   [x] Add labels for each drum sound row.

-   [x] **Phase 2: CSS Styling**
    -   [x] Create a `style.css` file.
    -   [x] Implement the dark-mode theme.
    -   [x] Style the grid container and cells (inactive, active, playhead highlight).
    -   [x] Style the buttons and sliders to be sleek and modern.
    -   [x] Set up the main layout using Flexbox or CSS Grid.

-   [x] **Phase 3: JavaScript Logic (Core Functionality)**
    -   [x] Create a `script.js` file.
    -   [x] Implement grid generation based on the "Steps" slider.
    -   [x] Add event listeners for clicking on grid cells to toggle their state.
    -   [x] Implement the "Clear" button functionality.
    -   [x] Set up the Web Audio API context.
    -   [x] Load the 6 drum sound audio files.

-   [x] **Phase 4: JavaScript Logic (Playback)**
    -   [x] Implement the main playback loop (sequencer).
    -   [x] Tie the loop timing to the "Tempo" slider.
    -   [x] Implement the playhead's visual movement across the grid.
    -   [x] Trigger the correct sounds based on the active cells in the current step.
    -   [x] Hook up the "Play/Stop" button.
    -   [x] Connect the "Master Volume" slider to the main output.

-   [x] **Phase 5: Final Polish**
    -   [x] Add the numerical value displays for the sliders.
    -   [x] Test thoroughly for bugs.
    -   [x] Final review of the UI/UX.

-   [x] **Phase 6: Migration to React**
    -   [x] Refactor the entire application from vanilla JavaScript to React.
    -   [x] Implement a component-based architecture.
    -   [x] Use Vite for the build process.

-   [x] **Phase 7: Responsive Grid Implementation**
    -   [x] Implement a responsive grid that adjusts to different viewport sizes.
    -   [x] Use a `ResizeObserver` to dynamically calculate the maximum number of steps.
    -   [x] Ensure the grid is always contained within the viewport.

## Deployment and Delivery Plan

-   [x] **Phase 8: Version Control & Hosting**
    -   [x] Initialize a Git repository.
    -   [x] Create a `.gitignore` file to exclude unnecessary files (like `.DS_Store`).
    -   [ ] Create a new public repository on GitHub.
    -   [ ] Push the initial project files to the GitHub repository.
    -   [ ] Enable GitHub Pages in the repository settings to deploy the `main` branch.
    -   [ ] Provide the public URL for testing and verification.