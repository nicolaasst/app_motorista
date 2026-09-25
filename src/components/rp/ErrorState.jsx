import { Icon } from "./Icon";

export function ErrorState({ title = "Algo deu errado", description, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <Icon name="report_problem" size={48} className="text-destructive" />
      <p className="text-headline-sm">{title}</p>
      {description && <p className="text-body-md text-muted-foreground">{description}</p>}
      {onRetry && (
        <button onClick={onRetry} className="rp-tap mt-2 inline-flex items-center gap-1 rounded-full border-2 border-primary-container px-4 py-2 text-label-md text-primary-deep">
          <Icon name="refresh" size={18} /> Tentar novamente
        </button>
      )}
    </div>
  );
}

export default ErrorState;