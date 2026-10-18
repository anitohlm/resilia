/**
 * Resilia Durable Event Queue & Local-First Writes
 * Guarantees every offline write is durably stored in IndexedDB with a unique event ID,
 * marked PENDING, and preserved across browser restarts.
 */

import { localDB, STORES } from './db';
import { SyncEvent, SyncOperation } from '../../types';

// Persistent client device ID in localStorage or generated UUID
export function getOrCreateDeviceId(): string {
  const STORAGE_KEY = 'resilia_device_id';
  let deviceId = localStorage.getItem(STORAGE_KEY);
  if (!deviceId) {
    deviceId = 'dev_' + crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  return deviceId;
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'uuid_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export class EventQueueService {
  /**
   * Records a local-first write to an entity store AND records an idempotent sync event
   * in the durable pending event queue.
   */
  public static async recordLocalWrite<T extends { id: string }>(
    entityType: SyncEvent['entity_type'],
    entityStore: (typeof STORES)[keyof typeof STORES],
    entity: T,
    operation: SyncOperation,
    actorId: string
  ): Promise<{ entity: T; event: SyncEvent }> {
    const deviceId = getOrCreateDeviceId();
    const eventId = 'evt_' + generateUUID();

    const event: SyncEvent = {
      event_id: eventId,
      entity_type: entityType,
      entity_id: entity.id,
      operation,
      payload: entity,
      origin_device_id: deviceId,
      actor_id: actorId,
      created_at: new Date().toISOString(),
      schema_version: 1,
      sync_status: 'PENDING',
      retry_count: 0,
    };

    // 1. Write the entity to local storage
    if (operation === 'DELETE') {
      await localDB.delete(entityStore, entity.id);
    } else {
      await localDB.put(entityStore, entity);
    }

    // 2. Put event into durable pending events queue
    await localDB.put(STORES.SYNC_EVENTS, event);

    // 3. Emit change notification for reactive UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resilia_local_write', { detail: { event, entity } }));
    }

    return { entity, event };
  }

  /**
   * Queues a sync event for an entity whose primary local copy is persisted elsewhere
   * (e.g. safety check-ins kept in localStorage). The event itself is durably stored in
   * IndexedDB and delivered by the normal sync client.
   */
  public static async enqueueEvent(
    entityType: SyncEvent['entity_type'],
    entity: { id: string },
    operation: SyncOperation,
    actorId: string
  ): Promise<SyncEvent> {
    const event: SyncEvent = {
      event_id: 'evt_' + generateUUID(),
      entity_type: entityType,
      entity_id: entity.id,
      operation,
      payload: entity,
      origin_device_id: getOrCreateDeviceId(),
      actor_id: actorId,
      created_at: new Date().toISOString(),
      schema_version: 1,
      sync_status: 'PENDING',
      retry_count: 0,
    };
    await localDB.put(STORES.SYNC_EVENTS, event);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resilia_local_write', { detail: { event, entity } }));
    }
    return event;
  }

  /**
   * Retrieves all pending events waiting for cloud synchronization.
   */
  public static async getPendingEvents(): Promise<SyncEvent[]> {
    const all = await localDB.getAll<SyncEvent>(STORES.SYNC_EVENTS);
    return all.filter((e) => e.sync_status === 'PENDING' || e.sync_status === 'FAILED');
  }

  /**
   * Retrieves all events for inspection in the Sync Center.
   */
  public static async getAllEvents(): Promise<SyncEvent[]> {
    const all = await localDB.getAll<SyncEvent>(STORES.SYNC_EVENTS);
    return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Marks an event as SYNCED with server acknowledgment timestamp.
   */
  public static async markEventSynced(eventId: string, ackTimestamp: string): Promise<void> {
    const event = await localDB.get<SyncEvent>(STORES.SYNC_EVENTS, eventId);
    if (event) {
      event.sync_status = 'SYNCED';
      event.server_ack_at = ackTimestamp;
      await localDB.put(STORES.SYNC_EVENTS, event);
    }
  }

  /**
   * Marks an event as FAILED with error message and increments retry count.
   */
  public static async markEventFailed(eventId: string, errorMessage: string): Promise<void> {
    const event = await localDB.get<SyncEvent>(STORES.SYNC_EVENTS, eventId);
    if (event) {
      event.sync_status = 'FAILED';
      event.retry_count += 1;
      event.last_error = errorMessage;
      await localDB.put(STORES.SYNC_EVENTS, event);
    }
  }

  /**
   * Resets all failed events back to PENDING for manual retry.
   */
  public static async retryAllFailed(): Promise<number> {
    const all = await localDB.getAll<SyncEvent>(STORES.SYNC_EVENTS);
    const failed = all.filter((e) => e.sync_status === 'FAILED');
    for (const evt of failed) {
      evt.sync_status = 'PENDING';
      evt.last_error = undefined;
      await localDB.put(STORES.SYNC_EVENTS, evt);
    }
    return failed.length;
  }
}
