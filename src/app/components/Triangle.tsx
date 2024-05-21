import { styled } from "styled-components";

export const Triangle = styled.div<{
  x: number;
  y: number;
  size: number;
  triangleHeight: number;
  isUp: boolean;
  isActive: boolean;
  zIndex: number;
  rowIndex: number;
}>`
  position: absolute;
  width: 0;
  height: 0;
  left: ${({ x }) => x}px;
  top: ${({ y, rowIndex }) => y + rowIndex * 2}px;
  z-index: ${({ zIndex }) => zIndex};
  pointer-events: auto;
  border-left: ${({ size }) => size / 2 - 2}px solid transparent;
  border-right: ${({ size }) => size / 2 - 2}px solid transparent;
  ${({ isUp, triangleHeight, isActive }) =>
    isUp
      ? `
    border-bottom: ${triangleHeight}px solid ${isActive ? "green" : "red"};
  `
      : `
    border-top: ${triangleHeight}px solid ${isActive ? "green" : "red"};
  `}
`;
