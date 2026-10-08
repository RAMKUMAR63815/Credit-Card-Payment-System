import { useContext } from "react"
import { ThemeContext } from "../context/ThemeContext"

function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext)

  return (
    <button
      onClick={toggleTheme}
      className="
        rounded-lg
        px-4
        py-2
        font-medium
        transition
        duration-300

        bg-gray-800
        text-white
        hover:bg-gray-900

        dark:bg-white
        dark:text-gray-800
        dark:hover:bg-gray-100
      "
    >
      {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
    </button>
  )
}

export default ThemeToggle