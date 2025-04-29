import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Check, PenLine } from "lucide-react";
import { useState } from "react";
import { TShirtSizeType, pointsMapping } from "@shared/schema";
import { tshirtSizes } from "@/lib/tshirt-sizes";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface PredictionResultProps {
  prediction: {
    title: string;
    description: string;
    size: TShirtSizeType;
    points: number;
    confidence: number;
    similarTasks: Array<{
      id: number;
      title: string;
      size: string;
      points: number;
    }>;
  } | null;
  isLoading: boolean;
  selectedSize: TShirtSizeType | null;
  onSizeSelect: (size: TShirtSizeType) => void;
}

export default function PredictionResult({ 
  prediction, 
  isLoading, 
  selectedSize,
  onSizeSelect
}: PredictionResultProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    if (!prediction || !selectedSize) return;
    
    setIsSaving(true);
    
    try {
      await apiRequest("POST", "/api/tasks", {
        ...prediction,
        size: selectedSize,
        points: pointsMapping[selectedSize],
      });
      
      // Invalidate recent tasks query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      toast({
        title: "Task saved",
        description: "The task estimation has been saved successfully.",
        variant: "default",
      });
      
      // Could reset form here if needed
    } catch (error) {
      toast({
        title: "Save failed",
        description: "There was an error saving the task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-start mb-5">
        <h2 className="text-xl font-semibold text-slate-900">Prediction Result</h2>
        <Badge className="bg-primary-100 text-primary-800 hover:bg-primary-100">AI Powered</Badge>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-10 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="text-slate-600 text-sm">Analyzing task complexity...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !prediction && (
        <div className="py-10 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <svg 
              className="h-8 w-8 text-slate-400"
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-700 mb-1">No Prediction Yet</h3>
          <p className="text-slate-500 max-w-md">Enter your task details and click "Predict Size" to get an AI-powered estimation.</p>
        </div>
      )}

      {/* Results State */}
      {!isLoading && prediction && (
        <div className="space-y-5">
          {/* Confidence Indicator */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700">Prediction Confidence</p>
            <div className="flex items-center space-x-2">
              <div className="bg-slate-100 rounded-full h-2 w-32">
                <div 
                  className="bg-primary-500 rounded-full h-2" 
                  style={{ width: `${prediction.confidence}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-primary-600">{prediction.confidence}%</span>
            </div>
          </div>
          
          {/* T-shirt Size Options */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {tshirtSizes.map((size) => {
              const isSelected = selectedSize === size.value;
              return (
                <div 
                  key={size.value}
                  onClick={() => onSizeSelect(size.value as TShirtSizeType)}
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

          {/* Prediction Explanation */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Prediction Explanation</h4>
            <p className="text-sm text-slate-600">
              This task appears to be a <span className="font-medium">{prediction.size} ({prediction.points} points)</span> task based on complexity, scope, and similarity to previous tasks.
            </p>
            {prediction.similarTasks && prediction.similarTasks.length > 0 && (
              <div className="mt-3 text-sm">
                <span className="font-medium text-slate-700">Similar historical tasks:</span>
                <ul className="mt-1 list-disc list-inside text-slate-600">
                  {prediction.similarTasks.map((task) => (
                    <li key={task.id}>
                      {task.title} ({task.size} - {task.points} points)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Accept & Save
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-slate-300 text-slate-700"
            >
              <PenLine className="mr-2 h-4 w-4" />
              Adjust Estimation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
