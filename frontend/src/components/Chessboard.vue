<script setup lang="ts">
/* A stateless Chessboard component */
import { onMounted, ref, watch } from 'vue';

const container = ref<HTMLDivElement | null>(null);

export interface Props {
  fen: string;
  orientation: Color;
  selectedSquare?: Square | undefined;
  draggedPiece?: Piece | undefined;
  lastMove?: { from: Square; to: Square } | undefined;
  premove?: { from: Square; to: Square } | undefined;
  allowedMoves?: Square[];
  allowedPremoves?: Square[];
  attackedSquares?: Square[];
  isPromoting?: Color | undefined;
  pause?: boolean | undefined;
}

export interface Emits {
  (e: 'clickSquare', square: Square): void;
  (e: 'release', square?: Square): void;
  (e: 'promote', square?: Square): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

export type Piece = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K' | 'p' | 'n' | 'b' | 'r' | 'q' | 'k' | '';
export type Color = 'w' | 'b';
export type Square = `${(typeof RANKS)[number]}${(typeof FILES)[number]}`;
export type Promotion = `${(typeof PROMOTIONS)[number]}`;

const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const PROMOTIONS = ['q', 'r', 'b', 'n'];

const COLORS = {
  SQUARE_DARK: '#2563eb',
  SQUARE_LIGHT: '#dbeafe',
  LAST_MOVE: '#aaa23acc',
  SELECTED_SQUARE: '#77a08ecc',
  ALLOWED_MOVES: '#77a08ecc',
  ALLOWED_PREMOVES: '#64535ccc',
  PREMOVE: '#64535ccc',
  ATTACKED_SQUARES: '#ff0000',
  PAUSE_BACKGROUND: '#0000007a',
  PROMOTION_BACKGROUND: '#0000009a',
  PROMOTION_HERO: '#2563eb',
  PROMOTION_HOVER: '#dbeafe'
};

onMounted(async () => {
  const [
    [overlayCanvas, overlayCtx],
    [piecesCanvas, piecesCtx],
    [movesCanvas, movesCtx],
    [backgroundCanvas, backgroundCtx]
  ] = ['overlay-canvas', 'pieces-canvas', 'moves-canvas', 'background-canvas']
    .map((canvasId) => document.getElementById(canvasId) as HTMLCanvasElement)
    .map((canvas) => [canvas, canvas.getContext('2d') as CanvasRenderingContext2D]);

  const board: Record<Square, Piece> = {};
  const images: Record<string, HTMLImageElement> = {};
  let cellSize: number = piecesCanvas.width / 8;
  let ratio = window.devicePixelRatio || 1;
  let promotionBottomY: number = (overlayCanvas.height * 5) / 8;
  let promotionTopY: number = (overlayCanvas.height * 3) / 8;

  await init();

  /**
   * Initialize the chessboard.
   */
  async function init(): Promise<void> {
    for (const square of iterateSquares()) {
      board[square] = '';
    }
    await loadImages();
    loadFen();
    redraw();

    window.addEventListener('resize', redraw);
    piecesCanvas.addEventListener('mousedown', onDragStart);
    piecesCanvas.addEventListener('touchstart', onDragStart);
    overlayCanvas.addEventListener('mousedown', onPromotionSelect);
    overlayCanvas.addEventListener('touchstart', onPromotionSelect);
    piecesCanvas.addEventListener('mouseup', onDragEnd);
    piecesCanvas.addEventListener('touchend', onDragEnd);
    piecesCanvas.addEventListener('mousemove', onDragMove);
    piecesCanvas.addEventListener('touchmove', onDragMove);
    overlayCanvas.addEventListener('mousemove', onPromotionMouseMove);

    watch(
      () => [props.allowedMoves, props.allowedPremoves, props.lastMove],
      (_) => {
        drawMoves();
      }
    );

    watch(
      () => props.fen,
      (_) => {
        loadFen();
        drawPieces();
      }
    );

    watch(
      () => [props.isPromoting, props.pause],
      (_) => {
        drawOverlay();
      }
    );
  }

  function loadImages(): Promise<void[]> {
    return Promise.all(
      ['K', 'Q', 'B', 'N', 'R', 'P', 'k', 'q', 'b', 'n', 'r', 'p'].map((piece) => {
        const image = new Image();
        // Pieces of different colors are stored in separate folders to prevent issues with case-insensitive file systems
        const color = piece === piece.toUpperCase() ? 'w' : 'b';
        image.src = `pieces/${color}/${piece}.svg`;
        images[piece] = image;
        return new Promise<void>((resolve) => {
          image.onload = () => resolve();
        });
      })
    );
  }

  /**
   * Parse FEN and load board state.
   */
  function loadFen(): void {
    const [fenBoard] = props.fen.split(' ');
    const squares = iterateSquares();
    let square = squares.next();
    for (const char of fenBoard) {
      if (char === '/') {
        continue;
      }
      if (isNaN(parseInt(char))) {
        board[square.value] = char as Piece;
        square = squares.next();
      } else {
        for (let i = 0; i < parseInt(char); i++) {
          board[square.value] = '';
          square = squares.next();
        }
      }
    }
  }

  /**
   * Draw squares canvas.
   */
  function drawSquares(): void {
    for (var i = 0; i < 8; i++) {
      for (var j = 0; j < 8; j++) {
        drawRectangle(
          backgroundCtx,
          [COLORS.SQUARE_LIGHT, COLORS.SQUARE_DARK][(i + j) % 2],
          (j * piecesCanvas.width) / 8,
          (i * piecesCanvas.height) / 8,
          cellSize
        );
      }
    }
  }

  /**
   * Draw moves canvas.
   */
  function drawMoves(): void {
    movesCtx.clearRect(0, 0, movesCanvas.width, movesCanvas.height);

    for (const lastMove of Object.values(props.lastMove || {})) {
      const [x, y] = squareToCoords(lastMove);
      drawRectangle(movesCtx, COLORS.LAST_MOVE, x, y, cellSize);
    }
    if (props.selectedSquare) {
      const [x, y] = squareToCoords(props.selectedSquare);
      drawRectangle(movesCtx, COLORS.SELECTED_SQUARE, x, y, cellSize);
    }
    for (const allowedMove of props.allowedMoves || []) {
      drawMove(COLORS.ALLOWED_MOVES, allowedMove);
    }
    for (const allowedPremove of props.allowedPremoves || []) {
      drawMove(COLORS.ALLOWED_PREMOVES, allowedPremove);
    }
    for (const premove of Object.values(props.premove || {})) {
      const [x, y] = squareToCoords(premove);
      drawRectangle(movesCtx, COLORS.PREMOVE, x, y, cellSize);
    }
    for (const attackedSquare of props.attackedSquares || []) {
      drawAttackedSquare(COLORS.ATTACKED_SQUARES, attackedSquare);
    }
  }

  /**
   * Draw pieces canvas.
   */
  function drawPieces(): void {
    piecesCtx.clearRect(0, 0, piecesCanvas.width, piecesCanvas.height);

    for (const square of iterateSquares()) {
      if (board[square]) {
        piecesCtx.drawImage(images[board[square]], ...squareToCoords(square), cellSize, cellSize);
      }
    }
  }

  /**
   * Draw overlay canvas.
   *
   * @param hoverPiece which promotion piece is being hovered
   */
  function drawOverlay(hoverPiece?: Promotion | undefined): void {
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // Draw pause overlay
    if (props.pause) {
      drawRectangle(overlayCtx, COLORS.PAUSE_BACKGROUND, 0, 0, overlayCanvas.width);
    }
    if (!props.isPromoting) {
      return;
    }

    // Draw promotion dialog
    drawRectangle(overlayCtx, COLORS.PROMOTION_BACKGROUND, 0, 0, overlayCanvas.width);
    drawRectangle(
      overlayCtx,
      COLORS.PROMOTION_HERO,
      0,
      promotionTopY,
      overlayCanvas.width,
      overlayCanvas.height / 4
    );
    if (hoverPiece) {
      drawRectangle(
        overlayCtx,
        COLORS.PROMOTION_HOVER,
        (overlayCanvas.width / 4) * PROMOTIONS.indexOf(hoverPiece ?? ''),
        promotionTopY,
        overlayCanvas.height / 4
      );
    }

    // Draw promotion pieces
    for (const [index, piece] of PROMOTIONS.map((piece) =>
      props.isPromoting === 'w' ? piece.toUpperCase() : piece
    ).entries()) {
      overlayCtx.drawImage(
        images[piece],
        (overlayCanvas.width / 4) * index + overlayCanvas.width / 4 - (cellSize * 3) / 2,
        overlayCanvas.height / 2 - cellSize / 2,
        cellSize,
        cellSize
      );
    }
  }

  /**
   * Redraw every canvas after calculating new container size.
   */
  function redraw(): void {
    if (!container.value) {
      return;
    }
    const containerSize = container.value.offsetWidth;
    setScale();

    [piecesCanvas, overlayCanvas, movesCanvas, backgroundCanvas].forEach((canvas) => {
      canvas.width = containerSize;
      canvas.height = containerSize;
      canvas.style.width = `${canvas.width}px`;
      canvas.style.height = `${canvas.height}px`;
      canvas.width *= ratio;
      canvas.height *= ratio;
    });
    const scaledContainerSize = containerSize * ratio;
    cellSize = scaledContainerSize / 8;
    promotionBottomY = (scaledContainerSize * 5) / 8;
    promotionTopY = (scaledContainerSize * 3) / 8;

    drawSquares();
    drawMoves();
    drawPieces();
    drawOverlay();
  }

  function setScale() {
    // Set contexts scale to match device pixel ratio to prevent blurry images
    const ratio = window.devicePixelRatio;
    [piecesCtx, overlayCtx, movesCtx, backgroundCtx].forEach((ctx) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio, ratio);
    });
  }

  // Called on mouse/touch drag start
  function onDragStart(event: MouseEvent | TouchEvent): void {
    const { square } = getMouseLocation(piecesCanvas, getMouseEventOrTouch(event));
    emit('clickSquare', square);
    event.preventDefault();
  }

  // Called on mouse/touch drag move
  function onDragMove(event: MouseEvent | TouchEvent): void {
    const { mouseX, mouseY, square } = getMouseLocation(movesCanvas, getMouseEventOrTouch(event));
    if (props.draggedPiece || props.selectedSquare) {
      drawMoves();

      if ((props.allowedMoves ?? []).includes(square)) {
        const [x, y] = squareToCoords(square);
        drawRectangle(movesCtx, COLORS.ALLOWED_MOVES, x, y, cellSize);
      }
    }

    if (props.draggedPiece) {
      movesCtx.drawImage(
        images[props.draggedPiece],
        mouseX - cellSize / 2,
        mouseY - cellSize / 2,
        cellSize,
        cellSize
      );
    }
    event.preventDefault();
  }

  // Called on mouse/touch drag end
  function onDragEnd(event: MouseEvent | TouchEvent): void {
    const { square } = getMouseLocation(piecesCanvas, getMouseEventOrTouch(event));
    emit('release', square);
    drawMoves();
    event.preventDefault();
  }

  // Called when mouse is over promotion dialog
  function onPromotionMouseMove(event: MouseEvent): void {
    const { mouseX, mouseY } = getMouseLocation(movesCanvas, event);
    drawOverlay();
    if (!!props.isPromoting && mouseY > promotionTopY && mouseY <= promotionBottomY) {
      drawOverlay(PROMOTIONS[Math.floor(mouseX / (overlayCanvas.width / 4))]);
    }
    event.preventDefault();
  }

  // Called when a promotion piece is selected
  function onPromotionSelect(event: MouseEvent | TouchEvent): void {
    const { mouseX, mouseY } = getMouseLocation(piecesCanvas, getMouseEventOrTouch(event));
    if (!!props.isPromoting && mouseY > promotionTopY && mouseY <= promotionBottomY) {
      const promotion = PROMOTIONS[Math.floor(mouseX / (overlayCanvas.width / 4))];
      emit('promote', promotion);
    }
    event.preventDefault();
  }

  /**
   * Get mouse or touch location on canvas.
   */
  function getMouseLocation(
    canvas: HTMLCanvasElement,
    event: MouseEvent | Touch
  ): { mouseX: number; mouseY: number; square: string } {
    const rectBounds = canvas.getBoundingClientRect();
    const mouseX = (event.clientX - rectBounds.left) * ratio;
    const mouseY = (event.clientY - rectBounds.top) * ratio;
    const square = coordsToSquare(mouseX, mouseY);
    return { mouseX, mouseY, square };
  }

  /*
   * Helper function to deal both with mouse and touch events.
   */
  function getMouseEventOrTouch(event: MouseEvent | TouchEvent): MouseEvent | Touch {
    if (!window.TouchEvent) {
      return event as MouseEvent;
    }
    return event instanceof TouchEvent ? (event.touches[0] ?? event.changedTouches[0]) : event;
  }

  /**
   * Convert square notation to canvas coordinates, taking into account board orientation.
   */
  function squareToCoords(square: string): [number, number] {
    const [file, rank] = square.split('');
    if (props.orientation === 'b') {
      return [
        Math.abs(FILES.indexOf(file) * cellSize - backgroundCanvas.width) - cellSize,
        Math.abs(RANKS.indexOf(rank) * cellSize - backgroundCanvas.height) - cellSize
      ];
    }
    return [FILES.indexOf(file) * cellSize, RANKS.indexOf(rank) * cellSize];
  }

  /**
   * Convert canvas coordinates to square notation, taking into account board orientation.
   */
  function coordsToSquare(x: number, y: number): string {
    if (props.orientation === 'w') {
      return `${FILES[Math.floor(x / cellSize)]}${RANKS[Math.floor(y / cellSize)]}`;
    }
    return `${FILES[Math.floor((piecesCanvas.width - x) / cellSize)]}${
      RANKS[Math.floor((piecesCanvas.height - y) / cellSize)]
    }`;
  }

  function* iterateSquares(): Generator<string> {
    for (const rank of RANKS) {
      for (const file of FILES) {
        yield `${file}${rank}`;
      }
    }
  }

  function drawRectangle(
    ctx: CanvasRenderingContext2D,
    color: string,
    x: number,
    y: number,
    width: number,
    height?: number
  ): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height ?? width);
  }

  function drawMove(color: string, square: Square): void {
    const [x, y] = squareToCoords(square);
    if (board[square]) {
      movesCtx.fillStyle = color;
      movesCtx.fillRect(x, y, cellSize, cellSize);
      movesCtx.save();
      movesCtx.beginPath();
      movesCtx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 1.8, 0, Math.PI * 2);
      movesCtx.closePath();
      movesCtx.clip();
      movesCtx.clearRect(x, y, cellSize, cellSize);
      movesCtx.restore();
    } else {
      movesCtx.fillStyle = color;
      movesCtx.beginPath();
      movesCtx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 6, 0, Math.PI * 2);
      movesCtx.fill();
    }
  }

  function drawAttackedSquare(colorWithoutAlpha: string, square: Square): void {
    const [x, y] = squareToCoords(square);
    const radius = cellSize / 2;
    const gradient = movesCtx.createRadialGradient(
      x + cellSize / 2,
      y + cellSize / 2,
      1,
      x + cellSize / 2,
      y + cellSize / 2,
      radius
    );
    gradient.addColorStop(0, `${colorWithoutAlpha}ff`);
    gradient.addColorStop(0.65, `${colorWithoutAlpha}a5`);
    gradient.addColorStop(1, `${colorWithoutAlpha}00`);
    movesCtx.fillStyle = gradient;
    movesCtx.arc(x + cellSize / 2, y + cellSize / 2, radius, 0, Math.PI * 2, false);
    movesCtx.fill();
  }
});
</script>

<template>
  <div ref="container" class="w-full h-full items-center flex justify-center cursor-pointer">
    <canvas id="background-canvas" class="absolute"></canvas>
    <canvas id="moves-canvas" class="absolute"></canvas>
    <canvas id="pieces-canvas" class="absolute"></canvas>
    <canvas
      id="overlay-canvas"
      v-show="!!props.isPromoting || props.pause"
      class="absolute"
    ></canvas>
  </div>
</template>
