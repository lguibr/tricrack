export function formatMatrix(matrix: number[][]): string {
  // Determine the maximum width of any number in the matrix for formatting
  const maxNumberWidth = Math.max(
    ...matrix.flat().map((num) => num.toString().length)
  );

  // Format each row and join them with newlines
  const formattedRows = matrix.map((row) => {
    return row
      .map((num) => num.toString().padStart(maxNumberWidth, " "))
      .join("");
  });

  return "\n" + formattedRows.join("\n") + "\n";
}
