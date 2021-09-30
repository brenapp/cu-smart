import { useEffect } from "react";
import { ResponseType, BUILDINGS } from "@lib/client/data";
import Link from "next/link";
import { motion } from "framer-motion";
import { popIn } from "@lib/client/animations";
import PopupID, { getID } from "@components/popup/id";
import useSensorData from "@lib/client/data";
import Head from "next/head";

const favorites: ResponseType["XREF"] = [
  {
    PointSliceID: 8935,
    Room: "325",
    RoomType: "Project Room",
    BLG: "WATT",
    Floor: "3rd Floor",
    ReadingType: "Zone Temp",
    Alias: "RM 325",
  },
  {
    PointSliceID: 8939,
    Room: "327",
    RoomType: "Project Room",
    BLG: "WATT",
    Floor: "3rd Floor",
    ReadingType: "Zone Temp",
    Alias: "RM 327",
  },
  {
    PointSliceID: 8916,
    Room: "331",
    RoomType: "Classroom",
    BLG: "WATT",
    Floor: "3rd Floor",
    ReadingType: "Zone Temp",
    Alias: "RM 331",
  },
  {
    PointSliceID: 8921,
    Room: "329",
    RoomType: "Project Room",
    BLG: "WATT",
    Floor: "3rd Floor",
    ReadingType: "Zone Temp",
    Alias: "RM 329",
  },
];

export default function Home() {
  const id = getID();
  const [data, actions] = useSensorData();

  useEffect(() => {
    actions.ensureData("XREF", { building: "WATT", sensor: "TEMP" }, 1000 * 60);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      <PopupID />
      <Head>
        <title>CU Smart</title>
        <meta name="description" content="Helps you find the optimal study space on Campus! Currently in development." />
      </Head>
      <nav className="w-full">
        <div className="accent w-full h-2 bg-orange"></div>
      </nav>
      <div className="py-6 px-12 flex flex-col sm:py-12 max-w-3xl m-auto">
        <h1 className="text-3xl pb-1">Welcome Back!</h1>
        <h3 className="text-xl text-gray-500">
          Select a room below to continue
        </h3>
        <section className="rooms flex flex-col pt-6">
          {favorites.map((room) => (
            <Link href={`/room/${room.PointSliceID}`} key={room.PointSliceID}>
              <motion.div
                {...(id ? popIn : {})}
                className="rounded-3xl bg-white shadow-md px-6 py-6 mb-6 flex items-center hover:shadow-xl transition-shadow cursor-pointer"
              >
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-4 text-orange"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </motion.div>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
