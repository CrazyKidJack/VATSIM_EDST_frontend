import React, { useRef } from "react";
import styled from "styled-components";
import { EdstButton } from "../resources/EdstButton";
import { EdstTooltip } from "../resources/EdstTooltip";
import { Tooltips } from "../../tooltips";
import { useRootDispatch, useRootSelector } from "../../redux/hooks";
import { menuEnum, windowEnum } from "../../enums";
import { openMenuThunk } from "../../redux/thunks/thunks";
import { aselSelector, Asel, closeMenu, menuPositionSelector, setAsel, zStackSelector, pushZStack } from "../../redux/slices/appSlice";
import { deleteAclEntry, deleteDepEntry, entrySelector } from "../../redux/slices/entriesSlice";
import { useCenterCursor, useDragging, useFocused } from "../../hooks";
import { FidRow, OptionsBody, OptionsBodyCol, OptionsBodyRow, OptionsMenu, OptionsMenuHeader } from "../../styles/optionMenuStyles";
import { EdstDraggingOutline } from "../../styles/draggingStyles";

const PlanOptionsDiv = styled(OptionsMenu)`
  width: 220px;
`;
const PlanOptionsBody = styled(OptionsBody)`
  text-indent: 4px;
`;

export const PlanOptions: React.FC = () => {
  const dispatch = useRootDispatch();
  const asel = useRootSelector(aselSelector) as Asel;
  const pos = useRootSelector(menuPositionSelector(menuEnum.planOptions));
  const zStack = useRootSelector(zStackSelector);
  const ref = useRef<HTMLDivElement | null>(null);
  const focused = useFocused(ref);
  const entry = useRootSelector(entrySelector(asel.cid));
  const dep = asel.window === windowEnum.dep;
  useCenterCursor(ref, [asel]);
  const { startDrag, stopDrag, dragPreviewStyle, anyDragging } = useDragging(ref, menuEnum.planOptions);

  function openMenu(menu: menuEnum) {
    dispatch(openMenuThunk(menu, ref.current, menuEnum.planOptions, true));
    dispatch(closeMenu(menuEnum.planOptions));
  }

  return (
    pos && (
      <PlanOptionsDiv
        ref={ref}
        pos={pos}
        zIndex={zStack.indexOf(menuEnum.planOptions)}
        onMouseDown={() => zStack.indexOf(menuEnum.planOptions) > 0 && dispatch(pushZStack(menuEnum.planOptions))}
        anyDragging={anyDragging}
        id="plan-menu"
      >
        {dragPreviewStyle && <EdstDraggingOutline style={dragPreviewStyle} onMouseUp={stopDrag} />}
        <OptionsMenuHeader focused={focused} onMouseDown={startDrag} onMouseUp={stopDrag}>
          Plan Options Menu
        </OptionsMenuHeader>
        <PlanOptionsBody>
          <FidRow>
            {entry.cid} {entry.callsign}
          </FidRow>
          <OptionsBodyRow>
            <EdstTooltip style={{ flexGrow: 1 }} title={Tooltips.planOptionsAlt} onMouseDown={() => openMenu(menuEnum.altitudeMenu)}>
              <OptionsBodyCol hover>Altitude...</OptionsBodyCol>
            </EdstTooltip>
          </OptionsBodyRow>
          {!dep && (
            <OptionsBodyRow>
              <EdstTooltip style={{ flexGrow: 1 }} title={Tooltips.planOptionsSpeed} disabled>
                <OptionsBodyCol hover>Speed...</OptionsBodyCol>
              </EdstTooltip>
            </OptionsBodyRow>
          )}
          <OptionsBodyRow>
            <EdstTooltip style={{ flexGrow: 1 }} title={Tooltips.planOptionsRoute} onMouseDown={() => openMenu(menuEnum.routeMenu)}>
              <OptionsBodyCol hover>Route...</OptionsBodyCol>
            </EdstTooltip>
          </OptionsBodyRow>
          <OptionsBodyRow>
            <EdstTooltip
              style={{ flexGrow: 1 }}
              title={Tooltips.planOptionsPrevRoute}
              disabled={entry?.previous_route === undefined}
              onMouseDown={() => openMenu(menuEnum.prevRouteMenu)}
            >
              <OptionsBodyCol hover>Previous Route</OptionsBodyCol>
            </EdstTooltip>
          </OptionsBodyRow>
          {!dep && (
            <OptionsBodyRow>
              <EdstTooltip style={{ flexGrow: 1 }} title={Tooltips.planOptionsStopProbe} disabled>
                <OptionsBodyCol hover>Stop Probe...</OptionsBodyCol>
              </EdstTooltip>
            </OptionsBodyRow>
          )}
          <OptionsBodyRow>
            <EdstTooltip style={{ flexGrow: 1 }} title={Tooltips.planOptionsTrialRestr} disabled>
              <OptionsBodyCol hover>{`Trial ${dep ? "Departure" : "Restrictions"}...`}</OptionsBodyCol>
            </EdstTooltip>
          </OptionsBodyRow>
          {!dep && (
            <OptionsBodyRow>
              <EdstTooltip style={{ flexGrow: 1 }} title={Tooltips.planOptionsPlans}>
                <OptionsBodyCol hover>Plans</OptionsBodyCol>
              </EdstTooltip>
            </OptionsBodyRow>
          )}
          <OptionsBodyRow>
            <EdstTooltip style={{ flexGrow: 1 }} title={Tooltips.planOptionsKeep}>
              <OptionsBodyCol hover>Keep</OptionsBodyCol>
            </EdstTooltip>
          </OptionsBodyRow>
          <OptionsBodyRow>
            <EdstTooltip
              style={{ flexGrow: 1 }}
              title={Tooltips.planOptionsDelete}
              onMouseDown={() => {
                dispatch(asel.window === windowEnum.acl ? deleteAclEntry(asel.cid) : deleteDepEntry(asel.cid));
                dispatch(setAsel(null));
                dispatch(closeMenu(menuEnum.planOptions));
              }}
            >
              <OptionsBodyCol hover>Delete</OptionsBodyCol>
            </EdstTooltip>
          </OptionsBodyRow>
          <OptionsBodyRow margin="0">
            <OptionsBodyCol alignRight>
              <EdstButton content="Exit" onMouseDown={() => dispatch(closeMenu(menuEnum.planOptions))} />
            </OptionsBodyCol>
          </OptionsBodyRow>
        </PlanOptionsBody>
      </PlanOptionsDiv>
    )
  );
};
