import { ResponseType, BUILDINGS } from "../../models/data";
import Link from "next/link";
import { motion } from "framer-motion"
import { popIn } from "../../animations";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
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
        <section className="live max-w-5xl m-auto flex items-center justify-evenly md:justify-start md:px-16 text-white">
          <div className="text-center md:pr-12">
            <p className="text-lg">73.4 °F</p>
            <p className="text-white text-opacity-90">TEMP</p>
          </div>
          <div className="text-center md:pr-12">
            <p className="text-lg">0.0</p>
            <p className="text-white text-opacity-90">HUMIDITY</p>
          </div>
        </section>
      </header>
      <main className="p-6 max-w-5xl m-auto">
        <motion.div {...popIn} className="bg-white w-full rounded-3xl shadow-sm p-6 flex flex-col">
          <h3 className="text-base font-semibold uppercase">Survey</h3>
          <h5 className="text-gray-500">Question 1 of 3</h5>
          <div className="question flex-1 mt-2 text-gray-600 mb-4">
            <p className="text-base">This room feels...</p>
            <div className="options flex flex-col md:flex-row">
              <div className="option rounded-xl w-full px-6 my-2 border-2 border-gray-200 py-4 cursor-pointer hover:border-gray-300 md:mr-4 md:text-center">
                Cold
              </div>
              <div className="option rounded-xl w-full px-6 my-2 border-2 border-gray-200 py-4 cursor-pointer hover:border-gray-300 md:mr-4 md:text-center">
                Cool
              </div>
              <div className="option rounded-xl w-full px-6 my-2 border-2 border-gray-200 py-4 cursor-pointer hover:border-gray-300 md:mr-4 md:text-center">
                Neutral
              </div>
              <div className="option rounded-xl w-full px-6 my-2 border-2 border-gray-200 py-4 cursor-pointer hover:border-gray-300 md:mr-4 md:text-center">
                Warm
              </div>
              <div className="option rounded-xl w-full px-6 my-2 border-2 border-gray-200 py-4 cursor-pointer hover:border-gray-300 md:text-center">
                Hot
              </div>
            </div>
          </div>
          <div>
            <a
              href="#"
              className="py-2 px-4 rounded-lg text-white hover:rounded-md transition-all hover:shadow-md"
            >
              Next
            </a>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
