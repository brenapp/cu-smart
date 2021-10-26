/**
 * @author Brendan McGuire
 * @date 27 September 2021
 * 
 * ID popup component, to prompt the user to enter their experiment ID. Eventually this will be
 * replaced with Single Sign On integration
 */

import Popup from "../Popup";
import { Input, Button } from "../Input";

import { useEffect, useState } from "react";

export const getID = () => {
  if (typeof window !== "undefined") {
    const id = localStorage.getItem("id");
    if (id) return id;
    else return "";
  } else {
    return "";
  }
};

export default function PopupID() {
    
  const id = getID();
  const [show, setShow] = useState(id == "");

    return (
      <Popup show={show}>
        <h1 className="text-xl font-bold">Enter Your Participant ID to Continue</h1>
        <p className="text-base my-4 text-gray-500">
          You should be able to get this number from the experiment supervisor.
          This number uniquely and anonymously identifies you, and is used to
          build your personalized recommendations.
        </p>

        <p className="text-base text-gray-500 my-4">
          This number is stored locally on your device, and submitted when you
          submit feedback.{" "}
        </p>
        <Input
          placeholder="Your Participant ID"
          type="number"
          onChange={(event) => process.browser ? localStorage.setItem("id", event.target.value) : null}
          onKeyDown={(event) => event.key === "Enter" ? setShow(false) : null}
        />
        <Button text="Submit" onClick={() => setShow(false)} />
      </Popup>
    );

}
