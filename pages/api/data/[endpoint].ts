/**
 * @author Brendan McGuire
 * @date 27 September 2021
 * 
 * Centralizes different data sources for temperature and humidity into a single unified endpoint with fallback. 
 */

import mssql, { ConnectionPool } from "mssql";
import { Building, BUILDINGS as BUILDING_NAMES, Metric, METRICS } from "../../../lib/client/data";
import type { NextApiRequest, NextApiResponse } from "next";

const BUILDINGS = Object.keys(BUILDING_NAMES);

/// Mobile METRICS. The box METRICS that can be moved, and upload data to WFIC_CEVAC_Shades
const mobileMETRICS = new Map<number, string>([
  [8916, "Sensor14"],
  [8921, "Sensor15"],
  [8935, "Sensor16"],
  [8939, "Sensor17"],
]);

interface BoxData {
  temp: number;
  humidity: number;
};

interface MobileSensoryEntry {
  DateTime: Date;
  Sensor: string;
  Metric: string;
  Reading: number;
};

const boxData = new Map<number, BoxData>([
  [8916, { temp: 0, humidity: 0 }],
  [8921, { temp: 0, humidity: 0 }],
  [8935, { temp: 0, humidity: 0 }],
  [8939, { temp: 0, humidity: 0 }],
]);

const mobileSensorData = new mssql.ConnectionPool({
  user: process.env.SHADES_USER,
  password: process.env.SHADES_PASSWORD,
  server: process.env.SHADES_SERVER,
  database: process.env.SHADES_DATABASE,
  options: {
    trustServerCertificate: true
  }
});

mobileSensorData.connect(connectionHandler(1, mobileSensorData, process.env.SHADES_DATABASE, async () => {
  (async function updateSensorData() {
    console.info("Updating live METRICS...");

    for (const [id, sensor] of mobileMETRICS) {

      const tempQuery = `SELECT TOP 1 * FROM [WFIC_CEVAC_Shades].[dbo].[SensorData]
                              WHERE (Metric='Temp(F)')
                              AND (Sensor='${sensor}')
                              AND (DateTime > DATEADD(HOUR, -1, GETDATE()))
                              ORDER BY [DATETIME] DESC`;

      const humidityQuery = `SELECT TOP 1 * FROM [WFIC_CEVAC_Shades].[dbo].[SensorData]
                              WHERE (Metric='Humidity')
                              AND (Sensor='${sensor}')
                              AND (DateTime > DATEADD(HOUR, -1, GETDATE()))
                              ORDER BY [DATETIME] DESC`;


      const tempData = await mobileSensorData.query<MobileSensoryEntry>(tempQuery);
      const humidityData = await mobileSensorData.query<MobileSensoryEntry>(humidityQuery);

      if (tempData.recordset.length > 0) {
        boxData.set(id, {
          temp: tempData.recordset[0].Reading,
          humidity: humidityData.recordset[0].Reading,
        });
      }

    }

    setTimeout(updateSensorData, 1000 * 60);
  })();
}));


/// Thermostat Data, is uploaded to WFIC_CEVAC. This is a fallback in case the box METRICS are not
/// online
const thermostatData = new mssql.ConnectionPool({
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_SERVER,
  database: process.env.MSSQL_DATABASE,
  options: {
    trustServerCertificate: true
  }
});

thermostatData.connect(connectionHandler(1, thermostatData, process.env.MSSQL_DATABASE));

function connectionHandler(retries: number, pool: ConnectionPool, database: string, after?: () => void) {
  return (err: any) => {
    if (err) {

      if (retries <= 10) {
        console.error(`Could not connect to ${database} database! Retrying (${retries}/10) in 1000ms... [${err}]`);
      }

      setTimeout(() => {
        pool.connect(connectionHandler(retries + 1, pool, database));
      }, 1000);


    } else {
      console.info(`Connected to ${database} database!`);
      after && after();
    }
  }
}

/// Endpoint: live

interface LiveEntry {
  PointSliceID: string,
  Alias: string,
  UTCDateTime: string,
  ETDateTime: string,
  ActualValue: number
}

async function live(req: NextApiRequest, res: NextApiResponse) {
  const { building, sensor } = req.query;

  if (typeof building != "string" || typeof sensor != "string" || !BUILDINGS.includes(building as Building) || !METRICS.includes(sensor as Metric)) {
    res.status(400).json({
      "status": "err",
      "error_message": `Invalid parameters. Must specify a "building" in ${BUILDINGS.join(", ")} and "sensor" in ${METRICS.join(", ")}.`
    });
  } else {

    // Shim humidity data for WATT - It is not present in the default sensor database
    if (sensor == "HUMIDITY") {

      let data: LiveEntry[] = [];

      if (building == "WATT") {
        for (const [id, box] of boxData) {
          data.push({
            PointSliceID: id.toString(),
            Alias: mobileMETRICS.get(id) || "",
            UTCDateTime: new Date().toISOString(),
            ETDateTime: new Date().toISOString(),
            ActualValue: box.humidity
          });
        }
      };

      res.status(200).json({
        "status": "ok",
        data
      });

      return;
    };

    try {

      // Safety: While tagged templates are not being used here, because we are validating the
      // values of building and sensor to a set of known, constant values, it is ok to
      // directly substitute here
      const result = await thermostatData.query<LiveEntry>(`SELECT * FROM [WFIC-CEVAC].[dbo].[CEVAC_${building}_${sensor}_LIVE]`);

      const record = result.recordsets[0];
      let data = [...record];

      // Artificially insert RM 327 in WATT TEMP
      if (sensor == "TEMP" && building == "WATT") {
        record.push({
          "PointSliceID": "8939",
          "Alias": "RM 327",
          "UTCDateTime": new Date().toISOString(),
          "ETDateTime": new Date().toISOString(),
          "ActualValue": 0
        });

        // Insert box data if it exists
        data = [...record].map(room => {
          if (boxData.has(+room.PointSliceID)) {
            room.ActualValue = boxData.get(+room.PointSliceID)?.temp as number;
          }

          return room;
        });

      };

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

export default function (req: NextApiRequest, res: NextApiResponse) {

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