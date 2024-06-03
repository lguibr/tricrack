import { styled } from "styled-components";

export const Triangle = styled.div<{
  $x: number;
  $y: number;
  $size: number;
  $triangleHeight: number;
  $isUp: boolean;
  $color?: string | null;
  $isHovering?: string | null;
  $zIndex: number;
  $rowIndex: number;
}>`
  position: absolute;
  width: 0;
  height: 0;
  left: ${({ $x }) => $x}px;
  top: ${({ $y, $rowIndex }) => $y + $rowIndex * 4}px;
  z-index: ${({ $zIndex }) => $zIndex};
  pointer-events: auto;
  border-radius: 5%;
  border-left: ${({ $size }) => $size / 2 - 3}px solid transparent;
  border-right: ${({ $size }) => $size / 2 - 3}px solid transparent;
  ${({ $isUp, $triangleHeight, $color, $isHovering }) =>
    $isUp
      ? `
    border-bottom: ${$triangleHeight}px solid ${
          $isHovering ? $isHovering : $color || "gray"
        };
  `
      : `
    border-top: ${$triangleHeight}px solid ${
          $isHovering ? $isHovering : $color || "gray"
        };
  `}
`;
