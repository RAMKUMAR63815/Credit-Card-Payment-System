import { useState } from "react"
import { useNavigate } from "react-router-dom"

function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate() //React app-la oru page-lendhu another page-ku move panna use pannuvom.

  const handleLogin = async (event) => {
    event.preventDefault() //Login button click pannumbodhu page refresh aagama, namma fetch() API request execute aaga allow pannuradhu.

    setMessage("")
    setLoading(true)//request start

    try {
      const response = await fetch(
        "http://localhost:8000/api/accounts/login/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // JavaScript object-ah JSON string format-ku convert pannuradhu
            username: username,
            password: password,
          }),
        }
      )

    const data = await response.json()

    if (!response.ok) {
        setMessage("Invalid username or password")
        return
      }

      localStorage.setItem("access_token", data.access)
      localStorage.setItem("refresh_token", data.refresh)

      setMessage("Login successful!")

      console.log("Login response:", data)

      setTimeout(() => {navigate("/dashboard")}, 500)//500 milliseconds (0.5 second) wait pannitu dashboard-ku pogum.

    } 
    catch (error) {
      console.error(error)
      setMessage("Unable to connect to server")
    } 
    finally {
      setLoading(false)
    }
  }

return (
    // min-h-screen = Full screen minimum height
    // bg-gray-100 = Light gray background
    // flex = Flexbox enable
    // items-center = Vertical center
    // justify-center = Horizontal center
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">

      {/* // w-full = Full width
      // max-w-md = Maximum medium width
      // bg-white = White background
      // p-8 = Padding
      // rounded-xl = Large rounded corners
      // shadow-lg = Large shadow */}
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">

        {/* // text-3xl = Large text
        // font-bold = Bold text
        // text-center = Center align
        // text-blue-600 = Blue text */}
        <h1 className="text-3xl font-bold text-center text-blue-600">
          Login
        </h1>

        {/*
        // text-center = Center align
        // text-gray-500 = Gray text
        // mt-2 = Small top margin */}
        <p className="text-center text-gray-500 mt-2">
          Credit Card Payment System
        </p>

        {/* // mt-6 = Large top margin */}
        <form className="mt-6" onSubmit={handleLogin}>

          {/* // mb-4 = Bottom margin */}
          <div className="mb-4">

            {/* // block = Full line display
            // mb-2 = Small bottom margin
            // font-medium = Medium font weight */}
            <label className="block mb-2 font-medium">
              Username
            </label>

            {/* // type="text" = Text input
            // w-full = Full width
            // border = Border
            // rounded-lg = Rounded corners
            // px-4 = Left and right padding
            // py-2 = Top and bottom padding */}
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div className="mb-4">

            {/* // block = Full line display
            // mb-2 = Small bottom margin
            // font-medium = Medium font */}
            <label className="block mb-2 font-medium">
              Password
            </label>

            {/* // type="password" = Hides password characters
            // w-full = Full width
            // border = Border
            // rounded-lg = Rounded corners
            // px-4 = Horizontal padding
            // py-2 = Vertical padding */}
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          {/* // type="submit" = Submit form
          // w-full = Full width
          // bg-blue-600 = Blue background
          // text-white = White text
          // py-2 = Vertical padding
          // rounded-lg = Rounded corners */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        {/* // text-center = Center text
        // mt-4 = Top margin
        // text-gray-600 = Gray text */}
        <p className="text-center mt-4 text-gray-600">
          Don't have an account? 
        </p>
        <button
            type="button"
            onClick={() => navigate("/register")}
            className="w-full mt-2 border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50"
                >
            Register
            </button>

        {message && (
          <p className="text-center mt-4 text-gray-600">
            {message}
          </p>
        )}

      </div>
    </div>
  )
}

export default Login

