import { supabase } from './supabaseClient';

export interface SyncAction {
  id: string;
  table: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  createdAt: number;
}

class SyncManager {
  private queue: SyncAction[] = [];
  private listeners: ((queueSize: number) => void)[] = [];

  constructor() {
    this.loadQueue();
    window.addEventListener('online', this.processQueue.bind(this));
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem('flowwork_sync_queue');
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (e) {
      this.queue = [];
    }
  }

  private saveQueue() {
    localStorage.setItem('flowwork_sync_queue', JSON.stringify(this.queue));
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l(this.queue.length));
  }

  subscribe(listener: (queueSize: number) => void) {
    this.listeners.push(listener);
    listener(this.queue.length);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  async enqueue(action: Omit<SyncAction, 'id' | 'createdAt'>) {
    const fullAction: SyncAction = {
      ...action,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    
    // If online, try immediate sync
    if (navigator.onLine) {
      const success = await this.executeAction(fullAction);
      if (success) return;
    }
    
    // Otherwise add to queue
    this.queue.push(fullAction);
    this.saveQueue();
  }

  async processQueue() {
    if (!navigator.onLine || this.queue.length === 0) return;
    
    console.log('🔄 Processing sync queue: ' + this.queue.length + ' items');
    const newQueue = [...this.queue];
    
    for (let i = 0; i < newQueue.length; i++) {
      const action = newQueue[i];
      const success = await this.executeAction(action);
      if (success) {
        // remove from this queue copy
        const currentIdx = this.queue.findIndex(a => a.id === action.id);
        if (currentIdx > -1) {
          this.queue.splice(currentIdx, 1);
          this.saveQueue();
        }
      } else {
        // Stop processing on first hard fail to maintain order
        break;
      }
    }
  }

  private async executeAction(action: SyncAction): Promise<boolean> {
    try {
      let result;
      switch (action.type) {
        case 'INSERT':
          result = await supabase.from(action.table).insert(action.payload);
          break;
        case 'UPDATE':
          result = await supabase.from(action.table).update(action.payload).eq('id', action.payload.id);
          break;
        case 'DELETE':
          result = await supabase.from(action.table).delete().eq('id', action.payload.id);
          break;
      }
      
      if (result?.error) {
        console.error('Sync error:', result.error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Execute action failed:', e);
      return false;
    }
  }
}

export const syncManager = new SyncManager();
