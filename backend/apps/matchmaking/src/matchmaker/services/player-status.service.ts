import { Injectable } from '@nestjs/common';
import { MatchmakingStatus } from '../model/matchmaking-status.interface';
import { PlayerStatusRepositoryService } from '../repositories/player-status.repository.service';

@Injectable()
export class PlayerStatusService {
  constructor(private readonly playerStatusRepository: PlayerStatusRepositoryService) {}

  /**
   * Set new player statuses.
   *
   * @param statusUpdates an array of status updates to be applied
   */
  async setPlayerStatuses(
    statusUpdates: {
      accountId: string;
      newStatus: Partial<MatchmakingStatus>;
      expireInSeconds?: number;
    }[],
  ): Promise<void> {
    await this.playerStatusRepository.setPlayerStatuses(statusUpdates);
  }

  /**
   * Delete player statuses by account ids.
   *
   * @param accountIds an array of account ids whose statuses should be deleted
   * @returns number of deleted statuses
   */
  async deletePlayerStatuses(accountIds: string[]): Promise<number> {
    return this.playerStatusRepository.deletePlayerStatuses(accountIds);
  }

  /**
   * Delete player statuses only if they are playing a game.
   * Do nothing for players who are not playing a game, in order not to wrongly delete their statuses.
   *
   * @param param account ids of players busy playing a game
   * @returns number of deleted statuses
   */
  async deletePlayingPlayerStatuses(param: {
    accountId0: string;
    accountId1: string;
    gameId: string;
  }): Promise<number> {
    return this.playerStatusRepository.deletePlayingPlayerStatuses(param);
  }

  /**
   * Return a player's status by account id.
   *
   * @param accountId account id
   * @returns player status
   */
  async getPlayerStatus(accountId: string): Promise<MatchmakingStatus> {
    return this.playerStatusRepository.getPlayerStatus(accountId);
  }
}
