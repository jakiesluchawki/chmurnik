import { useEffect, useRef, useState } from "react";
import {
  advanceInputs,
  inputsSettled,
  sceneAppearance,
} from "./presentation.mjs";

export function useSceneMotion(scene, target, playing, disabled) {
  const current = useRef({ input: target, flowOffset: 0 });
  const [frame, setFrame] = useState(current.current);
  const [hidden, setHidden] = useState(() => document.hidden);
  useEffect(() => {
    const visibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, []);
  useEffect(() => {
    if (disabled || hidden) {
      current.current = { ...current.current, input: target };
      setFrame(current.current);
      return;
    }
    let request;
    let previous = performance.now();
    let start = previous;
    const tick = (now) => {
      const elapsed = Math.min(64, now - previous);
      previous = now;
      const input =
        now - start > 650
          ? target
          : advanceInputs(current.current.input, target, elapsed);
      const speed =
        scene === "breeze" ? sceneAppearance(scene, input).speed : 0;
      current.current = {
        input,
        flowOffset:
          (current.current.flowOffset + (speed * elapsed) / 1000) % 290,
      };
      setFrame(current.current);
      if (playing || !inputsSettled(input, target))
        request = requestAnimationFrame(tick);
    };
    if (playing || !inputsSettled(current.current.input, target)) {
      request = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(request);
  }, [scene, target, playing, disabled, hidden]);
  return disabled || hidden ? { ...frame, input: target } : frame;
}
