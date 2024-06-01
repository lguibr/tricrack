import { styled } from "styled-components";

export const Triangle = styled.div<{
  $x: number;
  $y: number;
  $size: number;
  $triangleHeight: number;
  $isUp: boolean;
  $isActive: boolean;
  $isHovering: boolean;
  $zIndex: number;
  $rowIndex: number;
}>`
  position: absolute;
  width: 0;
  height: 0;
  left: ${({ $x }) => $x}px;
  top: ${({ $y, $rowIndex }) => $y + $rowIndex * 5}px;
  z-index: ${({ $zIndex }) => $zIndex};
  pointer-events: auto;
  border-left: ${({ $size }) => $size / 2 - 4}px solid transparent;
  border-right: ${({ $size }) => $size / 2 - 4}px solid transparent;
  ${({ $isUp, $triangleHeight, $isActive, $isHovering }) =>
    $isUp
      ? `
    border-bottom: ${$triangleHeight}px solid ${
          $isHovering ? "yellow" : $isActive ? "green" : "red"
        };
  `
      : `
    border-top: ${$triangleHeight}px solid ${
          $isHovering ? "yellow" : $isActive ? "green" : "red"
        };
  `}
`;
