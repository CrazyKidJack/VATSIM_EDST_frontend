import { Feature, polygon, Polygon } from "@turf/turf";
import { createSlice } from "@reduxjs/toolkit";
import { Fix, SectorData } from "../../types";
import { RootState } from "../store";

type SectorProfile = { id: string; name: string; sectors: string[] };

export type SectorDataState = {
  sectors: Record<string, Feature<Polygon>>;
  profiles: SectorProfile[];
  selectedSectors: string[];
  referenceFixes: Fix[];
  sectorId: string;
  artccId: string;
};

const initialState = {
  sectors: {},
  profiles: [],
  selectedSectors: [],
  referenceFixes: [],
  sectorId: "",
  artccId: ""
};

const sectorSlice = createSlice({
  name: "sectorData",
  initialState: initialState as SectorDataState,
  reducers: {
    setSectors(state: SectorDataState, action) {
      state.sectors = Object.fromEntries(
        action.payload.map((sector: SectorData) => [sector.properties.id, polygon(sector.geometry.coordinates, sector.properties)])
      );
    },
    setSelectedSectors(state: SectorDataState, action) {
      state.selectedSectors = action.payload;
    },
    toggleSector(state: SectorDataState, action) {
      if (state.selectedSectors.includes(action.payload)) {
        const selectedSectorsSet = new Set(state.selectedSectors);
        selectedSectorsSet.delete(action.payload);
        state.selectedSectors = [...selectedSectorsSet];
      } else {
        state.selectedSectors = [...state.selectedSectors, action.payload];
      }
    },
    setArtccId(state: SectorDataState, action) {
      state.artccId = action.payload;
    },
    setSectorId(state: SectorDataState, action) {
      state.sectorId = action.payload;
    },
    setSectorProfiles(state, action: { payload: SectorProfile[] }) {
      state.profiles = action.payload;
    },
    setReferenceFixes(state: SectorDataState, action) {
      state.referenceFixes = action.payload;
    }
  }
});

export const { setSectors, setSelectedSectors, toggleSector, setArtccId, setSectorId, setReferenceFixes, setSectorProfiles } = sectorSlice.actions;
export default sectorSlice.reducer;
export const referenceFixSelector = (state: RootState) => state.sectorData.referenceFixes;
export const sectorPolygonSelector = (state: RootState) => state.sectorData.sectors;
export const sectorIdSelector = (state: RootState) => state.sectorData.sectorId;
export const sectorProfilesSelector = (state: RootState) => state.sectorData.profiles;
export const selectedSectorsSelector = (state: RootState) => state.sectorData.selectedSectors;
