import Link from "next/link";
import Head from "next/head";
import Image from "next/image";
import { motion } from "framer-motion";
import { popIn } from "@lib/client/animations";
import { useRouter } from "next/router";
import PopupID, { getID } from "@components/popup/id";
import Popup from "@components/Popup";
import { Button, Select } from "@components/Input";
import React, { useState } from "react";
import Survey from "@components/Survey";
import useSensorData, { Entry, ResponseType } from "@lib/client/data";

import clothing1 from "@static/clothing/clothing1.png";
import clothing2 from "@static/clothing/clothing2.png";
const images = [clothing1, clothing2];

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

const options = {
  perception: ["Cold", "Cool", "Neutral", "Warm", "Hot"] as const,
  preference: [
    "Much Cooler",
    "Cooler",
    "As Is",
    "Warmer",
    "Much Warmer",
  ] as const,
  clothing: [1, 2] as const,
};

// Submits feedback to the server
async function submit(
  placeID: string,
  participantID: string,
  perception: number,
  preference: number,
  clothing: number
) {}

export default function FeedbackPage() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const participantID = getID();
  const [data, actions] = useSensorData();

  const [submitted, setSubmitted] = useState(false);

  // Survey questions
  const [perception, setPerception] = useState(2);
  const [preference, setPreference] = useState(2);
  const [clothing, setClothing] = useState(1);

  return (
    <div className="min-h-screen bg-gray-100">
      <PopupID />
      <Popup show={submitted}>
        <h1 className="text-xl font-bold">Submitted!</h1>
        <p>Your feedback has been saved to the server successfully.</p>
        <div className="flex justify-center items-center">
          <Button text="Close" onClick={() => router.push("/")} autoFocus />
        </div>
      </Popup>
      <header className="w-full h-20 rounded-b-xl bg-orange">
        <nav className="w-full flex items-center p-6 text-white">
          <Link href="/">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white cursor-pointer"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 17l-5-5m0 0l5-5m-5 5h12"
              />
            </svg>
          </Link>
          <p className="pl-3 text-lg flex-1">User Feedback</p>
        </nav>
        <section className="live max-w-5xl m-auto flex items-center justify-evenly md:justify-start md:px-16 text-white"></section>
      </header>
      <main className="p-6 max-w-5xl m-auto items-center">
        <Head>
          <title>User Feedback</title>
        </Head>
        <motion.div
          {...(participantID ? popIn : {})}
          className="bg-white w-full rounded-3xl shadow-sm p-6 flex flex-col"
        >
          <Survey
            onSubmit={async () => {
              await submit(id, participantID, perception, preference, clothing);
              setSubmitted(true);
            }}
          >
            <>
              <p>This room's temperature feels...</p>
              <Select
                options={options.perception}
                value={options.perception[perception]}
                onSelect={(item) =>
                  setPerception(options.perception.indexOf(item))
                }
                render={(item) => <>{item}</>}
              />
            </>
            <>
              <p>I want this room's temperature to be...</p>
              <Select
                options={options.preference}
                value={options.preference[preference]}
                onSelect={(item) =>
                  setPreference(options.preference.indexOf(item))
                }
                render={(item) => <>{item}</>}
              />
            </>
            <>
              <p>What is closest to your current clothing level?</p>
              <Select
                options={[1, 2]}
                value={clothing}
                onSelect={(item) => setClothing(item)}
                render={(item) => (
                  <div className="w-full flex items-center justify-center">
                    <Image
                      src={images[item - 1]}
                      width="106"
                      height="123"
                      alt={`Clothing Level ${item}`}
                    />
                  </div>
                )}
              />
            </>
          </Survey>
        </motion.div>
      </main>
    </div>
  );
}
