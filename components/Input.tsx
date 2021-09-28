import { ChangeEvent } from "react";

export type InputProps = {
  placeholder?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  onFocus?: () => void;

  type?: string;
};

export function Input(props: InputProps) {
  return (
    <input
      {...props}
      className="w-full py-2 text-center border-2 rounded-lg"
    />
  );
}


export function Button({ text, onClick }) {
    return (
        <button className="w-32 py-2 ml-auto mt-4 text-center text-white rounded-lg bg-orange active:bg-opacity-50" onClick={onClick}>
        Submit
      </button>
    );
  }
  