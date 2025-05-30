import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { TShirtSizeType } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ChevronRight, Edit, MoreHorizontal, Check, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tshirtSizes } from "@/lib/tshirt-sizes";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Task {
  id: number;
  title: string;
  description: string;
  size: string;
  points: number;
  createdAt: string;
}

export default function RecentTasks() {
  const { toast } = useToast();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedSize, setSelectedSize] = useState<TShirtSizeType | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks/recent'],
  });

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setSelectedSize(task.size as TShirtSizeType);
    setDialogOpen(true);
  };

  const handleSizeSelect = (size: TShirtSizeType) => {
    setSelectedSize(size);
  };

  const handleUpdateSize = async () => {
    if (!editingTask || !selectedSize) return;

    setIsUpdating(true);
    try {
      const response = await apiRequest("PUT", `/api/tasks/${editingTask.id}/size`, {
        size: selectedSize
      });

      if (!response.ok) {
        throw new Error("Failed to update task size");
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });

      // Close dialog
      handleCloseDialog();

      toast({
        title: "Size updated",
        description: "The task size has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "There was an error updating the task size.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTask(null);
    setSelectedSize(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Recent Tasks</h2>
        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
          <span>View All</span>
          <ChevronRight className="ml-1 h-4 w-4" />
        </button>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="flex-1">
                <Skeleton className="h-5 w-full max-w-[250px] mb-2" />
                <Skeleton className="h-4 w-full max-w-[350px]" />
              </div>
              <Skeleton className="h-6 w-10 rounded-full" />
              <Skeleton className="h-6 w-8" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {tasks && tasks.length > 0 ? tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{task.title}</div>
                      <div className="text-sm text-slate-500 truncate max-w-xs">{task.description}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <SizeBadge size={task.size as TShirtSizeType} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-slate-700">
                    {task.points}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-slate-500">
                    {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(task)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit Size</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                    No tasks have been estimated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Size Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task Size</DialogTitle>
            <DialogDescription>
              Change the T-shirt size for task <span className="font-medium">{editingTask?.title}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {tshirtSizes.map((size) => {
                const isSelected = selectedSize === size.value;
                return (
                  <div 
                    key={size.value}
                    onClick={() => handleSizeSelect(size.value as TShirtSizeType)}
                    className={cn(
                      "cursor-pointer rounded-lg border p-3 text-center transition-all duration-200 hover:-translate-y-1",
                      isSelected 
                        ? "border-2 border-primary-500 bg-primary-50" 
                        : "border-slate-200"
                    )}
                  >
                    <div 
                      className={cn(
                        "aspect-square flex items-center justify-center rounded-md mb-2 text-lg font-semibold",
                        isSelected 
                          ? "bg-primary-100 text-primary-700" 
                          : "bg-slate-50 text-slate-500"
                      )}
                    >
                      {size.value}
                    </div>
                    <div 
                      className={cn(
                        "text-xs font-medium",
                        isSelected ? "text-primary-700" : "text-slate-600"
                      )}
                    >
                      {size.points} {size.points === 1 ? "Point" : "Points"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateSize} 
              disabled={isUpdating || !selectedSize || (editingTask && selectedSize === editingTask.size as TShirtSizeType)}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SizeBadge({ size }: { size: TShirtSizeType }) {
  const getColor = (size: TShirtSizeType) => {
    switch(size) {
      case 'XS':
      case 'S':
        return "bg-slate-100 text-slate-800";
      case 'M':
        return "bg-slate-100 text-slate-800";
      case 'L': 
      case 'XL':
      case 'XXL':
        return "bg-primary-100 text-primary-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };
  
  return (
    <Badge className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColor(size)}`}>
      {size}
    </Badge>
  );
}
