
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

const API_URL =
  "http://localhost:8000/api/payments/analytics/summary/";

const CSV_EXPORT_URL =
  "http://localhost:8000/api/payments/analytics/export/csv/";

const PDF_EXPORT_URL =
  "http://localhost:8000/api/payments/analytics/export/pdf/";

const STATUS_COLORS = ["#16a34a", "#dc2626", "#d97706"];

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  // New states for CSV and PDF export
  const [exporting, setExporting] = useState("");
  const [exportError, setExportError] = useState("");
  const [exportSuccess, setExportSuccess] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadAnalytics() {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          throw new Error(
            "Please log in again to view payment analytics."
          );
        }

        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "Admin permission is required to view analytics."
          );
        }

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const detail = body?.detail || body?.error;

          throw new Error(
            detail ||
              `Unable to load analytics (HTTP ${response.status}).`
          );
        }

        const data = await response.json();

        if (
          !data ||
          typeof data !== "object" ||
          Array.isArray(data)
        ) {
          throw new Error(
            "The analytics API returned an invalid response."
          );
        }

        if (!controller.signal.aborted) {
          setAnalytics(data);
        }
      } catch (err) {
        if (
          err.name !== "AbortError" &&
          !controller.signal.aborted
        ) {
          setError(err.message || "Unable to load analytics.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => controller.abort();
  }, [retryKey]);

  // Download analytics CSV or PDF
  async function handleExport(format) {
    setExporting(format);
    setExportError("");
    setExportSuccess("");

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error(
          "Please log in again before exporting the report."
        );
      }

      const exportUrl =
        format === "csv" ? CSV_EXPORT_URL : PDF_EXPORT_URL;

      const response = await fetch(exportUrl, {
            method: "GET",
            headers: {
            Authorization: `Bearer ${token}`,
            Accept: "*/*",
                },
        });

      if (response.status === 401) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "Admin permission is required to export analytics."
        );
      }

      if (!response.ok) {
        const contentType =
          response.headers.get("content-type") || "";

        let message = `Export failed (HTTP ${response.status}).`;

        if (contentType.includes("application/json")) {
          const body = await response.json().catch(() => null);
          message = body?.detail || body?.error || message;
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("The server returned an empty report.");
      }

      // Check the response content type to avoid downloading an error page.
      const contentType =
        response.headers.get("content-type") || "";

      if (
        format === "pdf" &&
        !contentType.includes("application/pdf")
      ) {
        throw new Error(
          "The server did not return a PDF. Please check the backend export view."
        );
      }

      if (
        format === "csv" &&
        !(
          contentType.includes("text/csv") ||
          contentType.includes("application/csv") ||
          contentType.includes("octet-stream")
        )
      ) {
        throw new Error(
          "The server did not return a CSV file. Please check the backend export view."
        );
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      const today = new Date().toISOString().slice(0, 10);

      link.href = downloadUrl;
      link.download = `analytics_summary_${today}.${format}`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);

      setExportSuccess(
        `${format.toUpperCase()} report downloaded successfully.`
      );
    } catch (err) {
      setExportError(
        err.message || `Unable to export ${format.toUpperCase()} report.`
      );
    } finally {
      setExporting("");
    }
  }

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

        <p
          role="alert"
          className="mt-3 text-red-600 dark:text-red-400"
        >
          {error}
        </p>

        <button
          type="button"
          onClick={() => setRetryKey((value) => value + 1)}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </section>
    );
  }

  const dailyData = (
    Array.isArray(analytics.daily_analytics)
      ? analytics.daily_analytics
      : []
  ).map((item) => ({
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Payment Analytics
          </h2>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Overview of payment activity and transaction status.
          </p>
        </div>

        {/* New CSV and PDF export buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleExport("csv")}
            disabled={Boolean(exporting)}
            className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting === "csv" ? "Exporting CSV..." : "Export CSV"}
          </button>

          <button
            type="button"
            onClick={() => handleExport("pdf")}
            disabled={Boolean(exporting)}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting === "pdf" ? "Exporting PDF..." : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Export status messages */}
      {exportError && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {exportError}
        </p>
      )}

      {exportSuccess && (
        <p
          role="status"
          className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300"
        >
          {exportSuccess}
        </p>
      )}

      {/* Summary cards */}
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

      {/* Total amount */}
      <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Total Transaction Amount
        </p>

        <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white">
          {formatCurrency(analytics.total_amount)}
        </p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Daily payment trend */}
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

        {/* Transaction status chart */}
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
                    <Cell
                      key={item.name}
                      fill={STATUS_COLORS[index]}
                    />
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
