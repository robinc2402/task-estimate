import { Badge } from "@/components/ui/badge";

interface TeamMember {
  id: string;
  initials: string;
  name: string;
  role: string;
  status: 'online' | 'offline';
  color: string;
}

export default function TeamMembers() {
  const teamMembers: TeamMember[] = [
    {
      id: "0202fbdb-dd63-45ed-8976-e4295db5dfa7",
      initials: "AL",
      name: "Alex Lee",
      role: "Senior Developer",
      status: "online",
      color: "bg-primary-100 text-primary-800",
    },
    {
      id: "0202fbdb-dd63-45ed-8976-e4295db5dfa7",
      initials: "SK",
      name: "Sarah Kim",
      role: "Product Owner",
      status: "offline",
      color: "bg-secondary-100 text-secondary-800",
    }
  ];

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
              <div className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center font-medium`}>
                {member.initials}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">{member.name}</div>
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
