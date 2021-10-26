/**
 * @author Brendan McGuire
 * @date 2 October 2021
 * 
 * Manages the connection and interface for the local feedback database.
 */

import sqlite3 from "sqlite3";
import * as sqlite from "sqlite";
import { getTemperature, getRelativeHumidity } from "./outside";

export async function database() {
    const dbPath = process.env.NODE_ENV == "development" ? "./cu-smart.db" : "/data/cu-smart.db";
    console.info(`Opening cached database ${dbPath}...`);
    return sqlite.open({
        mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
        filename: dbPath,
        driver: sqlite3.cached.Database,
    });
};

export async function ensureSchema() {
    console.info("Ensuring database compatibility...");
    const db = await database();
    await db.run(
        `CREATE TABLE IF NOT EXISTS feedback (
            user_id INTEGER, 
            place_id INTEGER,
            sensations_temperature INTEGER,
            preferences_temperature INTEGER,
            clothing_level INTEGER,
            indoor_temp REAL,
            indoor_humidity REAL,
            outdoor_temp REAL,
            outdoor_humidity REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    `);
};

export type FivePointScale = 1 | 2 | 3 | 4 | 5;

export interface UserFeedback {
    user_id: number,
    place_id: number,
    sensations_temperature: FivePointScale,
    preferences_temperature: FivePointScale,
    clothing_level: FivePointScale,
    indoor_temp: number,
    indoor_humidity: number,
}


export async function addFeedback(feedback: UserFeedback): Promise<boolean> {
    const db = await database();

    const outdoorTemp = await getTemperature();
    const outdoorHumidity = await getRelativeHumidity();

    const result = await db.run(`
        INSERT INTO feedback 
            (user_id, 
                place_id,
                sensations_temperature,
                preferences_temperature,
                clothing_level,
                indoor_temp,
                indoor_humidity,
                outdoor_temp,
                outdoor_humidity) VALUES (
                ?, 
                ?, 
                ?,
                ?,
                ?, 
                ?, 
                ?,
                ?,
                ?)`,
        feedback.user_id,
        feedback.place_id,
        feedback.sensations_temperature,
        feedback.preferences_temperature,
        feedback.clothing_level,
        feedback.indoor_temp,
        feedback.indoor_humidity,
        outdoorTemp,
        outdoorHumidity
    );

    return !!result.changes && result.changes > 0;

}