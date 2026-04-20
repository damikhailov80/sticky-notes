# Sticky Notes Project Architecture

## Project Overview

An application for creating and managing virtual sticky notes with drag-and-drop support, resizing, and deletion via trash zone.

## Technology Stack

- **React 19** + **TypeScript**
- **Redux Toolkit** for state management
- **Redux Persist** for localStorage data persistence
- **Pointer Events API** for drag-and-drop implementation

---

## Architectural Decisions

### 1. State Management: Redux Toolkit + Redux Persist

**Solution:** Using Redux Toolkit with redux-persist for centralized sticky notes state management.

---

### 2. Drag-and-Drop Implementation: Custom Hook `useStickyNotesDrag`

**Solution:** Custom drag-and-drop implementation based on Pointer Events API with `requestAnimationFrame` optimization.

#### Key Features:

##### 2.1 Using Pointer Events Instead of Mouse Events

```typescript
target.setPointerCapture(e.pointerId);
```

**Advantages:**

- Unified handling for mouse, touch, and stylus
- Pointer capture ensures receiving all events even when moving outside element boundaries

##### 2.2 Rendering Optimization via CSS Transform

```typescript
element.style.transform = `translate(${offX}px, ${offY}px)`;
```

**Advantages:**

- Doesn't trigger reflow/repaint (runs on GPU)
- Smooth animation without Redux updates on every movement
- Final position is committed to Redux only on release

##### 2.3 Update Batching via requestAnimationFrame

```typescript
if (!stateRef.current.frameId) {
  stateRef.current.frameId = requestAnimationFrame(() => {
    updateElement(d.element, d.mode, pendingUpdate, d.startPosition);
    stateRef.current.frameId = null;
  });
}
```

**Advantages:**

- Synchronization with screen refresh rate (60 FPS)
- Prevention of excessive DOM updates
- Accumulation of changes in `pendingUpdate`

##### 2.4 Using useRef for Mutable State

```typescript
const stateRef = useRef({
  drag: null as DragState | null,
  isOverTrash: false,
  frameId: null as number | null,
  liveOffset: { x: 0, y: 0 },
  pendingUpdate: null,
});
```

**Advantages:**

- Avoiding unnecessary component re-renders
- Fast access to current state in event handlers
- Doesn't create new closures on every render

##### 2.5 Stable Event Handlers via handlersRef

```typescript
const handlersRef = useRef({
  handlePointerMove: (e: PointerEvent) => {},
  handlePointerUp: (e: PointerEvent) => {},
});

const handlePointerMove = useCallback((e: PointerEvent) => {
  handlersRef.current.handlePointerMove(e);
}, []);
```

**Advantages:**

- Handlers are not recreated on every render
- Access to current props via ref without changing dependencies

---

### 3. Potential Issues and Non-Ideal Solutions

#### 3.1 Complexity of `useStickyNotesDrag` Hook

**Problem:**

- Hook contains ~250 lines of code with multiple refs and states
- Mixes logic for moving, resizing, deletion, and event management
- Difficult to test and maintain

**Alternatives:**

- Use an existing library: `react-dnd`, `dnd-kit`, `react-draggable`
- Split into smaller hooks: `useDragMove`, `useDragResize`, `useTrashZone`

#### 3.2 Direct DOM Manipulation

**Problem:**

```typescript
element.style.transform = `translate(${offX}px, ${offY}px)`;
element.style.width = `${update.width}px`;
```

- Violates React's declarative paradigm
- Potential issues with DOM and virtual DOM synchronization
- Requires manual style cleanup

**Why it's done this way:**

- Performance: avoiding React re-renders on every mouse movement
- Animation smoothness via CSS transform

**Alternative:**

- Use animation libraries (Framer Motion, React Spring)

#### 3.3 Event Subscription Management

**Problem:**

```typescript
target.addEventListener('pointermove', handlePointerMove);
target.addEventListener('pointerup', handlePointerUp);
target.addEventListener('pointercancel', handlePointerUp);
target.addEventListener('lostpointercapture', handlePointerUp);
```

- Multiple subscriptions to different events
- Manual management of adding/removing listeners
- Risk of memory leaks with improper cleanup

**Current Solution:**

- Cleanup in `useEffect` and on drag completion
- Handling all edge cases (cancel, lost capture)

#### 3.4 Boundary Conditions During Movement

**Problem:**

```typescript
const x = Math.max(
  0,
  Math.min(
    window.innerWidth - drag.startSize.width - TOOLBAR_WIDTH,
    drag.startPosition.x + deltaX
  )
);
```

- Uses `window.innerWidth/Height` directly
- Doesn't account for window resize during drag
- Hardcoded `TOOLBAR_WIDTH` creates tight coupling

**Improvement:**

- Pass canvas boundaries as a parameter
- Subscribe to resize events
