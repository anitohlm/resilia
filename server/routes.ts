/**
 * Resilia REST API Router
 * Versioned endpoints under /api/v1/*
 */

import { Router } from 'express';
import { ai } from './gemini';
import { cloudStore } from './store';
import { ServerAgentOrchestrator } from './agents';

export const apiRouter = Router();

// --- 1. HEALTH & PROVIDER STATUS ---
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    service: 'Resilia Community Resilience Backend',
    timestamp: new Date().toISOString(),
    aiProvider: {
      configured: !!ai,
      model: 'gemini-3.8-flash',
    },
  });
});

// In-memory sliding window rate limiter for expensive AI inference (15 requests per 60s per IP)
const aiRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkAiRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 20;

  const current = aiRateLimitMap.get(ip);
  if (!current || now > current.resetAt) {
    aiRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

// --- 2. AI AGENTS ---
apiRouter.post('/ai/ask', async (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

  if (!checkAiRateLimit(clientIp)) {
    return res.status(429).json({
      error: 'Too many AI inquiries. Please wait a moment before asking again or use local offline emergency knowledge.',
      retryAfterSeconds: 60,
    });
  }

  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query string is required.' });
  }

  try {
    const result = await ServerAgentOrchestrator.answerQuestion(query);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- 3. INCIDENTS ---
apiRouter.get('/incidents', (req, res) => {
  res.json({ incidents: Array.from(cloudStore.incidents.values()) });
});

apiRouter.post('/incidents', (req, res) => {
  const incident = req.body;
  if (!incident || !incident.id || typeof incident.title !== 'string' || !incident.type) {
    return res.status(400).json({ error: 'Valid incident object with id, title, and type is required.' });
  }

  // Validate coordinates
  const lat = Number(incident.lat);
  const lng = Number(incident.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: 'Incident must have valid numeric coordinates.' });
  }

  // Sanitize & enforce valid status
  const validStatuses = ['REPORTED', 'VERIFIED', 'RESOLVED', 'CONTRADICTED'];
  if (incident.status && !validStatuses.includes(incident.status)) {
    return res.status(400).json({ error: `Invalid incident status: ${incident.status}` });
  }

  cloudStore.incidents.set(incident.id, incident);
  res.status(201).json({ status: 'created', incident });
});

// --- 4. ASSISTANCE REQUESTS ---
apiRouter.get('/assistance', (req, res) => {
  res.json({ requests: Array.from(cloudStore.assistanceRequests.values()) });
});

apiRouter.post('/assistance', (req, res) => {
  const request = req.body;
  if (!request || !request.id || typeof request.residentName !== 'string' || !request.category) {
    return res.status(400).json({ error: 'Valid assistance request object with id, residentName, and category is required.' });
  }

  // Validate and sanitize count
  const peopleCount = Math.max(1, Math.floor(Number(request.peopleCount) || 1));
  request.peopleCount = peopleCount;

  cloudStore.assistanceRequests.set(request.id, request);
  res.status(201).json({ status: 'created', request });
});

// --- 5. SHELTERS ---
apiRouter.get('/shelters', (req, res) => {
  res.json({ shelters: Array.from(cloudStore.shelters.values()) });
});

apiRouter.patch('/shelters/:id/capacity', (req, res) => {
  const { id } = req.params;
  const { occupancy, actorRole } = req.body;

  // Authorization check: Must explicitly be COORDINATOR
  if (!actorRole || actorRole !== 'COORDINATOR') {
    return res.status(403).json({ error: 'Permission Denied: Only Disaster Coordinators can adjust shelter capacity.' });
  }

  const shelter = cloudStore.shelters.get(id);
  if (!shelter) {
    return res.status(404).json({ error: 'Shelter not found.' });
  }

  const numericOccupancy = Number(occupancy);
  if (!Number.isFinite(numericOccupancy) || numericOccupancy < 0) {
    return res.status(400).json({ error: 'Occupancy must be a non-negative number.' });
  }

  shelter.capacityCurrent = Math.floor(numericOccupancy);
  if (shelter.capacityCurrent >= shelter.capacityTotal) {
    shelter.status = 'FULL';
  } else if (shelter.capacityCurrent >= shelter.capacityTotal * 0.85) {
    shelter.status = 'NEAR_CAPACITY';
  } else {
    shelter.status = 'OPEN';
  }
  shelter.lastUpdated = new Date().toISOString();
  cloudStore.shelters.set(id, shelter);
  res.json({ status: 'updated', shelter });
});

// --- 6. RESOURCES ---
apiRouter.get('/resources', (req, res) => {
  res.json({ resources: Array.from(cloudStore.resources.values()) });
});

// --- 7. MISSIONS ---
const SERVER_MISSION_TRANSITIONS: Record<string, string[]> = {
  PROPOSED: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['ASSIGNED', 'ACCEPTED', 'CANCELLED'],
  ASSIGNED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

apiRouter.get('/missions', (req, res) => {
  res.json({ missions: Array.from(cloudStore.missions.values()) });
});

apiRouter.patch('/missions/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, actorName, actorRole, note } = req.body;
  const mission = cloudStore.missions.get(id);
  if (!mission) {
    return res.status(404).json({ error: 'Mission not found.' });
  }

  // State machine transition validation
  const allowedNext = SERVER_MISSION_TRANSITIONS[mission.status] || [];
  if (!allowedNext.includes(status)) {
    return res.status(400).json({
      error: `Invalid mission state transition from ${mission.status} to ${status}. Allowed: ${allowedNext.join(', ') || 'None'}`
    });
  }

  // Role authorization checks
  if (status === 'APPROVED' || status === 'REJECTED' || status === 'ASSIGNED') {
    if (!actorRole || actorRole !== 'COORDINATOR') {
      return res.status(403).json({ error: `Only Coordinators can transition mission to ${status}.` });
    }
  }

  if (status === 'ACCEPTED' || status === 'IN_PROGRESS' || status === 'COMPLETED') {
    if (!actorRole || (actorRole !== 'RESPONDER' && actorRole !== 'COORDINATOR')) {
      return res.status(403).json({ error: `Only Responders or Coordinators can transition mission to ${status}.` });
    }
  }

  mission.status = status;
  mission.updatedAt = new Date().toISOString();
  mission.statusHistory.push({
    status,
    actorId: 'server',
    actorName: actorName || 'Coordinator',
    timestamp: mission.updatedAt,
    note,
  });
  cloudStore.missions.set(id, mission);
  res.json({ status: 'updated', mission });
});

// --- 8. SYNCHRONIZATION ---
apiRouter.post('/sync/upload', (req, res) => {
  const { events } = req.body;
  if (!Array.isArray(events)) {
    return res.status(400).json({ error: 'Array of events is required.' });
  }

  // Rate/resource protection: cap batch size to prevent memory exhaustion and DoS
  if (events.length > 100) {
    return res.status(400).json({ error: 'Event batch exceeds maximum limit of 100 items per request.' });
  }

  const result = cloudStore.processSyncEvents(events);
  res.json(result);
});

apiRouter.get('/sync/pull', (req, res) => {
  const since = typeof req.query.since === 'string' ? req.query.since : undefined;
  const changes = cloudStore.getChangesSince(since);
  res.json({ remoteRecords: changes, pulledAt: new Date().toISOString() });
});

// --- 9. AUDIT ---
apiRouter.get('/audit', (req, res) => {
  res.json({ auditEntries: cloudStore.auditEntries });
});

// --- 10. RESILIENCE ENDPOINTS ---
// Triage Records
apiRouter.get('/triage', (req, res) => {
  res.json({ triageRecords: Array.from(cloudStore.triageRecords.values()) });
});

apiRouter.post('/triage', (req, res) => {
  const record = req.body;
  if (!record || !record.id || !record.tagCode || !record.category) {
    return res.status(400).json({ error: 'Valid triage record with id, tagCode, and category is required.' });
  }
  cloudStore.triageRecords.set(record.id, record);
  res.status(201).json({ status: 'created', record });
});

// Ayuda & Ration Distributions
apiRouter.get('/ayuda', (req, res) => {
  res.json({ distributions: Array.from(cloudStore.rationDistributions.values()) });
});

apiRouter.post('/ayuda', (req, res) => {
  const dist = req.body;
  if (!dist || !dist.id || !dist.claimCode || !dist.packageType) {
    return res.status(400).json({ error: 'Valid ration distribution with id, claimCode, and packageType is required.' });
  }
  cloudStore.rationDistributions.set(dist.id, dist);
  res.status(201).json({ status: 'created', distribution: dist });
});

// Missing Persons & Family Kin
apiRouter.get('/missing-persons', (req, res) => {
  res.json({ missingPersons: Array.from(cloudStore.missingPersons.values()) });
});

apiRouter.post('/missing-persons', (req, res) => {
  const kin = req.body;
  if (!kin || !kin.id || !kin.fullName) {
    return res.status(400).json({ error: 'Valid missing person record with id and fullName is required.' });
  }
  cloudStore.missingPersons.set(kin.id, kin);
  res.status(201).json({ status: 'created', missingPerson: kin });
});

// Bayanihan Community Mutual Aid
apiRouter.get('/mutual-aid', (req, res) => {
  res.json({ posts: Array.from(cloudStore.mutualAidPosts.values()) });
});

apiRouter.post('/mutual-aid', (req, res) => {
  const post = req.body;
  if (!post || !post.id || !post.title || !post.type) {
    return res.status(400).json({ error: 'Valid mutual aid post with id, title, and type is required.' });
  }
  cloudStore.mutualAidPosts.set(post.id, post);
  res.status(201).json({ status: 'created', post });
});

// Outbreak Watch & Flood Exposure
apiRouter.get('/outbreak-watch', (req, res) => {
  res.json({ exposures: Array.from(cloudStore.outbreakWatch.values()) });
});

apiRouter.post('/outbreak-watch', (req, res) => {
  const exp = req.body;
  if (!exp || !exp.id || !exp.exposureTimestamp) {
    return res.status(400).json({ error: 'Valid flood exposure record with id and exposureTimestamp is required.' });
  }
  cloudStore.outbreakWatch.set(exp.id, exp);
  res.status(201).json({ status: 'created', exposure: exp });
});
