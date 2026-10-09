
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ThemeToggle from "../components/ThemeToggle";
import AnalyticsDashboard from "../components/AnalyticsDashboard.jsx";
import TransactionSearch from "../components/TransactionSearch.jsx";
import FraudAlerts from "../components/FraudAlerts.jsx";

function AdminDashboard() {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);

  // Card management states
  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState("");
  const [showCards, setShowCards] = useState(false);

  // Check whether the logged-in user is admin/staff
  useEffect(() => {
    let cancelled = false;

    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem("access_token");

        // No token: redirect to login
        if (!token) {
          navigate("/");
          return;
        }

        // Get current user details
        const response = await fetch(
          "http://localhost:8000/api/accounts/me/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Invalid or expired token
        if (!response.ok) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          navigate("/");
          return;
        }

        const data = await response.json();

        if (cancelled) return;

        console.log("Logged-in user:", data);

        // Check admin/staff permission
        if (!data.is_staff) {
          alert("Admin access required");
          navigate("/dashboard");
          return;
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Admin check error:", error);
          navigate("/dashboard");
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    checkAdmin();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Load all cards for admin
  const loadCards = async () => {
    try {
      setCardsLoading(true);
      setCardsError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/");
        return;
      }

      const response = await fetch(
        "http://localhost:8000/api/cards/admin/cards/",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/");
        return;
      }

      if (response.status === 403) {
        setCardsError(
          "You do not have permission to manage cards."
        );
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load cards.");
      }

      const data = await response.json();

      console.log("Admin cards:", data);

      // Support an array or a paginated response
      const cardList = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
          ? data.results
          : [];

      setCards(cardList);
    } catch (error) {
      console.error("Card loading error:", error);
      setCardsError(
        "Unable to load card information."
      );
    } finally {
      setCardsLoading(false);
    }
  };

  // Open card management section
  const handleManageCards = async () => {
    setShowCards(true);
    await loadCards();
  };

  // Block / Unblock card
  const updateCardStatus = async (cardId, blocked) => {
    const action = blocked ? "unblock" : "block";

    const endpoint =
      `http://localhost:8000/api/cards/admin/cards/${cardId}/${action}/`;

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/");
        return;
      }

      console.log(
        `Updating card ${cardId}: ${action}`
      );

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const responseData = await response
        .json()
        .catch(() => null);

      console.log(
        "Card status response:",
        responseData
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/");
        return;
      }

      if (response.status === 403) {
        alert(
          "You do not have permission to update this card."
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          responseData?.detail ||
            responseData?.message ||
            "Failed to update card status."
        );
      }

      // Update the card immediately in React
      setCards((currentCards) =>
        currentCards.map((card) =>
          card.id === cardId
            ? {
                ...card,
                is_blocked: !blocked,
              }
            : card
        )
      );

      // Reload the latest data from Django
      await loadCards();

      alert(
        blocked
          ? "Card unblocked successfully."
          : "Card blocked successfully."
      );
    } catch (error) {
      console.error(
        "Card status update error:",
        error
      );

      alert(
        error.message ||
          "Unable to update card status."
      );
    }
  };

  // Update credit limit
  const updateCreditLimit = async (
    cardId,
    currentLimit
  ) => {
    const newLimit = window.prompt(
      "Enter new credit limit:",
      currentLimit
    );

    // User clicked Cancel
    if (newLimit === null) return;

    // Empty value
    if (!newLimit.trim()) {
      alert("Please enter a credit limit.");
      return;
    }

    const numericLimit = Number(newLimit);

    // Validate number
    if (
      !Number.isFinite(numericLimit) ||
      numericLimit <= 0
    ) {
      alert(
        "Please enter a valid credit limit greater than 0."
      );
      return;
    }

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/");
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/cards/admin/cards/${cardId}/credit-limit/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            credit_limit: numericLimit,
          }),
        }
      );

      const responseData = await response
        .json()
        .catch(() => null);

      console.log(
        "Credit limit response:",
        responseData
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/");
        return;
      }

      if (response.status === 403) {
        alert(
          "You do not have permission to update the credit limit."
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          responseData?.detail ||
            responseData?.error ||
            "Failed to update credit limit."
        );
      }

      // Reload card information after update
      await loadCards();

      alert("Credit limit updated successfully.");
    } catch (error) {
      console.error(
        "Credit limit update error:",
        error
      );

      alert(
        error.message ||
          "Unable to update credit limit."
      );
    }
  };

  // Export transactions as CSV
  const handleExport = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/");
        return;
      }

      const response = await fetch(
        "http://localhost:8000/api/payments/transactions/admin/export/",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        console.error("CSV export error:", data);

        alert(
          data?.detail ||
            data?.error ||
            "Unable to export transactions"
        );
        return;
      }

      // Convert response into a CSV file
      const blob = await response.blob();

      // Create temporary browser URL
      const url = window.URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement("a");

      link.href = url;
      link.download = "transactions.csv";

      document.body.appendChild(link);

      // Start download
      link.click();

      // Clean up
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV export error:", error);
      alert("Unable to connect to Django server");
    }
  };

  // Open daily payment summary
  const handleSummary = () => {
    window.open(
      "http://localhost:8000/api/admin/summary/",
      "_blank"
    );
  };

  // Show checking message while verifying admin
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
          Checking admin access...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-100 dark:bg-gray-950">
      {/* Navbar */}
      <nav className="w-full bg-blue-600 px-4 py-4 text-white dark:bg-gray-900 sm:px-6">
        <div className="mx-auto flex w-full items-center justify-between gap-4 px-6 py-4">
          {/* Left corner */}
          <h1 className="text-xl font-bold">
            Admin Dashboard
          </h1>

          {/* Right corner */}
          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-lg bg-white px-4 py-2 font-medium text-blue-600 hover:bg-gray-100"
            >
              User Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Page Heading */}
        <header className="mb-2 text-center">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white md:text-4xl">
            Admin Dashboard
          </h2>

          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Manage users, cards and payment transactions.
          </p>
        </header>
        {/* Fraud Alerts */}
        <section className="w-full min-w-0">
            <FraudAlerts />
        </section>

        {/* Payment analytics and charts */}
        <section className="w-full min-w-0 space-y-8">
          <AnalyticsDashboard />
        </section>

        {/* Transaction search and history */}
        <section className="w-full min-w-0">
          <TransactionSearch />
        </section>

        {/* Dashboard Cards */}
        <section
          aria-label="Dashboard management options"
          className="grid w-full min-w-0 grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          {/* Users */}
          <div className="flex min-w-0 flex-col items-center rounded-xl bg-white p-6 text-center shadow-md dark:bg-gray-900">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              Users
            </h3>

            <p className="mt-3 text-gray-500 dark:text-gray-400">
              Manage registered users
            </p>

            <button
              type="button"
              onClick={() =>
                window.open(
                  "http://localhost:8000/admin/accounts/user/",
                  "_blank"
                )
              }
              className="mt-auto rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
            >
              Manage Users
            </button>
          </div>

          {/* Cards */}
          <div className="flex min-w-0 flex-col items-center rounded-xl bg-white p-6 text-center shadow-md dark:bg-gray-900">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              Cards
            </h3>

                  <p className="mt-3 mb-4 text-gray-500 dark:text-gray-400">                
                    Manage customer cards, block/unblock cards and update credit limits.
                  </p>

            <button
              type="button"
              onClick={handleManageCards}
              className="mt-auto rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
            >
              Manage Cards
            </button>
          </div>

          {/* Transactions */}
          <div className="flex min-w-0 flex-col items-center rounded-xl bg-white p-6 text-center shadow-md dark:bg-gray-900">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              Transactions
            </h3>

            <p className="mt-3 mb-2 text-gray-500 dark:text-gray-400">
              View payment transactions
            </p>

            <button
              type="button"
              onClick={() =>
                window.open(
                  "http://localhost:8000/admin/transactions/transaction/",
                  "_blank"
                )
              }
              className="mt-auto rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
            >
              Manage Transactions
            </button>
          </div>
        </section>

        {/* Card Management */}
        {showCards && (
          <section className="w-full min-w-0 overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-gray-900">
            {/* Card Management Header */}
            <div className="flex flex-col gap-4 border-b border-gray-200 p-6 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Card Management
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                  View customer cards, block/unblock cards and update credit limits.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCards(false)}
                className="self-start rounded-lg bg-gray-600 px-5 py-2 text-white hover:bg-gray-700 md:self-auto"
              >
                Hide
              </button>
            </div>

            {/* Card Loading */}
            {cardsLoading && (
              <div className="p-8 text-center">
                <p className="animate-pulse text-gray-600 dark:text-gray-400">
                  Loading cards...
                </p>
              </div>
            )}

            {/* Card Error */}
            {!cardsLoading && cardsError && (
              <div className="p-6">
                <div
                  role="alert"
                  className="rounded-xl bg-red-50 p-5 text-red-700 dark:bg-red-950 dark:text-red-300"
                >
                  {cardsError}
                </div>
              </div>
            )}

            {/* Cards Table */}
            {!cardsLoading &&
              !cardsError &&
              cards.length > 0 && (
                <div className="w-full min-w-0 overflow-x-auto">
                  <table className="w-full min-w-[750px] text-left">
                    <thead className="border-b bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-4 text-gray-800 dark:text-white">
                          User
                        </th>

                        <th className="px-6 py-4 text-gray-800 dark:text-white">
                          Card
                        </th>

                        <th className="px-6 py-4 text-gray-800 dark:text-white">
                          Credit Limit
                        </th>

                        <th className="px-6 py-4 text-gray-800 dark:text-white">
                          Status
                        </th>

                        <th className="px-6 py-4 text-gray-800 dark:text-white">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {cards.map((card) => (
                        <tr
                          key={card.id}
                          className="border-b border-gray-200 dark:border-gray-800"
                        >
                          {/* User */}
                          <td className="px-6 py-4 text-gray-800 dark:text-gray-200">
                            {card.username || "—"}
                          </td>

                          {/* Masked Card */}
                          <td className="whitespace-nowrap px-6 py-4 font-mono text-gray-800 dark:text-gray-200">
                            {card.masked_card_number || "—"}
                          </td>

                          {/* Credit Limit */}
                          <td className="whitespace-nowrap px-6 py-4 text-gray-800 dark:text-gray-200">
                            ₹
                            {Number(
                              card.credit_limit || 0
                            ).toLocaleString("en-IN")}
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <span
                              className={
                                card.is_blocked
                                  ? "inline-flex whitespace-nowrap rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300"
                                  : "inline-flex whitespace-nowrap rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-300"
                              }
                            >
                              {card.is_blocked
                                ? "Blocked"
                                : "Active"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {/* Block / Unblock */}
                              <button
                                type="button"
                                onClick={() =>
                                  updateCardStatus(
                                    card.id,
                                    card.is_blocked
                                  )
                                }
                                className={
                                  card.is_blocked
                                    ? "rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                                    : "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                                }
                              >
                                {card.is_blocked
                                  ? "Unblock"
                                  : "Block"}
                              </button>

                              {/* Update Credit Limit */}
                              <button
                                type="button"
                                onClick={() =>
                                  updateCreditLimit(
                                    card.id,
                                    card.credit_limit
                                  )
                                }
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                              >
                                Update Limit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            {/* No Cards */}
            {!cardsLoading &&
              !cardsError &&
              cards.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    No cards found.
                  </p>
                </div>
              )}
          </section>
        )}

        {/* Reports Section */}
        <section
          aria-label="Reports and exports"
          className="grid w-full min-w-0 grid-cols-1 gap-6 md:grid-cols-2"
        >
          {/* Daily Payment Summary */}
          <div className="flex min-w-0 flex-col items-center rounded-xl bg-white p-6 text-center shadow-md dark:bg-gray-900">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              Daily Payment Summary
            </h3>

            <p className="mt-3 mb-4 text-gray-500 dark:text-gray-400">                
              View daily successful and failed payments.
            </p>

            <button
              type="button"
              onClick={handleSummary}
              className="mt-auto rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700"
            >
              View Summary
            </button>
          </div>

          {/* Transaction Export */}
          <div className="flex min-w-0 flex-col items-center rounded-xl bg-white p-6 text-center shadow-md dark:bg-gray-900">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              Transaction Export
            </h3>

            <p className="mt-3 mb-4 text-gray-500 dark:text-gray-400">  
              Export all transactions as CSV.
            </p>

            <button
              type="button"
              onClick={handleExport}
              className="mt-auto rounded-lg bg-purple-600 px-6 py-2 font-medium text-white hover:bg-purple-700"
            >
              Export CSV
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
