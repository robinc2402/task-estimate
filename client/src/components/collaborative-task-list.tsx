import { useState } from "react";
import { Task, TShirtSizeType } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Loader2, Check, Users, ThumbsUp, ChevronDown, ChevronUp } from "lucide-react";
import { tshirtSizes } from "@/lib/tshirt-sizes";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface CollaborativeTaskListProps {
  tasks: Task[];
  isLoading: boolean;
  userId: string;
  userName: string;
  onTasksUpdated: () => void;
}

export default function CollaborativeTaskList({ 
  tasks, 
  isLoading, 
  userId, 
  userName,
  onTasksUpdated 
}: CollaborativeTaskListProps) {
  const { toast } = useToast();
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [loadingTask, setLoadingTask] = useState<{id: number, action: 'vote' | 'finalize'} | null>(null);

  const handleVote = async (taskId: number, size: TShirtSizeType) => {
    try {
      setLoadingTask({ id: taskId, action: 'vote' });
      
      const response = await apiRequest("POST", `/api/tasks/${taskId}/vote`, {
        userId,
        userName,
        size
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit vote");
      }
      
      toast({
        title: "Vote submitted",
        description: `You've voted for size ${size}`,
      });
      
      onTasksUpdated();
    } catch (error) {
      toast({
        title: "Vote failed",
        description: error instanceof Error ? error.message : "Failed to submit your vote",
        variant: "destructive",
      });
    } finally {
      setLoadingTask(null);
    }
  };

  const handleFinalize = async (taskId: number, finalSize: TShirtSizeType) => {
    try {
      setLoadingTask({ id: taskId, action: 'finalize' });
      
      const response = await apiRequest("POST", `/api/tasks/${taskId}/finalize`, {
        finalSize
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to finalize task");
      }
      
      // Invalidate both the session tasks and recent tasks queries
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/recent'] });
      
      toast({
        title: "Task finalized",
        description: `Task has been finalized with size ${finalSize}`,
      });
      
      onTasksUpdated();
    } catch (error) {
      toast({
        title: "Finalize failed",
        description: error instanceof Error ? error.message : "Failed to finalize the task",
        variant: "destructive",
      });
    } finally {
      setLoadingTask(null);
    }
  };

  // Calculate vote distribution for a task
  const getVoteDistribution = (votes: { userId: string; userName: string; size: TShirtSizeType }[]) => {
    const total = votes.length;
    if (total === 0) return {};
    
    const distribution: Record<string, number> = {};
    
    // Count votes for each size
    votes.forEach(vote => {
      distribution[vote.size] = (distribution[vote.size] || 0) + 1;
    });
    
    // Convert to percentages
    Object.keys(distribution).forEach(size => {
      distribution[size] = Math.round((distribution[size] / total) * 100);
    });
    
    return distribution;
  };

  // Check if current user has voted for a task
  const hasVoted = (task: Task) => {
    return task.votes?.some(vote => vote.userId === userId) || false;
  };

  // Get current user's vote for a task
  const getUserVote = (task: Task) => {
    return task.votes?.find(vote => vote.userId === userId)?.size || undefined;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Tasks...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Tasks Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500">
            Import tasks using the form above to start the estimation process.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex justify-between items-center">
            <span>Tasks to Estimate</span>
            <Badge className="ml-2">{tasks.length} tasks</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Accordion type="single" collapsible>
            {tasks.map((task) => {
              const voteDistribution = getVoteDistribution(task.votes || []);
              const userVote = getUserVote(task);
              
              return (
                <AccordionItem key={task.id} value={task.id.toString()} className="border-b">
                  <AccordionTrigger className="px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 flex items-center justify-between pr-4">
                      <div className="text-left">
                        <h3 className="font-medium text-base text-slate-800">{task.title}</h3>
                        <div className="flex items-center mt-1 text-sm text-slate-500">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "mr-2",
                              task.isFinalized ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200"
                            )}
                          >
                            {task.isFinalized ? "Finalized" : "In Progress"}
                          </Badge>
                          <Users className="h-3.5 w-3.5 mr-1" />
                          <span>{task.votes?.length || 0} votes</span>
                          {task.averageSize && (
                            <Badge className="ml-2 bg-primary-100 text-primary-800 border-primary-200 font-medium">
                              Most voted: {task.averageSize}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge 
                        className={cn(
                          "text-xs h-7 px-3 flex items-center",
                          task.isFinalized 
                            ? "bg-green-100 text-green-800 hover:bg-green-100" 
                            : "bg-primary-100 text-primary-800 hover:bg-primary-100"
                        )}
                      >
                        {task.isFinalized 
                          ? `Final: ${task.size}` 
                          : `Predicted: ${task.size}`}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="space-y-4">
                      {/* Task Description */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-1">Description</h4>
                        <p className="text-slate-600">{task.description}</p>
                      </div>
                      
                      {/* Vote Distribution */}
                      {task.votes && task.votes.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-2">Vote Distribution</h4>
                          <div className="space-y-2">
                            {Object.entries(voteDistribution).map(([size, percentage]) => (
                              <div key={size} className="flex items-center text-sm">
                                <span className="w-8 font-medium text-slate-700">{size}</span>
                                <div className="flex-1 mx-2">
                                  <Progress value={percentage} className="h-2" />
                                </div>
                                <span className="w-8 text-right text-slate-600">{percentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Voters */}
                      {task.votes && task.votes.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 mb-2">Voters</h4>
                          <div className="flex flex-wrap gap-2">
                            {task.votes.map((vote, index) => (
                              <Badge 
                                key={index} 
                                variant="outline"
                                className={cn(
                                  "bg-slate-50",
                                  vote.userId === userId && "bg-primary-50 border-primary-200"
                                )}
                              >
                                {vote.userName}: {vote.size}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {!task.isFinalized && (
                        <>
                          {/* Voting Controls */}
                          <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-2">
                              {userVote ? "Change Your Vote" : "Cast Your Vote"}
                            </h4>
                            <div className="grid grid-cols-6 gap-2">
                              {tshirtSizes.map((size) => (
                                <Button
                                  key={size.value}
                                  variant={userVote === size.value ? "default" : "outline"}
                                  size="sm"
                                  className={cn(
                                    "h-10",
                                    userVote === size.value 
                                      ? "bg-primary-600 hover:bg-primary-700" 
                                      : "hover:bg-slate-100"
                                  )}
                                  disabled={
                                    loadingTask?.id === task.id || task.isFinalized
                                  }
                                  onClick={() => handleVote(task.id, size.value as TShirtSizeType)}
                                >
                                  {userVote === size.value && (
                                    <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                                  )}
                                  {size.value}
                                </Button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Finalize Button */}
                          <div>
                            <Button
                              variant="default"
                              className="w-full mt-2 bg-green-600 hover:bg-green-700"
                              disabled={
                                loadingTask?.id === task.id || 
                                !task.votes || 
                                task.votes.length === 0
                              }
                              onClick={() => 
                                handleFinalize(
                                  task.id, 
                                  task.averageSize as TShirtSizeType || task.size as TShirtSizeType
                                )
                              }
                            >
                              {loadingTask?.id === task.id && loadingTask.action === 'finalize' ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Finalizing...
                                </>
                              ) : (
                                <>
                                  <Check className="mr-2 h-4 w-4" />
                                  Accept & Save
                                </>
                              )}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}