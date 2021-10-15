/**
 * @author Brendan McGuire
 * @date 30 September 2021
 * 
 * Reworked feedback system to allow users to submit feedback based on their room conditions.
 * Instead of submitted room conditions themselves, instead we will rely on retrieving the room
 * conditions on the server side at submission time. This purpose of this is to improve the data
 * flow on the client side and improve latency times.
 */

import { addFeedback, ensureSchema, FivePointScale, UserFeedback } from "@lib/server/database";
import { NextApiRequest, NextApiResponse } from "next";
import { ensureConnection, getBoxData } from "@lib/server/data";

export type Feedback = {
    place_id: string;
    user_id: string;
    perception: FivePointScale;
    preference: FivePointScale;
    clothing_level: FivePointScale;
};

export default async function (req: NextApiRequest, res: NextApiResponse) {

    if (req.method !== 'POST') {
        res.status(400).send({ status: "error", message: "Only post requests are permitted" })
        return;
    }

    await ensureSchema();
    await ensureConnection();

    try {
        const body = req.body as Feedback;

        const feedback: UserFeedback = {
            place_id: Number.parseInt(body.place_id),
            user_id: Number.parseInt(body.user_id),
            sensations_temperature: body.perception,
            preferences_temperature: body.preference,
            clothing_level: body.clothing_level,
    
            indoor_temp: 0.0,
            indoor_humidity: 0.0,
        };

        const boxData = await getBoxData();
    
        // Get the room conditions
        const { temp, humidity } = boxData.get(feedback.place_id);
        feedback.indoor_temp = temp;
        feedback.indoor_humidity = humidity;
    
        await addFeedback(feedback);
    
        res.status(200).send({ status: "ok" });

    } catch (err) {
        console.error(err);
        res.status(500).send({ status: "error", message: "An error occurred while processing your request" });
    }

};