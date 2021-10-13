import React, { useEffect, useState } from "react";
import { Header } from "@components/Header";
import Head from "next/head";
import { motion } from "framer-motion";
import { popIn, spring } from "@lib/client/animations";
import { Select } from "@components/Input";
import { FivePointScale } from "@lib/server/database";
import Image from "next/image";
import { BUILDINGS } from "@lib/client/data";

import clothing1 from "@static/clothing/clothing1.png";
import clothing2 from "@static/clothing/clothing2.png";
const images = [clothing1, clothing2];

import { favorites } from "@lib/client/favorites";

export default function Suggest() {
  const [clothing, setClothing] = useState(1);
  const [order, setOrder] = useState(favorites);

  useEffect(() => {
    setTimeout(() => setOrder(
      order.sort(() => Math.round(2 * (Math.random() - 0.5)))
    ), 1000);
  }, [order]);

  return (
    <main className="min-h-screen bg-gray-100">
      <Head>
        <title>Suggest A Room</title>
      </Head>
      <Header title="Room Recommendation" />
      <div className="py-3 px-12 flex flex-col sm:py-12 max-w-3xl m-auto">
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

        <div className="mt-6">
          {order.map((room) => (
            <motion.div
              layout
              transition={spring}
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
          ))}
        </div>
      </div>
    </main>
  );
}
