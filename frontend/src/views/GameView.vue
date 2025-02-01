<script setup lang="ts">
import Avatar from '@/components/Avatar.vue';
import Chat from '@/components/Chat.vue';
import Chessboard, { type Piece } from '@/components/Chessboard.vue';
import { getPrettyGameOverReason } from '@/core/game';
import router from '@/router';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';
import { useGameStore } from '@/stores/game.store';
import { type Color, type PieceSymbol, type Square } from 'chess.js';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';

const gameStore = useGameStore();
const chatStore = useChatStore();
const authStore = useAuthStore();

const { fen, turn, gameOver, orientation, playersInfo, mmssClocks, lastMove, metadata } =
  storeToRefs(gameStore);

// Statically store players' info for convenience, since they won't change during the game
const me = playersInfo.value!.me;
const opponent = playersInfo.value!.opponent;

// Chessboard props
const allowedMoves = ref<Square[]>([]);
const allowedPremoves = ref<Square[]>([]);
const attackedSquares = ref<Square[]>([]);
const premove = ref<{ from: Square; to: Square } | undefined>(undefined);
const selectedSquare = ref<Square | undefined>(undefined);
const draggedPiece = ref<Piece | undefined>(undefined);
const isPromoting = ref<{ from: Square; to: Square; color: Color } | undefined>(undefined);

const gameResult = computed<string | undefined>(() => {
  if (!gameOver.value) {
    return undefined;
  }
  let outcome = gameOver.value.winnerAccountId
    ? gameOver.value.winnerAccountId === me.id
      ? 'Victory'
      : 'Defeat'
    : 'Draw';

  return `${outcome} (${getPrettyGameOverReason(gameOver.value.gameOverReason)})`;
});

// Premove and update variables when turn changes
watch(
  turn,
  async (newTurn) => {
    allowedMoves.value = [];
    allowedPremoves.value = [];

    executePremove();
    if (selectedSquare.value) {
      allowedMoves.value = calculateAllowedMoves(selectedSquare.value);
    }
    attackedSquares.value = calculateAttackedKingSquares(newTurn);
  },
  { immediate: true }
);

async function clickSquare(square: Square, chosenPromotion?: PieceSymbol): Promise<void> {
  const pieceAtSquare = gameStore.getPieceAtSquare(square);
  premove.value = undefined;

  // Premove
  if (selectedSquare.value && allowedPremoves.value.includes(square) && me.color !== turn.value) {
    premove.value = { from: selectedSquare.value, to: square };
    allowedPremoves.value = [];
    selectedSquare.value = undefined;
    return;
  }

  // Click on player's own piece
  if (pieceAtSquare && pieceAtSquare.color === me.color) {
    selectedSquare.value = square;
    draggedPiece.value =
      me.color === 'w' ? (pieceAtSquare.type.toUpperCase() as Piece) : pieceAtSquare.type;
    if (me.color === turn.value) {
      allowedMoves.value = calculateAllowedMoves(square);
    } else {
      allowedPremoves.value = gameStore.getPremoves(square);
    }
    return;
  }

  // Move
  if (selectedSquare.value && allowedMoves.value.includes(square)) {
    const moves = gameStore
      .getMoves(selectedSquare.value)
      .filter((move) => move.from === selectedSquare.value && move.to === square);
    // If the move is a promotion, prompt the user to choose a piece and do not proceed further:
    // handleClickSquare will be called again with the chosen promotion and move will be finally executed
    if (!chosenPromotion && moves.some((move) => move.promotion)) {
      isPromoting.value = { from: selectedSquare.value, to: square, color: me.color };
      return;
    }
    const [from, to] = [selectedSquare.value, square];
    selectedSquare.value = undefined;
    allowedMoves.value = [];
    await gameStore.movePiece({ from, to, promotion: chosenPromotion });
  }
}

async function release(square?: Square): Promise<void> {
  draggedPiece.value = undefined;
  if (
    !square ||
    selectedSquare.value === square ||
    (!allowedMoves.value.includes(square) && !allowedPremoves.value.includes(square))
  ) {
    return;
  }
  if (selectedSquare.value) {
    clickSquare(square);
  }
}

async function promote(promotion: PieceSymbol): Promise<void> {
  if (!isPromoting.value) {
    return;
  }
  await clickSquare(isPromoting.value.to, promotion);
  isPromoting.value = undefined;
}

async function executePremove(): Promise<void> {
  if (!premove.value) {
    return;
  }
  const { from, to } = premove.value;
  const isPromotion = gameStore
    .getMoves(selectedSquare.value as Square)
    .filter((move) => move.from === from && move.to === to)
    .some((move) => move.promotion);
  premove.value = undefined;
  await gameStore.movePiece({
    from,
    to,
    // Always promote to a queen when premoving
    promotion: isPromotion ? 'q' : undefined
  });
}

function calculateAttackedKingSquares(turn: Color): Square[] {
  return gameStore
    .getBoard()
    .map((rank) =>
      rank
        .filter(
          (boardSquare) =>
            boardSquare &&
            boardSquare.type === 'k' &&
            boardSquare.color === turn &&
            gameStore.isAttacked(boardSquare.square, turn === 'w' ? 'b' : 'w')
        )
        .map((square) => square!.square)
    )
    .flat();
}

function calculateAllowedMoves(square: Square): Square[] {
  return gameStore.getMoves(square as Square).map((move) => move.to);
}
</script>

<template>
  <div
    class="flex-col md:flex-row w-full flex h-screen items-center justify-center bg-blue-900 text-2xl overflow-hidden"
  >
    <div class="hidden flex-1 md:block"></div>

    <!-- #### START mobile only section #### -->
    <div class="md:hidden w-full flex flex-col items-center bg-blue-700 text-lg">
      <div class="w-full flex items-center h-12 p-1 pr-0">
        <Avatar :string="opponent.id"></Avatar>
        <div class="ml-2 break-word">
          {{ opponent.username }}
          {{ metadata?.ranked ? `(${opponent.elo})` : '' }}
        </div>
      </div>
      <div class="h-11 text-4xl" :class="{ 'text-gray-500': turn === me.color }">
        {{ mmssClocks[opponent.color] }}
      </div>
    </div>
    <!-- #### END mobile only section #### -->

    <div class="flex-1 w-full md:w-auto">
      <Chessboard
        :fen="fen"
        :orientation="orientation"
        :allowedMoves="allowedMoves"
        :allowedPremoves="allowedPremoves"
        :selected-square="selectedSquare"
        :draggedPiece="draggedPiece"
        :lastMove="lastMove"
        :premove="premove"
        :isPromoting="isPromoting?.color"
        :attacked-squares="attackedSquares"
        :pause="!!gameOver"
        @click-square="(square) => clickSquare(square as Square)"
        @release="(square) => release(square as Square)"
        @promote="(piece) => promote(piece as PieceSymbol)"
      ></Chessboard>
    </div>

    <!-- #### START mobile only section #### -->
    <div
      v-if="!!gameOver"
      class="md:hidden mb-2 text-xl"
      :class="{
        'text-green-400': gameOver.winnerAccountId === me.id,
        'text-red-400': gameOver.winnerAccountId === opponent.id
      }"
    >
      {{ gameResult }}
    </div>
    <div class="md:hidden w-full flex flex-col items-center bg-blue-700 text-lg">
      <div class="h-11 text-4xl" :class="{ 'text-gray-500': turn !== me.color }">
        {{ mmssClocks[me.color] }}
      </div>
      <div class="w-full flex items-center h-12 p-1 pr-0">
        <Avatar :string="authStore.account.id"></Avatar>
        <div class="flex-1 ml-2">{{ metadata?.ranked ? `(${me.elo})` : '' }}</div>
        <div>
          <button class="text-lg" v-if="!gameOver" @click="gameStore.resign()">Resign</button>
          <button class="text-lg" v-if="gameOver" @click="router.push('/')">Back</button>
        </div>
      </div>
    </div>
    <!-- #### END mobile only section #### -->

    <!-- #### START desktop only section #### -->
    <div
      class="hidden md:flex flex-1 flex-col bg-blue-700 rounded shadow-lg px-4 pt-5 pb-4 sm:p-6 sm:pb-4 space-y-4 w-1/2 mr-24 ml-12 h-full"
    >
      <div class="flex h-16 items-center">
        <Avatar :string="opponent.id"></Avatar>
        <div class="ml-2 break-word">
          {{ opponent.username }}
          {{ metadata?.ranked ? `(${opponent.elo})` : '' }}
        </div>
      </div>

      <div class="text-6xl bg-blue-900 rounded p-4" :class="{ 'text-gray-500': turn === me.color }">
        {{ mmssClocks[opponent.color] }}
      </div>

      <div class="flex-1 flex-grow overflow-hidden">
        <Chat
          v-if="!gameStore.game?.vsAi"
          :chat-messages="chatStore.messages"
          @send-message="
            (message: string) => chatStore.sendGameChatMessage(message, gameStore.game!.id)
          "
        ></Chat>
      </div>

      <div class="text-6xl bg-blue-900 rounded p-4" :class="{ 'text-gray-500': turn !== me.color }">
        {{ mmssClocks[me.color] }}
      </div>

      <div class="flex h-16 items-center">
        <Avatar :string="authStore.account.id"></Avatar>
        <div class="ml-2 break-word">
          {{ me.username }} {{ metadata?.ranked ? `(${me.elo})` : '' }}
        </div>
      </div>
      <div
        v-if="!!gameOver"
        class="hidden md:block"
        :class="{
          'text-green-400': gameOver.winnerAccountId === me.id,
          'text-red-400': gameOver.winnerAccountId === opponent.id
        }"
      >
        {{ gameResult }}
      </div>
      <div>
        <button v-if="!gameOver" @click="gameStore.resign()">Resign</button>
        <button v-if="!!gameOver" @click="router.push('/')">Back</button>
      </div>
    </div>
    <!-- #### END desktop only section #### -->
  </div>
</template>
