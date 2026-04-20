import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Note, Position, Size } from '../types';

interface NotesState {
  notes: Note[];
}

const getMaxZIndex = (notes: Note[]): number => {
  if (notes.length === 0) return 1;
  return Math.max(...notes.map(note => note.zIndex)) + 1;
};

const initialState: NotesState = {
  notes: [],
};

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    addNote: (
      state,
      action: PayloadAction<{ color: string; position: Position; size: Size }>
    ) => {
      const newNote: Note = {
        id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        position: action.payload.position,
        size: action.payload.size,
        text: '',
        color: action.payload.color,
        zIndex: getMaxZIndex(state.notes),
      };
      state.notes.push(newNote);
    },

    deleteNote: (state, action: PayloadAction<string>) => {
      state.notes = state.notes.filter(note => note.id !== action.payload);
    },

    updateNoteText: (
      state,
      action: PayloadAction<{ noteId: string; text: string }>
    ) => {
      const note = state.notes.find(n => n.id === action.payload.noteId);
      if (note) {
        note.text = action.payload.text;
      }
    },

    updateNotePosition: (
      state,
      action: PayloadAction<{ noteId: string; position: Position }>
    ) => {
      const note = state.notes.find(n => n.id === action.payload.noteId);
      if (note) {
        note.position = action.payload.position;
      }
    },

    updateNoteSize: (
      state,
      action: PayloadAction<{ noteId: string; size: Size }>
    ) => {
      const note = state.notes.find(n => n.id === action.payload.noteId);
      if (note) {
        note.size = action.payload.size;
      }
    },

    bringNoteToFront: (state, action: PayloadAction<string>) => {
      const note = state.notes.find(n => n.id === action.payload);
      if (note) {
        note.zIndex = getMaxZIndex(state.notes);
      }
    },
  },
});

export const {
  addNote,
  deleteNote,
  updateNoteText,
  updateNotePosition,
  updateNoteSize,
  bringNoteToFront,
} = notesSlice.actions;

export const notesReducer = notesSlice.reducer;
