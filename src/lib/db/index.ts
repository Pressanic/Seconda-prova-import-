import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DbInstance = NeonHttpDatabase<typeof schema>;

// Lazy singleton — neon() is only called on first actual DB access,
// not at module import time. This prevents build failures when
// DATABASE_URL is not available during Vercel build phase.
let _db: DbInstance | undefined;

function getInstance(): DbInstance {
    if (!_db) {
        const sql = neon(process.env.DATABASE_URL!);
        _db = drizzle(sql, { schema });
    }
    return _db;
}

export const db = new Proxy({} as DbInstance, {
    get(_target, prop: string | symbol) {
        return (getInstance() as any)[prop as string];
    },
});

export type DB = DbInstance;
