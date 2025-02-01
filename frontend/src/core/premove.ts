import type { Chess, Color, Square } from 'chess.js';

/**
 * Determine whether a premove is valid or not.
 *
 * @param from starting square
 * @param to destination square
 * @param chess chess.js game instance
 * @returns whether premove is valid or not
 */
export function isValidPremove(from: Square, to: Square, chess: Chess): boolean {
  const piece = chess.get(from);
  if (piece == null || from === to) {
    return false;
  }
  const [fromCoords, toCoords] = [squareToCoords(from), squareToCoords(to)];
  switch (piece.type) {
    case 'p':
      return isPawnPremove(fromCoords, toCoords, piece.color);
    case 'n':
      return isKnightPremove(fromCoords, toCoords);
    case 'r':
      return isRookPremove(fromCoords, toCoords);
    case 'b':
      return isBishopPremove(fromCoords, toCoords);
    case 'q':
      return isQueenPremove(fromCoords, toCoords);
    case 'k':
      return isKingPremove(
        fromCoords,
        toCoords,
        piece.color,
        chess.getCastlingRights(chess.turn() === 'w' ? 'b' : 'w')
      );
    default:
      return false;
  }
}

function isPawnPremove(from: Coords, to: Coords, color: Color): boolean {
  return (
    Math.abs(from.x - to.x) <= 1 &&
    ((color === 'w' && (to.y === from.y + 1 || (from.y === 1 && to.y === 3 && from.x === to.x))) ||
      (color === 'b' && (to.y === from.y - 1 || (from.y === 6 && to.y === 4 && from.x === to.x))))
  );
}

function isKnightPremove(from: Coords, to: Coords): boolean {
  return (
    (Math.abs(from.x - to.x) === 1 && Math.abs(from.y - to.y) === 2) ||
    (Math.abs(from.x - to.x) === 2 && Math.abs(from.y - to.y) === 1)
  );
}

function isRookPremove(from: Coords, to: Coords): boolean {
  return from.x === to.x || from.y === to.y;
}

function isBishopPremove(from: Coords, to: Coords): boolean {
  return Math.abs(from.x - to.x) === Math.abs(from.y - to.y);
}

function isQueenPremove(from: Coords, to: Coords): boolean {
  return isRookPremove(from, to) || isBishopPremove(from, to);
}

function isKingPremove(
  from: Coords,
  to: Coords,
  color: Color,
  castlingRights: { k: boolean; q: boolean }
): boolean {
  return (
    (Math.abs(from.x - to.x) <= 1 && Math.abs(from.y - to.y) <= 1) ||
    (castlingRights.k && to.x === 6 && to.y === (color === 'w' ? 0 : 7)) ||
    (castlingRights.q && to.x === 2 && to.y === (color === 'w' ? 0 : 7))
  );
}

interface Coords {
  x: number;
  y: number;
}

function squareToCoords(square: Square): Coords {
  return { x: 'abcdefgh'.indexOf(square[0]), y: parseInt(square[1]) - 1 };
}
