import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { taskPredictionSchema, type TaskPrediction } from "@shared/schema";
import { z } from "zod";

interface TaskFormProps {
  onPredict: (prediction: any) => void;
  isPredicting: boolean;
  setIsPredicting: (isPredicting: boolean) => void;
}

export default function TaskForm({ onPredict, isPredicting, setIsPredicting }: TaskFormProps) {
  const { toast } = useToast();
  const [wordCount, setWordCount] = useState(0);
  
  const form = useForm<TaskPrediction>({
    resolver: zodResolver(
      taskPredictionSchema.extend({
        title: z.string().min(3, "Title must be at least 3 characters"),
        description: z.string().min(10, "Description must be at least 10 characters"),
      })
    ),
    defaultValues: {
      title: "",
      description: "",
    },
  });
  
  const updateWordCount = (text: string) => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
  };
  
  const onSubmit = async (data: TaskPrediction) => {
    setIsPredicting(true);
    
    try {
      const response = await apiRequest("POST", "/api/tasks/predict", data);
      const prediction = await response.json();
      onPredict(prediction);
    } catch (error) {
      toast({
        title: "Prediction failed",
        description: "There was an error predicting the task size. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPredicting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 fade-in animate-in fade-in duration-300">
      <h2 className="text-xl font-semibold mb-4 text-slate-900">New Task Estimation</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm font-medium text-slate-700">Task Title</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter task title"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm font-medium text-slate-700">Task Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the task in detail..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={4}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      updateWordCount(e.target.value);
                    }}
                  />
                </FormControl>
                <p className="text-xs text-slate-500 mt-1">
                  Be specific to improve prediction accuracy. Include technical details, complexity factors, and dependencies.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-2 space-y-3 sm:space-y-0">
            <div className="text-sm text-slate-600">
              <span>Words: </span>
              <span className="font-medium">{wordCount}</span>
              <span className="text-slate-400 ml-1">(more details improve accuracy)</span>
            </div>
            
            <Button 
              type="submit"
              className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={isPredicting}
            >
              {isPredicting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Predict Size
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
