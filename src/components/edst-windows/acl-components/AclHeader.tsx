import React, { useState } from "react";
import styled from "styled-components";
import { WindowTitleBar } from "../WindowTitleBar";
import { EdstWindowHeaderButton } from "../../utils/EdstButton";
import { Tooltips } from "../../../tooltips";
import { useRootDispatch, useRootSelector } from "../../../redux/hooks";
import { aclManualPostingSelector, aclSortDataSelector, setAclManualPosting } from "../../../redux/slices/aclSlice";
import { aclAselSelector, closeAllMenus, closeWindow } from "../../../redux/slices/appSlice";
import { addAclEntryByFid } from "../../../redux/thunks/entriesThunks";
import { NoSelectDiv } from "../../../styles/styles";
import { WindowHeaderRowDiv } from "../../../styles/edstWindowStyles";
import { AddFindInput } from "../../InputComponents";
import { openMenuThunk } from "../../../redux/thunks/openMenuThunk";
import { aclCleanup } from "../../../redux/thunks/aclCleanup";
import { EdstWindow } from "../../../enums/edstWindow";
import { AclSortOptionValues } from "../../../enums/acl/aclSortOption";

type AclHeaderProps = {
  focused: boolean;
  toggleFullscreen: () => void;
  startDrag: (e: React.MouseEvent<HTMLDivElement>) => void;
};

const AclHeaderDiv = styled(NoSelectDiv)``;

/**
 * ACL title bar and header row with add/find input field
 * @param focused focused state of ACL window
 * @param toggleFullscreen event handler to toggle maximized mode of ACL window
 * @param startDrag startDrag event handler
 */
export const AclHeader = ({ focused, toggleFullscreen, startDrag }: AclHeaderProps) => {
  const asel = useRootSelector(aclAselSelector);
  const sortData = useRootSelector(aclSortDataSelector);
  const manualPosting = useRootSelector(aclManualPostingSelector);
  const dispatch = useRootDispatch();

  const [searchStr, setSearchString] = useState("");
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      dispatch(addAclEntryByFid(searchStr));
      setSearchString("");
    }
  };

  return (
    <AclHeaderDiv>
      <WindowTitleBar
        focused={focused}
        toggleFullscreen={toggleFullscreen}
        startDrag={startDrag}
        closeWindow={() => {
          if (asel?.window === EdstWindow.ACL) {
            dispatch(closeAllMenus());
          }
          dispatch(closeWindow(EdstWindow.ACL));
        }}
        text={[
          "Aircraft List",
          `${sortData.sector ? "Sector/" : ""}${AclSortOptionValues[sortData.selectedOption]}`,
          `${manualPosting ? "Manual" : "Automatic"}`
        ]}
      />
      <WindowHeaderRowDiv>
        <EdstWindowHeaderButton
          disabled={asel === null}
          onMouseDown={(e: React.MouseEvent) => dispatch(openMenuThunk(EdstWindow.PLAN_OPTIONS, e.currentTarget))}
          content="Plan Options..."
          title={Tooltips.planOptions}
        />
        <EdstWindowHeaderButton
          disabled={asel === null}
          onMouseDown={(e: React.MouseEvent) => dispatch(openMenuThunk(EdstWindow.HOLD_MENU, e.currentTarget, EdstWindow.ACL, false))}
          content="Hold..."
          title={Tooltips.hold}
        />
        <EdstWindowHeaderButton disabled content="Show" />
        <EdstWindowHeaderButton disabled content="Show ALL" />
        <EdstWindowHeaderButton
          id="acl-sort-button"
          onMouseDown={(e: React.MouseEvent) => {
            dispatch(openMenuThunk(EdstWindow.ACL_SORT_MENU, e.currentTarget, EdstWindow.ACL));
          }}
          content="Sort..."
          title={Tooltips.sort}
        />
        <EdstWindowHeaderButton
          onMouseDown={(e: React.MouseEvent) => {
            dispatch(closeWindow(EdstWindow.TOOLS_MENU));
            dispatch(openMenuThunk(EdstWindow.TOOLS_MENU, e.currentTarget, EdstWindow.ACL));
          }}
          content="Tools..."
        />
        <EdstWindowHeaderButton
          onMouseDown={() => dispatch(setAclManualPosting(!manualPosting))}
          content="Posting Mode"
          title={Tooltips.postingMode}
        />
        <EdstWindowHeaderButton
          onMouseDown={(e: React.MouseEvent) => dispatch(openMenuThunk(EdstWindow.TEMPLATE_MENU, e.currentTarget, EdstWindow.ACL, false))}
          content="Template..."
          title={Tooltips.template}
        />
        <EdstWindowHeaderButton onMouseDown={() => dispatch(aclCleanup)} content="Clean Up" title={Tooltips.aclCleanUp} />
      </WindowHeaderRowDiv>
      <WindowHeaderRowDiv bottomRow>
        Add/Find
        <AddFindInput value={searchStr} onChange={e => setSearchString(e.target.value)} onKeyDown={handleKeyDown} />
        Facilities:
      </WindowHeaderRowDiv>
    </AclHeaderDiv>
  );
};
