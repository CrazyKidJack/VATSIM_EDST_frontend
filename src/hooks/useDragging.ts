import React, { RefObject, useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { useEventListener } from "usehooks-ts";
import { useRootDispatch, useRootSelector } from "../redux/hooks";
import { anyDraggingSelector, pushZStack, setAnyDragging, setWindowPosition, windowsSelector, zStackSelector } from "../redux/slices/appSlice";
import { WindowPosition } from "../typeDefinitions/types/windowPosition";
import { DragPreviewStyle } from "../typeDefinitions/types/dragPreviewStyle";
import { EdstWindow } from "../typeDefinitions/enums/edstWindow";

const DRAGGING_REPOSITION_CURSOR: EdstWindow[] = [
  EdstWindow.STATUS,
  EdstWindow.OUTAGE,
  EdstWindow.MESSAGE_COMPOSE_AREA,
  EdstWindow.MESSAGE_RESPONSE_AREA,
  EdstWindow.ALTIMETER,
  EdstWindow.METAR,
  EdstWindow.SIGMETS,
  EdstWindow.NOTAMS,
  EdstWindow.GI
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const computePreviewPos = (x: number, y: number, _width: number, _height: number): { left: number; top: number } => {
  return {
    left: x - 1,
    top: y
  };
};

type StopDragOn = "mousedown" | "mouseup";

/**
 * hook to provide startDrag/endDrag functions with a previewStyle to render the previewWindow
 * @param element ref to a DOM element
 * @param edstWindow window for which to trigger dragging events
 * @param stopDragOn whether to listen for stopDrag onMouseDown or onMouseUp
 * @returns
 */
export const useDragging = (element: RefObject<HTMLElement>, edstWindow: EdstWindow, stopDragOn: StopDragOn) => {
  const dispatch = useRootDispatch();
  const zStack = useRootSelector(zStackSelector);
  const anyDragging = useRootSelector(anyDraggingSelector);
  const [dragging, setDragging] = useState(false);
  const windows = useRootSelector(windowsSelector);
  const repositionCursor = DRAGGING_REPOSITION_CURSOR.includes(edstWindow);
  const [dragPreviewStyle, setDragPreviewStyle] = useState<DragPreviewStyle | null>(null);
  let ppos: WindowPosition | null = null;
  ppos = windows[edstWindow as EdstWindow].position;

  useEffect(() => {
    return () => {
      dispatch(setAnyDragging(false));
    };
  }, []);

  const draggingHandler = useCallback(
    (event: MouseEvent) => {
      if (event && element.current) {
        if (repositionCursor) {
          setDragPreviewStyle(prevStyle => ({
            ...prevStyle!,
            left: event.clientX,
            top: event.clientY
          }));
        } else {
          const { clientWidth: width, clientHeight: height } = element.current;
          setDragPreviewStyle(prevStyle => ({
            ...prevStyle!,
            ...computePreviewPos(event.pageX + prevStyle!.relX, event.pageY + prevStyle!.relY, width, height)
          }));
        }
      }
    },
    [element, repositionCursor]
  );

  const startDrag = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (element.current && ppos && !anyDragging) {
        event.stopPropagation();
        if (zStack.indexOf(edstWindow) < zStack.length - 1) {
          dispatch(pushZStack(edstWindow));
        }
        let previewPos;
        let relX = 0;
        let relY = 0;
        // eslint-disable-next-line no-underscore-dangle
        if (window.__TAURI__) {
          invoke("set_cursor_grab", { value: true }).then();
        }
        if (DRAGGING_REPOSITION_CURSOR.includes(edstWindow)) {
          // eslint-disable-next-line no-underscore-dangle
          if (window.__TAURI__) {
            previewPos = { x: ppos.x, y: ppos.y };
            invoke("set_cursor_position", previewPos).then();
          } else {
            previewPos = { x: event.pageX, y: event.pageY };
          }
        } else {
          previewPos = { x: event.pageX, y: event.pageY };
          relX = ppos.x - event.pageX;
          relY = ppos.y - event.pageY;
        }
        const style = {
          left: previewPos.x + relX - 1,
          top: previewPos.y + relY,
          relX,
          relY,
          height:
            element.current.clientHeight +
            parseFloat(getComputedStyle(element.current).getPropertyValue("border")) +
            parseFloat(getComputedStyle(element.current).getPropertyValue("margin")) * 2,
          width:
            element.current.clientWidth +
            parseFloat(getComputedStyle(element.current).getPropertyValue("border")) +
            parseFloat(getComputedStyle(element.current).getPropertyValue("margin")) * 2
        };
        setDragPreviewStyle(style);
        setDragging(true);
        dispatch(setAnyDragging(true));
        window.addEventListener("mousemove", draggingHandler);
      }
    },
    [anyDragging, dispatch, draggingHandler, edstWindow, element, ppos]
  );

  const stopDrag = useCallback(() => {
    if (dragging && element?.current && dragPreviewStyle) {
      const { left: x, top: y } = dragPreviewStyle;
      const newPos = { x: x + 1, y };
      // eslint-disable-next-line no-underscore-dangle
      if (window.__TAURI__) {
        invoke("set_cursor_grab", { value: false }).then();
      }
      dispatch(
        setWindowPosition({
          window: edstWindow,
          pos: newPos
        })
      );
      dispatch(setAnyDragging(false));
      setDragging(false);
      setDragPreviewStyle(null);
      window.removeEventListener("mousemove", draggingHandler);
    }
  }, [dispatch, dragPreviewStyle, dragging, draggingHandler, edstWindow, element]);

  useEventListener(stopDragOn, () => {
    if (dragPreviewStyle) {
      stopDrag();
    }
  });

  return { startDrag, dragPreviewStyle, anyDragging };
};
