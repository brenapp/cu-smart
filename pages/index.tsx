/**
 * @author Brendan McGuire
 * @date 5 October 2021
 * 
 * Home page, displays lists of favorites to go to, and additionally links out to suggestion page,
 * settings pane, and building selection page
 */

import { useEffect, useState } from "react";
import { ResponseType, BUILDINGS } from "@lib/client/data";
import Link from "next/link";
import { motion } from "framer-motion";
import { popIn, slideRight } from "@lib/client/animations";
import PopupID, { getID } from "@components/popup/id";
import useSensorData from "@lib/client/data";
import Head from "next/head";
import { Button, Input, Select } from "@components/Input";
import { favorites } from "@lib/client/favorites";

function SettingsPane() {
  const [open, setOpen] = useState(false);
  const [id, setID] = useState(() => {
    if (process.browser) {
      return localStorage.getItem("id") || "";
    }

    return "";
  });

  return (
    <>
      <div className="w-16 h-16 bg-orange text-white fixed right-0 top-0 z-10 rounded-bl-2xl flex justify-center items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7 cursor-pointer hover:rotate-90 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          onClick={() => setOpen(!open)}
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
      <motion.div
        {...slideRight()}
        initial="closed"
        animate={open ? "open" : "closed"}
      >
        <div className="bg-orange w-96 fixed right-0 h-screen p-6 pt-4">
          <h1 className="text-2xl text-white text-center mb-4 subpixel-antialiased">
            Settings
          </h1>

          <div className="mb-4">
            <label
              htmlFor="participant-id"
              className="text-white text-opacity-95 mb-2 block text-lg"
            >
              Participant ID
            </label>
            <Input
              id="participant-id"
              type="number"
              value={id}
              onChange={(event) => setID(event.target.value)}
              onBlur={() => localStorage.setItem("id", id)}
              className="border-0"
            />
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default function Home() {
  const id = getID();
  const [data, actions] = useSensorData();

  useEffect(() => {
    actions.ensureData("XREF", { building: "WATT", sensor: "TEMP" }, 1000 * 60);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      <Head>
        <title>CU Smart</title>
        <meta
          name="description"
          content="Helps you find the optimal study space on Campus! Currently in development."
        />
      </Head>
      <SettingsPane />
      <PopupID />

      <nav className="w-full">
        <div className="accent w-full h-2 bg-orange"></div>
      </nav>
      <div className="p-6 flex flex-col sm:py-12 max-w-3xl m-auto">
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
        <div className="flex items-center justify-center">
          <Link href="/suggest">
            <Button text={"Suggest A Room"} variant="primary" />
          </Link>
        </div>
      </div>
    </div>
  );
}
