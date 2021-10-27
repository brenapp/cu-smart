/**
 * @author Brendan McGuire
 * @date 5 October 2021
 *
 * Experiment administration page, displays recent feedback and current room statistics
 */

import { Header } from "@components/Header";
import Spinner from "@components/Spinner";
import { useEffect, useState } from "react";
import useSensorData, { Entry } from "@lib/client/data";
import { favorites } from "@lib/client/favorites";
import { ResponseType, BUILDINGS } from "@lib/client/data";

async function getFeedback() {
  if (!process.browser) {
    return [];
  }

  const response = await fetch("/api/takeout.csv");
  const data = await response.text();

  return data
    .split("\n")
    .slice(1)
    .map((line) => line.split(","));
}

function get<T extends "XREF" | "live" | "PXREF">(
  id: number,
  entry: Entry<T>
): [boolean, ResponseType[T][0] | null] {
  if (entry.loaded) {
    for (const item of entry.data) {
      if (item.PointSliceID == id) {
        return [true, item];
      }
    }
    return [true, null];
  } else {
    return [false, null];
  }
}

export default function Admin() {
  const [loaded, setLoaded] = useState(false);
  const [feedback, setFeedback] = useState<string[][]>([]);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [data, actions] = useSensorData();

  function load(spinner: boolean) {
    actions.ensureData("live", { building: "WATT", sensor: "TEMP" }, 1000 * 60);
    actions.ensureData(
      "live",
      { building: "WATT", sensor: "HUMIDITY" },
      1000 * 60
    );

    if (spinner) {
      setLoaded(false);
    }

    getFeedback().then((data) => {
      setFeedback(data);
      setLoaded(true);
      setUpdated(new Date());
    });
  }

  useEffect(() => {
    load(true);
    const update = setInterval(() => load(false), 10000);

    return () => clearInterval(update);
  }, []);

  return (
    <main className="min-h-screen bg-gray-100">
      <Header title="Experiment Administration" />
      <div className="md:py-4 px-12 flex flex-col sm:py-12 m-auto">
        <div className="live flex">
          {favorites.map((room) => {
            const [tempLoaded, temp] = get(
              room.PointSliceID,
              data.live[room.BLG].TEMP
            );
            const [humidityLoaded, humidity] = get(
              room.PointSliceID,
              data.live[room.BLG].HUMIDITY
            );

            const loaded = tempLoaded && humidityLoaded;

            return (
              <div className="rounded-3xl bg-white shadow-md px-6 mr-4 first-of-type:ml-2 py-6 mb-6 flex flex-col flex-1">
                <div className="flex flex-1 items-center">
                  <div className="h-12 w-12 bg-gray-500 rounded-lg mr-6 overflow-hidden">
                    <img
                      src={`/buildings/${room.BLG}.png`}
                      alt={BUILDINGS[room.BLG]}
                      className="h-full rounded-lg max-w-max"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg">{room.Alias}</h3>
                    <h5 className="text-base text-gray-500">
                      {BUILDINGS[room.BLG]}
                    </h5>
                  </div>
                </div>
                {loaded ? (
                  <div className="mt-2 flex items-center justify-evenly">
                    <p>Temp: {temp.ActualValue.toFixed(2)}</p>
                    <p>Humidity: {humidity.ActualValue.toFixed(2)}</p>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center justify-evenly text-orange">
                    <Spinner />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="submissions rounded-3xl bg-white shadow-md px-6 mr-4 py-6 ml-2">
          <table className="table-auto m-auto">
            <thead>
              <tr>
                <th>
                  <p className="text-base text-gray-500 italic">
                    Last Updated: {updated?.toLocaleTimeString() ?? ""}
                  </p>
                </th>
              </tr>
              <tr>
                <th className="pr-2 text-left">Participant ID</th>
                <th className="pr-2">Place ID</th>
                <th className="pr-2">Sensation</th>
                <th className="pr-2">Preference</th>
                <th className="pr-2">Clothing</th>
                <th className="pr-2">Indoor Temp.</th>
                <th className="pr-2">Indoor Humidity</th>
                <th className="pr-2">Outdoor Temp.</th>
                <th className="pr-2">Outdoor Humidity</th>
                <th className="pr-2">Datetime</th>
              </tr>
            </thead>
            <tbody>
              {loaded ? (
                feedback.map((row, index) => (
                  <tr key={index}>
                    <td className="pr-2">{row[0]}</td>
                    <td className="pr-2">{row[1]}</td>
                    <td className="pr-2">{row[2]}</td>
                    <td className="pr-2">{row[3]}</td>
                    <td className="pr-2">{row[4]}</td>
                    <td className="pr-2">{row[5]}</td>
                    <td className="pr-2">{row[6]}</td>
                    <td className="pr-2">{row[7]}</td>
                    <td className="pr-2">{row[8]}</td>
                    <td className="pr-2">{row[9]}</td>
                  </tr>
                ))
              ) : (
                <Spinner />
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
