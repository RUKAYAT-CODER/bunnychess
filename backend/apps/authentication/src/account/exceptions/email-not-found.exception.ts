export class EmailNotFoundException extends Error {
  constructor(message = 'Email not found') {
    super(message);
    this.name = EmailNotFoundException.name;
  }
}
