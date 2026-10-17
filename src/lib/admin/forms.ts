import spec from "./schema.json";
import { label } from "./types";
type Property = {
  type?: string;
  enum?: string[];
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  default?: unknown;
  description?: string;
};
type Schema = { properties: Record<string, Property>; required?: string[] };
export const schemas = spec.schemas as unknown as Record<string, Schema>;
export function buildFormPayload(
  schemaName: string,
  values: Record<string, unknown>,
  exclude: string[] = [],
) {
  const schema = schemas[schemaName];
  const body: Record<string, unknown> = {};
  for (const [key, p] of Object.entries(schema.properties)) {
    if (exclude.includes(key)) continue;
    const raw = values[key];
    const value = typeof raw === "string" ? raw.trim() : raw;
    if (value === undefined || value === null || value === "") {
      if (key === "adminNote" && value === "") {
        body[key] = "";
        continue;
      }
      if (schema.required?.includes(key))
        throw new Error(`${label(key)} is required.`);
      continue;
    }
    if (p.type === "number") {
      const n = Number(value);
      if (
        !Number.isFinite(n) ||
        (p.minimum !== undefined && n < p.minimum) ||
        (p.maximum !== undefined && n > p.maximum)
      )
        throw new Error(`Check ${label(key).toLowerCase()}.`);
      body[key] = n;
    } else if (p.type === "boolean")
      body[key] = value === true || value === "true";
    else if (p.format === "date-time" || key === "purchasedAt") {
      body[key] = new Date(String(value)).toISOString();
    } else {
      if (p.enum && !p.enum.includes(String(value)))
        throw new Error(`Choose a valid ${label(key).toLowerCase()}.`);
      body[key] = value;
    }
  }
  if (body.code) body.code = String(body.code).toUpperCase();
  if (body.type === "PERCENTAGE" && Number(body.value) > 100)
    throw new Error("A percentage discount cannot exceed 100%.");
  if (
    body.startsAt &&
    body.endsAt &&
    String(body.startsAt) >= String(body.endsAt)
  )
    throw new Error("The end date must follow the start date.");
  if (body.rule === "CAPACITY" && !body.capacity)
    throw new Error("Enter the number of items one resource can hold.");
  return body;
}

export function localDateInput(value: unknown): string {
  const text = String(value ?? "");
  if (!text || !/(Z|[+-]\d\d:\d\d)$/.test(text)) return text.slice(0, 16);
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
