import React, { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  minLines?: number;
  maxLines?: number;
  onValueChange?: (val: string) => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  hint,
  minLines = 1,
  maxLines = 1,
  onValueChange,
  onChange,
  value,
  defaultValue,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = String(value ?? defaultValue ?? '').length > 0;

  const isMultiline = minLines > 1 || maxLines > 1;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (onChange) onChange(e);
    if (onValueChange) onValueChange(e.target.value);
  };

  const containerStyles = `w-full rounded-hf-md bg-hf-card border-[1.5px] transition-all duration-150 py-[11px] px-[14px] flex items-center ${
    isFocused || hasValue ? 'border-hf-accent' : 'border-hf-border'
  }`;

  const inputStyles = `w-full bg-transparent text-hf-text-primary text-hf-body-md outline-none placeholder:text-hf-text-tertiary resize-none`;

  return (
    <div className={`flex flex-col w-full gap-1.5 ${className}`}>
      {label && <span className="text-hf-label-md text-hf-text-secondary leading-none">{label}</span>}
      <div className={containerStyles}>
        {isMultiline ? (
          <textarea
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={handleChange}
            placeholder={hint}
            rows={minLines}
            value={value}
            defaultValue={defaultValue}
            className={inputStyles}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={handleChange}
            placeholder={hint}
            value={value}
            defaultValue={defaultValue}
            className={inputStyles}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
      </div>
    </div>
  );
};
