export default function AppFooter() {
  return (
    <footer className="bg-white border-t border-slate-200 py-4">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center">
        <div className="text-sm text-slate-500 mb-2 sm:mb-0">
          © {new Date().getFullYear()} Task Estimator - Helping teams estimate better
        </div>
        <div className="flex space-x-4 text-sm text-slate-500">
          <a href="#" className="hover:text-primary-600 transition-colors">Feedback</a>
          <a href="#" className="hover:text-primary-600 transition-colors">Help</a>
          <a href="#" className="hover:text-primary-600 transition-colors">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
