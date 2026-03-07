import { useState, useEffect, useMemo } from "react";

interface TimeTheme {
  gradient: string;
  label: string;
}

const getTimeTheme = (hour: number): TimeTheme => {
  if (hour >= 5 && hour < 8) return {
    gradient: "linear-gradient(160deg, hsl(350 60% 88%), hsl(40 70% 85%), hsl(45 80% 90%))",
    label: "dawn",
  };
  if (hour >= 8 && hour < 12) return {
    gradient: "linear-gradient(160deg, hsl(45 50% 95%), hsl(200 40% 90%), hsl(180 30% 92%))",
    label: "morning",
  };
  if (hour >= 12 && hour < 14) return {
    gradient: "linear-gradient(160deg, hsl(40 65% 88%), hsl(25 55% 85%), hsl(35 70% 90%))",
    label: "noon",
  };
  if (hour >= 14 && hour < 18) return {
    gradient: "linear-gradient(160deg, hsl(200 35% 90%), hsl(35 60% 85%), hsl(40 70% 88%))",
    label: "afternoon",
  };
  if (hour >= 18 && hour < 21) return {
    gradient: "linear-gradient(160deg, hsl(20 70% 80%), hsl(280 30% 75%), hsl(240 35% 70%))",
    label: "sunset",
  };
  return {
    gradient: "linear-gradient(160deg, hsl(230 40% 20%), hsl(260 35% 18%), hsl(240 45% 15%))",
    label: "night",
  };
};

const TimeAwareBackground = () => {
  const [hour, setHour] = useState(() => new Date().getHours());

  useEffect(() => {
    const interval = setInterval(() => {
      setHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const theme = useMemo(() => getTimeTheme(hour), [hour]);
  const isNight = theme.label === "night" || theme.label === "sunset";

  return (
    <div className="fixed inset-0 -z-10 transition-all duration-[3000ms] ease-in-out" style={{ background: theme.gradient }}>
      {/* Subtle animated orbs */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-30 blur-3xl animate-float"
        style={{
          background: isNight
            ? "radial-gradient(circle, hsl(260 50% 40% / 0.3), transparent 70%)"
            : "radial-gradient(circle, hsl(40 80% 70% / 0.3), transparent 70%)",
          top: "-10%",
          right: "-20%",
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-20 blur-3xl animate-float"
        style={{
          background: isNight
            ? "radial-gradient(circle, hsl(220 60% 50% / 0.2), transparent 70%)"
            : "radial-gradient(circle, hsl(180 40% 70% / 0.25), transparent 70%)",
          bottom: "10%",
          left: "-15%",
          animationDelay: "1.5s",
        }}
      />
    </div>
  );
};

export default TimeAwareBackground;
