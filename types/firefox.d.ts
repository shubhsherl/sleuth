/**
 * Firefox browser API declarations
 */

declare namespace browser {
  namespace storage {
    interface StorageArea {
      get(keys: string | string[] | null): Promise<any>;
      get(callback: (items: { [key: string]: any }) => void): void;
      get(keys: string | string[] | null, callback: (items: { [key: string]: any }) => void): void;
      
      set(items: { [key: string]: any }): Promise<void>;
      set(items: { [key: string]: any }, callback?: () => void): void;
      
      remove(keys: string | string[]): Promise<void>;
      remove(keys: string | string[], callback?: () => void): void;
      
      clear(): Promise<void>;
      clear(callback?: () => void): void;
    }
    
    const local: StorageArea;
    const sync: StorageArea;
  }
} 