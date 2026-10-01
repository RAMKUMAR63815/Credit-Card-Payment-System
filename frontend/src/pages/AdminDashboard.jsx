import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

function AdminDashboard() {
  const navigate = useNavigate()

  const [checking, setChecking] = useState(true)

  // Check whether logged-in user is admin/staff
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem("access_token")

        // No token → go to login
        if (!token) {
          navigate("/")
          return
        }

        // Get current user details
        const response = await fetch(
          "http://localhost:8000/api/accounts/me/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        // Invalid or expired token
        if (!response.ok) {
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")

          navigate("/")
          return
        }

        const data = await response.json()

        console.log("Logged-in user:", data)

        // Check admin/staff permission
        if (!data.is_staff) {
          alert("Admin access required")
          navigate("/dashboard")
          return
        }

      } catch (error) {
        console.error("Admin check error:", error)

        navigate("/dashboard")

      } finally {
        setChecking(false)
      }
    }

    checkAdmin()
  }, [navigate])

  // Show checking message while verifying admin
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-lg font-medium">
          Checking admin access...
        </p>
      </div>
    )
  }

  // Export transactions as CSV
  const handleExport = async () => {
    try {
      const token = localStorage.getItem("access_token")

      if (!token) {
        navigate("/")
        return
      }

      const response = await fetch(
        "http://localhost:8000/api/payments/transactions/admin/export/",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => null)

        console.error("CSV export error:", data)

        alert(
          data?.detail ||
          data?.error ||
          "Unable to export transactions"
        )

        return
      }

      // Convert response into CSV file
      const blob = await response.blob()

      // Create temporary browser URL
      const url = window.URL.createObjectURL(blob)

      // Create download link
      const link = document.createElement("a")

      link.href = url
      link.download = "transactions.csv"

      document.body.appendChild(link)

      // Start download
      link.click()

      // Clean up
      link.remove()
      window.URL.revokeObjectURL(url)

    } catch (error) {
      console.error("CSV export error:", error)

      alert("Unable to connect to Django server")
    }
  }

  // Open daily payment summary
  const handleSummary = () => {
    window.open(
      "http://localhost:8000/api/admin/summary/",
      "_blank"
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-blue-600 text-white px-6 py-4">

        {/* Left and Right alignment */}
        <div className="w-full flex justify-between items-center">

          {/* Left Corner - Admin Dashboard */}
          <h1 className="text-xl font-bold">
            Admin Dashboard
          </h1>

          {/* Right Corner - User Dashboard */}
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 font-medium"
          >
            User Dashboard
          </button>

        </div>

      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Page Heading */}
        <div className="text-center mb-10">

          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
            Admin Dashboard
          </h2>

          <p className="text-gray-600 mt-3">
            Manage users, cards and payment transactions.
          </p>

        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Users */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center">

            <h3 className="text-xl font-semibold text-gray-800">
              Users
            </h3>

            <p className="text-gray-500 mt-3">
              Manage registered users
            </p>

            <button
              onClick={() =>
                window.open(
                  "http://localhost:8000/admin/accounts/user/",
                  "_blank"
                )
              }
              className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium"
            >
              Manage Users
            </button>

          </div>

          {/* Cards */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center">

            <h3 className="text-xl font-semibold text-gray-800">
              Cards
            </h3>

            <p className="text-gray-500 mt-3">
              View saved cards
            </p>

            <button
              onClick={() =>
                window.open(
                  "http://localhost:8000/admin/cards/card/",
                  "_blank"
                )
              }
              className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium"
            >
              Manage Cards
            </button>

          </div>

          {/* Transactions */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center">

            <h3 className="text-xl font-semibold text-gray-800">
              Transactions
            </h3>

            <p className="text-gray-500 mt-3">
              View payment transactions
            </p>

            <button
              onClick={() =>
                window.open(
                  "http://localhost:8000/admin/transactions/transaction/",
                  "_blank"
                )
              }
              className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium"
            >
              Manage Transactions
            </button>

          </div>

        </div>

        {/* Reports Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

          {/* Daily Payment Summary */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center">

            <h3 className="text-xl font-semibold text-gray-800">
              Daily Payment Summary
            </h3>

            <p className="text-gray-500 mt-3">
              View daily successful and failed payments.
            </p>

            <button
              onClick={handleSummary}
              className="mt-5 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              View Summary
            </button>

          </div>

          {/* Transaction Export */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center">

            <h3 className="text-xl font-semibold text-gray-800">
              Transaction Export
            </h3>

            <p className="text-gray-500 mt-3">
              Export all transactions as CSV.
            </p>

            <button
              onClick={handleExport}
              className="mt-5 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Export CSV
            </button>

          </div>

        </div>

      </main>

    </div>
  )
}

export default AdminDashboard
