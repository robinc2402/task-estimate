import {Users} from "lucide-react";
import {Link, useLocation} from "wouter";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {useLogin} from "@/context/LoginContext";

export default function AppHeader() {
    const [location] = useLocation();
    const {logout, user} = useLogin();
    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Link href="/">
                        <div className="flex items-center space-x-2 cursor-pointer">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-6 w-6 text-primary-500"
                            >
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            <h1 className="text-xl font-semibold text-slate-900">Task Estimator</h1>
                        </div>
                    </Link>
                </div>

                <div className="flex items-center">
                    <nav className="hidden md:flex mr-6">
                        <ul className="flex space-x-1">
                            <li>
                                <Link href="/">
                                    <div className={cn(
                                        "px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                                        location === "/"
                                            ? "text-primary-600 bg-primary-50"
                                            : "text-slate-600 hover:text-primary-600 hover:bg-slate-50"
                                    )}>
                                        Single Task
                                    </div>
                                </Link>
                            </li>
                            <li>
                                <Link href="/collaborative">
                                    <div className={cn(
                                        "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center cursor-pointer",
                                        location === "/collaborative"
                                            ? "text-primary-600 bg-primary-50"
                                            : "text-slate-600 hover:text-primary-600 hover:bg-slate-50"
                                    )}>
                                        <Users className="h-4 w-4 mr-1"/>
                                        Team Estimation
                                    </div>
                                </Link>
                            </li>
                        </ul>
                    </nav>

                    <div className="flex items-center space-x-4">
                        {/*<Button variant="ghost" size="icon" className="text-slate-600 hover:text-primary-500">*/}
                        {/*  <Settings className="h-5 w-5" />*/}
                        {/*</Button>*/}
                        <div className="flex items-center space-x-2 text-sm">
                            <span className="hidden md:inline-block">Team Scrum</span>
                            <div
                                className="p-2 h-8 bg-slate-800 flex items-center justify-center text-white">
                                <span>{user?.displayName}</span>
                            </div>
                        </div>
                        <Button onClick={logout}>
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
