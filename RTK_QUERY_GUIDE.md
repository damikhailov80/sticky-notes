# Redux Toolkit Query (RTK Query) Integration Guide

## Overview

RTK Query is the official data fetching and caching solution from Redux Toolkit. It simplifies API integration by providing automatic caching, request deduplication, and optimistic updates out of the box.

## Why RTK Query?

- ✅ **Less Boilerplate**: No need to write separate actions, reducers, and thunks
- ✅ **Automatic Caching**: Smart caching with automatic invalidation
- ✅ **Loading States**: Built-in loading, error, and success states
- ✅ **Request Deduplication**: Multiple components requesting same data = single API call
- ✅ **Optimistic Updates**: Update UI before server responds
- ✅ **TypeScript Support**: Full type safety with minimal configuration

## Implementation Steps

### Step 1: Create API Service

Create a new file `src/store/api.ts`:

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Note } from '../types';

export const notesApi = createApi({
  reducerPath: 'notesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://backend.org/api',
    // Optional: Add authentication headers
    prepareHeaders: headers => {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Notes'],
  endpoints: builder => ({
    // GET /notes - Fetch all notes
    getNotes: builder.query<Note[], void>({
      query: () => '/notes',
      providesTags: ['Notes'],
    }),

    // POST /notes - Create a new note
    createNote: builder.mutation<Note, Partial<Note>>({
      query: note => ({
        url: '/notes',
        method: 'POST',
        body: note,
      }),
      invalidatesTags: ['Notes'],
    }),

    // PUT /notes/:id - Update existing note
    updateNote: builder.mutation<Note, Note>({
      query: note => ({
        url: `/notes/${note.id}`,
        method: 'PUT',
        body: note,
      }),
      invalidatesTags: ['Notes'],
    }),

    // DELETE /notes/:id - Delete a note
    deleteNote: builder.mutation<void, string>({
      query: id => ({
        url: `/notes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notes'],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} = notesApi;
```

### Step 2: Configure Store

Update `src/store/store.ts`:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { notesReducer } from './notesSlice';
import { notesApi } from './api';

const STORAGE_KEY = 'sticky-notes-data';

const persistConfig = {
  key: STORAGE_KEY,
  storage,
  whitelist: ['notes'],
};

const persistedReducer = persistReducer(persistConfig, notesReducer);

export const store = configureStore({
  reducer: {
    notes: persistedReducer,
    // Add the API reducer
    [notesApi.reducerPath]: notesApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
      // Add the API middleware - enables caching, invalidation, polling, etc.
      .concat(notesApi.middleware),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Step 3: Use in Components

Update your components to use the generated hooks:

```typescript
// src/App.tsx
import { useGetNotesQuery, useCreateNoteMutation, useDeleteNoteMutation } from './store/api';

function App() {
  // Fetch notes - automatically refetches when invalidated
  const { data: notes, isLoading, isError, error } = useGetNotesQuery();

  // Mutations
  const [createNote, { isLoading: isCreating }] = useCreateNoteMutation();
  const [deleteNote, { isLoading: isDeleting }] = useDeleteNoteMutation();

  const handleAddNote = async () => {
    try {
      await createNote({
        text: 'New note',
        color: 'yellow',
        position: { x: 100, y: 100 },
      }).unwrap();
      // Note: No need to manually update state - cache is automatically invalidated
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id).unwrap();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  if (isLoading) return <div>Loading notes...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={handleAddNote} disabled={isCreating}>
        Add Note
      </button>
      {notes?.map(note => (
        <div key={note.id}>
          {note.text}
          <button onClick={() => handleDeleteNote(note.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

## Key Concepts

### Tags and Cache Invalidation

Tags are used to manage cache invalidation:

```typescript
// This query provides the 'Notes' tag
getNotes: builder.query<Note[], void>({
  query: () => '/notes',
  providesTags: ['Notes'], // ← Provides tag
}),

// This mutation invalidates the 'Notes' tag
createNote: builder.mutation<Note, Partial<Note>>({
  query: (note) => ({ url: '/notes', method: 'POST', body: note }),
  invalidatesTags: ['Notes'], // ← Invalidates tag, triggers refetch
}),
```

**Flow:**

1. Component calls `useGetNotesQuery()` → fetches data → caches with 'Notes' tag
2. User creates a note → `createNote()` mutation runs
3. Mutation invalidates 'Notes' tag
4. RTK Query automatically refetches `getNotes` query
5. Component re-renders with fresh data

### Optimistic Updates

Update UI immediately before server responds:

```typescript
updateNote: builder.mutation<Note, Note>({
  query: (note) => ({
    url: `/notes/${note.id}`,
    method: 'PUT',
    body: note,
  }),
  // Optimistic update
  async onQueryStarted(note, { dispatch, queryFulfilled }) {
    // Update cache immediately
    const patchResult = dispatch(
      notesApi.util.updateQueryData('getNotes', undefined, (draft) => {
        const index = draft.findIndex(n => n.id === note.id);
        if (index !== -1) draft[index] = note;
      })
    );

    try {
      await queryFulfilled;
    } catch {
      // Rollback on error
      patchResult.undo();
    }
  },
}),
```

### Polling and Refetching

Automatically refetch data at intervals:

```typescript
// Refetch every 30 seconds
const { data } = useGetNotesQuery(undefined, {
  pollingInterval: 30000,
});

// Refetch on window focus
const { data } = useGetNotesQuery(undefined, {
  refetchOnFocus: true,
});

// Refetch on reconnect
const { data } = useGetNotesQuery(undefined, {
  refetchOnReconnect: true,
});
```

### Manual Cache Management

```typescript
import { notesApi } from './store/api';

// Manually trigger refetch
dispatch(notesApi.util.invalidateTags(['Notes']));

// Prefetch data
dispatch(notesApi.util.prefetch('getNotes', undefined, { force: true }));

// Update cache manually
dispatch(
  notesApi.util.updateQueryData('getNotes', undefined, draft => {
    draft.push(newNote);
  })
);
```

## Advanced Features

### Conditional Fetching

Skip query until condition is met:

```typescript
const { data } = useGetNotesQuery(undefined, {
  skip: !isAuthenticated, // Don't fetch if not authenticated
});
```

### Lazy Queries

Trigger query manually instead of on mount:

```typescript
const [trigger, result] = useLazyGetNotesQuery();

// Call when needed
const handleClick = () => {
  trigger();
};
```

### Transforming Responses

Transform data before caching:

```typescript
getNotes: builder.query<Note[], void>({
  query: () => '/notes',
  transformResponse: (response: any) => {
    // Transform server response to match client format
    return response.data.map(note => ({
      ...note,
      createdAt: new Date(note.created_at),
    }));
  },
}),
```

## Migration from Current Setup

### Before (with redux-persist only):

```typescript
// Manual state management
const notes = useAppSelector(state => state.notes.notes);
dispatch(addNote(newNote));
```

### After (with RTK Query):

```typescript
// Automatic server sync
const { data: notes } = useGetNotesQuery();
const [createNote] = useCreateNoteMutation();
await createNote(newNote);
```

## Combining with Redux Persist

You can keep redux-persist for offline support:

```typescript
// Use RTK Query as source of truth
const { data: serverNotes } = useGetNotesQuery();

// Fallback to persisted local notes if offline
const localNotes = useAppSelector(state => state.notes.notes);

const notes = serverNotes ?? localNotes;
```

## Error Handling

```typescript
const { data, error, isError } = useGetNotesQuery();

if (isError) {
  if ('status' in error) {
    // FetchBaseQueryError
    const errMsg = 'error' in error ? error.error : JSON.stringify(error.data);
    return <div>Error: {errMsg}</div>;
  } else {
    // SerializedError
    return <div>Error: {error.message}</div>;
  }
}
```

## Best Practices

1. **Use Tags Wisely**: Group related data with the same tag for efficient invalidation
2. **Optimistic Updates**: Use for better UX on mutations
3. **Error Boundaries**: Wrap components with error boundaries for graceful error handling
4. **TypeScript**: Leverage full type safety with proper typing
5. **Selective Invalidation**: Use specific tags instead of invalidating everything
6. **Polling**: Use sparingly to avoid unnecessary network requests
7. **Cache Time**: Configure `keepUnusedDataFor` based on your data freshness requirements

## Resources

- [RTK Query Official Docs](https://redux-toolkit.js.org/rtk-query/overview)
- [RTK Query Examples](https://redux-toolkit.js.org/rtk-query/usage/examples)
- [Migration Guide](https://redux-toolkit.js.org/rtk-query/usage/migrating-to-rtk-query)
