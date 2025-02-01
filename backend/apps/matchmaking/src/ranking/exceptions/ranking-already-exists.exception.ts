export class RankingAlreadyExistsException extends Error {
  constructor(message = 'Ranking record already exists') {
    super(message);
    this.name = RankingAlreadyExistsException.name;
  }
}
