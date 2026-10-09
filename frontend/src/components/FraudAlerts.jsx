
import { useCallback, useEffect, useState } from "react";

const API_URL = "http://localhost:8000/api/payments/fraud/alerts/";

function FraudAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error("Please log in again to view fraud alerts.");
      }

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.status === 401) {
        throw new Error("Your session has expired. Please log in again.");
      }

      if (response.status === 403) {
        throw new Error("Admin permission is required to view fraud alerts.");
      }

      if (!response.ok) {
        throw new Error("Unable to load fraud alerts.");
      }

      const data = await response.json();
      setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  return (
    <section
      aria-label="Fraud alerts"
      className="w-full min-w-0 rounded-2xl border border-red-200 bg-white p-5 shadow-md dark:border-red-900 dark:bg-gray-900 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fraud Alerts
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Transactions flagged by the fraud detection system.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAlerts}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh Alerts"}
        </button>
      </div>

      <div className="mt-5 rounded-xl bg-red-50 p-4 dark:bg-red-950">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">
          Total flagged transactions
        </p>
        <p className="mt-1 text-3xl font-bold text-red-800 dark:text-red-200">
          {alerts.length}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg bg-red-100 p-4 text-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {error}
        </div>
      )}

      {!error && !loading && alerts.length === 0 && (
        <p className="mt-5 rounded-lg bg-gray-50 p-4 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          No flagged transactions found.
        </p>
      )}

      {alerts.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                  Transaction
                </th>
                <th className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                  User
                </th>
                <th className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                  Amount
                </th>
                <th className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                  Reason
                </th>
                <th className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                  Payment Status
                </th>
              </tr>
            </thead>

            <tbody>
              {alerts.map((alert) => (
                <tr
                  key={alert.id}
                  className="border-b border-gray-200 dark:border-gray-800"
                >
                  <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                    #{alert.id}
                  </td>

                  <td className="px-4 py-4 text-gray-700 dark:text-gray-300">
                    {alert.username}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-gray-900 dark:text-white">
                    ₹{Number(alert.amount).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                  <td className="max-w-xs px-4 py-4 text-sm text-red-700 dark:text-red-300">
                    {alert.fraud_reason}
                  </td>

                  <td className="px-4 py-4">
                    <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-950 dark:text-red-300">
                      {alert.status}
                    </span>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Fraud: {alert.fraud_status}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default FraudAlerts;
