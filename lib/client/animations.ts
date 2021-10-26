/**
 * @author Brendan McGuire
 * @date 26 September 2021
 * 
 * Reusable and composable animations with framer motion
 */

const popIn = {
    initial: {
        opacity: 0,
        y: 30,
        scale: 0.75
    },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1
    },
    transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
    }
};

const slideRight = (open?: any, closed?: any) => ({
    variants: {
        open: {
            x: open ?? 0
        },
        closed: {
            x: closed ?? "100%"
        }
    },
    transition: {
        type: "tween",
    },
});

const spring  = {
    type: "spring",
    damping: 25,
    stiffness: 120
  };


export { popIn, slideRight, spring };