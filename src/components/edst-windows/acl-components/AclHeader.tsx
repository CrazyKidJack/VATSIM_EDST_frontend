import React, {useState} from 'react';
import {WindowTitleBar} from "../WindowTitleBar";
import {EdstWindowHeaderButton} from "../../resources/EdstButton";
import {Tooltips} from "../../../tooltips";
import {useAppDispatch, useAppSelector} from "../../../redux/hooks";
import {setAclManualPosting} from "../../../redux/slices/aclSlice";
import {aclCleanup, addAclEntry, openWindowThunk} from "../../../redux/thunks";
import {windowEnum} from "../../../enums";
import {aclAselSelector, closeWindow, setAsel, setInputFocused} from "../../../redux/slices/appSlice";


export const AclHeader: React.FC<{focused: boolean}> = ({focused}) => {
  const asel = useAppSelector(aclAselSelector);
  const sortData = useAppSelector((state) => state.acl.sortData);
  const manualPosting = useAppSelector((state) => state.acl.manualPosting);
  const dispatch = useAppDispatch();

  const [searchStr, setSearchString] = useState('');
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      dispatch(addAclEntry(searchStr));
      setSearchString('');
    }
  };

  return (<div>
    <WindowTitleBar
      focused={focused}
      closeWindow={() => {
        dispatch(setAsel(null));
        dispatch(closeWindow(windowEnum.acl));
      }}
      text={['Aircraft List', `${sortData.sector ? 'Sector/' : ''}${sortData.selectedOption}`, `${manualPosting ? 'Manual' : 'Automatic'}`]}
    />
    <div className="no-select">
      <EdstWindowHeaderButton
        disabled={asel === null}
        onMouseDown={(e: React.KeyboardEvent) => dispatch(openWindowThunk(windowEnum.planOptions, e.currentTarget))}
        content="Plan Options..."
        title={Tooltips.planOptions}
      />
      <EdstWindowHeaderButton
        disabled={asel === null}
        onMouseDown={(e: React.KeyboardEvent) => dispatch(openWindowThunk(windowEnum.holdMenu, e.currentTarget, windowEnum.acl))}
        content="Hold..."
        title={Tooltips.hold}
      />
      <EdstWindowHeaderButton disabled={true} content="Show"/>
      <EdstWindowHeaderButton disabled={true} content="Show ALL"/>
      <EdstWindowHeaderButton
        id="acl-sort-button"
        onMouseDown={(e: React.KeyboardEvent) => {
          dispatch(openWindowThunk(windowEnum.sortMenu, e.currentTarget));
        }}
        content="Sort..."
        title={Tooltips.sort}
      />
      <EdstWindowHeaderButton disabled={true} content="Tools..."/>
      <EdstWindowHeaderButton
        onMouseDown={() => dispatch(setAclManualPosting(!manualPosting))}
        content="Posting Mode"
        title={Tooltips.postingMode}
      />
      <EdstWindowHeaderButton
        onMouseDown={(e: React.KeyboardEvent) => dispatch(openWindowThunk(windowEnum.templateMenu, e.currentTarget))}
        content="Template..."
        title={Tooltips.template}
      />
      <EdstWindowHeaderButton
        onMouseDown={() => dispatch(aclCleanup)}
        content="Clean Up"
        title={Tooltips.aclCleanUp}
      />
    </div>
    <div className="edst-window-header-bottom-row no-select">
      Add/Find
      <div className="input-container">
        <input
          onFocus={() => dispatch(setInputFocused(true))}
          onBlur={() => dispatch(setInputFocused(false))}
          value={searchStr}
          onChange={(e) => setSearchString(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  </div>);
};