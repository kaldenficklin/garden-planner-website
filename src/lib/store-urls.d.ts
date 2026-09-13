export declare const APP_STORE: string;
export declare const PLAY_STORE: string;
export declare const STORE_PAGES: Record<string, { ppid: string; listing: string }>;
export declare function storeUrl(store: 'ios' | 'android', page?: string | null): string;
