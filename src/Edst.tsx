import React, { useState } from "react";

import { useEventListener, useInterval } from "usehooks-ts";
import { EdstHeader } from "./components/EdstHeader";
import { Acl } from "./components/edst-windows/Acl";
import { Dep } from "./components/edst-windows/Dep";
import { Status } from "./components/edst-windows/Status";
import { RouteMenu } from "./components/edst-windows/RouteMenu";
import { Outage } from "./components/edst-windows/Outage";
import { AltMenu } from "./components/edst-windows/AltMenu";
import { PlanOptions } from "./components/edst-windows/PlanOptions";
import { PlansDisplay } from "./components/edst-windows/PlansDisplay";
import { SpeedMenu } from "./components/edst-windows/spd-hdg/SpeedMenu";
import { HeadingMenu } from "./components/edst-windows/spd-hdg/HeadingMenu";
import { HoldMenu } from "./components/edst-windows/HoldMenu";
import { MessageComposeArea } from "./components/edst-windows/MessageComposeArea";
import { MessageResponseArea } from "./components/edst-windows/MessageResponseArea";
import { TemplateMenu } from "./components/edst-windows/TemplateMenu";
import { SectorSelector } from "./components/SectorSelector";
import {
  mcaCommandStringSelector,
  openWindow,
  pushZStack,
  setMcaCommandString,
  showSectorSelectorSelector,
  windowsSelector
} from "./redux/slices/appSlice";
import { useRootDispatch, useRootSelector } from "./redux/hooks";
import { ToolsMenu } from "./components/edst-windows/tools-components/ToolsMenu";
import { AltimeterWindow } from "./components/edst-windows/AltimeterWindow";
import { MetarWindow } from "./components/edst-windows/MetarWindow";
import { refreshWeatherThunk } from "./redux/thunks/weatherThunks";
import { EquipmentTemplateMenu } from "./components/edst-windows/template-components/EquipmentTemplateMenu";
import { SigmetWindow } from "./components/edst-windows/SigmetWindow";
import { Gpd } from "./components/edst-windows/Gpd";
import { EdstDiv, EdstBodyDiv } from "./styles/edstStyles";
import { GpdMapOptions } from "./components/edst-windows/gpd-components/GpdMapOptions";
import { fetchAllAircraft } from "./api/api";
import { updateSweatboxAircraftThunk } from "./redux/thunks/updateSweatboxAircraftThunk";
import { EdstWindow } from "./enums/edstWindow";
import { CancelHoldMenu } from "./components/prompts/CancelHoldMenu";
import { GIWindow } from "./components/edst-windows/GeneralInforationWindow";
import { WEATHER_REFRESH_RATE } from "./constants";
import { HubContextProvider } from "./contexts/HubContext";
import { AclSortMenu } from "./components/edst-windows/acl-components/AclSortMenu";
import { DepSortMenu } from "./components/edst-windows/dep-components/DepSortMenu";

const Edst = () => {
  const dispatch = useRootDispatch();
  const windows = useRootSelector(windowsSelector);
  const mcaCommandString = useRootSelector(mcaCommandStringSelector);
  const showSectorSelector = useRootSelector(showSectorSelectorSelector);
  const [mcaInputRef, setMcaInputRef] = useState<React.RefObject<HTMLTextAreaElement> | null>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  useInterval(() => {
    fetchAllAircraft().then(aircraftList => {
      dispatch(updateSweatboxAircraftThunk(aircraftList));
    });
  }, 5000);

  useInterval(() => dispatch(refreshWeatherThunk), WEATHER_REFRESH_RATE);

  const handleKeyDown = (event: KeyboardEvent) => {
    // console.log(document.activeElement?.localName);
    // event.preventDefault();
    if (
      document.activeElement?.localName !== "input" &&
      document.activeElement?.localName !== "textarea" &&
      !windows[EdstWindow.ALTITUDE_MENU].open
    ) {
      if (!mcaInputRef?.current) {
        dispatch(openWindow(EdstWindow.MESSAGE_COMPOSE_AREA));
        if (event.key.match(/(\w|\s|\d|\/)/gi) && event.key.length === 1) {
          dispatch(setMcaCommandString(mcaCommandString + event.key.toUpperCase()));
        }
      } else {
        dispatch(pushZStack(EdstWindow.MESSAGE_COMPOSE_AREA));
        mcaInputRef.current.focus();
      }
    }
  };

  useEventListener("keydown", handleKeyDown);

  return (
    <EdstDiv
      ref={bodyRef}
      onContextMenu={event => process.env.NODE_ENV !== "development" && event.preventDefault()}
      tabIndex={document.activeElement?.localName !== "input" && document.activeElement?.localName !== "textarea" ? -1 : 0}
    >
      <EdstHeader />
      <div id="toPrint" />
      <EdstBodyDiv>
        {showSectorSelector && <SectorSelector />}
        {windows[EdstWindow.ACL].open && <Acl />}
        {windows[EdstWindow.DEP].open && <Dep />}
        {windows[EdstWindow.GPD].open && <Gpd />}
        {windows[EdstWindow.PLANS_DISPLAY].open && <PlansDisplay />}
        {windows[EdstWindow.PLAN_OPTIONS].open && <PlanOptions />}
        {windows[EdstWindow.ACL_SORT_MENU].open && <AclSortMenu />}
        {windows[EdstWindow.DEP_SORT_MENU].open && <DepSortMenu />}
        {windows[EdstWindow.TOOLS_MENU].open && <ToolsMenu />}
        {windows[EdstWindow.GPD_MAP_OPTIONS_MENU].open && <GpdMapOptions />}
        {windows[EdstWindow.ROUTE_MENU].open && <RouteMenu />}
        {windows[EdstWindow.TEMPLATE_MENU].open && <TemplateMenu />}
        {windows[EdstWindow.EQUIPMENT_TEMPLATE_MENU].open && <EquipmentTemplateMenu />}
        {windows[EdstWindow.HOLD_MENU].open && <HoldMenu />}
        {windows[EdstWindow.CANCEL_HOLD_MENU].open && <CancelHoldMenu />}
        {windows[EdstWindow.SPEED_MENU].open && <SpeedMenu />}
        {windows[EdstWindow.HEADING_MENU].open && <HeadingMenu />}
        {windows[EdstWindow.ALTITUDE_MENU].open && <AltMenu />}
        {windows[EdstWindow.STATUS].open && <Status />}
        {windows[EdstWindow.OUTAGE].open && <Outage />}
        {windows[EdstWindow.ALTIMETER].open && <AltimeterWindow />}
        {windows[EdstWindow.METAR].open && <MetarWindow />}
        {windows[EdstWindow.SIGMETS].open && <SigmetWindow />}
        {windows[EdstWindow.GI].open && <GIWindow />}
        {windows[EdstWindow.MESSAGE_COMPOSE_AREA].open && <MessageComposeArea setMcaInputRef={setMcaInputRef} />}
        {windows[EdstWindow.MESSAGE_RESPONSE_AREA].open && <MessageResponseArea />}
      </EdstBodyDiv>
    </EdstDiv>
  );
};

const EdstProvider = () => (
  <HubContextProvider>
    <React.StrictMode>
      <Edst />
    </React.StrictMode>
  </HubContextProvider>
);

export default EdstProvider;
