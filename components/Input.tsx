import { ChangeEvent, ReactNode, useState } from "react";

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
    <input {...props} className="w-full py-2 text-center border-2 rounded-lg" />
  );
}

export type ButtonProps = {
  onClick?: () => void;
  text: string;
};

export function Button({ text, onClick }: ButtonProps) {
  return (
    <button
      className="w-32 py-2 ml-auto mt-4 text-center text-white rounded-lg bg-orange active:bg-opacity-50"
      onClick={onClick}
    >
      {text}
    </button>
  );
}

export type SelectProps<T> = {
  options: T[];
  value: T;
  onSelect: (value: T) => void;

  render: (item: T) => ReactNode;
};
export function Select<T>({
  options,
  render,
  onSelect,
  value,
}: SelectProps<T>) {

  const base = "rounded-xl w-full px-6 my-2 border-2 border-gray-200 py-4 cursor-pointer md:mr-4 md:text-center"

  const unselected = base + " hover:border-gray-300";
  const selected = base + " border-orange";

  return (
    <div className="options flex flex-col md:flex-row">
      {options.map((item, i) => (
        <div
          key={i}
          className={value === item ? selected : unselected}
          onClick={() => onSelect(item)}
        >
          {render(item)}
        </div>
      ))}
    </div>
  );
}
