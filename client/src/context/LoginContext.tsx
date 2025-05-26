import {createContext, useContext, useEffect, useState, ReactNode} from "react";
import {toast} from "@/hooks/use-toast.ts";

type User = {
    displayName: string;
    username: string
} | null;

type LoginContextType = {
    user: User;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: any }>;
    logout: () => void;
};

const LoginContext = createContext<LoginContextType | undefined>(undefined);

export function LoginProvider({children}: { children: ReactNode }) {
    const [user, setUser] = useState<User>(() => {
        // Restore user from localStorage
        const storedUser = localStorage.getItem("user");
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const login = async (username: string, password: string) => {
        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({username, password}),
            });

            if (!response.ok) {
                toast({
                    title: "Login failed",
                    variant: "destructive",
                });
                throw new Error("Login failed!");
            }

            const data = await response.json(); // should contain { user, token }

            // Save user & token
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("token", data.token); // Optional if needed
            setUser(data.user);
            return {success: true};
        } catch (err) {
            console.error("Login failed:", err);
            return {success: false, error: err};
        }
    };


    const logout = () => {
        localStorage.removeItem("user");
        setUser(null);
    };

    useEffect(() => {
        // Optional: listen for storage changes in other tabs
        const syncUser = () => {
            const stored = localStorage.getItem("user");
            setUser(stored ? JSON.parse(stored) : null);
        };
        window.addEventListener("storage", syncUser);
        return () => window.removeEventListener("storage", syncUser);
    }, []);

    return (
        <LoginContext.Provider value={{user, login, logout}}>
            {children}
        </LoginContext.Provider>
    );
}

export function useLogin() {
    const context = useContext(LoginContext);
    if (!context) throw new Error("useLogin must be used within LoginProvider");
    return context;
}
