import { Pool } from 'pg';
import { dbConfig } from '../config/env.js';

export const pool = new Pool(dbConfig);