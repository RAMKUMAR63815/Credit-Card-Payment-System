import { BrowserRouter, Routes, Route } from "react-router-dom"

import Login from "./pages/Login"

import Dashboard from "./pages/Dashboard"
import Register from "./pages/Register"
import Cards from "./pages/Cards"
import Payment from "./pages/Payment"
import Transactions from "./pages/Transactions"
import AdminDashboard from "./pages/AdminDashboard"

function App() {
  return (
    <BrowserRouter>
    {/* URL change aagumbodhu correct component/page display panna help pannum. */}

      <Routes>

        <Route path="/" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />
        {/* elements means dashboard content display pannu */}

        <Route path="/cards" element={<Cards />} />
        <Route path="/payment" element={<Payment />} />

        <Route path="/transactions" element={<Transactions />}/>
        <Route path="/admin-dashboard"element={<AdminDashboard />}/>

      </Routes>

    </BrowserRouter>
  )
}

export default App