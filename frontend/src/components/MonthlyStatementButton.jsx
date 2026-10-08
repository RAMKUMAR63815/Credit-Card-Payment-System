function MonthlyStatement() {
  const downloadStatement = async () => {
    try {
      // Get JWT access token from browser storage
      const token = localStorage.getItem("access_token");

      // Stop if user is not logged in
      if (!token) {
        alert("Please login first.");
        return;
      }

      // Call Django backend monthly statement API
      const response = await fetch(
        "http://localhost:8000/api/statements/monthly/",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Check whether API request was successful
      if (!response.ok) {
        throw new Error("Failed to generate statement");
      }

      // Convert API response into PDF binary data
      const blob = await response.blob();

      // Create temporary browser URL for the PDF
      const url = window.URL.createObjectURL(blob);

      // Create temporary download link
      const link = document.createElement("a");

      link.href = url;
      link.download = "monthly_statement.pdf";

      // Add link to page and trigger download
      document.body.appendChild(link);
      link.click();

      // Remove temporary link
      link.remove();

      // Release temporary browser URL
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Statement download error:", error);

      alert("Unable to download monthly statement.");
    }
  };

  return (
    <button
      onClick={downloadStatement}
      className="
        rounded-xl
        bg-blue-600
        px-5
        py-3
        font-semibold
        text-white
        transition
        hover:bg-blue-700
      "
    >
      📄 Download Monthly Statement
    </button>
  );
}

export default MonthlyStatement;