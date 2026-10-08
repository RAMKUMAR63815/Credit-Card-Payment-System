import {
  createContext, // Creates a Context to share theme data between components.
  useEffect,     // Runs code when the component loads or when theme changes.
  useState,      // Stores the current theme and allows us to update it.
} from "react"; // Imports these React features from the React library.

export const ThemeContext = createContext(); // Creates a ThemeContext that other components can use to access theme data.

export function ThemeProvider({ children }) { // Creates a provider component; children means the components placed inside ThemeProvider.

  const [theme, setTheme] = useState(() => { // Creates theme state and setTheme function; initial value is loaded from localStorage.

    return localStorage.getItem("theme") || "light"; // Gets saved theme from localStorage; if nothing is saved, uses light.
  }); // Ends the useState initialization.

  useEffect(() => { // Runs this code whenever the theme value changes.

    const root = document.documentElement; // Gets the HTML <html> element of the webpage.

    if (theme === "dark") { // Checks whether the current theme is dark.

      root.classList.add("dark"); // Adds the "dark" class to <html> so Tailwind dark mode can work.

    } else { // Runs when the current theme is not dark.

      root.classList.remove("dark"); // Removes the "dark" class from <html> and switches to light mode.
    }

    localStorage.setItem("theme", theme); // Saves the current theme in browser localStorage so it remains after refresh.

  }, [theme]); // Runs useEffect whenever the theme value changes.

  const toggleTheme = () => { // Creates a function that switches between light and dark themes.

    setTheme((currentTheme) => // Updates the theme using its current value.

      currentTheme === "light" ? "dark" : "light" );}; 

  return ( 
    // Provides theme information to all child components.
        <ThemeContext.Provider 
                value={{theme,toggleTheme }}// Defines the data/functions available through ThemeContext.
            // Shares the current theme value, either light or dark.
            // Shares the function used to change the theme.
            >

        {children} // Displays the components placed inside ThemeProvider.

        </ThemeContext.Provider> 
  ); }