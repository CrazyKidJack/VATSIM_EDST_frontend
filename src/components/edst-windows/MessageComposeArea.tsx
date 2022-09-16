import React, { forwardRef, useRef, useState } from "react";
import styled, { ThemeProvider } from "styled-components";
import { convertBeaconCodeToString, formatUtcMinutes, getClearedToFixRouteFixes } from "../../lib";
import { useRootDispatch, useRootSelector } from "../../redux/hooks";
import { aclManualPostingSelector, setAclManualPosting } from "../../redux/slices/aclSlice";
import { entriesSelector, updateEntry } from "../../redux/slices/entrySlice";
import {
  closeAllWindows,
  defaultWindowPositions,
  FULLSCREEN_WINDOWS,
  mcaCommandStringSelector,
  mcaFeedbackSelector,
  pushZStack,
  setIsFullscreen,
  setMcaAcceptMessage,
  setMcaCommandString,
  setMcaRejectMessage,
  setMcaResponse,
  setMraMessage,
  setWindowPosition,
  windowPositionSelector,
  zStackSelector
} from "../../redux/slices/appSlice";
import { addAclEntryByFid } from "../../redux/thunks/entriesThunks";
import { printFlightStrip } from "../PrintableFlightStrip";
import { defaultFontSize, eramFontFamily } from "../../styles/styles";
import { FloatingWindowDiv } from "../../styles/floatingWindowStyles";
import { EdstDraggingOutline } from "../utils/EdstDraggingOutline";
import { aircraftTracksSelector } from "../../redux/slices/trackSlice";
import { ApiFlightplan } from "../../typeDefinitions/types/apiTypes/apiFlightplan";
import { EdstEntry } from "../../typeDefinitions/types/edstEntry";
import { openWindowThunk } from "../../redux/thunks/openWindowThunk";
import { aclCleanup } from "../../redux/thunks/aclCleanup";
import { useDragging } from "../../hooks/useDragging";
import { EdstWindow } from "../../typeDefinitions/enums/edstWindow";
import { useHubActions } from "../../hooks/useHubActions";
import { useHubConnector } from "../../hooks/useHubConnector";
import { fetchFormatRoute, fetchRouteFixes } from "../../api/api";
import { useOnUnmount } from "../../hooks/useOnUnmount";
import { toggleAltimeter, toggleMetar } from "../../redux/slices/weatherSlice";
import { FloatingWindowOptionContainer } from "../utils/FloatingWindowOptionContainer";
import { useWindowOptions } from "../../hooks/useWindowOptions";
import { windowOptionsSelector } from "../../redux/slices/windowOptionsSlice";

const MessageComposeAreaDiv = styled(FloatingWindowDiv)`
  color: rgba(173, 173, 173, ${props => (props.theme.brightness ?? 80) / 100});
  background-color: #000000;
  border: 1px solid #adadad;
  font-family: ${eramFontFamily};
`;

type MessageComposeInputAreaDivProps = { width?: number; height?: number };
const MessageComposeInputAreaDiv = styled.div.attrs(({ width = 50, height = 2 }: MessageComposeInputAreaDivProps) => ({
  width: `${width}ch`,
  height: `${height}em`
}))<MessageComposeInputAreaDivProps>`
  line-height: 1;
  width: auto;
  height: auto;
  border-bottom: 1px solid #adadad;

  textarea {
    color: inherit;
    height: ${props => props.height};
    resize: none;
    white-space: initial;
    overflow: hidden;
    width: ${props => props.width};
    font-family: ${eramFontFamily};
    font-size: ${defaultFontSize};
    outline: none;
    border: none;
    caret: underscore;
    background-color: #000000;
    text-transform: uppercase;
  }
`;

const FeedbackContainerDiv = styled.div`
  min-height: calc(3em + 12px);
`;
const ResponseFeedbackRowDiv = styled.div`
  height: 1em;
  line-height: 1;
  padding: 2px;
  display: flex;
  flex-grow: 1;
`;

const AcceptCheckmarkSpan = styled.span`
  color: #00ad00;
  height: 1em;

  ::before {
    content: "\u2713";
  }
`;

const RejectCrossSpan = styled.span`
  color: #ad0000;
  height: 1em;

  ::before {
    content: "\u2715"; // apparently this is literally just the character X (xray)
  }
`;

export const MessageComposeArea = forwardRef<HTMLTextAreaElement>((props, inputRef) => {
  const mcaFeedbackString = useRootSelector(mcaFeedbackSelector);
  const mcaCommandString = useRootSelector(mcaCommandStringSelector);
  const pos = useRootSelector(windowPositionSelector(EdstWindow.MESSAGE_COMPOSE_AREA));
  const manualPosting = useRootSelector(aclManualPostingSelector);
  const entries = useRootSelector(entriesSelector);
  const aircraftTracks = useRootSelector(aircraftTracksSelector);
  const dispatch = useRootDispatch();
  const ref = useRef<HTMLDivElement>(null);
  const zStack = useRootSelector(zStackSelector);
  const [mcaInputValue, setMcaInputValue] = useState(mcaCommandString);
  const { startDrag, dragPreviewStyle, anyDragging } = useDragging(ref, EdstWindow.MESSAGE_COMPOSE_AREA, "mousedown");
  const hubActions = useHubActions();
  const { connectHub, disconnectHub } = useHubConnector();

  useOnUnmount(() => dispatch(setMcaCommandString(mcaInputValue)));

  const [showOptions, setShowOptions] = useState(false);
  const windowOptions = useRootSelector(windowOptionsSelector(EdstWindow.MESSAGE_COMPOSE_AREA));
  const options = useWindowOptions(EdstWindow.MESSAGE_COMPOSE_AREA);

  const accept = (message: string) => {
    dispatch(setMcaAcceptMessage(message));
  };

  const acceptDposKeyBD = () => {
    accept("D POS KEYBD");
  };

  const reject = (message: string) => {
    dispatch(setMcaRejectMessage(message));
  };

  const toggleVci = (fid: string) => {
    const entry: EdstEntry | undefined = Object.values(entries)?.find(
      e => String(e.cid) === fid || String(e.aircraftId) === fid || String(e.assignedBeaconCode ?? 0).padStart(4, "0") === fid
    );
    if (entry) {
      if (entry.vciStatus < 1) {
        dispatch(updateEntry({ aircraftId: entry.aircraftId, data: { vciStatus: 1 } }));
      } else {
        dispatch(updateEntry({ aircraftId: entry.aircraftId, data: { vciStatus: 0 } }));
      }
    }
  };

  const toggleHighlightEntry = (fid: string) => {
    const entry: EdstEntry | undefined = Object.values(entries)?.find(
      entry => String(entry?.cid) === fid || String(entry.aircraftId) === fid || convertBeaconCodeToString(entry.assignedBeaconCode) === fid
    );
    if (entry) {
      if (entry.aclDisplay) {
        dispatch(updateEntry({ aircraftId: entry.aircraftId, data: { aclHighlighted: !entry.aclHighlighted } }));
      }
      if (entry.depDisplay) {
        dispatch(updateEntry({ aircraftId: entry.aircraftId, data: { depHighlighted: !entry.depHighlighted } }));
      }
    }
  };

  const getEntryByFid = (fid: string): EdstEntry | undefined => {
    return Object.values(entries ?? {})?.find(
      (entry: EdstEntry) =>
        String(entry.cid) === fid || String(entry.aircraftId) === fid || convertBeaconCodeToString(entry.assignedBeaconCode) === fid
    );
  };

  const flightplanReadout = async (fid: string) => {
    const now = new Date();
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const entry = getEntryByFid(fid);
    if (entry) {
      const formattedRoute = await fetchFormatRoute(entry.route, entry.departure, entry.destination);
      const msg =
        `${formatUtcMinutes(utcMinutes)}\n` +
        `${entry.aircraftId} ${entry.aircraftId} ${entry.aircraftType}/${entry.faaEquipmentSuffix} ${convertBeaconCodeToString(
          entry.assignedBeaconCode
        )} ${entry.speed} EXX00` +
        ` ${entry.altitude} ${entry.departure}./.` +
        `${formattedRoute.replace(/^\.+/, "")}` +
        `${entry.destination ?? ""}`;
      dispatch(setMraMessage(msg));
    }
  };

  const parseQU = async (args: string[]) => {
    if (args.length === 2) {
      const entry = getEntryByFid(args[1]);
      if (entry && entry.aclDisplay) {
        const routeFixes = await fetchRouteFixes(entry.route, entry.departure, entry?.destination);
        if (routeFixes?.map(fix => fix.name)?.includes(args[0])) {
          const aircraftTrack = aircraftTracks[entry.aircraftId];
          const frd = await hubActions.generateFrd(aircraftTrack.location);
          const formattedRoute = await fetchFormatRoute(entry.route, entry.departure, entry.destination);
          const route = getClearedToFixRouteFixes(args[0], entry, routeFixes, formattedRoute, frd)?.route;
          if (route) {
            const amendedFlightplan: ApiFlightplan = {
              ...entry,
              route: route
                .split(/\.+/g)
                .join(" ")
                .trim()
            };
            hubActions.amendFlightplan(amendedFlightplan).then(() => dispatch(setMcaAcceptMessage(`CLEARED DIRECT`)));
          }
        }
        reject("FORMAT");
      }
    }
  };

  const parseUU = (args: string[]) => {
    switch (args.length) {
      case 0:
        dispatch(openWindowThunk(EdstWindow.ACL));
        acceptDposKeyBD();
        break;
      case 1:
        switch (args[0]) {
          case "C":
            dispatch(aclCleanup);
            break;
          case "D":
            dispatch(openWindowThunk(EdstWindow.DEP));
            break;
          case "P":
            dispatch(openWindowThunk(EdstWindow.ACL));
            dispatch(setAclManualPosting(!manualPosting));
            break;
          case "G":
            dispatch(openWindowThunk(EdstWindow.GPD));
            break;
          case "R":
            FULLSCREEN_WINDOWS.forEach(window => dispatch(setIsFullscreen({ window, value: true })));
            dispatch(setWindowPosition({ window: EdstWindow.MESSAGE_COMPOSE_AREA, pos: defaultWindowPositions[EdstWindow.MESSAGE_COMPOSE_AREA]! }));
            break;
          case "X":
            dispatch(closeAllWindows());
            break;
          default:
            dispatch(addAclEntryByFid(args[0]));
            break;
        }
        acceptDposKeyBD();
        break;
      case 2:
        if (args[0] === "H") {
          toggleHighlightEntry(args[1]);
          acceptDposKeyBD();
        } else {
          dispatch(setMcaRejectMessage(`REJECT\n${mcaInputValue}`));
        }
        break;
      default:
        // TODO: give error msg
        dispatch(setMcaRejectMessage(`REJECT\n${mcaInputValue}`));
    }
  };

  const parseCommand = () => {
    // TODO: rename command variable
    const [command, ...args] = mcaInputValue
      .trim()
      .split(/\s+/)
      .map(s => s.toUpperCase());
    // console.log(command, args)
    if (command.match(/\/\/\w+/)) {
      toggleVci(command.slice(2));
      acceptDposKeyBD();
    } else {
      // TODO: break down switch cases into functions (parseUU, parseFR, ...)
      switch (command) {
        case "//": // should turn vci on/off for a CID
          toggleVci(args[0]);
          acceptDposKeyBD();
          break; // end case //
        case "SI":
          connectHub()
            .then(() => accept("SIGN IN"))
            .catch(() => reject("SIGN IN"));
          break;
        case "SO":
          disconnectHub()
            .then(() => accept("SIGN OUT"))
            .catch(() => reject("SIGN OUT"));
          break;
        case "UU":
          parseUU(args);
          break; // end case UU
        case "QU": // cleared direct to fix: QU <fix> <fid>
          parseQU(args).then();
          break; // end case QU
        case "QD": // altimeter request: QD <station>
          dispatch(toggleAltimeter(args));
          dispatch(openWindowThunk(EdstWindow.ALTIMETER));
          accept("ALTIMETER REQ");
          break; // end case QD
        case "WR": // weather request: WR <station>
          dispatch(toggleMetar(args));
          dispatch(openWindowThunk(EdstWindow.METAR));
          accept(`WEATHER STAT REQ\n${mcaInputValue}`);
          break; // end case WR
        case "FR": // flightplan readout: FR <fid>
          if (args.length === 0) {
            reject(`READOUT\n${mcaInputValue}`);
          } else if (args.length === 1) {
            flightplanReadout(args[0]).then(() => accept(`READOUT\n${mcaInputValue}`));
            dispatch(openWindowThunk(EdstWindow.MESSAGE_RESPONSE_AREA));
          } else {
            dispatch(setMcaResponse(`REJECT: MESSAGE TOO LONG\nREADOUT\n${mcaInputValue}`));
          }
          break; // end case FR
        case "SR":
          if (args.length === 1) {
            const entry = getEntryByFid(args[0]);
            if (entry) {
              printFlightStrip(entry);
              acceptDposKeyBD();
            } else {
              reject(mcaInputValue);
            }
          } else {
            reject(mcaInputValue);
          }
          break;
        default:
          // TODO: give better error msg
          reject(mcaInputValue);
      }
    }
    setMcaInputValue("");
  };

  const handleInputChange = (event: React.ChangeEvent<any>) => {
    event.preventDefault();
    if (event.target.value.match(/\n$/)) {
      setMcaInputValue(event.target.value.trim());
    } else {
      setMcaInputValue(event.target.value);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<any>) => {
    if (event.shiftKey) {
      (inputRef as React.RefObject<HTMLTextAreaElement>)?.current?.blur();
    }
    if (zStack.indexOf(EdstWindow.MESSAGE_COMPOSE_AREA) < zStack.length - 1) {
      dispatch(pushZStack(EdstWindow.MESSAGE_COMPOSE_AREA));
    }
    switch (event.key) {
      case "Enter":
        if (mcaInputValue.length > 0) {
          parseCommand();
        } else {
          dispatch(setMcaRejectMessage(""));
        }
        break;
      case "Escape":
        setMcaInputValue("");
        dispatch(setMcaResponse(""));
        break;
      default:
        break;
    }
  };

  const feedbackRows = mcaFeedbackString.toUpperCase().split("\n");

  const onMcaMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    switch (event.button) {
      case 1:
        setShowOptions(true);
        break;
      default:
        startDrag(event);
        if (zStack.indexOf(EdstWindow.MESSAGE_COMPOSE_AREA) < zStack.length - 1) {
          dispatch(pushZStack(EdstWindow.MESSAGE_COMPOSE_AREA));
        }
        break;
    }
  };

  const zIndex = zStack.indexOf(EdstWindow.MESSAGE_COMPOSE_AREA);
  const rect = ref.current?.getBoundingClientRect();

  return (
    pos && (
      <>
        <ThemeProvider theme={windowOptions}>
          <MessageComposeAreaDiv ref={ref} anyDragging={anyDragging} id="edst-mca" pos={pos} zIndex={zIndex} onMouseDownCapture={onMcaMouseDown}>
            {dragPreviewStyle && <EdstDraggingOutline style={dragPreviewStyle} />}
            <MessageComposeInputAreaDiv height={windowOptions.lines} width={windowOptions.width}>
              <textarea
                ref={inputRef}
                tabIndex={document.activeElement === (inputRef as React.RefObject<HTMLTextAreaElement>).current ? -1 : undefined}
                value={mcaInputValue}
                onChange={handleInputChange}
                onKeyDownCapture={handleKeyDown}
              />
            </MessageComposeInputAreaDiv>
            <FeedbackContainerDiv>
              <ResponseFeedbackRowDiv>
                {mcaFeedbackString.startsWith("ACCEPT") && <AcceptCheckmarkSpan />}
                {mcaFeedbackString.startsWith("REJECT") && <RejectCrossSpan />}
                {feedbackRows[0]}
              </ResponseFeedbackRowDiv>
              {feedbackRows.slice(1, 30).map(s => (
                <ResponseFeedbackRowDiv key={s}>{s}</ResponseFeedbackRowDiv>
              ))}
            </FeedbackContainerDiv>
          </MessageComposeAreaDiv>
        </ThemeProvider>
        {showOptions && rect && (
          <FloatingWindowOptionContainer
            pos={{
              x: pos.x + rect.width,
              y: pos.y
            }}
            zIndex={zIndex}
            title="MCA"
            onClose={() => setShowOptions(false)}
            options={options}
          />
        )}
      </>
    )
  );
});
