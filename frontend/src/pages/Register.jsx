import { useState } from "react"
import { useNavigate } from "react-router-dom"

function Register() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  })

  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData({
      ...formData,//Old form data-va preserve pannitu, user change panna field value mattum update pannudhu.
      [name]: value,
    })
  }

  const handleRegister = async (event) => {
    event.preventDefault()

    setMessage("")
    setLoading(true)

    try {
      const response = await fetch(
        "http://localhost:8000/api/accounts/register/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      )

      const data = await response.json()

      console.log("Register response:", data)

      if (!response.ok) {
        if (data.username) {
          setMessage(data.username[0])
        } else if (data.email) {
          setMessage(data.email[0])
        } else if (data.password) {
          setMessage(data.password[0])//first email error message
        } else {
          setMessage("Registration failed")
        }

        return
      }

      setMessage("Registration successful!")

      setTimeout(() => {
        navigate("/")
      }, 1000)

    } catch (error) {
      console.error("Register error:", error)
      setMessage("Unable to connect to Django server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">

      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">

        <h1 className="text-3xl font-bold text-center text-blue-600">
          Create Account
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Credit Card Payment System
        </p>

        <form onSubmit={handleRegister} className="mt-6">

          {/* First Name */}
          <div className="mb-4">
            <label className="block mb-2 font-medium">
              First Name
            </label>

            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Enter first name"
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          {/* Last Name */}
          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Last Name
            </label>

            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Enter last name"
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          {/* Username */}
          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Username
            </label>

            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block mb-2 font-medium">
              Password
            </label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Creating Account..." : "Register"}
          </button>

        </form>

        {message && (
          <p className="text-center mt-4 font-medium">
            {message}
          </p>
        )}

        <p className="text-center mt-4 text-gray-600">
          Already have an account?
        </p>

        <button
          onClick={() => navigate("/")}
          className="w-full mt-2 border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50"
        >
          Go to Login
        </button>

      </div>

    </div>
  )
}

export default Register