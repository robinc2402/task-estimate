import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, Loader2, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CsvImportFormProps {
  sessionId: string;
  onTasksImported: () => void;
}

export default function CsvImportForm({ sessionId, onTasksImported }: CsvImportFormProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setUploadError(null);
    
    if (selectedFile) {
      // Preview the file content
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        // Show first few lines of the CSV
        const lines = content.split('\n').slice(0, 5).join('\n');
        setPreviewData(lines);
      };
      reader.readAsText(selectedFile);
    } else {
      setPreviewData(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadError("Please select a CSV file first");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Read the file content
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
      });

      // Send the file content to the API
      const response = await apiRequest(
        "POST", 
        `/api/sessions/${sessionId}/import`, 
        { csvData: fileContent }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to import tasks");
      }

      // Reset form
      setFile(null);
      setPreviewData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Notify parent
      onTasksImported();
      
      toast({
        title: "Import successful",
        description: "Your tasks have been imported and are ready for estimation",
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "An unknown error occurred");
      
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import tasks",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="cursor-pointer"
            disabled={isUploading}
          />
          <p className="text-sm text-slate-500 mt-1">
            The CSV file should have "title" and "description" columns
          </p>
        </div>
        <Button 
          onClick={handleUpload} 
          disabled={!file || isUploading}
          className="whitespace-nowrap"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <UploadCloud className="mr-2 h-4 w-4" />
              Import Tasks
            </>
          )}
        </Button>
      </div>

      {/* Error message */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}

      {/* File preview */}
      {file && previewData && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-5 w-5 text-primary-500" />
              <h3 className="font-medium">File Preview: {file.name}</h3>
            </div>
            <pre className="bg-slate-100 p-3 rounded-md text-xs font-mono overflow-x-auto">
              {previewData}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Example format */}
      <div className="bg-primary-50 border border-primary-100 rounded-md p-4">
        <div className="flex items-center space-x-2 mb-2">
          <CheckCircle2 className="h-5 w-5 text-primary-500" />
          <h3 className="font-medium text-primary-700">Example CSV Format</h3>
        </div>
        <pre className="bg-white p-3 rounded-md text-xs font-mono overflow-x-auto">
{`title,description
"Implement login feature","Create login form with authentication"
"Add pagination","Add pagination to the user list view"
"Fix mobile layout","Fix responsive layout issues on mobile devices"`}
        </pre>
      </div>
    </div>
  );
}