interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      
      <p className="text-slate-500 font-medium animate-pulse">
        {message ? ` ${message}` : 'Carregando...'}
      </p>
    </div>
  );
}