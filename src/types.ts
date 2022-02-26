import {Feature, Point, Position} from "@turf/turf";

export type EdstEntryType = {
  cid: string, // 3 character unique identifier within EDST
  callsign: string, // aircraft callsign
  route: string, // route string parsed by EDST
  routes?: any[],
  route_data: FixType[],
  previous_route?: string,
  previous_route_data?: FixType[], // fixes for latest previous route
  altitude: string,
  interim?: number,
  type: string,
  equipment: string,
  flightplan: any, // VATSIM flightplan data plus ground speed and position (lon/lat)
  dep: string, // departure airport ICAO code
  dest: string, // destination airport ICAO code
  dep_info?: any, // additional data about departure airport like local code, lon/lat, ARTCC of jurisdiction (if
                  // available)
  dest_info?: any, // additional data about destination airport like local code, lon/lat, ARTCC of jurisdiction (if
                   // available)
  adr: any[], // adapted departure routes proposed by EDST
  adar: any[], // adapted departure-arrival routes proposed by EDST
  beacon: string, // assigned beacon code
  remarks: string, // remarks string
  spd?: string, // assigned speed
  hdg?: string, // assigned heading
  update_time: number, // last time the entry was updated in EDST
  hold_data?: any, // assigned hold instructions
  free_text_content?: string, // free text content
  cleared_direct?: { frd: string, fix: string }, // if cleared direct to somewhere, this will contain the FRD and the
                                                 // fix the aircraft was cleared to
}

// type for a single EDST entry
export type LocalEdstEntryVType = {
  _route?: string, // shortened route string, starting at the next inbound fix
  _route_data?: (FixType & { dist: number })[],
  aar_list?: any[], // preferred arrival routes
  _aar_list?: any[] | null, // preferred arrival routes processed by the frontend
  vciStatus: number, // vci status (-1: not acknowledged, 0: acknowledged but not on frequency, 1: on frequency)
  depStatus: number, // departure flightplan status (-1: not acknowledged, 0: acknowledged but not checked, 1: verified)
  aclHighlighted?: boolean,
  depHighlighted?: boolean,
  aclRouteDisplay?: string | null, // for toggling remarks
  remarksChecked?: boolean, // whether remarks have been checked or not
  spa: boolean, // SPA indicator
  boundaryTime: number, // minutes until entering the sector's airspace (will be negative if already inside)
  referenceFix?: ReferenceFixType | null, // current FRD
  pendingRemoval?: number | null, // if not null, number represents timestamp when pendingRemoval status was activated
  scratch_hdg?: string, // speed assigned in the scratchpad
  scratch_spd?: string, // heading assigned in the scratchpad
  showFreeText?: boolean, // boolean whether to display the free text row or not
  voiceType?: string, // voice type in VATSIM flightplan, /v/ by default
  aclDisplay: boolean,
  aclDeleted: boolean,
  depDisplay: boolean,
  depDeleted: boolean
}

// type for a single EDST entry
export type LocalEdstEntryType = EdstEntryType & LocalEdstEntryVType;

export type ReferenceFixType = {
  waypoint_id: string,
  point: Feature<Point>,
  distance: number,
  bearing: number
}

export type FixType = {
  name: string,
  pos: Position,
  dist?: number,
  minutesAtFix?: number
}

export type EdstPreferredRouteType = {
  eligible?: boolean,
  route: string,
  route_data?: FixType[],
  aar_amendment_route_string?: string,
  dest?: string
}

export type WindowPositionType = {
  x: number,
  y: number,
  w?: number,
  h?: number
}


export type SectorDataType = {
  geometry: { coordinates: Position[][], type: string },
  properties: {
    alt_low?: string,
    alt_high?: string,
    id: string
  }
}

export type PlanDataType = {
  cid: string,
  callsign: string,
  plan_data: any,
  msg: string
}
