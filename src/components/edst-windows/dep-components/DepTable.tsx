import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { DepRow } from "./DepRow";
import { useRootSelector } from "../../../redux/hooks";
import { NoSelectDiv } from "../../../styles/styles";
import { edstFontGrey } from "../../../styles/colors";
import { ScrollContainer } from "../../../styles/optionMenuStyles";
import { BodyRowDiv, BodyRowHeaderDiv } from "../../../styles/bodyStyles";
import { DepCol2, DepFidCol, RadioCol } from "./DepStyled";
import { entriesSelector } from "../../../redux/slices/entrySlice";
import { depManualPostingSelector, depSortOptionSelector } from "../../../redux/slices/depSlice";
import { EdstEntry } from "../../../typeDefinitions/types/edstEntry";
import { AircraftTypeCol, AltCol, CodeCol, RouteCol, SpecialBox } from "../../../styles/sharedColumns";
import { DepRowField } from "../../../typeDefinitions/enums/dep/depRowField";
import { COMPLETED_CHECKMARK_SYMBOL } from "../../../constants";
import { DepSortOption } from "../../../typeDefinitions/enums/dep/depSortOption";

const DepBodyStyleDiv = styled(NoSelectDiv)`
  white-space: nowrap;
  overflow: hidden;
  flex-flow: column;
  display: flex;
  color: ${edstFontGrey};
`;

export function DepTable() {
  const selectedSortOption = useRootSelector(depSortOptionSelector);
  const manualPosting = useRootSelector(depManualPostingSelector);
  const entries = useRootSelector(entriesSelector);
  const [hiddenList, setHiddenList] = useState<DepRowField[]>([]);

  const toggleHideColumn = (field: DepRowField) => {
    const hiddenCopy = hiddenList.slice(0);
    const index = hiddenCopy.indexOf(field);
    if (index > -1) {
      hiddenCopy.splice(index, 1);
    } else {
      hiddenCopy.push(field);
    }
    setHiddenList(hiddenCopy);
  };

  const sortFunc = (u: EdstEntry, v: EdstEntry) => {
    switch (selectedSortOption) {
      case DepSortOption.ACID:
        return u.aircraftId.localeCompare(v.aircraftId);
      case DepSortOption.DESTINATION:
        return u.destination.localeCompare(v.destination);
      case DepSortOption.ORIGIN:
        return u.departure?.localeCompare(v.departure);
      default:
        return u.aircraftId.localeCompare(v.aircraftId);
    }
  };

  const entryList = useMemo(() => Object.values(entries)?.filter((entry: EdstEntry) => entry.depDisplay), [entries]);
  const spaEntryList = useMemo(() => Object.entries(entryList.filter((entry: EdstEntry) => entry.spa)), [entryList]);

  return (
    <DepBodyStyleDiv>
      <BodyRowHeaderDiv>
        <RadioCol header>{COMPLETED_CHECKMARK_SYMBOL}</RadioCol>
        <DepCol2>P-Time</DepCol2>
        <DepFidCol>Flight ID</DepFidCol>
        <SpecialBox />
        <SpecialBox />
        <AircraftTypeCol hidden={hiddenList.includes(DepRowField.TYPE)}>
          <div onMouseDown={() => toggleHideColumn(DepRowField.TYPE)}>T{!hiddenList.includes(DepRowField.TYPE) && "ype"}</div>
        </AircraftTypeCol>
        <AltCol headerCol>Alt.</AltCol>
        <CodeCol hover hidden={hiddenList.includes(DepRowField.CODE)} onMouseDown={() => toggleHideColumn(DepRowField.CODE)}>
          C{!hiddenList.includes(DepRowField.CODE) && "ode"}
        </CodeCol>
        <RouteCol>Route</RouteCol>
      </BodyRowHeaderDiv>
      <ScrollContainer>
        {spaEntryList?.map(([i, entry]: [string, EdstEntry]) => (
          <DepRow key={entry.aircraftId} index={Number(i)} entry={entry} hidden={hiddenList} />
        ))}
        {spaEntryList.length > 0 && <BodyRowDiv separator />}
        {Object.entries(entryList?.filter((entry: EdstEntry) => !entry.spa && (entry.depStatus > -1 || !manualPosting))?.sort(sortFunc))?.map(
          ([i, entry]: [string, EdstEntry]) => (
            <DepRow key={entry.aircraftId} index={Number(i)} entry={entry} hidden={hiddenList} />
          )
        )}
        {manualPosting && <BodyRowDiv separator />}
        {manualPosting &&
          Object.entries(entryList?.filter((entry: EdstEntry) => !entry.spa && entry.depStatus === -1))?.map(([i, entry]: [string, EdstEntry]) => (
            <DepRow key={entry.aircraftId} index={Number(i)} entry={entry} hidden={hiddenList} />
          ))}
      </ScrollContainer>
    </DepBodyStyleDiv>
  );
}
