import React from "react";
import styled from "styled-components";
import { useRootSelector } from "../../redux/hooks";
import { tooltipsEnabledSelector } from "../../redux/slices/appSlice";

const TooltipDiv = styled.div`
  position: absolute;
  color: #ffffff;
  background-color: #000000;
  border: 1px solid #adad00;
  padding: 2px;
  font-size: 0.85em;
  transform: translateY(32px);
  z-index: 2000;
  white-space: pre-line;
`;

const TooltipContent: React.FC<{ content: any }> = ({ content }) => {
  // eslint-disable-next-line jsx-a11y/tabindex-no-positive
  return <TooltipDiv tabIndex={2000}>{content}</TooltipDiv>;
};

const TooltipBody = styled.div`
  all: unset;
`;

type EdstTooltipProps = {
  title?: string;
  content?: string;
  onMouseDown?: React.EventHandler<React.MouseEvent>;
  onContextMenu?: React.EventHandler<React.MouseEvent>;
  disabled?: boolean;
  style?: Record<string, string | number>;
};

export const EdstTooltip: React.FC<EdstTooltipProps> = ({ title, content, style, ...props }) => {
  const globalTooltipsEnabled = useRootSelector(tooltipsEnabledSelector);
  const [tooltipEnabled, setTooltipEnabled] = React.useState(false);

  return (
    <TooltipBody
      style={style}
      {...props}
      onMouseEnter={e => e.shiftKey && setTooltipEnabled(true)}
      // onKeyDownCapture={(e) => e.shiftKey && setTooltipEnabled(!tooltip_enabled)}
      onMouseLeave={() => setTooltipEnabled(false)}
    >
      {globalTooltipsEnabled && tooltipEnabled && title && <TooltipContent content={title} />}
      {content ?? props.children}
    </TooltipBody>
  );
};
