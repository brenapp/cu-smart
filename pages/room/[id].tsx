import { ResponseType, BUILDINGS } from "../../models/data";
import Link from "next/link";
import { motion } from "framer-motion";
import { popIn } from "../../animations";
import { useRouter } from "next/router";
import PopupID, { getID } from "../../components/popup/id";
import Popup from "../../components/Popup";
import { Button, Select } from "../../components/Input";
import { useState } from "react";
import Survey from "../../components/Survey";

export default function Home() {
  const router = useRouter();
  const { id } = router.query;
  const participantID = getID();


  const [submitted, setSubmitted] = useState(false);
  const [perception, setPerception] = useState("Cold");

  return (
    <div className="min-h-screen bg-gray-100">
      <PopupID />
      <Popup show={submitted}>
        <h1 className="text-xl font-bold">Submitted!</h1>
        <p>Your feedback has been saved to the server successfully.</p>
        <div className="flex justify-center items-center">
          <Button text="Close" onClick={() => setSubmitted(false)} autoFocus />
        </div>
      </Popup>
      <header className="w-full h-36 rounded-b-3xl bg-orange">
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
          <p className="pl-3 text-lg flex-1">WATT 319</p>
        </nav>
        <section className="live max-w-5xl m-auto flex items-center justify-evenly md:justify-start md:px-16 text-white"></section>
      </header>
      <main className="p-6 max-w-5xl m-auto">
        <motion.div
          {...(participantID ? popIn : {})}
          className="bg-white w-full rounded-3xl shadow-sm p-6 flex flex-col"
        >
          <Survey onSubmit={() => setSubmitted(true)}>
            <>
              <p>This room's temperature feels...</p>
              <Select
                options={["Cold", "Cool", "Neutral", "Warm", "Hot"]}
                value={perception}
                onSelect={(item) => setPerception(item)}
                render={(item) => <>{item}</>}
              />
            </>
            <>
              <p>I want this room's temperature to be...</p>
              <Select
                options={[
                  "Much Cooler",
                  "Cooler",
                  "As Is",
                  "Warmer",
                  "Much Warmer",
                ]}
                value={perception}
                onSelect={(item) => setPerception(item)}
                render={(item) => <>{item}</>}
              />
            </>
          </Survey>
        </motion.div>
      </main>
    </div>
  );
}
