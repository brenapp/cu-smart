/**
 * @author Brendan McGuire
 * @date 26 October 2021
 *
 * Calls out to the suggestion pipeline to get suggestions for a given query, based on certain
 * conditions.
 */

import { NextApiRequest, NextApiResponse } from "next";
import { getTemperature, getRelativeHumidity } from "@lib/server/outside"
import { getLiveData } from "@lib/server/data";

export default async function (req: NextApiRequest, res: NextApiResponse) {
    const { id, clothing_level, rooms } = req.query as { id: string, clothing_level: string, rooms: string[] };

    const outdoor_temp = await getTemperature();
    const outdoor_humidity = await getRelativeHumidity();

    const time = (() => {
        const now = new Date();

        return now.getHours() < 12 ? 1 : 2;
    })();

    const temperature = await getLiveData("WATT", "TEMP").then(data => data.filter(entry => rooms.includes(entry.PointSliceID)));
    const humidity = await getLiveData("WATT", "HUMIDITY").then(data => data.filter(entry => rooms.includes(entry.PointSliceID)));

    const resp = {};
    for (const room of rooms) {
        const indoor_temp = temperature.find(entry => entry.PointSliceID === room)?.ActualValue;
        const indoor_humidity = humidity.find(entry => entry.PointSliceID === room)?.ActualValue;

        resp[room] = `python main.py ${clothing_level} ${indoor_temp} ${indoor_humidity} ${outdoor_temp} ${outdoor_humidity} ${time} ${id}`
    };


    res.status(200).end(JSON.stringify({
        id,
        clothing_level,
        outdoor_temp,
        outdoor_humidity,
        time,
        rooms,
        temperature,
        humidity,
        resp
    }));
};