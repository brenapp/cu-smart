import { motion } from "framer-motion";
import { ReactChild, useState } from "react";
import { Button } from "./Input";

type Props = {
  children: ReactChild[];
  onSubmit?: () => void;
};

export default function Survey({ children, onSubmit }: Props) {
  const [index, setIndex] = useState(0);

  const increment: () => void = () =>
    setIndex(Math.min(index + 1, children.length - 1));
  const decrement: () => void = () => setIndex(Math.max(index - 1, 0));

  return (
    <div>
      <h3 className="text-base font-semibold uppercase">Survey</h3>
      <h5 className="text-gray-500">
        Question {index + 1} of {children.length}
      </h5>
      <div>{children[index]}</div>
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
          <Button text="Submit" variant="primary" onClick={onSubmit} />
        )}
      </div>
    </div>
  );
}
