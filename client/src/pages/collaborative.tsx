import {useState} from "react";
import AppHeader from "@/components/app-header";
import AppFooter from "@/components/app-footer";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";
import TeamMembers from "@/components/team-members";
import CsvImportForm from "@/components/csv-import-form";
import CollaborativeTaskList from "@/components/collaborative-task-list";
import {useQuery} from "@tanstack/react-query";
import {Loader2} from "lucide-react";
import {useToast} from "@/hooks/use-toast";
import {useLogin} from "@/context/LoginContext";

export default function CollaborativeEstimation() {
    const {user} = useLogin();
    const {toast} = useToast();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [userName, setUserName] = useState(user?.username);
    const [userId, setUserId] = useState(user.id);

    interface SessionType {
        id: number;
        name: string;
        createdAt: string;
        isActive: boolean;
    }

    // Fetch active sessions
    const {
        data: sessions = [],
        isLoading: isLoadingSessions,
        refetch: refetchSessions
    } = useQuery<SessionType[]>({
        queryKey: ['/api/sessions'],
        enabled: !sessionId, // Only fetch sessions when no session is selected
    });

    // Fetch tasks for the selected session
    const {
        data: tasks = [],
        isLoading: isLoadingTasks,
        refetch: refetchTasks
    } = useQuery({
        queryKey: ['/api/sessions', sessionId, 'tasks'],
        queryFn: async () => {
            if (!sessionId) return [];
            const response = await fetch(`/api/sessions/${sessionId}/tasks`);
            if (!response.ok) throw new Error('Failed to fetch session tasks');
            return response.json();
        },
        enabled: !!sessionId, // Only fetch tasks when a session is selected
    });

    const handleCreateSession = async () => {
        const sessionName = prompt("Enter a name for the estimation session:");
        if (!sessionName) return;

        try {
            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name: sessionName}),
            });

            if (!response.ok) throw new Error('Failed to create session');

            const session = await response.json();
            setSessionId(session.id.toString());

            toast({
                title: "Session created",
                description: `You've created a new estimation session: ${sessionName}`,
            });
        } catch (error) {
            toast({
                title: "Error creating session",
                description: "There was a problem creating your session.",
                variant: "destructive",
            });
        }
    };

    const handleSelectSession = (id: string) => {
        setSessionId(id);
    };

    const handleBackToSessions = () => {
        setSessionId(null);
        refetchSessions();
    };

    const handleTasksImported = () => {
        refetchTasks();
        toast({
            title: "Tasks imported",
            description: "Your tasks have been imported successfully.",
        });
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <AppHeader/>
            <main className="flex-grow container mx-auto px-4 py-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">Collaborative Estimation</h1>
                    <p className="text-slate-600 mt-2">Work together to estimate tasks with your team</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column - Task List */}
                    <div className="lg:col-span-8 space-y-6">
                        {!sessionId ? (
                            // Session selection
                            <Card>
                                <CardHeader>
                                    <CardTitle>Select Estimation Session</CardTitle>
                                    <CardDescription>
                                        Join an existing session or create a new one to start estimating tasks
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingSessions ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary-500"/>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-4 mb-6">
                                                {sessions && sessions.length > 0 ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {sessions.map((session) => (
                                                            <Card
                                                                key={session.id}
                                                                className="cursor-pointer hover:border-primary-500 transition-colors"
                                                                onClick={() => handleSelectSession(session.id.toString())}
                                                            >
                                                                <CardContent className="p-4">
                                                                    <h3 className="font-medium text-lg">{session.name}</h3>
                                                                    <p className="text-sm text-slate-500">
                                                                        Created {new Date(session.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-6 text-slate-500">
                                                        No active estimation sessions found
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                className="w-full"
                                                onClick={handleCreateSession}
                                            >
                                                Create New Session
                                            </Button>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            // Session view with CSV import and task list
                            <>
                                <Card className="mb-6">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <div>
                                            <CardTitle>Import Tasks</CardTitle>
                                            <CardDescription>
                                                Upload a CSV file with your tasks to estimate
                                            </CardDescription>
                                        </div>
                                        <Button variant="outline" onClick={handleBackToSessions}>
                                            Back to Sessions
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <CsvImportForm
                                            sessionId={sessionId}
                                            onTasksImported={handleTasksImported}
                                        />
                                    </CardContent>
                                </Card>

                                <CollaborativeTaskList
                                    tasks={tasks || []}
                                    isLoading={isLoadingTasks}
                                    userId={userId}
                                    userName={userName}
                                    onTasksUpdated={refetchTasks}
                                />
                            </>
                        )}
                    </div>

                    {/* Right Column - Team Members */}
                    <div className="lg:col-span-4">
                        <TeamMembers/>
                    </div>
                </div>
            </main>

            <AppFooter/>
        </div>
    );
}