import React, { MouseEventHandler, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { invoke } from "@tauri-apps/api/tauri";
import { useEventListener, useWindowSize } from "usehooks-ts";
import {
  FloatingWindowDiv,
  FloatingWindowHeaderColDiv16ch,
  FloatingWindowHeaderColDivFlex,
  FloatingWindowHeaderDiv
} from "../../styles/floatingWindowStyles";
import { WindowPosition } from "../../typeDefinitions/types/windowPosition";
import { borderHover } from "../../styles/styles";

const FloatingWindowOptionsBodyDiv = styled(FloatingWindowDiv)<{ offsetPos: boolean }>`
  font-size: ${props => props.theme.fontProperties.fontSize};
  display: inline-flex;
  flex-flow: column;
  height: auto;
`;

type FloatingWindowOptionDivProps = { backgroundColor: string };
const FloatingWindowOptionDiv = styled(FloatingWindowHeaderDiv)<FloatingWindowOptionDivProps>`
  height: 1em;
  background-color: ${props => props.backgroundColor};
  padding-right: 16px;
  border: 1px solid #adadad;
  text-indent: 6px;
  align-items: center;
  ${borderHover}
`;

type FloatingWindowOptionRowProps = { option: FloatingWindowOption };
const FloatingWindowOptionRow = ({ option }: FloatingWindowOptionRowProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const prevOptionValueRef = useRef<string>(option.value);
  const prevPosRef = useRef<WindowPosition>();

  useEffect(() => {
    // eslint-disable-next-line no-underscore-dangle
    if (window.__TAURI__ && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      if (!prevPosRef.current) {
        prevPosRef.current = { left: rect.left, top: rect.top };
      } else if (prevPosRef.current.left !== rect.left || prevPosRef.current.top !== rect.top) {
        if (option.value !== prevOptionValueRef.current) {
          const newCursorPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          invoke("set_cursor_position", newCursorPos).then();
          prevOptionValueRef.current = option.value;
        }
      }
      prevPosRef.current = { left: rect.left, top: rect.top };
    }
  });

  return (
    <FloatingWindowOptionDiv ref={ref} backgroundColor={option.backgroundColor ?? "#000000"} onMouseDownCapture={option.onMouseDown}>
      {option.value}
    </FloatingWindowOptionDiv>
  );
};

type FloatingWindowOption = {
  value: string;
  backgroundColor?: string;
  onMouseDown?: MouseEventHandler<HTMLDivElement>;
};

export type FloatingWindowOptions = Record<string, FloatingWindowOption>;

type FloatingWindowOptionsProps<T extends FloatingWindowOptions> = {
  parentPos: WindowPosition;
  parentWidth: number;
  zIndex: number;
  onClose?: () => void;
  title?: string;
  options?: T;
};

export function FloatingWindowOptionContainer<T extends FloatingWindowOptions>({ parentPos, ...props }: FloatingWindowOptionsProps<T>) {
  const [pos, setPos] = useState<WindowPosition>({
    left: parentPos.left + props.parentWidth,
    top: parentPos.top
  });
  const ref = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const xRef = useRef<HTMLDivElement>(null);
  const windowSize = useWindowSize();

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      if (parentPos.left + props.parentWidth + rect.width > windowSize.width) {
        setPos({ left: parentPos.left - rect.width, top: parentPos.top });
      } else {
        setPos({ left: parentPos.left + props.parentWidth, top: parentPos.top });
      }
    }
  }, [windowSize, parentPos, props.parentWidth]);

  useEffect(() => {
    // eslint-disable-next-line no-underscore-dangle
    if (window.__TAURI__) {
      let rect = null;
      if (xRef.current) {
        rect = xRef.current.getBoundingClientRect();
      } else if (headerRef.current) {
        rect = headerRef.current.getBoundingClientRect();
      } else if (ref.current) {
        rect = ref.current.getBoundingClientRect();
      }
      if (rect) {
        const newCursorPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        invoke("set_cursor_position", newCursorPos).then();
      }
    }
  }, []);

  useEventListener("mousedown", () => props.onClose?.());

  return (
    <FloatingWindowOptionsBodyDiv
      onMouseDown={event => event.stopPropagation()}
      pos={pos}
      ref={ref}
      zIndex={props.zIndex + 1}
      offsetPos={!props.title}
    >
      {props.title && (
        <FloatingWindowHeaderDiv ref={headerRef}>
          <FloatingWindowHeaderColDivFlex>{props.title}</FloatingWindowHeaderColDivFlex>
          <FloatingWindowHeaderColDiv16ch onMouseDownCapture={props.onClose} ref={xRef}>
            X
          </FloatingWindowHeaderColDiv16ch>
        </FloatingWindowHeaderDiv>
      )}
      {props.options && Object.entries(props.options).map(([key, option]) => <FloatingWindowOptionRow key={key} option={option} />)}
    </FloatingWindowOptionsBodyDiv>
  );
}
