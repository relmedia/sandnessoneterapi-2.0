"use client";

import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const defaultFieldClassName =
  "w-full rounded-xl border border-warm-light bg-cream px-4 pb-2.5 pt-6 font-sans text-base font-normal text-stone transition-colors focus:border-sage focus:outline-none";

function useFloatingLabel(
  value: string | number | readonly string[] | undefined,
  defaultValue: string | number | readonly string[] | undefined,
) {
  const [focused, setFocused] = useState(false);

  const hasValue =
    value !== undefined && value !== "" ? true : defaultValue !== undefined && defaultValue !== "";

  return {
    focused,
    setFocused,
    floated: focused || hasValue,
  };
}

function FloatingLabel({
  id,
  label,
  floated,
  alignTop = false,
  children,
}: {
  readonly id: string;
  readonly label: string;
  readonly floated: boolean;
  readonly alignTop?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-4 origin-left transition-all duration-200 ease-out ${
          floated
            ? "top-2.5 translate-y-0 text-xs font-normal text-sage"
            : alignTop
              ? "top-4 translate-y-0 text-sm font-normal text-stone/70"
              : "top-1/2 -translate-y-1/2 text-sm font-normal text-stone/70"
        }`}
      >
        {label}
      </label>
    </div>
  );
}

type FloatingLabelFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  fieldClassName?: string;
};

export function FloatingLabelField({
  label,
  value,
  defaultValue,
  className,
  fieldClassName = defaultFieldClassName,
  id: idProp,
  onFocus,
  onBlur,
  ...props
}: FloatingLabelFieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const { setFocused, floated } = useFloatingLabel(value, defaultValue);

  return (
    <div className={className}>
      <FloatingLabel id={id} label={label} floated={floated}>
        <input
          id={id}
          value={value}
          defaultValue={defaultValue}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          className={fieldClassName}
          {...props}
        />
      </FloatingLabel>
    </div>
  );
}

type FloatingLabelSelectOption = {
  readonly value: string;
  readonly label: string;
};

type FloatingLabelSelectProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly FloatingLabelSelectOption[];
  className?: string;
  fieldClassName?: string;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
};

export function FloatingLabelSelect({
  label,
  value,
  onValueChange,
  options,
  className,
  fieldClassName = defaultFieldClassName,
  id: idProp,
  name,
  required,
  disabled,
}: FloatingLabelSelectProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [open, setOpen] = useState(false);
  const floated = open || value !== "";

  return (
    <div className={className}>
      <FloatingLabel id={id} label={label} floated={floated}>
        <Select
          value={value}
          onValueChange={(nextValue) => {
            if (nextValue !== null) {
              onValueChange(nextValue);
            }
          }}
          open={open}
          onOpenChange={setOpen}
          items={options}
          id={id}
          name={name}
          required={required}
          disabled={disabled}
        >
          <SelectTrigger
            className={`${fieldClassName} h-auto min-h-[3.75rem] w-full justify-between rounded-xl pr-4 data-[size=default]:h-auto focus-visible:border-sage focus-visible:ring-2 focus-visible:ring-sage/15 [&_svg]:text-stone/70`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            alignItemWithTrigger={false}
            className="border-stone/10 bg-white text-stone shadow-md ring-stone/10"
          >
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="py-1 pl-4 pr-8 font-sans text-base font-normal focus:bg-sage-light/60 focus:text-stone"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FloatingLabel>
    </div>
  );
}

type FloatingLabelTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  fieldClassName?: string;
};

export function FloatingLabelTextarea({
  label,
  value,
  defaultValue,
  className,
  fieldClassName = defaultFieldClassName,
  id: idProp,
  onFocus,
  onBlur,
  ...props
}: FloatingLabelTextareaProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const { setFocused, floated } = useFloatingLabel(value, defaultValue);

  return (
    <div className={className}>
      <FloatingLabel id={id} label={label} floated={floated} alignTop>
        <textarea
          id={id}
          value={value}
          defaultValue={defaultValue}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          className={`${fieldClassName} resize-y`}
          {...props}
        />
      </FloatingLabel>
    </div>
  );
}
