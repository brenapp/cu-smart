import React from "react";
import { Header } from "@components/Header";
import Head from "next/head";

export default function Suggest() {
  return (
    <main>
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
          Fill out the form below to generate your personalized recommendation!
        </p>
      </div>
    </main>
  );
}
