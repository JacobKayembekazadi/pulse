// ============================================================================
// STORAGE SERVICE - Persistent Data Layer
// Uses localStorage with structure ready for backend migration
// ============================================================================

type StorageKey =
  | 'nexus-accounts'
  | 'nexus-contacts'
  | 'nexus-conversations'
  | 'nexus-templates'
  | 'nexus-sops'
  | 'nexus-campaigns'
  | 'nexus-competitors'
  | 'nexus-analytics'
  | 'nexus-engagements'
  | 'nexus-settings';

class StorageService {
  private cache: Map<string, any> = new Map();

  // Generic get with type safety
  get<T>(key: StorageKey, defaultValue: T): T {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    if (typeof window === 'undefined') {
      return defaultValue;
    }

    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache.set(key, parsed);
        return parsed as T;
      }
    } catch (e) {
      console.warn(`Error reading ${key} from localStorage:`, e);
    }

    return defaultValue;
  }

  // Generic set with immediate persistence
  set<T>(key: StorageKey, value: T): void {
    this.cache.set(key, value);

    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Error writing ${key} to localStorage:`, e);
    }
  }

  // Update specific item in array
  updateItem<T extends { id: string }>(key: StorageKey, id: string, updates: Partial<T>): T | null {
    const items = this.get<T[]>(key, []);
    const index = items.findIndex(item => item.id === id);

    if (index === -1) return null;

    const updated = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    items[index] = updated;
    this.set(key, items);

    return updated;
  }

  // Add item to array
  addItem<T extends { id: string }>(key: StorageKey, item: T): T {
    const items = this.get<T[]>(key, []);
    const withTimestamp = {
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    items.push(withTimestamp);
    this.set(key, items);
    return withTimestamp;
  }

  // Remove item from array
  removeItem<T extends { id: string }>(key: StorageKey, id: string): boolean {
    const items = this.get<T[]>(key, []);
    const filtered = items.filter(item => item.id !== id);

    if (filtered.length === items.length) return false;

    this.set(key, filtered);
    return true;
  }

  // Get single item by ID
  getItem<T extends { id: string }>(key: StorageKey, id: string): T | null {
    const items = this.get<T[]>(key, []);
    return items.find(item => item.id === id) || null;
  }

  // Clear specific key
  clear(key: StorageKey): void {
    this.cache.delete(key);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }

  // Clear all NEXUS data
  clearAll(): void {
    const keys: StorageKey[] = [
      'nexus-accounts',
      'nexus-contacts',
      'nexus-conversations',
      'nexus-templates',
      'nexus-sops',
      'nexus-campaigns',
      'nexus-competitors',
      'nexus-analytics',
      'nexus-engagements',
      'nexus-settings'
    ];

    keys.forEach(key => this.clear(key));
  }

  // Generate unique ID
  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const storage = new StorageService();
