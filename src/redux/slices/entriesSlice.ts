import {EdstEntryType} from "../../types";
import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import _ from "lodash";
import {fetchEdstEntries, fetchAarList} from "../../api";
import {refreshEntry} from "../refresh";
import {RootState} from "../store";
import {depFilter, entryFilter} from "../../filters";
import {getClosestReferenceFix, processAar} from "../../lib";
import {point} from "@turf/turf";

export type EntriesStateType = {
  [cid: string]: EdstEntryType
};

const initialState = {};

export const refreshEntriesThunk: any = createAsyncThunk(
  'entries/entriesRefresh',
  async (_args: void, thunkAPI) => {
    let newEntries: EntriesStateType = {};
    let newEntryList: any[] = [];
    const {referenceFixes} = (thunkAPI.getState() as RootState).sectorData;
    await fetchEdstEntries()
      .then(response => response.json())
      .then((data: any[]) => newEntryList = data);
    for (let newEntry of newEntryList) {
      const state = thunkAPI.getState() as RootState;
      let currentEntry = _.assign({...state.entries[newEntry.cid]}, refreshEntry(newEntry, state));
      if (depFilter(currentEntry, state.sectorData.artccId) && !currentEntry.depDeleted) {
        if (!currentEntry.depDisplay) {
          currentEntry.depDisplay = true;
          if (currentEntry.aar_list === undefined) {
            await fetchAarList(state.sectorData.artccId, currentEntry.cid)
              .then(response => response.json())
              .then(aarList => {
                currentEntry.aar_list = aarList;
                currentEntry._aar_list = processAar(currentEntry, aarList);
              });
          }
        }
      } else {
        if (entryFilter(currentEntry, state.sectorData)) {
          if (!currentEntry.aclDisplay && !currentEntry.aclDeleted) {
            // remove cid from departure list if will populate the aircraft list
            currentEntry.aclDisplay = true;
            currentEntry.depDeleted = true;
            currentEntry.depDisplay = false;
            if (currentEntry.aar_list === undefined) {
              await fetchAarList(state.sectorData.artccId, currentEntry.cid)
                .then(response => response.json())
                .then(aarList => {
                  currentEntry.aar_list = aarList;
                  currentEntry._aar_list = processAar(currentEntry, aarList);
                });
            }
          }
          if (referenceFixes.length > 0) {
            currentEntry.reference_fix = getClosestReferenceFix(referenceFixes, point([newEntry.flightplan.lon, newEntry.flightplan.lat]));
          }
        }
      }
      // thunkAPI.dispatch(setEntry(currentEntry));
      newEntries[newEntry.cid] = currentEntry;
    }
    return new Promise<EntriesStateType>(function (resolve) {
      resolve(newEntries);
    });
  }
);

const entriesSlice = createSlice({
  name: 'entries',
  initialState: initialState as EntriesStateType,
  reducers: {
    updateEntry(state, action) {
      _.assign(state[action.payload.cid], action.payload.data);
    },
    setEntry(state, action: { payload: EdstEntryType }) {
      state[action.payload.cid] = action.payload;
    },
    toggleSpa(state, action: { payload: string }) {
      state[action.payload].spa = !state[action.payload].spa;
    },
    deleteAclEntry(state, action: { payload: string }) {
      state[action.payload].aclDisplay = false;
      state[action.payload].aclDeleted = true;
    },
    deleteDepEntry(state, action: { payload: string }) {
      state[action.payload].depDisplay = false;
      state[action.payload].depDeleted = true;
    }
  },
  extraReducers: {
    [refreshEntriesThunk.fulfilled]: (state, action: { payload: EntriesStateType }) => {
      return {...state, ...action.payload};
    }
  }
});

export const {setEntry, updateEntry, toggleSpa, deleteAclEntry, deleteDepEntry} = entriesSlice.actions;
export default entriesSlice.reducer;

export const entriesSelector = (state: RootState) => state.entries;
export const entrySelector = (cid: string) => (state: RootState) => state.entries[cid];
export const aselEntrySelector = (state: RootState) => state.app.asel ? state.entries[state.app.asel.cid] : null;