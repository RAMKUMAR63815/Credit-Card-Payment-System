
import { useEffect, useState } from "react";

const API_URL =
  "http://localhost:8000/api/payments/admin/transactions/";

const initialFilters = {
  search: "",
  status: "",
  min_amount: "",
  max_amount: "",
  start_date: "",
  end_date: "",
};

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function TransactionSearch() {
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");

  const [transactions, setTransactions] = useState([]);
  const [count, setCount] = useState(0);
  const [nextUrl, setNextUrl] = useState(null);
  const [previousUrl, setPreviousUrl] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTransactions() {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          throw new Error("Please log in to view transactions.");
        }

        const params = new URLSearchParams();

        params.set("page", String(page));
        params.set("page_size", pageSize);

        Object.entries(appliedFilters).forEach(([key, value]) => {
          if (value !== "") {
            params.set(key, value);
          }
        });

        const response = await fetch(
          `${API_URL}?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (response.status === 401) {
          throw new Error("Your session has expired. Please log in again.");
        }

        if (response.status === 403) {
          throw new Error("Admin permission is required.");
        }

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const detail = body?.detail || body?.error;

          throw new Error(
            detail || `Unable to load transactions (${response.status}).`
          );
        }

        const data = await response.json();

        if (controller.signal.aborted) return;

        // DRF pagination returns an object with a results array.
        // The array fallback also supports an unpaginated response.
        const results = Array.isArray(data) ? data : data.results || [];

        setTransactions(results);
        setCount(Array.isArray(data) ? results.length : data.count || 0);
        setNextUrl(Array.isArray(data) ? null : data.next || null);
        setPreviousUrl(Array.isArray(data) ? null : data.previous || null);
      } catch (err) {
        if (err.name !== "AbortError" && !controller.signal.aborted) {
          setError(err.message || "Unable to load transactions.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadTransactions();

    return () => controller.abort();
  }, [page, pageSize, appliedFilters, refreshKey]);

  function updateFilter(event) {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSearch(event) {
    event.preventDefault();

    if (
      filters.min_amount !== "" &&
      (!Number.isFinite(Number(filters.min_amount)) ||
        Number(filters.min_amount) < 0)
    ) {
      setError("Minimum amount must be a valid non-negative number.");
      return;
    }

    if (
      filters.max_amount !== "" &&
      (!Number.isFinite(Number(filters.max_amount)) ||
        Number(filters.max_amount) < 0)
    ) {
      setError("Maximum amount must be a valid non-negative number.");
      return;
    }

    if (
      filters.min_amount !== "" &&
      filters.max_amount !== "" &&
      Number(filters.min_amount) > Number(filters.max_amount)
    ) {
      setError("Minimum amount cannot exceed maximum amount.");
      return;
    }

    if (
      filters.start_date &&
      filters.end_date &&
      filters.start_date > filters.end_date
    ) {
      setError("Start date cannot be after end date.");
      return;
    }

    setError("");
    setPage(1);
    setAppliedFilters({ ...filters });
  }

  function clearFilters() {
    setFilters({ ...initialFilters });
    setAppliedFilters({ ...initialFilters });
    setPage(1);
    setError("");
  }

  function changePage(direction) {
    if (direction === "next" && nextUrl) {
      setPage((current) => current + 1);
    }

    if (direction === "previous" && previousUrl) {
      setPage((current) => Math.max(1, current - 1));
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / Number(pageSize)));
  const firstResult = count === 0 ? 0 : (page - 1) * Number(pageSize) + 1;
  const lastResult = Math.min(page * Number(pageSize), count);

  return (
    <section className="mt-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Transaction History
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Search and filter customer payments.
        </p>
      </div>

      {/* Search and filters */}
      <form
        onSubmit={handleSearch}
        className="space-y-5 rounded-xl bg-white p-6 shadow-md dark:bg-gray-900"
      >
        <div>
          <label
            htmlFor="transaction-search"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Search by transaction ID, payment ID, or last four card digits
          </label>

          <input
            id="transaction-search"
            name="search"
            type="search"
            inputMode="numeric"
            value={filters.search}
            onChange={updateFilter}
            placeholder="For example, 1234"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label
              htmlFor="transaction-status"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Status
            </label>

            <select
              id="transaction-status"
              name="status"
              value={filters.status}
              onChange={updateFilter}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All statuses</option>
              <option value="SUCCESS">Successful</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="min-amount"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Minimum amount (₹)
            </label>

            <input
              id="min-amount"
              name="min_amount"
              type="number"
              min="0"
              step="0.01"
              value={filters.min_amount}
              onChange={updateFilter}
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="max-amount"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Maximum amount (₹)
            </label>

            <input
              id="max-amount"
              name="max_amount"
              type="number"
              min="0"
              step="0.01"
              value={filters.max_amount}
              onChange={updateFilter}
              placeholder="Any amount"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="start-date"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              From date
            </label>

            <input
              id="start-date"
              name="start_date"
              type="date"
              value={filters.start_date}
              onChange={updateFilter}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="end-date"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              To date
            </label>

            <input
              id="end-date"
              name="end_date"
              type="date"
              value={filters.end_date}
              onChange={updateFilter}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="page-size"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Results per page
            </label>

            <select
              id="page-size"
              value={pageSize}
              onChange={(event) => {
                setPageSize(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
          >
            Search transactions
          </button>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Clear filters
          </button>

          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            className="rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Refresh
          </button>
        </div>
      </form>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {/* Results table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-md dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-5 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Transactions
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            {loading
              ? "Loading..."
              : count === 0
                ? "No results"
                : `Showing ${firstResult}–${lastResult} of ${count}`}
          </p>
        </div>

        {loading ? (
          <p className="p-8 text-center text-gray-600 dark:text-gray-300">
            Loading transactions...
          </p>
        ) : transactions.length === 0 ? (
          <p className="p-8 text-center text-gray-600 dark:text-gray-300">
            No transactions match your filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  {[
                    "Transaction ID",
                    "Customer",
                    "Card",
                    "Amount",
                    "Status",
                    "Payment ID",
                    "Date",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-5 py-4 font-semibold text-gray-700 dark:text-gray-200"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-t border-gray-200 dark:border-gray-800"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-gray-800 dark:text-gray-200">
                      #{transaction.id}
                    </td>

                    <td className="px-5 py-4 text-gray-800 dark:text-gray-200">
                      {transaction.username || "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 font-mono text-gray-800 dark:text-gray-200">
                      {transaction.card_last_four
                        ? `•••• ${transaction.card_last_four}`
                        : "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-800 dark:text-gray-200">
                      {formatCurrency(transaction.amount)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          transaction.status === "SUCCESS"
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : transaction.status === "FAILED"
                              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-800 dark:text-gray-200">
                      {transaction.payment_id ?? "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-gray-600 dark:text-gray-300">
                      {formatDate(transaction.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 p-5 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => changePage("previous")}
              disabled={!previousUrl || loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 enabled:hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-200 dark:enabled:hover:bg-gray-800"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() => changePage("next")}
              disabled={!nextUrl || loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 enabled:hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-200 dark:enabled:hover:bg-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TransactionSearch;
