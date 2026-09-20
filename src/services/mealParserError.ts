/** An error whose message is written for the user and shown in the chat as-is. */
export class MealParserError extends Error {
  constructor(message: string, readonly detail?: string) {
    super(message);
    this.name = 'MealParserError';
  }
}
