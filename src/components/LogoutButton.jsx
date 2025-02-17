import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const LogoutButton = () => {
    const { logout } = useContext(AuthContext);

    return (
        <button onClick={logout} className="bg-red-600 text-white p-2 rounded">
            Logout
        </button>
    );
};

export default LogoutButton;
