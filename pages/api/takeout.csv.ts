/**
 * @author Brendan McGuire
 * @date 5 October 2021
 * 
 * Single API to export all feedback to a single CSV file
 */

import { database, ensureSchema, UserFeedback } from "@lib/server/database";
import { NextApiRequest, NextApiResponse } from "next";

export default async function takeout(req: NextApiRequest, res: NextApiResponse) {
    const db = await database();
    await ensureSchema();

    const result = await db.all<UserFeedback[]>(`SELECT * FROM feedback`);

    if (result.length === 0) {
        res.status(500).send("No feedback found");
        return;
    }

    let response = Object.keys(result[0]).join(",") + "\n";
    for (let feedback of result) {
        response += Object.values(feedback).join(",") + "\n";
    }

    res.setHeader("Content-Type", "text/csv");
    res.status(200).send(response);
};