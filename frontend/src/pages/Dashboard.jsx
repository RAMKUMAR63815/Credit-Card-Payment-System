// Import React hooks used for state management and running code after component loading.
import { useEffect, useState } from "react"

// Import useNavigate to move between React pages without refreshing the browser.
import { useNavigate } from "react-router-dom"

// Import ThemeToggle for light/dark mode.
import ThemeToggle from "../components/ThemeToggle"

// Import MonthlyStatement for downloading the monthly PDF statement.
import MonthlyStatement from "../components/MonthlyStatementButton"


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

    try {

      const token = localStorage.getItem("access_token")

      if (!token) {

        navigate("/")

        return
      }

      const response = await fetch(
        "http://localhost:8000/api/accounts/me/",
        {
          method: "GET",

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

      console.error(
        "Error fetching user:",
        error
      )
    }
  }


  // This function fetches dashboard statistics from FastAPI.
  const fetchDashboard = async () => {

    try {

      setLoading(true)

      setError("")

      const token =
        localStorage.getItem("access_token")

      if (!token) {

        setError(
          "Please login to view the dashboard."
        )

        return
      }

      const response = await fetch(
        "http://localhost:8001/dashboard/summary",
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      // Temporary delay for loading skeleton testing.
      await new Promise((resolve) =>
        setTimeout(resolve, 3000)
      )


      if (response.status === 401) {

        localStorage.removeItem("access_token")

        localStorage.removeItem("refresh_token")

        setError(
          "Your session has expired. Please login again."
        )

        return
      }


      if (!response.ok) {

        throw new Error(
          "Failed to load dashboard"
        )
      }


      const data = await response.json()

      setDashboard(data)

    } catch (error) {

      console.error(
        "Dashboard error:",
        error
      )

      setError(
        "Unable to load dashboard data. Please try again."
      )

    } finally {

      setLoading(false)
    }
  }


  // Run user and dashboard API calls when Dashboard component loads.
  useEffect(() => {

    const loadDashboard = async () => {

      await fetchUser()

      await fetchDashboard()
    }

    loadDashboard()

  }, [navigate])


  // This function handles user logout.
  const handleLogout = async () => {

    const refreshToken =
      localStorage.getItem("refresh_token")

    const accessToken =
      localStorage.getItem("access_token")


    try {

      const response = await fetch(
        "http://localhost:8000/api/accounts/logout/",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization:
              `Bearer ${accessToken}`,
          },

          body: JSON.stringify({
            refresh: refreshToken,
          }),
        }
      )


      const data = await response.json()

      console.log(
        "Logout response:",
        data
      )

    } catch (error) {

      console.error(
        "Logout error:",
        error
      )

    } finally {

      localStorage.removeItem(
        "access_token"
      )

      localStorage.removeItem(
        "refresh_token"
      )

      navigate("/")
    }
  }


  // Display loading skeleton while API data is loading.
  if (loading) {

    return (
      <div className="
        min-h-screen
        bg-gray-100
        transition-colors
        duration-300
        dark:bg-gray-950
      ">

        {/* Navbar shown during loading. */}
        <nav className="
          flex
          items-center
          justify-between
          bg-blue-600
          px-6
          py-4
          text-white
          dark:bg-gray-900
        ">

          <h1 className="text-xl font-bold">
            Credit Card Payment System
          </h1>

          {/* Theme button */}
          <ThemeToggle />

        </nav>


        <div className="p-8">

          <div className="
            mx-auto
            mb-6
            h-8
            w-48
            animate-pulse
            rounded
            bg-gray-200
            dark:bg-gray-800
          ">
          </div>


          <div className="
            grid
            gap-6
            md:grid-cols-2
            lg:grid-cols-4
          ">

            {[1, 2, 3, 4].map((item) => (

              <div
                key={item}
                className="
                  animate-pulse
                  rounded-xl
                  bg-white
                  p-6
                  shadow
                  dark:bg-gray-900
                "
              >

                <div className="
                  mx-auto
                  mb-4
                  h-4
                  w-32
                  rounded
                  bg-gray-200
                  dark:bg-gray-700
                ">
                </div>

                <div className="
                  mx-auto
                  h-8
                  w-24
                  rounded
                  bg-gray-200
                  dark:bg-gray-700
                ">
                </div>

              </div>
            ))}

          </div>


          <div className="
            mt-8
            animate-pulse
            rounded-xl
            bg-white
            p-6
            shadow
            dark:bg-gray-900
          ">

            <div className="
              mx-auto
              mb-6
              h-6
              w-48
              rounded
              bg-gray-200
              dark:bg-gray-700
            ">
            </div>


            <div className="space-y-4">

              {[1, 2, 3, 4, 5].map((item) => (

                <div
                  key={item}
                  className="
                    h-10
                    rounded
                    bg-gray-200
                    dark:bg-gray-700
                  "
                >
                </div>
              ))}

            </div>

          </div>

        </div>

      </div>
    )
  }


  // Display error page when dashboard API fails.
  if (error) {

    return (
      <div className="
        min-h-screen
        bg-gray-100
        dark:bg-gray-950
      ">

        <nav className="
          flex
          items-center
          justify-between
          bg-blue-600
          px-6
          py-4
          text-white
          dark:bg-gray-900
        ">

          <h1 className="text-xl font-bold">
            Credit Card Payment System
          </h1>

          <ThemeToggle />

        </nav>


        <div className="p-8">

          <div className="
            mx-auto
            max-w-2xl
            rounded-xl
            bg-white
            p-6
            text-center
            shadow
            dark:bg-gray-900
          ">

            <h1 className="
              mb-3
              text-2xl
              font-bold
              text-gray-800
              dark:text-white
            ">
              Dashboard
            </h1>

            <p className="text-red-600 dark:text-red-400">
              {error}
            </p>

          </div>

        </div>

      </div>
    )
  }


  // Handle case where dashboard response has not arrived.
  if (!dashboard) {

    return (
      <div className="
        min-h-screen
        bg-gray-100
        p-8
        dark:bg-gray-950
      ">

        <p className="
          text-center
          text-red-600
          dark:text-red-400
        ">
          Dashboard data is unavailable.
        </p>

      </div>
    )
  }


  // Display the complete dashboard after successful API requests.
  return (
    <div className="
      min-h-screen
      bg-gray-100
      transition-colors
      duration-300
      dark:bg-gray-950
    ">


      {/* ================= NAVBAR ================= */}

      <nav className="
        flex
        items-center
        justify-between
        bg-blue-600
        px-6
        py-4
        text-white
        shadow-md
        dark:bg-gray-900
      ">

        <h1 className="text-xl font-bold">
          Credit Card Payment System
        </h1>


        <div className="
          flex
          items-center
          gap-3
        ">

          {/* Theme Toggle */}
          <ThemeToggle />


          {/* Admin dashboard navigation button */}
          <button
            onClick={() =>
              navigate("/admin-dashboard")
            }
            className="
              rounded-lg
              bg-gray-800
              px-4
              py-2
              text-white
              transition
              hover:bg-gray-900
              dark:bg-gray-700
              dark:hover:bg-gray-600
            "
          >
            Admin Dashboard
          </button>


          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="
              rounded-lg
              bg-red-500
              px-4
              py-2
              text-white
              transition
              hover:bg-red-600
            "
          >
            Logout
          </button>

        </div>

      </nav>


      {/* ================= MAIN CONTENT ================= */}

      <div className="
        mx-auto
        w-full
        max-w-7xl
        px-4
        py-8
        sm:px-6
        lg:px-8
      ">


        {/* ================= DASHBOARD TITLE ================= */}

        <div className="text-center">

          <h2 className="
            text-3xl
            font-bold
            text-gray-800
            dark:text-white
          ">
            Dashboard
          </h2>

          <p className="
            mt-2
            text-gray-600
            dark:text-gray-400
          ">
            Welcome to your payment dashboard.
          </p>

        </div>


        {/* ================= USER PROFILE ================= */}

        <div className="
          mx-auto
          mt-8
          w-full
          max-w-xl
          rounded-2xl
          bg-white
          p-8
          text-center
          shadow-md
          dark:bg-gray-900
        ">

          <h3 className="
            mb-6
            text-2xl
            font-bold
            text-gray-800
            dark:text-white
          ">
            My Profile
          </h3>


          {user ? (

            <div className="mx-auto max-w-md space-y-4">

              <div className="
                flex
                items-center
                justify-between
                rounded-lg
                bg-gray-50
                px-5
                py-3
                text-left
                dark:bg-gray-800
              ">

                <span className="
                  font-semibold
                  text-gray-600
                  dark:text-gray-300
                ">
                  User ID
                </span>

                <span className="
                  font-bold
                  text-gray-800
                  dark:text-white
                ">
                  {user.id}
                </span>

              </div>


              <div className="
                flex
                items-center
                justify-between
                rounded-lg
                bg-gray-50
                px-5
                py-3
                text-left
                dark:bg-gray-800
              ">

                <span className="
                  font-semibold
                  text-gray-600
                  dark:text-gray-300
                ">
                  Username
                </span>

                <span className="
                  font-bold
                  text-gray-800
                  dark:text-white
                ">
                  {user.username}
                </span>

              </div>


              <div className="
                flex
                items-center
                justify-between
                rounded-lg
                bg-gray-50
                px-5
                py-3
                text-left
                dark:bg-gray-800
              ">

                <span className="
                  font-semibold
                  text-gray-600
                  dark:text-gray-300
                ">
                  Email
                </span>

                <span className="
                  break-all
                  text-right
                  font-bold
                  text-gray-800
                  dark:text-white
                ">
                  {user.email}
                </span>

              </div>

            </div>

          ) : (

            <p className="
              text-red-500
              dark:text-red-400
            ">
              Unable to load user information.
            </p>

          )}

        </div>


        {/* ================= DASHBOARD STATISTICS ================= */}

        <div className="
          mt-10
          grid
          grid-cols-1
          gap-6
          md:grid-cols-2
          lg:grid-cols-4
        ">


          {/* Total Spent */}
          <div className="
            flex
            min-h-[150px]
            flex-col
            items-center
            justify-center
            rounded-2xl
            bg-white
            p-6
            text-center
            shadow-md
            transition
            hover:-translate-y-1
            hover:shadow-lg
            dark:bg-gray-900
          ">

            <p className="
              text-sm
              font-medium
              text-gray-500
              dark:text-gray-400
            ">
              Total Spent
            </p>

            <h2 className="
              mt-3
              text-2xl
              font-bold
              text-gray-800
              dark:text-white
            ">
              ₹{Number(
                dashboard.total_amount_spent
              ).toFixed(2)}
            </h2>

          </div>


          {/* Available Credit */}
          <div className="
            flex
            min-h-[150px]
            flex-col
            items-center
            justify-center
            rounded-2xl
            bg-white
            p-6
            text-center
            shadow-md
            transition
            hover:-translate-y-1
            hover:shadow-lg
            dark:bg-gray-900
          ">

            <p className="
              text-sm
              font-medium
              text-gray-500
              dark:text-gray-400
            ">
              Available Credit
            </p>

            <h2 className="
              mt-3
              text-2xl
              font-bold
              text-gray-800
              dark:text-white
            ">
              ₹{Number(
                dashboard.available_credit_limit
              ).toFixed(2)}
            </h2>

          </div>


          {/* Total Transactions */}
          <div className="
            flex
            min-h-[150px]
            flex-col
            items-center
            justify-center
            rounded-2xl
            bg-white
            p-6
            text-center
            shadow-md
            transition
            hover:-translate-y-1
            hover:shadow-lg
            dark:bg-gray-900
          ">

            <p className="
              text-sm
              font-medium
              text-gray-500
              dark:text-gray-400
            ">
              Total Transactions
            </p>

            <h2 className="
              mt-3
              text-2xl
              font-bold
              text-gray-800
              dark:text-white
            ">
              {dashboard.total_transactions}
            </h2>

          </div>


          {/* Current Month Spending */}
          <div className="
            flex
            min-h-[150px]
            flex-col
            items-center
            justify-center
            rounded-2xl
            bg-white
            p-6
            text-center
            shadow-md
            transition
            hover:-translate-y-1
            hover:shadow-lg
            dark:bg-gray-900
          ">

            <p className="
              text-sm
              font-medium
              text-gray-500
              dark:text-gray-400
            ">
              This Month Spending
            </p>

            <h2 className="
              mt-3
              text-2xl
              font-bold
              text-gray-800
              dark:text-white
            ">
              ₹{Number(
                dashboard.current_month_spending
              ).toFixed(2)}
            </h2>

          </div>

        </div>


        {/* ================= QUICK ACTIONS ================= */}

        <div className="
          mt-10
          grid
          grid-cols-1
          gap-6
          md:grid-cols-2
          lg:grid-cols-4
        ">


          {/* My Cards */}
          <div className="
            flex
            min-h-[210px]
            flex-col
            items-center
            justify-between
            rounded-2xl
            bg-white
            p-7
            text-center
            shadow-md
            transition
            hover:-translate-y-1
            hover:shadow-lg
            dark:bg-gray-900
          ">

            <h3 className="
              text-xl
              font-bold
              text-gray-800
              dark:text-white
            ">
              My Cards
            </h3>

            <p className="
              mt-3
              text-gray-500
              dark:text-gray-400
            ">
              Add and manage your credit cards.
            </p>

            <button
              onClick={() =>
                navigate("/cards")
              }
              className="
                mt-5
                rounded-lg
                bg-blue-600
                px-5
                py-2.5
                font-medium
                text-white
                transition
                hover:bg-blue-700
              "
            >
              Manage Cards
            </button>

          </div>


          {/* Make Payment */}
          <div className="
            flex
            min-h-[210px]
            flex-col
            items-center
            justify-between
            rounded-2xl
            bg-white
            p-7
            text-center
            shadow-md
            transition
            hover:-translate-y-1
            hover:shadow-lg
            dark:bg-gray-900
          ">

            <h3 className="
              text-xl
              font-bold
              text-gray-800
              dark:text-white
            ">
              Make Payment
            </h3>

            <p className="
              mt-3
              text-gray-500
              dark:text-gray-400
            ">
              Make a payment using your saved card.
            </p>

            <button
              onClick={() =>
                navigate("/payment")
              }
              className="
                mt-5
                rounded-lg
                bg-green-600
                px-5
                py-2.5
                font-medium
                text-white
                transition
                hover:bg-green-700
              "
            >
              Make Payment
            </button>

          </div>


          {/* Transactions */}
          <div className="
            flex
            min-h-[210px]
            flex-col
            items-center
            justify-between
            rounded-2xl
            bg-white
            p-7
            text-center
            shadow-md
            transition
            hover:-translate-y-1
            hover:shadow-lg
            dark:bg-gray-900
          ">

            <h3 className="
              text-xl
              font-bold
              text-gray-800
              dark:text-white
            ">
              Transactions
            </h3>

            <p className="
              mt-3
              text-gray-500
              dark:text-gray-400
            ">
              View your payment history.
            </p>

            <button
              onClick={() =>
                navigate("/transactions")
              }
              className="
                mt-5
                rounded-lg
                bg-purple-600
                px-5
                py-2.5
                font-medium
                text-white
                transition
                hover:bg-purple-700
              "
            >
              View Transactions
            </button>

          </div>


          {/* Monthly Statement */}
          <div className="
            flex
            min-h-[210px]
            flex-col
            items-center
            justify-between
            rounded-2xl
            bg-white
            p-7
            text-center
            shadow-md
            transition
            hover:-translate-y-1
            hover:shadow-lg
            dark:bg-gray-900
          ">

            <h3 className="
              text-xl
              font-bold
              text-gray-800
              dark:text-white
            ">
              Monthly Statement
            </h3>

            <p className="
              mt-3
              text-gray-500
              dark:text-gray-400
            ">
              Download your monthly transaction statement as a PDF.
            </p>

            <div className="mt-5">
              <MonthlyStatement />
            </div>

          </div>

        </div>


        {/* ================= RECENT TRANSACTIONS ================= */}

        <div className="
          mt-10
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-md
          dark:bg-gray-900
        ">

          <div className="
            border-b
            border-gray-200
            px-6
            py-5
            dark:border-gray-800
          ">

            <h2 className="
              text-center
              text-2xl
              font-bold
              text-gray-800
              dark:text-white
            ">
              Recent Transactions
            </h2>

            <p className="
              mt-1
              text-center
              text-sm
              text-gray-500
              dark:text-gray-400
            ">
              Your latest payment activity
            </p>

          </div>


          {dashboard.last_5_transactions.length === 0 ? (

            <div className="p-8 text-center">

              <p className="
                text-gray-500
                dark:text-gray-400
              ">
                No transactions found.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="
                w-full
                min-w-[700px]
                text-center
              ">

                <thead className="
                  bg-gray-50
                  dark:bg-gray-800
                ">

                  <tr className="
                    border-b
                    border-gray-200
                    dark:border-gray-700
                  ">

                    <th className="
                      px-6
                      py-4
                      text-sm
                      font-semibold
                      text-gray-600
                      dark:text-gray-300
                    ">
                      Amount
                    </th>

                    <th className="
                      px-6
                      py-4
                      text-sm
                      font-semibold
                      text-gray-600
                      dark:text-gray-300
                    ">
                      Status
                    </th>

                    <th className="
                      px-6
                      py-4
                      text-sm
                      font-semibold
                      text-gray-600
                      dark:text-gray-300
                    ">
                      Date
                    </th>

                    <th className="
                      px-6
                      py-4
                      text-sm
                      font-semibold
                      text-gray-600
                      dark:text-gray-300
                    ">
                      Masked Card
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {dashboard.last_5_transactions.map(
                    (transaction, index) => (

                      <tr
                        key={index}
                        className="
                          border-b
                          border-gray-200
                          transition
                          hover:bg-gray-50
                          dark:border-gray-800
                          dark:hover:bg-gray-800
                        "
                      >

                        <td className="
                          px-6
                          py-4
                          font-semibold
                          text-gray-800
                          dark:text-white
                        ">
                          ₹{Number(
                            transaction.amount
                          ).toFixed(2)}
                        </td>


                        <td className="px-6 py-4">

                          <span
                            className={
                              transaction.status === "SUCCESS"
                                ? "inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700 dark:bg-green-950 dark:text-green-300"
                                : transaction.status === "FAILED"
                                ? "inline-block rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700 dark:bg-red-950 dark:text-red-300"
                                : "inline-block rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                            }
                          >
                            {transaction.status}
                          </span>

                        </td>


                        <td className="
                          px-6
                          py-4
                          text-gray-600
                          dark:text-gray-300
                        ">

                          {new Date(
                            transaction.date
                          ).toLocaleDateString()}

                        </td>


                        <td className="
                          px-6
                          py-4
                          font-medium
                          text-gray-700
                          dark:text-gray-300
                        ">
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