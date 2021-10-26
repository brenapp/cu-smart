/**
 * @author Brendan McGuire
 * @date 28 September 2021
 *
 * Paginated Survey component, with a list of questions and a pagination bar, and animations between
 * pages.
 **/

import { popIn } from "@lib/client/animations";
import { motion, AnimatePresence } from "framer-motion";
import { ReactChild, useState } from "react";
import { Button, ButtonProps } from "./Input";

type Props = {
  children: ReactChild[];
  onSubmit?: () => void;
  submitButton?: Partial<ButtonProps>;
};

export default function Survey({ children, onSubmit, submitButton }: Props) {
  const [index, setIndex] = useState(0);

  const increment: () => void = () =>
    setIndex(Math.min(index + 1, children.length - 1));
  const decrement: () => void = () => setIndex(Math.max(index - 1, 0));

  return (
    <div>
      <h3 className="text-base font-semibold uppercase">Survey</h3>
      <div className="flex items-center mb-2">
        <h5 className="text-gray-500">
          Question {index + 1} of {children.length}
        </h5>
        <div className="progress relative ml-4 flex-1 h-2">
          <div
            className="progress-bar bg-orange h-2 rounded-md absolute z-10 transition-all"
            style={{ width: `${((index + 1) / children.length) * 100}%` }}
          />
          <div className="remainder absolute h-2 w-full bg-gray-200 rounded-md"></div>
        </div>
      </div>
      {children[index]}
      <div className="flex w-full items-center justify-end">
        <Button
          text="Previous"
          variant={index == 0 ? "disabled" : "secondary"}
          className="mr-2"
          onClick={decrement}
        />

        {index < children.length - 1 ? (
          <Button text="Next" variant="primary" onClick={increment} />
        ) : (
          <Button
            text="Submit"
            variant="primary"
            onClick={onSubmit}
            {...submitButton}
          />
        )}
      </div>
    </div>
  );
}
