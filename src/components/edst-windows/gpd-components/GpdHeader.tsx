import React from "react";
import { WindowTitleBar } from "../WindowTitleBar";
import { EdstWindowHeaderButton } from "../../resources/EdstButton";
import { Tooltips } from "../../../tooltips";
import { useRootDispatch, useRootSelector } from "../../../redux/hooks";
import { openMenuThunk } from "../../../redux/thunks/thunks";
import { menuEnum, windowEnum } from "../../../enums";
import { Asel, closeAllMenus, closeMenu, closeWindow, gpdAselSelector } from "../../../redux/slices/appSlice";
import { NoSelectDiv } from "../../../styles/styles";
import { WindowHeaderRowDiv } from "../../../styles/edstWindowStyles";
import { gpdSuppressedSelector, toggleSuppressed } from "../../../redux/slices/gpdSlice";

type GpdHeaderProps = {
  focused: boolean;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
};

export const GpdHeader: React.FC<GpdHeaderProps> = ({ focused, zoomLevel, setZoomLevel }) => {
  const asel = useRootSelector(gpdAselSelector);
  const suppressed = useRootSelector(gpdSuppressedSelector);
  const dispatch = useRootDispatch();

  const handleRangeClick = (event: React.MouseEvent) => {
    switch (event.button) {
      case 0:
        setZoomLevel(Math.min(zoomLevel + 1, 10));
        break;
      case 1:
        setZoomLevel(Math.max(zoomLevel - 1, 4));
        break;
      default:
        break;
    }
  };

  const handleSuppressClick = () => {
    dispatch(toggleSuppressed());
  };

  return (
    <NoSelectDiv>
      <WindowTitleBar
        focused={focused}
        closeWindow={() => {
          if (asel?.window === windowEnum.graphicPlanDisplay) {
            dispatch(closeAllMenus());
          }
          dispatch(closeWindow(windowEnum.graphicPlanDisplay));
        }}
        text={["Graphic Plan Display - Current Time"]}
      />
      <div>
        <EdstWindowHeaderButton
          disabled={asel === null}
          onMouseDown={(e: React.MouseEvent) => dispatch(openMenuThunk(menuEnum.planOptions, e.currentTarget))}
          content="Plan Options..."
          title={Tooltips.planOptions}
        />
        <EdstWindowHeaderButton
          disabled={asel === null}
          onMouseDown={(e: React.MouseEvent) =>
            dispatch(openMenuThunk(menuEnum.holdMenu, e.currentTarget, windowEnum.graphicPlanDisplay, false, (asel as Asel).cid))
          }
          content="Hold..."
          title={Tooltips.hold}
        />
        <EdstWindowHeaderButton disabled content="Show" />
        <EdstWindowHeaderButton disabled content="Show ALL" />
        <EdstWindowHeaderButton disabled content="Graphic..." />
        <EdstWindowHeaderButton
          onMouseDown={(e: React.MouseEvent) =>
            dispatch(openMenuThunk(menuEnum.templateMenu, e.currentTarget, windowEnum.graphicPlanDisplay, false, asel?.cid ?? null))
          }
          content="Template..."
          title={Tooltips.template}
        />
        <EdstWindowHeaderButton
          disabled
          content="Clean Up"
          // title={Tooltips.gpdCleanUp}
        />
      </div>
      <WindowHeaderRowDiv>
        <EdstWindowHeaderButton disabled content="Recenter" title={Tooltips.planOptions} />
        <EdstWindowHeaderButton disabled onMouseDown={handleRangeClick} content="Range" />
        <EdstWindowHeaderButton content={!suppressed ? "Suppress" : "Restore"} onMouseDown={handleSuppressClick} width={84} />
        <EdstWindowHeaderButton
          onMouseDown={(e: React.MouseEvent) => {
            dispatch(closeMenu(menuEnum.gpdMapOptionsMenu));
            dispatch(openMenuThunk(menuEnum.gpdMapOptionsMenu, e.currentTarget, windowEnum.graphicPlanDisplay));
          }}
          content="Map Options..."
        />
        <EdstWindowHeaderButton
          onMouseDown={(e: React.MouseEvent) => {
            dispatch(closeMenu(menuEnum.toolsMenu));
            dispatch(openMenuThunk(menuEnum.toolsMenu, e.currentTarget, windowEnum.graphicPlanDisplay));
          }}
          content="Tools..."
        />
        <EdstWindowHeaderButton disabled content="Saved Map" />
      </WindowHeaderRowDiv>
    </NoSelectDiv>
  );
};
