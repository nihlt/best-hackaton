import type { IncomingMessage, ServerResponse } from 'node:http';
import type {
  AiAnalysis,
  AiAssistantResponse,
  AiUserAction,
  Solution,
  WorldState,
} from '../src/types/types';
import { buildAssistantFallback } from '../src/utils/assistantFallback';

interface AssistantRequestPayload {
  worldState: WorldState;
  solution: Solution;
  aiAnalysis: AiAnalysis;
  userAction?: AiUserAction;
  userMessage?: string;
}

const assistantResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['schema_version', 'timestamp', 'scenario_id', 'model_info', 'summary', 'risks', 'recommendations', 'insights', 'chat_answer'],
  properties: {
    schema_version: { type: 'string' },
    timestamp: { type: 'string' },
    scenario_id: { type: 'string' },
    model_info: {
      type: 'object',
      additionalProperties: false,
      required: ['provider', 'model'],
      properties: {
        provider: { type: 'string' },
        model: { type: 'string' },
      },
    },
    summary: { type: 'string' },
    risks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['level', 'type', 'target_id', 'message'],
        properties: {
          level: { type: 'string', enum: ['low', 'medium', 'high'] },
          type: { type: 'string', enum: ['route_delay', 'stock_risk', 'demand_risk', 'connectivity_risk'] },
          target_id: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'target_id', 'message'],
        properties: {
          type: { type: 'string', enum: ['reroute', 'reprioritize', 'rebalance', 'monitor'] },
          target_id: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
    insights: {
      type: 'object',
      additionalProperties: false,
      required: ['most_critical_node_id', 'best_source_node_id', 'largest_eta_min'],
      properties: {
        most_critical_node_id: { type: ['string', 'null'] },
        best_source_node_id: { type: ['string', 'null'] },
        largest_eta_min: { type: 'number' },
      },
    },
    chat_answer: { type: 'string' },
  },
} as const;

function readRequestBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function extractOutputText(data: any) {
  const candidates = data?.candidates ?? [];
  const firstCandidate = candidates[0];
  const parts = firstCandidate?.content?.parts ?? [];
  const textPart = parts.find((item: any) => typeof item?.text === 'string');
  return textPart?.text ?? '';
}

function buildSystemPrompt() {
  return [
    'You are a logistics AI assistant embedded in a Lviv dispatch operations interface.',
    'You receive the current world state (nodes, edges, vehicles, events), the optimizer solution (allocation plan, KPIs, unserved demands, alerts), and a prior AI analysis (demand forecasts, route risks, recommendations).',
    'Your job is to produce a concise, actionable operational analysis grounded strictly in the provided data.',
    '',
    'Rules:',
    '- summary: 2-3 sentences describing the most important current situation. Mention blocked routes, critical demand nodes, unmet demand, and connectivity issues if present. Do not repeat generic phrases.',
    '- risks: derive from actual blocked edges, high risk_score values in route_risk_adjustments, unserved_demands, low stock vs demand, and connectivity_status. Each risk must reference a specific node_id, edge_id, or scenario_id.',
    '- recommendations: derive from actual risks. If a route is blocked, recommend reroute. If demand is unserved and critical, recommend reprioritize. If vehicle_utilization is low with unmet demand, recommend rebalance. Be specific.',
    '- insights: most_critical_node_id is the delivery_point with the highest weighted demand score. best_source_node_id is the warehouse with the most relevant stock. largest_eta_min is the maximum eta_min in the allocation_plan.',
    '- chat_answer: answer the user message directly using data from the provided context. If the user asks about blocked routes, list them. If about KPIs, give the numbers. If about why something failed, explain using solution.unserved_demands. Always be specific and concise.',
    '- Return only valid JSON matching the schema. Do not add any explanation outside the JSON.',
  ].join('\n');
}

function buildUserPrompt(payload: AssistantRequestPayload) {
  return JSON.stringify(
    {
      task: 'Analyze the logistics state below and answer the user message in a compact operational format.',
      user_message: payload.userMessage ?? '',
      last_user_action: payload.userAction ?? { type: 'none', message: 'No recent action.' },
      world_state: payload.worldState,
      solution: payload.solution,
      ai_analysis: payload.aiAnalysis,
    },
    null,
    2,
  );
}

async function callGeminiAssistant(
  payload: AssistantRequestPayload,
  apiKey: string,
  model: string,
): Promise<AiAssistantResponse> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${buildSystemPrompt()}\n\n${buildUserPrompt(payload)}` }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseJsonSchema: assistantResponseSchema,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed with ${response.status}`);
  }

  const data = await response.json();
  const outputText = extractOutputText(data);

  if (!outputText) {
    throw new Error('Gemini response did not include structured text output.');
  }

  return JSON.parse(outputText) as AiAssistantResponse;
}

export function installAssistantApi(
  server: { middlewares: { use: (path: string, handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>) => void } },
  env: Record<string, string>,
) {
  server.middlewares.use('/api/assistant/analyze', async (req, res) => {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    let payload: AssistantRequestPayload | null = null;

    try {
      const rawBody = await readRequestBody(req);
      payload = JSON.parse(rawBody) as AssistantRequestPayload;
      const apiKey = env.API_KEY || env.GEMINI_API_KEY;
      const model = env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

      if (!apiKey) {
        sendJson(res, 200, buildAssistantFallback(
          payload.worldState,
          payload.solution,
          payload.aiAnalysis,
          payload.userMessage,
          payload.userAction,
        ));
        return;
      }

      const assistantResponse = await callGeminiAssistant(payload, apiKey, model);
      sendJson(res, 200, assistantResponse);
    } catch (error) {
      if (payload) {
        sendJson(res, 200, buildAssistantFallback(
          payload.worldState,
          payload.solution,
          payload.aiAnalysis,
          payload.userMessage,
          payload.userAction,
        ));
        return;
      }

      sendJson(res, 500, {
        error: error instanceof Error ? error.message : 'Assistant request failed.',
      });
    }
  });
}
