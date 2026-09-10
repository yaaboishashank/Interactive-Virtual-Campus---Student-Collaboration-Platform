import { Outlet } from "react-router-dom";
import Navbar from "../components/navigation/Navbar/Navbar";

export default function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}