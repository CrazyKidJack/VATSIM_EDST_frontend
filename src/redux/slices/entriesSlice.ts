import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import _ from "lodash";
import { point } from "@turf/turf";
import { LocalEdstEntry } from "../../types";
import { fetchEdstEntries, fetchAarList } from "../../api";
import { refreshEntry } from "../refresh";
import { RootState } from "../store";
import { depFilter, entryFilter } from "../../filters";
import { equipmentIcaoToNas, getClosestReferenceFix, processAar } from "../../lib";

export type EntriesState = Record<string, LocalEdstEntry>;

const initialState = {};

const currentEntryFallbackValue = {
  vciStatus: -1,
  depStatus: -1,
  aclDisplay: false,
  aclDeleted: false,
  depDisplay: false,
  depDeleted: false
};

export const refreshEntriesThunk: any = createAsyncThunk("entries/entriesRefresh", async (_args: void, thunkAPI) => {
  const { sectors, selectedSectors, artccId, referenceFixes } = (thunkAPI.getState() as RootState).sectorData;
  const polygons = selectedSectors ? selectedSectors.map(id => sectors[id]) : Object.values(sectors).slice(0, 1);

  const newEntries: EntriesState = {};
  let newEntryList: any[] = [];
  fetchEdstEntries()
    .then(response => response.json())
    .then((data: any[]) => {
      newEntryList = data;
    });
  newEntryList.forEach(newEntry => {
    const state = thunkAPI.getState() as RootState;
    let currentEntry = _.assign({}, state.entries[newEntry.cid] ?? currentEntryFallbackValue);
    currentEntry = _.assign(currentEntry, refreshEntry(newEntry, polygons, artccId, currentEntry));
    if (currentEntry.flightplan.flight_rules === "I" || currentEntry.aclDisplay || currentEntry.depDisplay) {
      if (depFilter(currentEntry, state.sectorData.artccId) && !currentEntry.depDeleted) {
        if (!currentEntry.depDisplay) {
          currentEntry.depDisplay = true;
          if (currentEntry.aarList === undefined) {
            fetchAarList(state.sectorData.artccId, currentEntry.cid)
              .then(response => response.json())
              .then(aarList => {
                currentEntry.aarList = aarList;
                currentEntry.currentAarList = processAar(currentEntry, aarList);
              });
          }
        }
        const icaoFields = currentEntry.flightplan?.aircraft?.split("/").slice(1);
        icaoFields[0] = icaoFields[0]?.split("-")?.pop();
        if (icaoFields?.length === 2) {
          currentEntry.equipment = equipmentIcaoToNas(icaoFields[0], icaoFields[1]);
        }
      } else if (currentEntry.aclDisplay || entryFilter(currentEntry, polygons)) {
        if (!currentEntry.aclDisplay && !currentEntry.aclDeleted) {
          // remove cid from departure list if it will populate the aircraft list
          currentEntry.aclDisplay = true;
          currentEntry.depDeleted = true;
          currentEntry.depDisplay = false;
          if (currentEntry.aarList === undefined) {
            fetchAarList(state.sectorData.artccId, currentEntry.cid)
              .then(response => response.json())
              .then(aarList => {
                currentEntry.aarList = aarList;
                currentEntry.currentAarList = processAar(currentEntry, aarList);
              });
          }
        }
        if (referenceFixes.length > 0) {
          currentEntry.referenceFix = getClosestReferenceFix(referenceFixes, point([newEntry.flightplan.lon, newEntry.flightplan.lat]));
        }
        const icaoFields = currentEntry.flightplan?.aircraft?.split("/").slice(1);
        icaoFields[0] = icaoFields[0]?.split("-")?.pop();
        if (icaoFields?.length === 2) {
          currentEntry.equipment = equipmentIcaoToNas(icaoFields[0], icaoFields[1]);
        }
      }
    }
    // thunkAPI.dispatch(setEntry(currentEntry));
    newEntries[newEntry.cid] = _.assign({}, currentEntry);
  });
  return new Promise<EntriesState>(resolve => {
    resolve(newEntries);
  });
});

const entriesSlice = createSlice({
  name: "entries",
  initialState: initialState as EntriesState,
  reducers: {
    updateEntry(state, action: { payload: { cid: string; data: Partial<LocalEdstEntry> } }) {
      _.assign(state[action.payload.cid], action.payload.data);
    },
    setEntry(state, action: { payload: LocalEdstEntry }) {
      state[action.payload.cid] = action.payload;
    },
    toggleSpa(state, action: { payload: string }) {
      state[action.payload].spa = !state[action.payload].spa;
    },
    deleteAclEntry(state, action: { payload: string }) {
      state[action.payload].aclDisplay = false;
      state[action.payload].aclDeleted = true;
    },
    addAclEntry(state, action: { payload: string }) {
      state[action.payload].aclDisplay = true;
      state[action.payload].aclDeleted = false;
    },
    deleteDepEntry(state, action: { payload: string }) {
      state[action.payload].depDisplay = false;
      state[action.payload].depDeleted = true;
    },
    addDepEntry(state, action: { payload: string }) {
      state[action.payload].depDisplay = true;
      state[action.payload].depDeleted = false;
    }
  },
  extraReducers: {
    [refreshEntriesThunk.fulfilled]: (state, action: { payload: EntriesState }) => {
      return { ...state, ...action.payload };
    }
  }
});

export const { setEntry, updateEntry, toggleSpa, deleteAclEntry, deleteDepEntry, addAclEntry, addDepEntry } = entriesSlice.actions;
export default entriesSlice.reducer;

export const entriesSelector = (state: RootState) => state.entries;
export const entrySelector = (cid: string) => (state: RootState) => state.entries[cid];
export const aselEntrySelector = (state: RootState) => (state.app.asel ? state.entries[state.app.asel.cid] : null);
