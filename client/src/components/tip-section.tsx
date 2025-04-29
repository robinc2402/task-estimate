import { Lightbulb, ExternalLink } from "lucide-react";

export default function TipSection() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 animate-in fade-in duration-300">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-primary-600" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Estimation Tips</h3>
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-medium text-slate-700">Be specific in descriptions</span> - Include technical requirements and dependencies to improve prediction accuracy.
            </p>
            <p>
              <span className="font-medium text-slate-700">Compare with similar tasks</span> - Look at comparable historical items for more accurate estimates.
            </p>
            <p>
              <span className="font-medium text-slate-700">Break down large tasks</span> - Consider splitting XXL tasks into smaller, more manageable pieces.
            </p>
          </div>
          <button className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
            <span>More estimation resources</span>
            <ExternalLink className="ml-1 h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
