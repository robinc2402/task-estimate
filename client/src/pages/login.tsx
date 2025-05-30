import AppFooter from "@/components/app-footer";
import {LoginForm} from "@/components/login-form.tsx";
import {useLogin} from "@/context/LoginContext";

export default function Login() {
    const {user} = useLogin();
    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <main className="flex-grow flex items-center justify-center">
                {/* Centered Task Form */}
                <div className="w-full max-w-2xl px-4">
                    {!user && <LoginForm/>}
                    {user && <p>{user.username} logged in!</p>}
                </div>
            </main>
            <AppFooter/>
        </div>
    );
}
