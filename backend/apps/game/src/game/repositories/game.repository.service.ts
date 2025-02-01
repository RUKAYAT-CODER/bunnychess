import { InjectRedis } from '@nestjs-modules/ioredis';
import { readFileSync } from 'fs';
import { Redis } from 'ioredis';
import { join } from 'path';
import { ConcurrentMoveException } from '../exceptions/concurrent-move.exception';
import { ChessGame } from '../model/chess-game';

interface GameRedis extends Redis {
  updateGame: (gameKey: string, gameRepr: string, seq: number) => Promise<number>;
}

export class GameRepositoryService {
  constructor(@((InjectRedis as any)()) private readonly redis: GameRedis) {
    this.redis.defineCommand('updateGame', {
      lua: readFileSync(join(__dirname, 'game/lua-scripts/update-game.lua'), 'utf-8'),
      numberOfKeys: 1,
    });
  }

  async storeGame(chessGame: ChessGame): Promise<void> {
    const gameKey = this.getGameKey(chessGame.id);
    const transaction = this.redis.multi();
    transaction.hset(gameKey, 'gameRepr', chessGame.toString(), 'seq', chessGame.seq);
    transaction.expire(gameKey, 86400); // 1 day
    await transaction.exec();
  }

  async findGame(gameId: string): Promise<ChessGame | undefined> {
    const gameRepr = await this.redis.hget(this.getGameKey(gameId), 'gameRepr');
    return gameRepr ? ChessGame.fromString(gameRepr) : undefined;
  }

  async deleteGame(gameId: string): Promise<void> {
    await this.redis.del(this.getGameKey(gameId));
  }

  async updateGame(chessGame: ChessGame): Promise<void> {
    const result = await this.redis.updateGame(
      this.getGameKey(chessGame.id),
      chessGame.toString(),
      chessGame.seq,
    );
    if (result === 0) {
      throw new ConcurrentMoveException(
        `Trying to update game ${chessGame.id} with same seq number`,
      );
    }
  }

  private getGameKey(gameId: string): string {
    return `game:chess-game:${gameId}:status`;
  }
}
