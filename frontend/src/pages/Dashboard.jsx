import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()

  useEffect(() => {
    // Component load aagumbodhu execute aaga vendiya code inga ezhuthuvom
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("access_token")

        if (!token) {
          navigate("/")
          return
        }

        const response = await fetch(
          "http://localhost:8000/api/accounts/me/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!response.ok) {
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
          navigate("/")
          return
        }

        const data = await response.json()

        setUser(data)
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refresh_token")
    const accessToken = localStorage.getItem("access_token")

    try {
      const response = await fetch(
        "http://localhost:8000/api/accounts/logout/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            refresh: refreshToken,
          }),
        }
      )

      const data = await response.json()

      console.log("Logout response:", data)
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")

      navigate("/")
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">

        <h1 className="text-xl font-bold">
          Credit Card Payment System
        </h1>

        {/* Right Side Buttons */}
        <div className="flex items-center gap-3">

          {/* Admin Dashboard */}
          <button
            onClick={() => navigate("/admin-dashboard")}
            className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg"
          >
            Admin Dashboard
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg"
          >
            Logout
          </button>

        </div>

      </nav>

      {/* Main Content - Center everything */}
      <div className="flex flex-col items-center text-center p-8">

        <h2 className="text-3xl font-bold">
          Dashboard
        </h2>

        <p className="mt-2 text-gray-600">
          Welcome to your payment dashboard.
        </p>

        {/* User Information */}
        <div className="bg-white p-6 rounded-xl shadow mt-6 w-full max-w-md">

          <h3 className="text-xl font-semibold mb-4">
            My Profile
          </h3>

          {loading ? (
            <p className="text-gray-500">
              Loading...
            </p>
          ) : user ? (
            <div className="space-y-3">

              <p>
                <span className="font-semibold">
                  User ID:
                </span>{" "}
                {user.id}
              </p>

              <p>
                <span className="font-semibold">
                  Username:
                </span>{" "}
                {user.username}
              </p>

              <p>
                <span className="font-semibold">
                  Email:
                </span>{" "}
                {user.email}
              </p>

            </div>
          ) : (
            <p className="text-red-500">
              Unable to load user information.
            </p>
          )}

        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full max-w-6xl">

          {/* My Cards */}
          <div className="bg-white p-6 rounded-xl shadow">

            <h3 className="text-xl font-semibold">
              My Cards
            </h3>

            <p className="text-gray-500 mt-2">
              Add and manage your credit cards.
            </p>

            <button
              onClick={() => navigate("/cards")}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Manage Cards
            </button>

          </div>

          {/* Make Payment */}
          <div className="bg-white p-6 rounded-xl shadow">

            <h3 className="text-xl font-semibold">
              Make Payment
            </h3>

            <p className="text-gray-500 mt-2">
              Make a payment using your saved card.
            </p>

            <button
              onClick={() => navigate("/payment")}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              Make Payment
            </button>

          </div>

          {/* Transactions */}
          <div className="bg-white p-6 rounded-xl shadow">

            <h3 className="text-xl font-semibold">
              Transactions
            </h3>

            <p className="text-gray-500 mt-2">
              View your payment history.
            </p>

            <button
              onClick={() => {
                console.log("View Transactions clicked")
                navigate("/transactions")
              }}
              className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg"
            >
              View Transactions
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}

export default Dashboard
