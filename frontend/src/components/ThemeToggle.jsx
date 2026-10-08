import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

function ThemeToggle() {
  const { theme, toggleTheme } =
    useContext(ThemeContext);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="
        rounded-xl
        border
        border-gray-300
        bg-white
        px-4
        py-2
        text-sm
        font-medium
        text-gray-800
        shadow-sm
        transition
        hover:bg-gray-100

        dark:border-gray-600
        dark:bg-gray-800
        dark:text-white
        dark:hover:bg-gray-700
      "
      aria-label="Toggle dark mode"
    >
      {theme === "light" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}

export default ThemeToggle;