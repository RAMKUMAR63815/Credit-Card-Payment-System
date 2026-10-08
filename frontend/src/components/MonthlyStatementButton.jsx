function MonthlyStatementButton() {
  const downloadStatement = async () => {
    try {
      const token =
        localStorage.getItem("access_token");

      if (!token) {
        alert("Please login first.");
        return;
      }

      const response = await fetch(
        "http://localhost:8000/api/statements/monthly/",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to generate statement"
        );
      }

      const blob = await response.blob();

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        "monthly_statement.pdf";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(error);

      alert(
        "Unable to download monthly statement."
      );
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

export default MonthlyStatementButton;