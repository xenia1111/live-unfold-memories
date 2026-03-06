import { useState, useEffect } from "react";
import eggNest from "@/assets/egg-nest.png";
import catLv0 from "@/assets/cat-lv0.png";

interface EggHatchEffectProps {
  onComplete: () => void;
}

const EggHatchEffect = ({ onComplete }: EggHatchEffectProps) => {
  const [phase, setPhase] = useState<"shake" | "crack" | "burst" | "kitten">("shake");

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("crack"), 800),
      setTimeout(() => setPhase("burst"), 1800),
      setTimeout(() => setPhase("kitten"), 2800),
      setTimeout(() => onComplete(), 4200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Light burst overlay */}
      {(phase === "burst" || phase === "kitten") && (
        <div className="absolute inset-0 animate-hatch-burst bg-gradient-radial from-amber-200/80 via-amber-100/40 to-transparent" />
      )}

      {/* Rays of light */}
      {phase === "burst" && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 bg-gradient-to-t from-amber-400/60 to-transparent animate-hatch-ray"
              style={{
                height: "120px",
                transformOrigin: "bottom center",
                transform: `rotate(${i * 45}deg)`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Egg shell pieces flying out */}
      {(phase === "crack" || phase === "burst") && (
        <>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute text-xl animate-shell-fly"
              style={{
                animationDelay: `${i * 0.1}s`,
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) rotate(${i * 60}deg)`,
              }}
            >
              🥚
            </div>
          ))}
        </>
      )}

      {/* Egg - shaking then cracking */}
      {(phase === "shake" || phase === "crack") && (
        <div className={phase === "shake" ? "animate-egg-shake" : "animate-egg-crack"}>
          <img
            src={eggNest}
            alt="egg hatching"
            className="w-28 h-28 object-contain"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      )}

      {/* Kitten appearing */}
      {phase === "kitten" && (
        <div className="animate-kitten-appear">
          <img src={catLv0} alt="kitten" className="w-20 h-20 object-contain" style={{ imageRendering: "pixelated" }} />
          <p className="text-center text-xs font-medium text-white drop-shadow-lg mt-2 animate-fade-in">
            🎉 小猫咪诞生了！
          </p>
        </div>
      )}

      {/* Sparkle particles */}
      {(phase === "burst" || phase === "kitten") && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute text-sm animate-sparkle-fly"
              style={{
                left: `${30 + Math.random() * 40}%`,
                top: `${30 + Math.random() * 40}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.8 + Math.random() * 0.6}s`,
              }}
            >
              {["✨", "⭐", "💫", "🌟"][i % 4]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EggHatchEffect;
