import Terminal from '@terminaldotshop/sdk';

type TerminalEnv = 'production' | 'dev';

export class ClientBuilder {
  private environment!: TerminalEnv;
  private token!: string;
  private client: Terminal | null = null;

  constructor() {}

  initialize() {
    if (this.environment && this.token) {
      this.client = new Terminal({
        environment: this.environment,
        bearerToken: this.token,
      });
    }
  }

  setEnvironment(environment: TerminalEnv) {
    this.environment = environment;
  }

  setToken(token: string) {
    this.token = token;
  }

  getClient() {
    return this.client;
  }

  operate() {
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    return this.client;
  }

  isInitialized() {
    return this.client !== null;
  }
}
