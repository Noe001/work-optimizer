declare module '@rails/actioncable' {
  export interface Subscription {
    unsubscribe(): void;
    perform(action: string, data?: any): void;
  }

  export interface Consumer {
    subscriptions: {
      create(
        channel: string | { channel: string; [key: string]: any },
        callbacks?: {
          connected?(): void;
          disconnected?(): void;
          received?(data: any): void;
          [key: string]: any;
        }
      ): Subscription;
    };
  }

  export function createConsumer(url?: string): Consumer;
}
