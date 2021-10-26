/**
 * @author Brendan McGuire
 * @date 5 October 2021
 * 
 * Header component with integrated back button
 **/

import router from "next/router";
import React from "react";

export type HeaderProps = {
  title: string;
};

export function Header({ title }: HeaderProps) {
  return (
    <header className="w-full h-20 rounded-b-xl bg-orange">
      <nav className="w-full flex items-center p-6 text-white">
        <a onClick={() => router.back()} >
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
        </a>
        <p className="pl-3 text-lg flex-1">{title}</p>
      </nav>
    </header>
  );
}
