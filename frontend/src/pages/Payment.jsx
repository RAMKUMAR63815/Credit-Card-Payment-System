
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

        const data = await response.json()

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
            data.error || "Failed to fetch cards"
          )
        }

        setCards(data)
      } catch (error) {
        console.error("Error fetching cards:", error)
        setMessage("Unable to load cards")
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [navigate])

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

      const response = await fetch(
        "http://localhost:8000/api/payments/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            card_id: cardId,
            amount: amount,
          }),
        }
      )

      const data = await response.json()

      console.log("Payment response:", data)
      console.log("Payment status code:", response.status)

      if (response.status === 401) {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")

        setMessage("Session expired. Please login again.")
        setStatus("FAILED")

        navigate("/")
        return
      }

      if (response.status === 503) {
        setMessage(
          "Payment service is unavailable. Please make sure FastAPI is running."
        )
        setStatus("FAILED")
        return
      }

      if (!response.ok) {
        setMessage(
          data.error || "Payment failed"
        )
        setStatus("FAILED")
        return
      }

      setMessage(
        data.message || "Payment processed successfully"
      )

      setStatus(
        data.transaction?.status || "SUCCESS"
      )

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

      <div className="max-w-2xl mx-auto p-8">

        <h2 className="text-3xl font-bold">
          Make Payment
        </h2>

        <p className="text-gray-600 mt-2">
          Select a saved card and enter the payment amount.
        </p>

        <div className="bg-white p-6 rounded-xl shadow mt-6">

          {loading ? (
            <p>
              Loading cards...
            </p>
          ) : cards.length === 0 ? (
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
            <form onSubmit={handlePayment}>

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

