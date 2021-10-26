/**
 * @author Brendan McGuire
 * @date 28 September 2021
 *
 * Custom input components using tailwind styling
 **/

import {
  ChangeEvent,
  DetailedHTMLProps,
  InputHTMLAttributes,
  ReactChild,
  ReactNode,
} from "react";

export type InputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
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
      className={
        "w-full py-2 text-center border-2 rounded-lg after:" + props.className
      }
    />
  );
}

export type ButtonProps = {
  onClick?: () => void;
  text: string;
  variant?: "primary" | "secondary" | "disabled";
  className?: string;
  autoFocus?: boolean;
  before?: () => ReactChild;
};

export function Button({
  text,
  onClick,
  variant,
  className,
  autoFocus,
  before,
}: ButtonProps) {
  const base =
    "py-2 px-4 mt-4 text-center rounded-lg border-box hover:shadow-md transition:all flex justify-center items-center";

  const variants = {
    primary: "text-white bg-orange active:bg-opacity-50",
    secondary: "active:bg-opacity-50 border-2 active:border-orange",
    disabled:
      "bg-gray-100 bg-gray-100-active:bg-opacity-50 hover:shadow-none cursor-not-allowed",
  };

  return (
    <button
      className={[variants[variant || "primary"], className, base].join(" ")}
      onClick={onClick}
      autoFocus={autoFocus}
    >
      {before && before()}
      {text}
    </button>
  );
}

export type SelectProps<T> = {
  options: readonly T[];
  value: T;
  onSelect: (value: T, selected: boolean) => void;

  mode?: "row" | "col" | "responsive";

  className?: string;
  render: (item: T) => ReactNode;
};
export function Select<T>({
  options,
  render,
  onSelect,
  className,
  mode = "responsive",
  value,
}: SelectProps<T>) {
  const base =
    className +
    " rounded-xl flex-1 my-2 mx-2 border-2 border-gray-200 py-4 cursor-pointer md:mr-4 text-center";

  const unselected = base + " hover:border-gray-300";
  const selected = base + " border-orange";

  const flex = {
    row: "flex-row",
    col: "flex-col",
    responsive: "flex-col md:flex-row",
  };

  return (
    <div className={`options flex ${flex[mode]} justify-between`}>
      {options.map((item, i) => (
        <div
          key={i}
          className={value === item ? selected : unselected}
          onClick={() => onSelect(item, value === item)}
        >
          {render(item)}
        </div>
      ))}
    </div>
  );
}
