/**
 * @author Brendan McGuire
 * @date 27 September 2021
 * 
 * Centralizes different data sources for temperature and humidity into a single unified endpoint with fallback. 
 */

import { Building, BUILDINGS as BUILDING_NAMES, Metric, METRICS } from "@lib/client/data";
import type { NextApiRequest, NextApiResponse } from "next";
import { getBoxData, ensureConnection, BUILDINGS, mobileMETRICS, thermostatData, getLiveData } from "@lib/server/data"

/// Endpoint: live

async function live(req: NextApiRequest, res: NextApiResponse) {
  const { building, sensor } = req.query;

  await getBoxData();
  if (typeof building != "string" || typeof sensor != "string" || !BUILDINGS.includes(building as Building) || !METRICS.includes(sensor as Metric)) {
    res.status(400).json({
      "status": "err",
      "error_message": `Invalid parameters. Must specify a "building" in ${BUILDINGS.join(", ")} and "sensor" in ${METRICS.join(", ")}.`
    });
  } else {

    // Shim humidity data for WATT - It is not present in the default sensor database
    try {
      const data = await getLiveData(building as Building, sensor as Metric);
      res.status(200).json({
        "status": "ok",
        data
      });

    } catch (err) {
      console.log(err);

      // Special Case: If the database reports the table does not exist, it makes the most
      // sense to just return an empty array instead of a 500 error. The client will report
      // this data as unavailable instead of producing an error. This means when these data is
      // added to the database, it will work seamlessly
      if (err instanceof Error && err.message.startsWith("Invalid object name")) {
        res.status(200).json({
          "status": "ok",
          "data": []
        });
      } else {
        res.status(500).json({
          "status": "err",
          "error_message": `Database Error: ${err instanceof Error ? err.message : "Unknown Error"}`
        });
      }
    }
  }

};

/// Endpoint: hist
interface HistoricalEntry {
  Time: Date;
  Value: number;
}

function calculateAvgValue(recordList: HistoricalEntry[]) {
  let newList: Record<number, number[]> = {};
  recordList.forEach(e => {
    const hour = e["Time"].getHours(); // extract hours
    newList.hasOwnProperty(hour) ? newList[hour].push(e["Value"]) : newList[hour] = [e["Value"]];
  });
  let average = (array: number[]) => array.reduce((a, b) => a + b) / array.length;
  let avg: Record<string, number> = {};
  for (const property in newList) {
    avg[property] = average(newList[property]);
  }
  return avg;
}

function returnPastData(data: Record<string, number>, hour: number) {
  let d = new Date();
  let curHour = d.getHours() - 1;
  if (curHour < 0)
    curHour += 24;
  let res = {
    labels: [] as number[],
    data: [] as number[]
  };
  let labels = [];
  let sensorData = [];
  for (let i = 0; i < hour; i++) {
    sensorData.unshift(data[curHour]);
    labels.unshift(curHour);
    curHour--;
    if (curHour < 0)
      curHour += 24;
  }
  res.labels = labels;
  res.data = sensorData;
  return res;
}

async function hist(req: NextApiRequest, res: NextApiResponse) {
  const { building, sensor, id, labels } = req.query;

  if (typeof building != "string" || typeof sensor != "string" || typeof id != "string" || !BUILDINGS.includes(building as Building) || !METRICS.includes(sensor as Metric)) {
    res.status(400).json({
      "status": "err",
      "error_message": "Invalid parameters"
    });
  } else {

    // If the user specifies a valid number of labels to include, otherwise default
    let size = 12;
    if (typeof labels == "string") {

      if (!isNaN(parseInt(labels))) {
        size = parseInt(labels);
      } else {
        res.status(400).json({
          "status": "err",
          "error_message": "Invalid label size"
        });
      }

    };
    try {

      // Safety: While tagged templates are not being used here, because we are validating the
      // values of building and sensor to a set of known, constant values, it is ok to
      // directly substitute here
      const result = await thermostatData.query<HistoricalEntry>(
        `SELECT TOP (96) [ETDateTime] as [Time], [ActualValue] as [Value] FROM [WFIC-CEVAC].[dbo].[CEVAC_${building}_${sensor}_HIST_CACHE] WHERE [PointSliceID] = ${id} ORDER BY [Time] DESC `);

      let timesteps = result.recordsets[0];

      // Find the average value for each timestep
      let average = calculateAvgValue(timesteps);

      // Rearrange the averages into a summary
      let summary = returnPastData(average, size);

      // record = returnPastData(record, 12);
      res.status(200).json({
        "status": "ok",
        "data": summary
      })

    } catch (err) {
      res.status(500).json({
        "status": "err",
        "error_message": `Database Error: ${err instanceof Error ? err.message : "Unknown Error"}`
      });
    }

  }
};

/// Endpoint: PXREF

interface PXrefEntry {
  PointSliceID: string;
  Alias: string;
  in_xref: true;
}

async function PXREF(req: NextApiRequest, res: NextApiResponse) {
  const { building, sensor } = req.query;

  if (typeof building != "string" || typeof sensor != "string" || !BUILDINGS.includes(building as Building) || !METRICS.includes(sensor as Metric)) {
    res.status(400).json({
      "status": "err",
      "error_message": `Invalid parameters. Must specify a "building" in ${BUILDINGS.join(", ")} and "sensor" in ${METRICS.join(", ")}.`
    });
  } else {
    try {

      const result = await thermostatData.query<PXrefEntry>(`SELECT [PointSliceID], [Alias], [in_xref] FROM [WFIC-CEVAC].[dbo].[CEVAC_${building}_${sensor}_PXREF]`);

      const record = result.recordsets[0];
      res.status(200).json({
        "status": "ok",
        "data": record
      })
    } catch (err) {
      res.status(500).json({
        "status": "err",
        "error_message": `Database Error: ${err instanceof Error ? err.message : "Unknown Error"}`
      });
    };
  }

};

// Endpoint: XREF

interface XrefEntry {
  PointSliceID: number;
  Room: string;
  RoomType: string;
  BLG: string;
  Floor: string;
  ReadingType: string;
  Alias: string;
}

async function XREF(req: NextApiRequest, res: NextApiResponse) {
  const { building, sensor } = req.query;

  if (typeof building != "string" || typeof sensor != "string" || !BUILDINGS.includes(building as Building) || !METRICS.includes(sensor as Metric)) {
    res.status(400).json({
      "status": "err",
      "error_message": `Invalid parameters. Must specify a "building" in ${BUILDINGS.join(", ")} and "sensor" in ${METRICS.join(", ")}.`
    });
  } else {
    try {
      const result = await thermostatData.query<XrefEntry>(`SELECT [PointSliceID], [Room], [RoomType], [BLG], [Floor], [ReadingType], [Alias] FROM [WFIC-CEVAC].[dbo].[CEVAC_${building}_${sensor}_XREF]`);

      const record = result.recordsets[0].map(r => ({ ...r, "BLG": r.BLG.toUpperCase() }));

      // In WATT TEMP, artificially add RM 319 to the list of rooms
      if (building == "WATT" && sensor == "TEMP") {
        record.push({
          "PointSliceID": 8939,
          "Room": "319",
          "RoomType": "Project Room",
          "BLG": "WATT",
          "Floor": "3rd Floor",
          "ReadingType": "Zone Temp",
          "Alias": "RM 319 / Zone Temp"
        });
      };


      res.status(200).json({
        "status": "ok",
        "data": record
      })
    } catch (err) {
      res.status(500).json({
        "status": "err",
        "error_message": `Database Error: ${err instanceof Error ? err.message : "Unknown Error"}`
      });
    };
  }

};



const endpoints = { live, hist, PXREF, XREF };

export default async function (req: NextApiRequest, res: NextApiResponse) {
  await ensureConnection();

  const end = req.query.endpoint as string;
  const endpoint = endpoints[end];

  if (endpoint) {
    endpoint(req, res);
  } else {
    res.status(400).json({
      "status": "err",
      "error_message": `Invalid endpoint. Must specify one of ${Object.keys(endpoints).join(", ")}.`
    });
  }


};