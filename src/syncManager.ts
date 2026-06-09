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
    
    console.log(`📥 [SyncManager DEBUG] Enqueuing new action: [${action.type}] for table "${action.table}"`);

    // If online, try immediate sync
    if (navigator.onLine) {
      console.log(`🌐 [SyncManager DEBUG] Device is ONLINE. Attempting immediate execution for action: [${action.type}]`);
      const success = await this.executeAction(fullAction);
      if (success) {
        console.log(`🚀 [SyncManager DEBUG] Immediate sync SUCCESS for table "${action.table}"`);
        return;
      } else {
        console.warn(`⏳ [SyncManager DEBUG] Immediate sync failed. Storing in queue for automatic retry...`);
      }
    } else {
      console.log(`🔌 [SyncManager DEBUG] Device is OFFLINE. Saving action to local sync queue.`);
    }
    
    // Otherwise add to queue
    this.queue.push(fullAction);
    this.saveQueue();
  }

  async processQueue() {
    if (!navigator.onLine) {
      console.log('🔌 [SyncManager DEBUG] Skipping queue processing. Device is currently OFFLINE.');
      return;
    }
    if (this.queue.length === 0) {
      console.log('ℹ️ [SyncManager DEBUG] Sync queue is empty. No items to process.');
      return;
    }
    
    console.log(`🔄 [SyncManager DEBUG] Processing sync queue: ${this.queue.length} items remaining...`);
    const newQueue = [...this.queue];
    
    for (let i = 0; i < newQueue.length; i++) {
      const action = newQueue[i];
      console.log(`👉 [SyncManager DEBUG] (${i + 1}/${newQueue.length}) Processing action [${action.type}] for table "${action.table}"`);
      
      const success = await this.executeAction(action);
      if (success) {
        // remove from this queue copy
        const currentIdx = this.queue.findIndex(a => a.id === action.id);
        if (currentIdx > -1) {
          this.queue.splice(currentIdx, 1);
          this.saveQueue();
          console.log(`✅ [SyncManager DEBUG] Successfully synced and cleared item from queue. Remaining: ${this.queue.length}`);
        }
      } else {
        console.error(`❌ [SyncManager DEBUG] Stopped queue processing at item ${i + 1} to preserve dependency ordering.`);
        break;
      }
    }
  }

  private async executeAction(action: SyncAction): Promise<boolean> {
    const startTime = Date.now();
    console.log(`📡 [SyncManager DEBUG Execute] Sending [${action.type}] for table "${action.table}"...`);
    
    try {
      let result: any;
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
      
      const duration = Date.now() - startTime;
      
      if (result?.error) {
        console.error(`❌ [SyncManager DEBUG Sync Error] Table "${action.table}" [${action.type}] execution failed in ${duration}ms:`, {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
          statusCode: result.status,
          statusText: result.statusText
        });
        return false;
      }
      
      console.log(`✅ [SyncManager DEBUG Sync Success] Table "${action.table}" [${action.type}] executed successfully in ${duration}ms. Status: ${result?.status || 200}`);
      return true;
    } catch (e: any) {
      const duration = Date.now() - startTime;
      console.error(`🚨 [SyncManager DEBUG Sync Exception] Fatal connection/internal exception in ${duration}ms:`, {
        message: e?.message || String(e),
        stack: e?.stack
      });
      return false;
    }
  }
}

export const syncManager = new SyncManager();
