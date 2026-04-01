import { useEffect, useState } from "react";
import Confetti from "react-confetti";

type CelebrationConfettiProps = {
  active: boolean;
};

export default function CelebrationConfetti({ active }: CelebrationConfettiProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [allowMotion, setAllowMotion] = useState(true);

  useEffect(() => {
    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setAllowMotion(!media.matches);

    updateMotionPreference();
    media.addEventListener("change", updateMotionPreference);

    return () => {
      media.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  if (!active || !allowMotion) {
    return null;
  }

  return (
    <Confetti
      width={size.width}
      height={size.height}
      recycle={false}
      numberOfPieces={220}
      gravity={0.18}
      tweenDuration={7000}
    />
  );
}
