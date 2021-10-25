import React, { useEffect, useState } from "react";
import { Header } from "@components/Header";
import Head from "next/head";
import { motion, useCycle } from "framer-motion";
import { Select } from "@components/Input";
import { FivePointScale } from "@lib/server/database";
import Image from "next/image";
import { BUILDINGS } from "@lib/client/data";

import clothing1 from "@static/clothing/clothing1.png";
import clothing2 from "@static/clothing/clothing2.png";
const images = [clothing1, clothing2];

import { favorites } from "@lib/client/favorites";

const itemsA = [0, 1, 2, 3];
const itemsB = [2, 0, 3, 1];
const itemsC = [3, 2, 1, 0];
const itemsD = [1, 3, 0, 2];

export default function Suggest() {
  const [clothing, setClothing] = useState(-1);
  const [items, setItems] = useCycle(itemsA, itemsB, itemsC, itemsD);

  useEffect(() => {
    setItems();
  }, [clothing]);

  return (
    <main className="min-h-screen bg-gray-100">
      <Head>
        <title>Suggest A Room</title>
      </Head>
      <Header title="Room Recommendation" />
      <div className="py-3 px-6 flex flex-col sm:py-12 max-w-3xl m-auto">
        <p className="text-lg text-gray-500">
          Based on your earlier feedback, we have developed a personalized
          machine learning model to best recommend a room for you.
        </p>

        <p className="text-lg text-gray-500 mt-4">
          What is closest to your current clothing level?
        </p>
        <Select
          options={[1, 2]}
          value={clothing}
          onSelect={(item: FivePointScale) => setClothing(item)}
          className="mt-4"
          mode="row"
          render={(item) => (
            <div className="w-full flex items-center justify-center">
              <Image
                src={images[item - 1]}
                width="53"
                height="61"
                alt={`Clothing Level ${item}`}
              />
            </div>
          )}
        />

        { clothing !== -1 && (<div>
          <h1 className="mt-8 mb-4 uppercase text-lg text-center text-gray-700">Your Suggested Rooms</h1>
          {items.map((item, index) => (
            <motion.div
              key={item}
              layout
              initial="false"
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="rounded-3xl bg-white shadow-md px-6 py-6 mb-6 flex items-center hover:shadow-xl transition-shadow cursor-pointer"
            >
               <div className="rounded-lg mr-6 overflow-hidden flex items-center">
                <h1 className="text-xl text-orange">#{index + 1}</h1>
              </div>
              <div className="h-12 w-12 bg-gray-500 rounded-lg mr-6 overflow-hidden">
                <img
                  src={`/buildings/${favorites[item].BLG}.png`}
                  alt={BUILDINGS[favorites[item].BLG]}
                  className="h-full rounded-lg max-w-max"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg">{favorites[item].Alias}</h3>
                <h5 className="text-base text-gray-500">
                  {BUILDINGS[favorites[item].BLG]}
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
          ))}
        </div>)}
      </div>
    </main>
  );
}
