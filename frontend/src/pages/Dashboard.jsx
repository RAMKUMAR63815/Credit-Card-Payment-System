// Import React hooks used for state management and running code after component loading.
import { useEffect, useState } from "react"

// Import useNavigate to move between React pages without refreshing the browser.
import { useNavigate } from "react-router-dom"


// Define the Dashboard React component.
function Dashboard() {

  // Store logged-in user's profile information.
  const [user, setUser] = useState(null)

  // Store dashboard statistics and recent transaction data.
  const [dashboard, setDashboard] = useState(null)

  // Track whether dashboard/user data is currently loading.
  const [loading, setLoading] = useState(true)

  // Store any error message that occurs while fetching data.
  const [error, setError] = useState("")

  // Create navigation function for moving between pages.
  const navigate = useNavigate()


  // This function fetches the logged-in user's profile from Django.
  const fetchUser = async () => {

    // Start the try block for API request handling.
    try {

      // Get JWT access token stored after login.
      const token = localStorage.getItem("access_token")

      // Check whether the user has logged in.
      if (!token) {

        // Send the user back to the login page if no token exists.
        navigate("/")

        // Stop the function because authentication is missing.
        return
      }


      // Send request to Django's current-user API.
      const response = await fetch(
        "http://localhost:8000/api/accounts/me/",
        {
          // Tell Django that this is a GET request.
          method: "GET",

          // Send JWT token in the Authorization header.
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )


      // Check whether Django rejected the JWT token.
      if (!response.ok) {

        // Remove invalid access token from browser storage.
        localStorage.removeItem("access_token")

        // Remove refresh token from browser storage.
        localStorage.removeItem("refresh_token")

        // Redirect the user to login.
        navigate("/")

        // Stop execution after authentication failure.
        return
      }


      // Convert Django's JSON response into a JavaScript object.
      const data = await response.json()

      // Store the logged-in user's information in state.
      setUser(data)

    } catch (error) {

      // Print user API error in the browser console for debugging.
      console.error("Error fetching user:", error)
    }
  }


  // This function fetches dashboard statistics from FastAPI.
  const fetchDashboard = async () => {

    // Start the try block for dashboard API request.
    try {

      // Show loading state while dashboard data is being fetched.
      setLoading(true)

      // Clear any previous error message.
      setError("")


      // Get the JWT access token from browser storage.
      const token = localStorage.getItem("access_token")


      // Check whether the access token exists.
      if (!token) {

        // Show login-required message when token is missing.
        setError("Please login to view the dashboard.")

        // Stop this function because authentication is missing.
        return
      }


      // Send authenticated request to FastAPI dashboard endpoint.
      const response = await fetch(
        "http://localhost:8001/dashboard/summary",
        {
          // Use GET because we are retrieving dashboard information.
          method: "GET",

          // Send JWT token to FastAPI.
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )


      // Check specifically for an expired or invalid JWT.
      if (response.status === 401) {

        // Remove invalid access token.
        localStorage.removeItem("access_token")

        // Remove refresh token.
        localStorage.removeItem("refresh_token")

        // Display session-expired message.
        setError(
          "Your session has expired. Please login again."
        )

        // Stop execution after authentication failure.
        return
      }


      // Check for other HTTP errors such as 500 or 503.
      if (!response.ok) {

        // Create an error that will be handled by catch.
        throw new Error("Failed to load dashboard")
      }


      // Convert FastAPI JSON response into JavaScript data.
      const data = await response.json()

      // Store dashboard API response in state.
      setDashboard(data)

    } catch (error) {

      // Print dashboard API error in browser console.
      console.error("Dashboard error:", error)

      // Show user-friendly error message.
      setError(
        "Unable to load dashboard data. Please try again."
      )

    } finally {

      // Stop the loading state after request completes.
      setLoading(false)
    }
  }


  // Run user and dashboard API calls when Dashboard component loads.
  useEffect(() => {

    // Create function to load all dashboard-related data.
    const loadDashboard = async () => {

      // First fetch logged-in user's information.
      await fetchUser()

      // Then fetch dashboard statistics and transactions.
      await fetchDashboard()
    }

    // Execute the data-loading function.
    loadDashboard()

  }, [navigate])


  // This function handles user logout.
  const handleLogout = async () => {

    // Get refresh token from browser storage.
    const refreshToken = localStorage.getItem("refresh_token")

    // Get access token from browser storage.
    const accessToken = localStorage.getItem("access_token")


    // Start logout API request handling.
    try {

      // Send logout request to Django.
      const response = await fetch(
        "http://localhost:8000/api/accounts/logout/",
        {
          // Logout API uses POST.
          method: "POST",

          // Tell Django that request body contains JSON.
          headers: {
            "Content-Type": "application/json",

            // Send access token for authentication.
            Authorization: `Bearer ${accessToken}`,
          },

          // Send refresh token to Django for token blacklisting.
          body: JSON.stringify({
            refresh: refreshToken,
          }),
        }
      )


      // Convert logout response to JSON.
      const data = await response.json()

      // Print logout response for debugging.
      console.log("Logout response:", data)

    } catch (error) {

      // Print logout error if API request fails.
      console.error("Logout error:", error)

    } finally {

      // Remove access token from browser storage.
      localStorage.removeItem("access_token")

      // Remove refresh token from browser storage.
      localStorage.removeItem("refresh_token")

      // Redirect user to login page.
      navigate("/")
    }
  }


  // Display loading skeleton while API data is loading.
  if (loading) {

    // Return loading UI instead of dashboard.
    return (
      <div className="min-h-screen bg-gray-100">

        {/* Navbar shown during loading. */}
        <nav className="flex items-center justify-between bg-blue-600 px-6 py-4 text-white">

          {/* Application title. */}
          <h1 className="text-xl font-bold">
            Credit Card Payment System
          </h1>

        </nav>


        {/* Loading skeleton container. */}
        <div className="p-8">

          {/* Dashboard heading skeleton. */}
          <div className="mx-auto mb-6 h-8 w-48 animate-pulse rounded bg-gray-200"></div>


          {/* Four statistic card skeletons. */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

            {/* Create four loading cards. */}
            {[1, 2, 3, 4].map((item) => (

              // Individual statistic skeleton card.
              <div
                key={item}
                className="animate-pulse rounded-xl bg-white p-6 shadow"
              >

                {/* Skeleton for card title. */}
                <div className="mx-auto mb-4 h-4 w-32 rounded bg-gray-200"></div>

                {/* Skeleton for card value. */}
                <div className="mx-auto h-8 w-24 rounded bg-gray-200"></div>

              </div>
            ))}

          </div>


          {/* Recent transactions skeleton. */}
          <div className="mt-8 animate-pulse rounded-xl bg-white p-6 shadow">

            {/* Transactions heading skeleton. */}
            <div className="mx-auto mb-6 h-6 w-48 rounded bg-gray-200"></div>


            {/* Five transaction row skeletons. */}
            <div className="space-y-4">

              {/* Generate five fake loading rows. */}
              {[1, 2, 3, 4, 5].map((item) => (

                // Individual transaction loading row.
                <div
                  key={item}
                  className="h-10 rounded bg-gray-200"
                ></div>
              ))}

            </div>

          </div>

        </div>

      </div>
    )
  }


  // Display error page when dashboard API fails.
  if (error) {

    // Return error UI.
    return (
      <div className="min-h-screen bg-gray-100">

        {/* Navbar for error screen. */}
        <nav className="bg-blue-600 px-6 py-4 text-white">

          {/* Application name. */}
          <h1 className="text-xl font-bold">
            Credit Card Payment System
          </h1>

        </nav>


        {/* Error message container. */}
        <div className="p-8">

          {/* Error card. */}
          <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 text-center shadow">

            {/* Dashboard heading. */}
            <h1 className="mb-3 text-2xl font-bold">
              Dashboard
            </h1>

            {/* Display actual error message. */}
            <p className="text-red-600">
              {error}
            </p>

          </div>

        </div>

      </div>
    )
  }


  // Handle case where dashboard response has not arrived.
  if (!dashboard) {

    // Display simple fallback message.
    return (
      <div className="min-h-screen bg-gray-100 p-8">

        {/* Fallback message. */}
        <p className="text-center text-red-600">
          Dashboard data is unavailable.
        </p>

      </div>
    )
  }


  // Display the complete dashboard after successful API requests.
  return (
    <div className="min-h-screen bg-gray-100">


      {/* ================= NAVBAR ================= */}

      {/* Top navigation bar. */}
      <nav className="flex items-center justify-between bg-blue-600 px-6 py-4 text-white shadow-md">

        {/* Application title. */}
        <h1 className="text-xl font-bold">
          Credit Card Payment System
        </h1>


        {/* Right-side navigation buttons. */}
        <div className="flex items-center gap-3">

          {/* Admin dashboard navigation button. */}
          <button
            onClick={() => navigate("/admin-dashboard")}
            className="rounded-lg bg-gray-800 px-4 py-2 text-white transition hover:bg-gray-900"
          >
            Admin Dashboard
          </button>


          {/* Logout button. */}
          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
          >
            Logout
          </button>

        </div>

      </nav>


      {/* ================= MAIN CONTENT ================= */}

      {/* Main dashboard content container. */}
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">


        {/* ================= DASHBOARD TITLE ================= */}

        {/* Dashboard heading section. */}
        <div className="text-center">

          {/* Dashboard page title. */}
          <h2 className="text-3xl font-bold text-gray-800">
            Dashboard
          </h2>

          {/* Dashboard description. */}
          <p className="mt-2 text-gray-600">
            Welcome to your payment dashboard.
          </p>

        </div>


        {/* ================= USER PROFILE ================= */}

        {/* User profile card. */}
        <div className="mx-auto mt-8 w-full max-w-xl rounded-2xl bg-white p-8 text-center shadow-md">

          {/* Profile heading. */}
          <h3 className="mb-6 text-2xl font-bold text-gray-800">
            My Profile
          </h3>


          {/* Check whether user information exists. */}
          {user ? (

            // Display user details when available.
            <div className="mx-auto max-w-md space-y-4">

              {/* User ID row. */}
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-5 py-3 text-left">

                {/* User ID label. */}
                <span className="font-semibold text-gray-600">
                  User ID
                </span>

                {/* User ID value. */}
                <span className="font-bold text-gray-800">
                  {user.id}
                </span>

              </div>


              {/* Username row. */}
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-5 py-3 text-left">

                {/* Username label. */}
                <span className="font-semibold text-gray-600">
                  Username
                </span>

                {/* Username value. */}
                <span className="font-bold text-gray-800">
                  {user.username}
                </span>

              </div>


              {/* Email row. */}
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-5 py-3 text-left">

                {/* Email label. */}
                <span className="font-semibold text-gray-600">
                  Email
                </span>

                {/* Email value. */}
                <span className="break-all text-right font-bold text-gray-800">
                  {user.email}
                </span>

              </div>

            </div>

          ) : (

            // Display message when user information is unavailable.
            <p className="text-red-500">
              Unable to load user information.
            </p>
          )}

        </div>


        {/* ================= DASHBOARD STATISTICS ================= */}

        {/* Four dashboard statistic cards with equal-width columns and equal gaps. */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">


          {/* Total Spent card. */}
          <div className="flex min-h-[150px] flex-col items-center justify-center rounded-2xl bg-white p-6 text-center shadow-md transition hover:-translate-y-1 hover:shadow-lg">

            {/* Card label. */}
            <p className="text-sm font-medium text-gray-500">
              Total Spent
            </p>

            {/* Display total amount spent. */}
            <h2 className="mt-3 text-2xl font-bold text-gray-800">
              ₹{Number(
                dashboard.total_amount_spent
              ).toFixed(2)}
              {/* Display exactly 2 digits after the decimal point. */}
            </h2>

          </div>


          {/* Available Credit card. */}
          <div className="flex min-h-[150px] flex-col items-center justify-center rounded-2xl bg-white p-6 text-center shadow-md transition hover:-translate-y-1 hover:shadow-lg">

            {/* Card label. */}
            <p className="text-sm font-medium text-gray-500">
              Available Credit
            </p>

            {/* Display user's available credit limit. */}
            <h2 className="mt-3 text-2xl font-bold text-gray-800">
              ₹{Number(
                dashboard.available_credit_limit
              ).toFixed(2)}
            </h2>

          </div>


          {/* Total Transactions card. */}
          <div className="flex min-h-[150px] flex-col items-center justify-center rounded-2xl bg-white p-6 text-center shadow-md transition hover:-translate-y-1 hover:shadow-lg">

            {/* Card label. */}
            <p className="text-sm font-medium text-gray-500">
              Total Transactions
            </p>

            {/* Display transaction count. */}
            <h2 className="mt-3 text-2xl font-bold text-gray-800">
              {dashboard.total_transactions}
            </h2>

          </div>


          {/* Current Month Spending card. */}
          <div className="flex min-h-[150px] flex-col items-center justify-center rounded-2xl bg-white p-6 text-center shadow-md transition hover:-translate-y-1 hover:shadow-lg">

            {/* Card label. */}
            <p className="text-sm font-medium text-gray-500">
              This Month Spending
            </p>

            {/* Display current month's spending. */}
            <h2 className="mt-3 text-2xl font-bold text-gray-800">
              ₹{Number(
                dashboard.current_month_spending
              ).toFixed(2)}
            </h2>

          </div>

        </div>


        {/* ================= QUICK ACTIONS ================= */}

        {/* Three navigation cards for main user actions. */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">


          {/* My Cards card. */}
          <div className="flex min-h-[210px] flex-col items-center justify-between rounded-2xl bg-white p-7 text-center shadow-md transition hover:-translate-y-1 hover:shadow-lg">

            {/* Card title. */}
            <h3 className="text-xl font-bold text-gray-800">
              My Cards
            </h3>

            {/* Card description. */}
            <p className="mt-3 text-gray-500">
              Add and manage your credit cards.
            </p>

            {/* Navigate to cards page. */}
            <button
              onClick={() => navigate("/cards")}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700"
            >
              Manage Cards
            </button>

          </div>


          {/* Make Payment card. */}
          <div className="flex min-h-[210px] flex-col items-center justify-between rounded-2xl bg-white p-7 text-center shadow-md transition hover:-translate-y-1 hover:shadow-lg">

            {/* Card title. */}
            <h3 className="text-xl font-bold text-gray-800">
              Make Payment
            </h3>

            {/* Card description. */}
            <p className="mt-3 text-gray-500">
              Make a payment using your saved card.
            </p>

            {/* Navigate to payment page. */}
            <button
              onClick={() => navigate("/payment")}
              className="mt-5 rounded-lg bg-green-600 px-5 py-2.5 font-medium text-white transition hover:bg-green-700"
            >
              Make Payment
            </button>

          </div>


          {/* Transactions navigation card. */}
          <div className="flex min-h-[210px] flex-col items-center justify-between rounded-2xl bg-white p-7 text-center shadow-md transition hover:-translate-y-1 hover:shadow-lg">

            {/* Card title. */}
            <h3 className="text-xl font-bold text-gray-800">
              Transactions
            </h3>

            {/* Card description. */}
            <p className="mt-3 text-gray-500">
              View your payment history.
            </p>

            {/* Navigate to transactions page. */}
            <button
              onClick={() => navigate("/transactions")}
              className="mt-5 rounded-lg bg-purple-600 px-5 py-2.5 font-medium text-white transition hover:bg-purple-700"
            >
              View Transactions
            </button>

          </div>

        </div>


        {/* ================= RECENT TRANSACTIONS ================= */}

        {/* Recent transactions section. */}
        <div className="mt-10 overflow-hidden rounded-2xl bg-white shadow-md">

          {/* Recent transaction heading area. */}
          <div className="border-b px-6 py-5">

            {/* Recent transaction heading. */}
            <h2 className="text-center text-2xl font-bold text-gray-800">
              Recent Transactions
            </h2>

            {/* Small section description. */}
            <p className="mt-1 text-center text-sm text-gray-500">
              Your latest payment activity
            </p>

          </div>


          {/* Check whether user has transactions. */}
          {dashboard.last_5_transactions.length === 0 ? (

            // Display message when no transactions exist.
            <div className="p-8 text-center">

              {/* No transaction message. */}
              <p className="text-gray-500">
                No transactions found.
              </p>

            </div>

          ) : (

            // Display transaction table when transactions exist.
            <div className="overflow-x-auto">

              {/* Transaction table with centered content. */}
              <table className="w-full min-w-[700px] text-center">

                {/* Table heading section. */}
                <thead className="bg-gray-50">

                  {/* Table heading row. */}
                  <tr className="border-b">

                    {/* Amount column. */}
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                      Amount
                    </th>

                    {/* Status column. */}
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                      Status
                    </th>

                    {/* Date column. */}
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                      Date
                    </th>

                    {/* Card number column. */}
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">
                      Masked Card
                    </th>

                  </tr>

                </thead>


                {/* Table body. */}
                <tbody>

                  {/* Loop through last five transactions. */}
                  {dashboard.last_5_transactions.map(
                    (transaction, index) => (

                      // Create one table row for each transaction.
                      <tr
                        key={index}
                        className="border-b transition hover:bg-gray-50"
                      >

                        {/* Display transaction amount. */}
                        <td className="px-6 py-4 font-semibold text-gray-800">
                          ₹{Number(
                            transaction.amount
                          ).toFixed(2)}
                        </td>


                        {/* Display transaction status. */}
                        <td className="px-6 py-4">

                          {/* Apply different text color based on status. */}
                          <span
                            className={
                              transaction.status === "SUCCESS"
                                ? "inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700"
                                : transaction.status === "FAILED"
                                ? "inline-block rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700"
                                : "inline-block rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700"
                            }
                          >

                            {/* Print SUCCESS, FAILED, or another status. */}
                            {transaction.status}

                          </span>

                        </td>


                        {/* Display transaction date. */}
                        <td className="px-6 py-4 text-gray-600">

                          {/* Convert API date into readable local date. */}
                          {new Date(
                            transaction.date
                          ).toLocaleDateString()}
                          {/* This converts the Date object into a human-readable date */}

                        </td>


                        {/* Display masked card number. */}
                        <td className="px-6 py-4 font-medium text-gray-700">
                          {transaction.masked_card_number}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </div>
  )
}


// Export Dashboard so App.jsx/router can use it.
export default Dashboard