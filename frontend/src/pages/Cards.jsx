import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

function Cards() {
  const navigate = useNavigate()

  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    card_holder_name: "",
    card_number: "",
    cvv: "",
    expiry_month: "",
    expiry_year: "",
  })

  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch cards")
      }

      const data = await response.json()

      setCards(data)
    } catch (error) {
      console.error("Error fetching cards:", error)
      setMessage("Unable to load cards")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCards()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleAddCard = async (event) => {
    event.preventDefault()

    setMessage("")
    setSubmitting(true)

    try {
      const token = localStorage.getItem("access_token")

      const response = await fetch(
        "http://localhost:8000/api/cards/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        console.error("Card error:", data)
        setMessage("Unable to add card")
        return
      }

      setMessage("Card added successfully!")

      setFormData({
        card_holder_name: "",
        card_number: "",
        cvv: "",
        expiry_month: "",
        expiry_year: "",
      })

      await fetchCards()

    } catch (error) {
      console.error("Add card error:", error)
      setMessage("Unable to connect to Django server")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCard = async (cardId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this card?"
    )

    if (!confirmDelete) {
      return
    }

    try {
      const token = localStorage.getItem("access_token")

      const response = await fetch(
        `http://localhost:8000/api/cards/${cardId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setMessage("Unable to delete card")
        return
      }

      setMessage(data.message)

      await fetchCards()

    } catch (error) {
      console.error("Delete card error:", error)
      setMessage("Unable to connect to Django server")
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

      <div className="max-w-6xl mx-auto p-8">

        <h2 className="text-3xl font-bold">
          My Cards
        </h2>

        <p className="text-gray-600 mt-2">
          Add and manage your credit cards.
        </p>

        {/* Add Card Form */}
        <div className="bg-white p-6 rounded-xl shadow mt-6">

          <h3 className="text-xl font-semibold mb-6">
            Add New Card
          </h3>

          <form onSubmit={handleAddCard}>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Card Holder */}
              <div>
                <label className="block mb-2 font-medium">
                  Card Holder Name
                </label>

                <input
                  type="text"
                  name="card_holder_name"
                  value={formData.card_holder_name}
                  onChange={handleChange}
                  placeholder="Enter card holder name"
                  className="w-full border rounded-lg px-4 py-2"
                  required
                />
              </div>

              {/* Card Number */}
              <div>
                <label className="block mb-2 font-medium">
                  Card Number
                </label>

                <input
                  type="text"
                  name="card_number"
                  value={formData.card_number}
                  onChange={handleChange}
                  placeholder="Enter card number"
                  maxLength="19"
                  className="w-full border rounded-lg px-4 py-2"
                  required
                />
              </div>

              {/* CVV */}
              <div>
                <label className="block mb-2 font-medium">
                  CVV
                </label>

                <input
                  type="password"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleChange}
                  placeholder="Enter CVV"
                  maxLength="4"
                  className="w-full border rounded-lg px-4 py-2"
                  required
                />
              </div>

              {/* Expiry Month */}
              <div>
                <label className="block mb-2 font-medium">
                  Expiry Month
                </label>

                <input
                  type="number"
                  name="expiry_month"
                  value={formData.expiry_month}
                  onChange={handleChange}
                  placeholder="MM"
                  min="1"
                  max="12"
                  className="w-full border rounded-lg px-4 py-2"
                  required
                />
              </div>

              {/* Expiry Year */}
              <div>
                <label className="block mb-2 font-medium">
                  Expiry Year
                </label>

                <input
                  type="number"
                  name="expiry_year"
                  value={formData.expiry_year}
                  onChange={handleChange}
                  placeholder="YYYY"
                  min="2026"
                  className="w-full border rounded-lg px-4 py-2"
                  required
                />
              </div>

            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              {submitting ? "Adding Card..." : "Add Card"}
            </button>

          </form>

          {message && (
            <p className="mt-4 font-medium text-blue-600">
              {message}
            </p>
          )}

        </div>

        {/* Saved Cards */}
        <div className="mt-8">

          <h3 className="text-xl font-semibold mb-4">
            Saved Cards
          </h3>

          {loading ? (
            <p className="text-gray-500">
              Loading cards...
            </p>
          ) : cards.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow">
              <p className="text-gray-500">
                No cards added yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {cards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white p-6 rounded-xl shadow"
                >

                  <div className="flex justify-between items-start">

                    <div>
                      <p className="text-sm text-gray-500">
                        Card Holder
                      </p>

                      <p className="font-semibold">
                        {card.card_holder_name}
                      </p>
                    </div>

                    <span className="text-blue-600 font-bold">
                      ****
                    </span>

                  </div>

                  <p className="text-2xl font-mono mt-6">
                    {card.masked_card_number}
                  </p>

                  <div className="flex justify-between mt-6">

                    <div>
                      <p className="text-sm text-gray-500">
                        Expires
                      </p>

                      <p>
                        {card.expiry_month}/{card.expiry_year}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">
                        Last 4
                      </p>

                      <p>
                        {card.last_four}
                      </p>
                    </div>

                  </div>

                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="w-full mt-6 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
                  >
                    Delete Card
                  </button>

                </div>
              ))}

            </div>
          )}

        </div>

      </div>

    </div>
  )
}

export default Cards