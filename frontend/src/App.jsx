import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Basket from "./components/Basket/Basket";
import BasketNavbar from "./components/Basket/BasketNavbar";
import Error from "./components/Error/Error";
import Home from "./components/Home";
import Footer from "./layout/Footer/Footer";
import Navbar from "./layout/Navbar/Navbar";
import AdminPage from "./components/AdminPage/AdminPage";
import ProductsPage from "./pages/ProductsPage/ProductsPage";
import FloatingBasket from "./components/FloatingBasket/FloatingBasket";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHomePage = location.pathname === "/";

  return (
    <>
      <ToastContainer />
      <ScrollToTop />
      <FloatingBasket />
      {isHomePage ? <Navbar /> : <BasketNavbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/basket" element={<Basket />} />
        <Route path="*" element={<Error />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/products" element={<ProductsPage />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
