
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_URL = "http://localhost:8000/api/payments/analytics/summary/";

const STATUS_COLORS = ["#16a34a", "#dc2626", "#d97706"];

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("access_token");

        if (!token) {
          throw new Error("Please log in again to view analytics.");
        }

        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          throw new Error("Your session has expired. Please log in again.");
        }

        if (response.status === 403) {
          throw new Error("Admin permission is required to view analytics.");
        }

        if (!response.ok) {
          throw new Error(`Unable to load analytics (HTTP ${response.status}).`);
        }

        const data = await response.json();

        if (!cancelled) {
          setAnalytics(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load analytics.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="my-8 rounded-xl bg-white p-6 shadow-md dark:bg-gray-900">
        <p className="animate-pulse text-gray-600 dark:text-gray-300">
          Loading payment analytics...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="my-8 rounded-xl bg-white p-6 shadow-md dark:bg-gray-900">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Payment Analytics
        </h2>
        <p className="mt-3 text-red-600 dark:text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          Retry
        </button>
      </section>
    );
  }

  const dailyData = (analytics.daily_analytics || []).map((item) => ({
    ...item,
    successful: Number(item.successful || 0),
    failed: Number(item.failed || 0),
  }));

  const statusData = [
    {
      name: "Successful",
      value: Number(analytics.successful_transactions || 0),
    },
    {
      name: "Failed",
      value: Number(analytics.failed_transactions || 0),
    },
    {
      name: "Pending",
      value: Number(analytics.pending_transactions || 0),
    },
  ];

  const cards = [
    {
      title: "Total Transactions",
      value: analytics.total_transactions || 0,
      description: "All recorded payments",
    },
    {
      title: "Successful",
      value: analytics.successful_transactions || 0,
      description: "Completed payments",
    },
    {
      title: "Failed",
      value: analytics.failed_transactions || 0,
      description: "Unsuccessful payments",
    },
    {
      title: "Pending",
      value: analytics.pending_transactions || 0,
      description: "Awaiting a final status",
    },
  ];

  return (
    <section className="my-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Payment Analytics
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Overview of payment activity and transaction status.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-900"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {card.title}
            </p>
            <p className="mt-3 text-3xl font-bold text-gray-800 dark:text-white">
              {Number(card.value).toLocaleString("en-IN")}
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Total Transaction Amount
        </p>
        <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white">
          {formatCurrency(analytics.total_amount)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="min-w-0 rounded-xl bg-white p-6 shadow-md dark:bg-gray-900">
          <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white">
            Daily Payment Trend
          </h3>

          {dailyData.length === 0 ? (
            <p className="py-16 text-center text-gray-500 dark:text-gray-400">
              No transaction data available.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => String(date).slice(5)}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="successful"
                  name="Successful"
                  stroke="#16a34a"
                  strokeWidth={3}
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  name="Failed"
                  stroke="#dc2626"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="min-w-0 rounded-xl bg-white p-6 shadow-md dark:bg-gray-900">
          <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white">
            Transaction Status
          </h3>

          {statusData.every((item) => item.value === 0) ? (
            <p className="py-16 text-center text-gray-500 dark:text-gray-400">
              No transactions have been recorded yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  label
                >
                  {statusData.map((item, index) => (
                    <Cell key={item.name} fill={STATUS_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
}
