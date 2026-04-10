/**
 * Classe base abstrata para todas as exceções de domínio.
 *
 * Cada subclasse declara seu próprio `statusCode` HTTP, mantendo o
 * AllExceptionsFilter completamente agnóstico a exceções concretas
 * (Open/Closed Principle — aberto para extensão, fechado para modificação).
 */
export abstract class DomainException extends Error {
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // Necessário para que instanceof funcione corretamente com classes estendidas em ES5
    Object.setPrototypeOf(this, new.target.prototype);
  }
}