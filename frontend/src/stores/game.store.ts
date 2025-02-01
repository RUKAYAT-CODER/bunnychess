import { ChessAi } from '@/core/ai';
import { useChessClock } from '@/core/chess-clock';
import {
  checkGameOver,
  gameFromString,
  GameOverReason,
  type Game,
  type GameMetadata
} from '@/core/game';
import { isValidPremove } from '@/core/premove';
import { socket, type WsError } from '@/core/websocket';
import router from '@/router';
import { accountService } from '@/services/account.service';
import { Chess, type Color, type Move, type Piece, type PieceSymbol, type Square } from 'chess.js';
import { values, without } from 'lodash';
import { defineStore } from 'pinia';
import { markRaw, ref, watch } from 'vue';
import { useAuthStore } from './auth.store';
import { useChatStore } from './chat.store';

interface GameStateUpdate {
  gameId: string;
  move: string;
  seq: number;
  clocks: { w: number; b: number };
}

interface MovePiece {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
}

interface GameOver {
  winnerAccountId?: string;
  gameOverReason: string;
}

export interface PlayersInfo {
  me: { id: string; username: string; color: Color; elo?: number };
  opponent: { id: string; username: string; color: Color; elo?: number };
}

/**
 * Hold game data and provide game-related methods.
 */
export const useGameStore = defineStore('game', () => {
  const authStore = useAuthStore();
  const chatStore = useChatStore();

  const chess: Chess = markRaw(new Chess());
  let chessAi: ChessAi | undefined;
  let localSeq: number = 0;

  const chessClock = useChessClock({ w: 600000, b: 600000 }, 'w');
  const game = ref<Game | undefined>(undefined);
  const metadata = ref<GameMetadata | undefined>(undefined);
  const fen = ref<string>(chess.fen());
  const turn = ref<Color>(chess.turn());
  const orientation = ref<Color>('w');
  const playersInfo = ref<PlayersInfo | undefined>(undefined);
  const lastMove = ref<{ from: Square; to: Square } | undefined>(undefined);
  const gameOver = ref<GameOver | undefined>(undefined);

  /**
   * Join a game by its id, fetch players info, start clocks and navigate to game page;
   * if a Game object is passed, it will be used directly.
   *
   * @param gameOrGameId Game object or game id to join
   */
  async function joinGame(gameOrGameId: string | Game): Promise<void> {
    game.value =
      typeof gameOrGameId === 'string'
        ? gameFromString(
            await socket.emitWithAck('matchmaking:join-game', { gameId: gameOrGameId })
          )
        : gameOrGameId;
    if (game.value.vsAi) {
      chessAi = new ChessAi({
        skillLevel: game.value.vsAi,
        moveCallback: (move) => movePiece(move)
      });
    }

    metadata.value = JSON.parse(game.value.metadata);
    orientation.value = game.value.accountIds.w === authStore.account.id ? 'w' : 'b';
    chess.loadPgn(game.value.pgn);
    gameOver.value = undefined;
    localSeq = game.value.seq;
    updateGameStateRefs();
    await updatePlayersInfo();
    chessClock.set(game.value.gameClocks, chess.turn());
    chessClock.disabled.value = false;
    chessClock.start();
    chatStore.$reset();

    router.push({ path: '/game' });

    if (game.value.vsAi && playersInfo.value!.opponent.color === 'w') {
      chessAi!.makeMove(chess.fen());
    }
  }

  /**
   * Resign current game.
   */
  async function resign(): Promise<void> {
    if (!game.value) {
      return;
    }
    if (game.value.vsAi) {
      gameOver.value = {
        winnerAccountId: ChessAi.id,
        gameOverReason: GameOverReason.Resignation
      };
      chessClock.disabled.value = true;
      chessClock.pause();
      return;
    }
    try {
      await socket.emitWithAck('game:resign', { gameId: game.value.id });
    } catch (err) {
      console.error('Something went wrong while resigning', (err as Error).message);
    }
  }

  /**
   * Get piece at square.
   *
   * @param square chessboard square
   */
  function getPieceAtSquare(square: Square): Piece | undefined {
    return chess.get(square);
  }

  /**
   * Move a piece on the board.
   *
   * @param param requested move details
   */
  async function movePiece({ from, to, promotion }: MovePiece): Promise<void> {
    if (!game.value || gameOver.value) {
      return;
    }

    let move: Move;
    try {
      move = chess.move({ from, to, promotion });
    } catch (err) {
      // Invalid move, usually caused by premove
      return;
    }
    localSeq++;
    updateGameStateRefs();

    if (game.value.vsAi && chessAi) {
      // Need to locally increase clock time and check if game is over when playing against AI
      chessClock.press(game.value.gameRules.timeIncreasePerTurnMs);
      if (!checkLocalGameOver() && turn.value === playersInfo.value?.opponent.color) {
        chessAi.makeMove(chess.fen());
      }
      return;
    }

    try {
      await socket.emitWithAck('game:make-move', { gameId: game.value!.id, move: move.san });
      chessClock.press();
    } catch (err) {
      console.error('Something went wrong while making move', (err as WsError).message);
      localSeq--;
      chess.undo();
      updateGameStateRefs();
    }
  }

  /**
   * Get possible moves for piece located at square.
   *
   * @param square piece square
   */
  function getMoves(square: Square): Move[] {
    return chess.moves({ square, verbose: true });
  }

  /**
   * Get premoves for piece located at square.
   *
   * @param square square of the piece
   */
  function getPremoves(square: Square): Square[] {
    const premoves: Square[] = [];
    for (const file of 'abcdefgh') {
      for (const rank of '12345678') {
        const to = `${file}${rank}` as Square;
        if (isValidPremove(square as Square, to, chess)) {
          premoves.push(to);
        }
      }
    }
    return premoves;
  }

  /**
   * Return current board status.
   */
  function getBoard(): ({
    square: Square;
    type: PieceSymbol;
    color: Color;
  } | null)[][] {
    return chess.board();
  }

  /**
   * Return whether a piece at square is attacked or not.
   *
   * @param square square to check
   * @param turn attacking color
   * @returns whether square is attacked or not
   */
  function isAttacked(square: Square, turn: Color): boolean {
    return chess.isAttacked(square, turn);
  }

  // Emit game check event to server when clock ends
  watch(
    chessClock.timedOutColor,
    (timedOutColor) => {
      if (!game.value) {
        return;
      }
      if (timedOutColor) {
        if (game.value.vsAi) {
          gameOver.value = {
            winnerAccountId:
              timedOutColor === playersInfo.value!.me.color ? ChessAi.id : playersInfo.value!.me.id,
            gameOverReason:
              timedOutColor === 'w' ? GameOverReason.WhiteTimeout : GameOverReason.BlackTimeout
          };
        } else {
          socket.emit('game:check-result', { gameId: game.value.id });
        }
      }
    },
    { immediate: true }
  );

  /**
   * Bind WebSocket events.
   */
  function bindEvents(): void {
    socket.on('game:game-start', async ({ gameId }) => {
      await joinGame(gameId);
    });

    socket.on('game:game-state-update', ({ gameId, move, seq, clocks }: GameStateUpdate) => {
      if (gameId !== game.value?.id) {
        console.error('Received game state update for different game');
        return;
      }
      // Either my own move or duplicated message: just update clocks
      if (seq === localSeq) {
        chessClock.set(clocks);
        chessClock.start();
        return;
      }
      // Opponent's move
      if (seq === localSeq + 1) {
        chess.move(move);
        localSeq = seq;
        chessClock.set(clocks);
        chessClock.press();
        updateGameStateRefs();
        return;
      }
      console.error(`Game is out of sync: localSeq = ${localSeq}, received seq = ${seq}`);
    });

    socket.on('game:game-over', ({ gameId, winnerAccountId, gameOverReason }) => {
      if (gameId !== game.value?.id) {
        console.error('Received game over event for different game');
        return;
      }
      gameOver.value = { winnerAccountId, gameOverReason };
      chessClock.disabled.value = true;
      chessClock.pause();
    });
  }

  // Update refs with current chess game state
  function updateGameStateRefs(): void {
    fen.value = chess.fen();
    turn.value = chess.turn();
    lastMove.value = chess
      .history({ verbose: true })
      .map(({ from, to }) => ({ from, to }))
      .pop();
  }

  // When playing against AI, locally check if game is over
  function checkLocalGameOver(): boolean {
    const gameOverReason = checkGameOver(chess);
    if (gameOverReason) {
      gameOver.value = {
        winnerAccountId:
          gameOverReason === GameOverReason.Checkmate
            ? turn.value === playersInfo.value!.me.color
              ? ChessAi.id
              : authStore.account.id
            : undefined,
        gameOverReason
      };
      chessClock.disabled.value = true;
      chessClock.pause();
      return true;
    }
    return false;
  }

  // Fetch players' info from server
  async function updatePlayersInfo(): Promise<void> {
    if (!game.value) {
      return;
    }
    const myInfo = {
      me: {
        id: authStore.account.id,
        username: authStore.account.username,
        color: orientation.value,
        elo: authStore.account.mmr
      }
    };
    if (game.value.vsAi) {
      playersInfo.value = {
        ...myInfo,
        opponent: {
          id: ChessAi.id,
          username: chessAi!.username,
          color: orientation.value === 'w' ? 'b' : 'w'
        }
      };
    } else {
      await accountService
        .get(without(values(game.value.accountIds), authStore.account.id)[0])
        .then((opponentAccount) => {
          playersInfo.value = {
            ...myInfo,
            opponent: {
              id: opponentAccount.id,
              username: opponentAccount.username,
              color: orientation.value === 'w' ? 'b' : 'w',
              elo: opponentAccount.mmr
            }
          };
        });
    }
  }

  return {
    game,
    metadata,
    fen,
    turn,
    orientation,
    playersInfo,
    gameOver,
    lastMove,
    mmssClocks: chessClock.mmssClocks,

    joinGame,
    getPremoves,
    getMoves,
    getBoard,
    isAttacked,
    resign,
    getPieceAtSquare,
    movePiece,
    bindEvents
  };
});
