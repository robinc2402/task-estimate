import AppHeader from "@/components/app-header";
import AppFooter from "@/components/app-footer";
import TaskForm from "@/components/task-form";
import PredictionResult from "@/components/prediction-result";
import RecentTasks from "@/components/recent-tasks";
import EstimationStats from "@/components/estimation-stats";
import TipSection from "@/components/tip-section";
import TeamMembers from "@/components/team-members";
import { useState } from "react";
import { TShirtSizeType } from "@shared/schema";

export default function Home() {
  const [prediction, setPrediction] = useState<{
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
  } | null>(null);
  
  const [isPredicting, setIsPredicting] = useState(false);
  const [selectedSize, setSelectedSize] = useState<TShirtSizeType | null>(null);
  
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <AppHeader />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (Task Form and Prediction) */}
          <div className="lg:col-span-8 space-y-6">
            <TaskForm 
              onPredict={(prediction) => {
                setPrediction(prediction);
                setSelectedSize(prediction.size as TShirtSizeType);
              }}
              isPredicting={isPredicting}
              setIsPredicting={setIsPredicting}
            />
            
            <PredictionResult 
              prediction={prediction}
              isLoading={isPredicting}
              selectedSize={selectedSize}
              onSizeSelect={setSelectedSize}
            />
            
            <RecentTasks />
          </div>
          
          {/* Right Column (Dashboard) */}
          <div className="lg:col-span-4 space-y-6">
            <EstimationStats />
            <TipSection />
            <TeamMembers />
          </div>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
}
