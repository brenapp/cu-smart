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
import process from "child_process";
import { promisify } from "util";

export default async function (req: NextApiRequest, res: NextApiResponse) {
    const { id, clothing_level, rooms } = req.query as { id: string, clothing_level: string, rooms: string[] };

    const outdoor_temp = await getTemperature();
    const outdoor_humidity = await getRelativeHumidity();

    const date = (() => {
        const [date, time] = new Date().toISOString().split("T");
        return `"\\"${date} ${time.split(".")[0]}\\""`;
    })();

    const temperature = await getLiveData("WATT", "TEMP").then(data => data.filter(entry => rooms.includes(entry.PointSliceID)));
    const humidity = await getLiveData("WATT", "HUMIDITY").then(data => data.filter(entry => rooms.includes(entry.PointSliceID)));

    const resp = {};
    for (const room of rooms) {
        const indoor_temp = temperature.find(entry => entry.PointSliceID === room)?.ActualValue;
        const indoor_humidity = humidity.find(entry => entry.PointSliceID === room)?.ActualValue;
        
        // SECURITY IMPLICATIONS: Right now, this code is not safe! It is trivially easy to perform
        // Remote Code Execution by modifying the command line arguments. This systems will get
        // resolved as we switch to the webserver system.
        const command = `python -W ignore ./thermal/main.py predict ${id} ${room} ${clothing_level} ${indoor_temp} ${indoor_humidity} ${outdoor_temp} ${outdoor_humidity} ${date}`
        const { stdout } = await promisify(process.exec)(command);
        resp[room] = Number.parseFloat(stdout);
    };
    
    // python main.py predict user_id place_id clothing_level indoor_temp indoor_humidity
    // outdoor_temp outdoor_humidity created_at
    res.setHeader("Content-Type", "application/json")
        .setHeader("Cache-Control", "maxage=60");
    res.status(200).end(JSON.stringify(resp));
};