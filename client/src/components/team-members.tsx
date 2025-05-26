import {Badge} from "@/components/ui/badge";
import {useState, useEffect} from "react";

interface TeamMember {
    id: string;
    initials: string;
    name: string;
    role: string;
    status: 'online' | 'offline';
    color: string;
}

export default function TeamMembers() {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const fetchTeamMembers = async () => {
        const teamMembers = await fetch('/api/team-members');
        const users = await teamMembers.json()
        return users.users

    }
    useEffect(() => {
        fetchTeamMembers().then(data => {
            console.log('TeamMembers', data);
            setTeamMembers(data)
        })
    }, []);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Team Members</h2>
            <div className="space-y-3">
                {teamMembers.map((member) => (
                    <div
                        key={member.id}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-md transition-colors"
                    >
                        <div className="flex items-center space-x-3">

                            <div>
                                <div className="text-sm font-medium text-slate-900">{member.displayName}</div>
                                <div className="text-xs text-slate-500">{member.role}</div>
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className={member.status === 'online'
                                ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-100"
                                : "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-100"}
                        >
                            {member.status === 'online' ? 'Online' : 'Offline'}
                        </Badge>
                    </div>
                ))}
            </div>
        </div>
    );
}
