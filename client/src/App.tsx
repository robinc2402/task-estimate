import {Switch, Route, Link as RouterLink} from "wouter";
import {queryClient} from "./lib/queryClient";
import {QueryClientProvider} from "@tanstack/react-query";
import {TooltipProvider} from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "./pages/login";
import CollaborativeEstimation from "@/pages/collaborative";
import {LoginProvider, useLogin} from "@/context/LoginContext"

function Router() {

    const {user} = useLogin();
    return (
        <Switch>
            {user && <>
                <Route path="/" component={Home}/>
                <Route path="/task-estimation" component={Home}/>
                <Route path="/collaborative" component={CollaborativeEstimation}/>
            </>}
            {!user && <Route component={Login}/>}
            <Route component={NotFound}/>
        </Switch>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <LoginProvider>
                <TooltipProvider>
                    <Router/>
                </TooltipProvider>
            </LoginProvider>
        </QueryClientProvider>
    );
}

export default App;
