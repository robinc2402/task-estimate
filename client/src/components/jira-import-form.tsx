
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, AlertCircle, CheckCircle2, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface JiraImportFormProps {
  sessionId: string;
  onTasksImported: () => void;
}

interface JiraProject {
  key: string;
  name: string;
}

export default function JiraImportForm({ sessionId, onTasksImported }: JiraImportFormProps) {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  
  // Project import state
  const [selectedProject, setSelectedProject] = useState("");
  const [maxResults, setMaxResults] = useState(50);
  
  // JQL import state
  const [jqlQuery, setJqlQuery] = useState("");
  const [jqlMaxResults, setJqlMaxResults] = useState(50);

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const response = await apiRequest("GET", "/api/jira/projects");
      if (response.ok) {
        const projectsData = await response.json();
        setProjects(projectsData);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to load projects");
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast({
        title: "Warning",
        description: "Could not load Jira projects. You can still use JQL import.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleProjectImport = async () => {
    if (!selectedProject) {
      setImportError("Please select a project");
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      const response = await apiRequest(
        "POST", 
        `/api/sessions/${sessionId}/import/jira`, 
        { 
          projectKey: selectedProject,
          maxResults 
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to import tasks from Jira");
      }

      // Reset form
      setSelectedProject("");
      setMaxResults(50);

      // Notify parent
      onTasksImported();
      
      toast({
        title: "Import successful",
        description: "Tasks have been imported from Jira and are ready for estimation",
      });
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "An unknown error occurred");
      
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import tasks from Jira",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleJqlImport = async () => {
    if (!jqlQuery.trim()) {
      setImportError("Please enter a JQL query");
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      const response = await apiRequest(
        "POST", 
        `/api/sessions/${sessionId}/import/jira/jql`, 
        { 
          jql: jqlQuery,
          maxResults: jqlMaxResults 
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to import tasks using JQL");
      }

      // Reset form
      setJqlQuery("");
      setJqlMaxResults(50);

      // Notify parent
      onTasksImported();
      
      toast({
        title: "Import successful",
        description: "Tasks have been imported from Jira using JQL and are ready for estimation",
      });
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "An unknown error occurred");
      
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import tasks using JQL",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="project" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="project">Import by Project</TabsTrigger>
          <TabsTrigger value="jql">Import by JQL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="project" className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-select">Select Project</Label>
              <Select 
                value={selectedProject} 
                onValueChange={setSelectedProject}
                disabled={isImporting || isLoadingProjects}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingProjects ? "Loading projects..." : "Select a Jira project"} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.key} value={project.key}>
                      {project.key} - {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-results">Maximum Results</Label>
              <Input
                id="max-results"
                type="number"
                min="1"
                max="100"
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value) || 50)}
                disabled={isImporting}
              />
            </div>

            <Button 
              onClick={handleProjectImport} 
              disabled={!selectedProject || isImporting}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Import from Project
                </>
              )}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="jql" className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jql-query">JQL Query</Label>
              <Textarea
                id="jql-query"
                placeholder="Enter your JQL query (e.g., project = MYPROJ AND status != Done)"
                value={jqlQuery}
                onChange={(e) => setJqlQuery(e.target.value)}
                disabled={isImporting}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jql-max-results">Maximum Results</Label>
              <Input
                id="jql-max-results"
                type="number"
                min="1"
                max="100"
                value={jqlMaxResults}
                onChange={(e) => setJqlMaxResults(parseInt(e.target.value) || 50)}
                disabled={isImporting}
              />
            </div>

            <Button 
              onClick={handleJqlImport} 
              disabled={!jqlQuery.trim() || isImporting}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Import with JQL
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Error message */}
      {importError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-700">{importError}</p>
        </div>
      )}

      {/* Example JQL queries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-primary-500" />
            <span>Example JQL Queries</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="bg-slate-100 p-3 rounded-md">
            <code className="text-xs">project = MYPROJ AND status != Done</code>
            <p className="text-xs text-slate-600 mt-1">All open issues in project MYPROJ</p>
          </div>
          <div className="bg-slate-100 p-3 rounded-md">
            <code className="text-xs">sprint in openSprints() AND assignee = currentUser()</code>
            <p className="text-xs text-slate-600 mt-1">Your issues in current sprints</p>
          </div>
          <div className="bg-slate-100 p-3 rounded-md">
            <code className="text-xs">created >= -7d AND type = Story</code>
            <p className="text-xs text-slate-600 mt-1">Stories created in the last 7 days</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
