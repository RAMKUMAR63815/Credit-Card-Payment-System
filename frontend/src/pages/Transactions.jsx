import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

function Transactions() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  // Filter states
  const [status, setStatus] = useState("")
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Fetch transactions
  const fetchTransactions = async (
    filterStatus = "",
    filterMinAmount = "",
    filterMaxAmount = "",
    filterStartDate = "",
    filterEndDate = ""
  ) => {
    try {
      setLoading(true)
      setMessage("")

      const token = localStorage.getItem("access_token")

      // No token → go to login
      if (!token) {
        navigate("/")
        return
      }

      // Create query parameters
      const params = new URLSearchParams()

      if (filterStatus) {
        params.append("status", filterStatus)
      }

      if (filterMinAmount) {
        params.append("min_amount", filterMinAmount)
      }

      if (filterMaxAmount) {
        params.append("max_amount", filterMaxAmount)
      }

      if (filterStartDate) {
        params.append("start_date", filterStartDate)
      }

      if (filterEndDate) {
        params.append("end_date", filterEndDate)
      }

      // Build API URL
      const queryString = params.toString()

      const url = queryString
        ? `http://localhost:8000/api/payments/history/?${queryString}`
        : "http://localhost:8000/api/payments/history/"

      console.log("Transactions URL:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Transactions status:", response.status)

      // Handle expired/invalid token
      if (response.status === 401) {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")

        navigate("/")
        return
      }

      // Read response
      const data = await response.json()

      console.log("Transactions response:", data)

      // Backend error
      if (!response.ok) {
        setMessage(
          data.error || "Unable to load transactions"
        )
        return
      }

      // API directly returns an array
      if (Array.isArray(data)) {
        setTransactions(data)
      }

      // API returns { results: [...] }
      else if (Array.isArray(data.results)) {
        setTransactions(data.results)
      }

      // Unexpected response
      else {
        setTransactions([])
        setMessage("Invalid transaction data received")
      }

    } catch (error) {
      console.error(
        "Error fetching transactions:",
        error
      )

      setMessage(
        "Unable to connect to transaction service"
      )
    } finally {
      setLoading(false)
    }
  }

  // Load filters from URL
  useEffect(() => {
    const urlStatus = searchParams.get("status") || ""
    const urlMinAmount =
      searchParams.get("min_amount") || ""
    const urlMaxAmount =
      searchParams.get("max_amount") || ""
    const urlStartDate =
      searchParams.get("start_date") || ""
    const urlEndDate =
      searchParams.get("end_date") || ""

    // Put URL values into React state
    setStatus(urlStatus)
    setMinAmount(urlMinAmount)
    setMaxAmount(urlMaxAmount)
    setStartDate(urlStartDate)
    setEndDate(urlEndDate)

    // Fetch using URL filter values
    fetchTransactions(
      urlStatus,
      urlMinAmount,
      urlMaxAmount,
      urlStartDate,
      urlEndDate
    )
  }, [searchParams])

  // Apply filters
  const handleFilter = (event) => {
    event.preventDefault()

    const params = {}

    if (status) {
      params.status = status
    }

    if (minAmount) {
      params.min_amount = minAmount
    }

    if (maxAmount) {
      params.max_amount = maxAmount
    }

    if (startDate) {
      params.start_date = startDate
    }

    if (endDate) {
      params.end_date = endDate
    }

    // Update browser URL
    setSearchParams(params)

    // Fetch filtered transactions immediately
    fetchTransactions(
      status,
      minAmount,
      maxAmount,
      startDate,
      endDate
    )
  }

  // Clear all filters
  const clearFilters = () => {
    setStatus("")
    setMinAmount("")
    setMaxAmount("")
    setStartDate("")
    setEndDate("")

    // Remove query parameters from URL
    setSearchParams({})

    // Fetch all transactions
    fetchTransactions("", "", "", "", "")
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">

        <h1 className="text-xl font-bold">
          Credit Card Payment System
        </h1>

        <button
          onClick={() => navigate("/dashboard")}
          className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100"
        >
          Dashboard
        </button>

      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8">

        <div className="bg-white shadow-lg rounded-xl p-6">

          {/* Heading */}
          <div className="text-center mb-6">

            <h2 className="text-3xl font-bold text-gray-800">
              Transaction History
            </h2>

            <p className="text-gray-500 mt-2">
              View and filter your payment transactions.
            </p>

          </div>

          {/* Filters */}
          <form
            onSubmit={handleFilter}
            className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-5"
          >

            <h3 className="text-lg font-semibold mb-4">
              Filter Transactions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

              {/* Status */}
              <div>

                <label className="block mb-2 text-sm font-medium">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2 bg-white"
                >

                  <option value="">
                    All Status
                  </option>

                  <option value="SUCCESS">
                    Success
                  </option>

                  <option value="FAILED">
                    Failed
                  </option>

                  <option value="PENDING">
                    Pending
                  </option>

                </select>

              </div>

              {/* Minimum Amount */}
              <div>

                <label className="block mb-2 text-sm font-medium">
                  Min Amount
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={minAmount}
                  onChange={(event) =>
                    setMinAmount(event.target.value)
                  }
                  placeholder="₹ Min"
                  className="w-full border rounded-lg px-3 py-2"
                />

              </div>

              {/* Maximum Amount */}
              <div>

                <label className="block mb-2 text-sm font-medium">
                  Max Amount
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={maxAmount}
                  onChange={(event) =>
                    setMaxAmount(event.target.value)
                  }
                  placeholder="₹ Max"
                  className="w-full border rounded-lg px-3 py-2"
                />

              </div>

              {/* Start Date */}
              <div>

                <label className="block mb-2 text-sm font-medium">
                  Start Date
                </label>

                <input
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(event.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />

              </div>

              {/* End Date */}
              <div>

                <label className="block mb-2 text-sm font-medium">
                  End Date
                </label>

                <input
                  type="date"
                  value={endDate}
                  onChange={(event) =>
                    setEndDate(event.target.value)
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />

              </div>

            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-5">

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
              >
                Apply Filters
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg"
              >
                Clear
              </button>

            </div>

          </form>

          {/* Transactions */}
          <div className="mt-8">

            {/* Loading */}
            {loading ? (

              <p className="text-center text-gray-500 py-8">
                Loading transactions...
              </p>

            ) : message ? (

              /* Error */
              <div className="text-center py-8">

                <p className="text-red-500">
                  {message}
                </p>

              </div>

            ) : transactions.length === 0 ? (

              /* No transactions */
              <div className="text-center py-8">

                <p className="text-gray-500">
                  No transactions found.
                </p>

              </div>

            ) : (

              /* Transaction List */
              <div className="space-y-4">

                {transactions.map((transaction) => (

                  <div
                    key={transaction.id}
                    className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
                  >

                    {/* Transaction Header */}
                    <div className="flex justify-between items-start">

                      <div>

                        <p className="text-sm text-gray-500">
                          Transaction ID
                        </p>

                        <p className="font-semibold text-lg">
                          #{transaction.id}
                        </p>

                      </div>

                      {/* Status */}
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          transaction.status === "SUCCESS"
                            ? "bg-green-100 text-green-700"
                            : transaction.status === "FAILED"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {transaction.status}
                      </span>

                    </div>

                    {/* Transaction Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">

                      {/* Amount */}
                      <div>

                        <p className="text-sm text-gray-500">
                          Amount
                        </p>

                        <p className="font-semibold text-lg">
                          ₹{transaction.amount}
                        </p>

                      </div>

                      {/* Payment ID */}
                      <div>

                        <p className="text-sm text-gray-500">
                          Payment ID
                        </p>

                        <p className="font-semibold ml-8">
                          {transaction.payment_id ?? "N/A"}
                        </p>

                      </div>

                      {/* Card */}
                      <div>

                        <p className="text-sm text-gray-500">
                          Card
                        </p>

                        <p className="font-semibold">
                          {transaction.card
                            ? `****${transaction.card}`
                            : "N/A"}
                        </p>

                      </div>

                    </div>

                    {/* Created At */}
                    <div className="border-t mt-4 pt-4">

                      <p className="text-sm text-gray-500">
                        Created At
                      </p>

                      <p className="text-gray-700">

                        {transaction.created_at
                          ? new Date(
                              transaction.created_at
                            ).toLocaleString()
                          : "N/A"}

                      </p>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  )
}

export default Transactions