import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Vérification du token et récupération de l'user
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await api.get("/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data?.success && res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem("user", JSON.stringify(res.data.user));
          } else {
            setUser(null);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          }
        } catch {
          setUser(null);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", credentials);
      if (!res.data?.success || !res.data?.user) {
        const msg =
          res.data?.message ||
          (Array.isArray(res.data?.errors) && res.data.errors[0]?.msg
            ? res.data.errors[0].msg
            : "Erreur de connexion");
        toast.error(msg);
        setLoading(false);
        return { success: false, message: msg };
      }
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      toast.success("Connexion réussie");
      // استعمال window.location باش الـ redirect يخدم 100% (بلا اعتماد على navigate)
      const to = res.data.user?.role === "admin" ? "/admin" : "/";
      window.location.href = to;
      return { success: true };
    } catch (err) {
      setUser(null);
      const msg =
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK"
          ? "Backend غير شغال. شغّل: cd backend && node server.js (port 3000)"
          : "Erreur de connexion.");
      toast.error(msg);
      setLoading(false);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
