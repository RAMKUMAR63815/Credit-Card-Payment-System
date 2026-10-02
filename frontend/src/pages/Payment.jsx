
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

function Payment() {
  const navigate = useNavigate()

  const [cards, setCards] = useState([])
  const [cardId, setCardId] = useState("")
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  // Load saved cards
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const token = localStorage.getItem("access_token")

        if (!token) {
          navigate("/")
          return
        }

        const response = await fetch(
          "http://localhost:8000/api/cards/my-cards/",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const contentType =
          response.headers.get("content-type") || ""

        let data = {}

        if (contentType.includes("application/json")) {
          data = await response.json()
        } else {
          const text = await response.text()

          console.error(
            "Cards API returned non-JSON response:",
            text
          )

          throw new Error(
            `Cards API returned status ${response.status}`
          )
        }

        console.log("Cards response:", data)

        if (response.status === 401) {
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")

          setMessage("Session expired. Please login again.")

          navigate("/")
          return
        }

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.detail ||
              "Failed to fetch cards"
          )
        }

        setCards(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("Error fetching cards:", error)

        setMessage("Unable to load cards")
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [navigate])

  // Make payment
  const handlePayment = async (event) => {
    event.preventDefault()

    setMessage("")
    setStatus("")
    setPaying(true)

    try {
      const token = localStorage.getItem("access_token")

      if (!token) {
        navigate("/")
        return
      }

      /*
       * IMPORTANT:
       * Django URL structure:
       *
       * config/urls.py
       *   api/payments/
       *
       * transactions/urls.py
       *   payments/
       *
       * Therefore the final URL is:
       *
       * /api/payments/payments/
       */
      const paymentUrl =
        "http://localhost:8000/api/payments/payments/"

      const response = await fetch(paymentUrl, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          card_id: Number(cardId),
          amount: amount,
        }),
      })

      console.log("Payment URL:", response.url)
      console.log(
        "Payment status code:",
        response.status
      )

      const contentType =
        response.headers.get("content-type") || ""

      let data = {}

      /*
       * Do not blindly call response.json().
       *
       * If Django returns an HTML 404/500 page,
       * response.json() will throw:
       *
       * Unexpected token '<'
       */
      if (contentType.includes("application/json")) {
        data = await response.json()
      } else {
        const text = await response.text()

        console.error(
          "Payment API returned non-JSON response:",
          text
        )

        setMessage(
          `Payment API returned an invalid response. HTTP ${response.status}`
        )

        setStatus("FAILED")

        return
      }

      console.log("Payment response:", data)

      // JWT expired
      if (response.status === 401) {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")

        setMessage("Session expired. Please login again.")
        setStatus("FAILED")

        navigate("/")
        return
      }

      // FastAPI/payment service unavailable
      if (response.status === 503) {
        setMessage(
          "Payment service is unavailable. Please make sure FastAPI is running."
        )

        setStatus("FAILED")

        return
      }

      // Any other API error
      if (!response.ok) {
        setMessage(
          data.error ||
            data.detail ||
            data.message ||
            "Payment failed"
        )

        setStatus(
          data.status ||
            data.transaction?.status ||
            "FAILED"
        )

        return
      }

      /*
       * Successful Django response.
       *
       * Your backend may return status in:
       * data.transaction.status
       * or data.status
       */
      setMessage(
        data.message ||
          "Payment processed successfully"
      )

      setStatus(
        data.transaction?.status ||
          data.status ||
          "SUCCESS"
      )

      // Clear form after successful request
      setAmount("")
      setCardId("")
    } catch (error) {
      console.error("Payment error:", error)

      setMessage(
        "Unable to connect to payment service"
      )

      setStatus("FAILED")
    } finally {
      setPaying(false)
    }
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
          className="bg-white text-blue-600 px-4 py-2 rounded-lg"
        >
          Dashboard
        </button>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-8">

        <h2 className="text-3xl font-bold">
          Make Payment
        </h2>

        <p className="text-gray-600 mt-2">
          Select a saved card and enter the payment amount.
        </p>

        <div className="bg-white p-6 rounded-xl shadow mt-6">

          {/* Loading */}
          {loading ? (
            <p>
              Loading cards...
            </p>
          ) : cards.length === 0 ? (

            /* No Cards */
            <div>

              <p className="text-gray-500">
                No saved cards available.
              </p>

              <button
                onClick={() => navigate("/cards")}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Add Card
              </button>

            </div>
          ) : (

            /* Payment Form */
            <form onSubmit={handlePayment}>

              {/* Card */}
              <div className="mb-5">

                <label className="block mb-2 font-medium">
                  Select Card
                </label>

                <select
                  value={cardId}
                  onChange={(event) =>
                    setCardId(event.target.value)
                  }
                  className="w-full border rounded-lg px-4 py-2"
                  required
                >

                  <option value="">
                    Select a card
                  </option>

                  {cards.map((card) => (
                    <option
                      key={card.id}
                      value={card.id}
                    >
                      {card.masked_card_number}
                    </option>
                  ))}

                </select>

              </div>

              {/* Amount */}
              <div className="mb-5">

                <label className="block mb-2 font-medium">
                  Amount
                </label>

                <input
                  type="number"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value)
                  }
                  placeholder="Enter amount"
                  min="1"
                  step="0.01"
                  className="w-full border rounded-lg px-4 py-2"
                  required
                />

              </div>

              {/* Pay Button */}
              <button
                type="submit"
                disabled={paying}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg disabled:opacity-50"
              >
                {paying
                  ? "Processing..."
                  : "Make Payment"}
              </button>

            </form>
          )}

          {/* Message */}
          {message && (
            <div className="mt-6 p-4 rounded-lg bg-gray-100">

              <p className="font-semibold">
                {message}
              </p>

              {status && (
                <p className="mt-2">
                  Status:{" "}
                  <span className="font-bold">
                    {status}
                  </span>
                </p>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Payment
