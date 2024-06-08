import { colors } from "./constants";

export function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const getRandomColor = () => {
  const colorIndex = getRandomNumber(0, colors.length - 1);
  return colors[colorIndex];
};
