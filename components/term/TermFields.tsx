import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const baseField =
  "w-full border border-[var(--term-border)] bg-black/40 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-[var(--term-border-focus)] disabled:cursor-not-allowed disabled:opacity-60";

function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label
        htmlFor={htmlFor}
        className="text-[11px] uppercase tracking-[0.18em] text-[var(--term-text-comment)]"
      >
        // {children}
      </label>
      {hint ? (
        <span className="text-[11px] text-[var(--term-text-muted)]">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function TermInput({
  label,
  hint,
  id,
  className = "",
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div>
      {label ? (
        <FieldLabel htmlFor={id} hint={hint}>
          {label}
        </FieldLabel>
      ) : null}
      <input id={id} className={`${baseField} ${className}`} {...rest} />
    </div>
  );
}

export function TermTextarea({
  label,
  hint,
  id,
  rows = 4,
  className = "",
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div>
      {label ? (
        <FieldLabel htmlFor={id} hint={hint}>
          {label}
        </FieldLabel>
      ) : null}
      <textarea
        id={id}
        rows={rows}
        className={`${baseField} resize-y ${className}`}
        {...rest}
      />
    </div>
  );
}

export function TermSelect({
  label,
  hint,
  id,
  children,
  className = "",
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div>
      {label ? (
        <FieldLabel htmlFor={id} hint={hint}>
          {label}
        </FieldLabel>
      ) : null}
      <select id={id} className={`${baseField} ${className}`} {...rest}>
        {children}
      </select>
    </div>
  );
}
