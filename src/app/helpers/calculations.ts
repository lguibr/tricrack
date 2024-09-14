import { colors } from "./constants";

export function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const getRandomColor = () => {
  const colorIndex = getRandomNumber(0, colors.length - 1);
  return colors[colorIndex];
};

export function getRowColFromIndex(
  index: number,
  _numRows: number,
  numCols: number
): { row: number; col: number } {
  // Calculate the row and column
  const row = Math.floor(index / numCols);
  const col = index % numCols;

  return { row, col };
}

type Matrix<T> = T[][];

export function combineMatrices<T>(matrices: Matrix<T>[]): T[][][] {
  if (matrices.length === 0) return [];

  const rows = matrices[0].length;
  const cols = matrices[0][0].length;
  const depth = matrices.length;

  // Initialize the resulting 3D matrix
  const result: T[][][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Array.from({ length: depth }))
  );

  // Populate the result matrix with values from input matrices
  for (let d = 0; d < depth; d++) {
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        result[i][j][d] = matrices[d][i][j];
      }
    }
  }

  return result;
}

export function buildUnitByDepthCustom(
  initialY: number,
  finalY: number,
  maxValue: number,
  items: number
): number[] {
  // Define coefficients based on the constraints
  const c: number = initialY; // f(0) = initialY

  // Setup the system of equations to solve for 'a' and 'b'
  // f(1) = a + b + c = finalY
  // f(0.5) = 0.25a + 0.5b + c = maxValue (peak at x=0.5)
  const equations: [number[], number[]] = [
    [0.25, 0.5], // Coefficients for x^2 and x in the equation for maxValue
    [1, 1], // Coefficients for x^2 and x in the equation for finalY
  ];
  const constants: number[] = [
    maxValue - initialY, // Constant term for the equation for maxValue
    finalY - initialY, // Constant term for the equation for finalY
  ];

  // Solve the system of linear equations
  const [a, b]: number[] = solveLinearSystem(equations, constants);

  // Generate polynomial values
  const x: number[] = Array.from({ length: items }, (_, i) => i / (items - 1));
  const unit: number[] = x
    .map((x) => a * x * x + b * x + c)
    .map((val) => Math.round(val));
  console.log("unit");
  console.log(unit);

  return unit;
}

// Helper function to solve a system of linear equations using matrix operations
function solveLinearSystem(
  equations: [number[], number[]],
  constants: number[]
): number[] {
  // Using Cramer's Rule or any matrix library that can solve linear systems
  const [[a11, a12], [a21, a22]]: [number[], number[]] = equations;
  const [b1, b2]: number[] = constants;
  const det: number = a11 * a22 - a12 * a21; // Determinant of the matrix
  const detA: number = b1 * a22 - b2 * a12; // Determinant for 'a'
  const detB: number = a11 * b2 - a21 * b1; // Determinant for 'b'

  if (det === 0) throw new Error("No unique solution");

  return [detA / det, detB / det];
}
