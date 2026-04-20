# Sticky Notes Application

A single-page web application for creating and managing sticky notes with drag-and-drop functionality, built with React and TypeScript.

🔗 **[Live Demo](https://damikhailov80.github.io/sticky-notes)**

## Features Implemented

### Core Features (All 4 Required Features)

- ✅ **Create notes** with specified size and position
- ✅ **Resize notes** by dragging the bottom-right corner handle
- ✅ **Move notes** by dragging the header area
- ✅ **Delete notes** by dragging them to the trash zone (bottom-right corner)

### Bonus Features

- ✅ **Text editing** with auto-expanding textarea
- ✅ **Bring to front** - click any note to bring it to the front (z-index management)
- ✅ **Local storage persistence** - notes are automatically saved and restored on page reload
- ✅ **Multiple colors** - 6 pastel color options for notes

## System Requirements

- **Screen Resolution**: Minimum 1024x768
- **Supported Browsers**:
  - Google Chrome (latest, Windows/Mac)
  - Mozilla Firefox (latest, all platforms)
  - Microsoft Edge (latest)

## Technologies Used

- **Language**: TypeScript (strict mode enabled)
- **Framework**: React 19.2.5 with functional components and hooks
- **State Management**: Redux Toolkit with redux-persist for local storage
- **Build Tool**: Create React App
- **No external UI component libraries** - all components built from scratch

## Installation and Running

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Development Mode

1. Clone the repository and navigate to the project directory

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

4. Open your browser to [http://localhost:3000](http://localhost:3000)

The application will automatically reload when you make changes to the source code.

### Production Build

1. Create an optimized production build:

```bash
npm run build
```

2. The build artifacts will be stored in the `build/` directory

3. Serve the production build with any static file server:

```bash
npx serve -s build
```

## Usage Instructions

1. **Create a Note**: Click any color button in the left toolbar to create a new note with that color
2. **Move a Note**: Click and drag the colored header area to move the note around the canvas
3. **Resize a Note**: Click and drag the bottom-right corner handle to resize the note
4. **Edit Text**: Click inside the note's text area and start typing
5. **Delete a Note**: Drag the note to the trash zone in the bottom-right corner (it will highlight when active)
6. **Bring to Front**: Click anywhere on a note to bring it to the front when notes overlap

## Project Structure

```
src/
├── components/         # React components
│   ├── StickyNote.tsx     # Individual sticky note component
│   ├── StickyNote.css     # Note styling
│   ├── Toolbar.tsx        # Color selection toolbar
│   ├── Toolbar.css        # Toolbar styling
│   ├── TrashZone.tsx      # Deletion zone component
│   └── TrashZone.css      # Trash zone styling
├── hooks/              # Custom React hooks
│   └── useStickyNotesDrag.ts  # Centralized drag-and-drop logic
├── store/              # Redux state management
│   ├── store.ts           # Redux store configuration with persistence
│   ├── notesSlice.ts      # Notes state slice with reducers
│   └── hooks.ts           # Typed Redux hooks
├── types/              # TypeScript type definitions
│   └── index.ts           # Shared interfaces and types
├── utils/              # Utility functions
│   ├── constants.ts       # Application constants
│   ├── notePosition.ts    # Note positioning calculations
│   └── trashZone.ts       # Trash zone collision detection
├── App.tsx            # Main application component
├── App.css            # Application styling
├── index.tsx          # Application entry point
└── index.css          # Global styles
```

## Architecture Overview

### State Management Architecture

The application uses Redux Toolkit for centralized state management with redux-persist for automatic local storage synchronization. All note data (position, size, text, color, z-index) is stored in a single Redux slice (`notesSlice`), ensuring a single source of truth. This architecture provides predictable state updates through pure reducer functions and enables easy debugging through Redux DevTools. The persistence layer automatically serializes the state to localStorage on every change and rehydrates it on application load, providing seamless data persistence without manual save operations.

### Drag-and-Drop System

The drag-and-drop functionality is implemented through a custom hook (`useStickyNotesDrag`) that centralizes all drag logic in one place, avoiding code duplication across components. The system uses native browser mouse events (mousedown, mousemove, mouseup) rather than the HTML5 Drag API to provide precise control over drag behavior and visual feedback. The hook maintains internal drag state (mode, position, size) and exposes callback functions for move and resize operations. This architecture separates concerns: components handle rendering and user interaction initiation, while the hook manages the complex drag state machine and coordinate calculations. The trash zone uses real-time collision detection during drag operations to provide immediate visual feedback.

### Component Architecture

The application follows a component-based architecture with clear separation of concerns. The `App` component serves as the orchestrator, managing the overall layout and connecting child components to the Redux store. Presentational components (`StickyNote`, `Toolbar`, `TrashZone`) receive data and callbacks via props and remain unaware of the global state structure. The `StickyNote` component is fully controlled - it doesn't manage its own position or size, instead receiving these values from Redux and notifying the parent of user interactions. This unidirectional data flow makes the application predictable and testable. CSS modules are used for component-specific styling, preventing style conflicts and maintaining encapsulation.

## Technical Notes

- **Minimum note size**: 150x100 pixels (enforced during resize)
- **Default note size**: 200x150 pixels
- **Z-index management**: Automatic z-index assignment ensures proper layering
- **Performance**: Uses React.memo and useCallback to prevent unnecessary re-renders
- **Type safety**: Strict TypeScript mode with comprehensive type definitions
- **No external drag libraries**: All drag-and-drop logic implemented from scratch
- **Responsive textarea**: Automatically expands to fit content without scrollbars

## Browser Compatibility

Tested and verified on:

- Chrome 120+ (Windows, macOS)
- Firefox 121+ (Windows, macOS, Linux)
- Edge 120+ (Windows)

## Future Enhancements (Not Implemented)

- REST API integration for server-side persistence
- Collaborative editing with real-time synchronization
- Note categories and filtering
- Export/import functionality
- Keyboard shortcuts
