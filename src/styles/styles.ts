import styled from "styled-components";

// export const edstFontFamily = "Consolas, MyConsolas";
export const edstFontFamily = "EDST, Consolas, MyConsolas";
export const eramFontFamily = "ERAM";
export const defaultFontSize = "17px";
export const defaultInputFontSize = "17px";

export const NoSelectDiv = styled.div`
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

// TODO: rename this div
export const DraggableDiv = styled(NoSelectDiv)<{ anyDragging?: boolean }>(props => props.anyDragging && { "pointer-events": "none" });
