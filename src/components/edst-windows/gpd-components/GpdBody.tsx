import React, { useEffect } from "react";
import { MapContainer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import styled from "styled-components";
import { useRootSelector } from "../../../redux/hooks";
import { GpdAircraftTrack, GpdPlanDisplay } from "./GpdMapElements";
import { entriesSelector } from "../../../redux/slices/entrySlice";
import { gpdPlanDataSelector, gpdSuppressedSelector } from "../../../redux/slices/gpdSlice";
import { EdstEntry } from "../../../typeDefinitions/types/edstEntry";

const center = { lat: 42.362944444444445, lng: -71.00638888888889 };

type MapConfiguratorProps = {
  zoomLevel: number;
};

const MapConfigurator = ({ zoomLevel }: MapConfiguratorProps) => {
  const map = useMap();
  useEffect(() => {
    map.setZoom(zoomLevel); // eslint-disable-next-line
  }, [zoomLevel]);
  return null;
};

const GpdBodyDiv = styled.div`
  overflow: hidden;
  width: 100%;
  height: 100%;

  .leaflet-container {
    width: 100%;
    height: 100%;
    background: #000000;
  }
`;

export const GpdBody = ({ zoomLevel }: { zoomLevel: number }) => {
  const entries = useRootSelector(entriesSelector);
  const displayData = useRootSelector(gpdPlanDataSelector);
  const suppressed = useRootSelector(gpdSuppressedSelector);

  const entryList = Object.values(entries)?.filter((entry: EdstEntry) => entry.aclDisplay);

  return (
    <GpdBodyDiv>
      <MapContainer
        center={center}
        doubleClickZoom={false}
        zoom={6}
        placeholder
        dragging={false}
        zoomControl={false}
        zoomAnimation={false}
        maxZoom={10}
        minZoom={5}
      >
        <MapConfigurator zoomLevel={zoomLevel} />
        {!suppressed && entryList.map(entry => <GpdAircraftTrack key={entry.aircraftId} aircraftId={entry.aircraftId} />)}
        {displayData && <GpdPlanDisplay displayData={displayData} />}
      </MapContainer>
    </GpdBodyDiv>
  );
};
