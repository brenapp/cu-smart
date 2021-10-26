/**
 * @author Brendan McGuire
 * @date 27 September 2021
 *
 * Component used to surface popup messages. Note that these popups are disturbing to the user
 * experience, and should be used sparingly.
 **/

import { motion } from "framer-motion";
import { popIn } from "@lib/client/animations";

export type Props = {
  children: React.ReactNode;
  show: boolean;
};

export default function Popup({ children, show }: Props) {
  if (!show) {
    return null;
  }

  return (
    <div className="w-screen h-screen fixed top-0 left-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <motion.div {...popIn} className="w-96 bg-white p-6 rounded-2xl">
        {children}
      </motion.div>
    </div>
  );
}
