/**
 * @author Brendan McGuire
 * @date 2 October 2021
 * 
 * Combines all of the disparate room information into the a single, consumable API.
 */

import mssql, { ConnectionPool } from "mssql";
import { Building, BUILDINGS as BUILDING_NAMES, Metric, METRICS } from "../client/data";
import { config } from "dotenv"
config();

export const BUILDINGS = Object.keys(BUILDING_NAMES);

/// Mobile metrics. The box metrics that can be moved, and upload data to WFIC_CEVAC_Shades
export const mobileMETRICS = new Map<number, string>([
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

export const mobileSensorData = new mssql.ConnectionPool({
  user: process.env.SHADES_USER,
  password: process.env.SHADES_PASSWORD,
  server: process.env.SHADES_SERVER,
  database: process.env.SHADES_DATABASE,
  options: {
    trustServerCertificate: true
  }
});

/// Thermostat Data, is uploaded to WFIC_CEVAC. This is a fallback in case the box METRICS are not
/// online
export const thermostatData = new mssql.ConnectionPool({
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_SERVER,
  database: process.env.MSSQL_DATABASE,
  options: {
    trustServerCertificate: true
  }
});


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

export async function ensureConnection() {
  return new Promise<void>((resolve) => {

    const connected = [false, false];
    const allConnected = () => connected.every(c => c);

    thermostatData.connect(connectionHandler(1, thermostatData, process.env.MSSQL_DATABASE, () => {
      connected[0] = true;
      if (allConnected()) {
        resolve();
      };
    }));
    mobileSensorData.connect(connectionHandler(1, mobileSensorData, process.env.SHADES_DATABASE, async () => {
      connected[1] = true;
      if (allConnected()) {
        resolve();
      };
    }));
  });
};

export async function getBoxData() {
  await ensureConnection();

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

  };
  
  return boxData;
};

export interface LiveEntry {
  PointSliceID: string,
  Alias: string,
  UTCDateTime: string,
  ETDateTime: string,
  ActualValue: number
}

export async function getLiveData(building: Building, sensor: Metric) {
  await ensureConnection();
  await getBoxData();

  console.log(process.env);
  
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

    return data;
  };

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

    return data;
};