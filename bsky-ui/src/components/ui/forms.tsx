import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'icon'
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'tertiary' | 'danger'
}
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  color = 'primary',
  className = '',
  children,
  ...props
}) => {
  const baseClasses =
    'font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

  const getColorClasses = (variant: string, color: string) => {
    if (variant === 'icon') {
      // Add hover:text-blue-600 for icon variant
      return 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-inherit hover:text-blue-600 dark:hover:text-blue-400 focus:ring-blue-500 p-1'
    }
    if (variant === 'primary') {
      return {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
        secondary:
          'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
        tertiary:
          'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
        danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
      }[color]
    } else if (variant === 'secondary') {
      return {
        primary:
          'bg-blue-100 hover:bg-blue-200 text-blue-900 focus:ring-blue-500',
        secondary:
          'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
        tertiary:
          'bg-green-100 hover:bg-green-200 text-green-900 focus:ring-green-500',
        danger: 'bg-red-100 hover:bg-red-200 text-red-900 focus:ring-red-500',
      }[color]
    } else {
      // outline
      return {
        primary:
          'border border-blue-300 hover:bg-blue-50 text-blue-700 focus:ring-blue-500',
        secondary:
          'border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-gray-500',
        tertiary:
          'border border-green-300 hover:bg-green-50 text-green-700 focus:ring-green-500',
        danger:
          'border border-red-300 hover:bg-red-50 text-red-700 focus:ring-red-500',
      }[color]
    }
  }

  const sizeClasses = {
    xxs: 'px-0 py-0 text-[6pt]',
    xs: 'px-0 py-0',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  // For icon variant, override padding and font size
  const iconClasses =
    variant === 'icon'
      ? 'p-1 rounded-full text-base leading-none flex items-center justify-center'
      : sizeClasses[size]

  return (
    <button
      className={`${baseClasses} ${getColorClasses(
        variant,
        color
      )} ${iconClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface LinkButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'icon'
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'tertiary' | 'danger'
  href: string
  target?: string
}

export const LinkButton: React.FC<LinkButtonProps> = ({
  variant = 'primary',
  size = 'md',
  color = 'primary',
  className = '',
  children,
  href,
  target,
  ...props
}) => {
  const baseClasses =
    'font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors'

  const getColorClasses = (variant: string, color: string) => {
    if (variant === 'icon') {
      // Add hover:text-blue-600 for icon variant
      return 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-inherit hover:text-blue-600 dark:hover:text-blue-400 focus:ring-blue-500 p-1'
    }
    if (variant === 'primary') {
      return {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
        secondary:
          'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
        tertiary:
          'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
        danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
      }[color]
    } else if (variant === 'secondary') {
      return {
        primary:
          'bg-blue-100 hover:bg-blue-200 text-blue-900 focus:ring-blue-500',
        secondary:
          'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
        tertiary:
          'bg-green-100 hover:bg-green-200 text-green-900 focus:ring-green-500',
        danger: 'bg-red-100 hover:bg-red-200 text-red-900 focus:ring-red-500',
      }[color]
    } else {
      // outline
      return {
        primary:
          'border border-blue-300 hover:bg-blue-50 text-blue-700 focus:ring-blue-500',
        secondary:
          'border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-gray-500',
        tertiary:
          'border border-green-300 hover:bg-green-50 text-green-700 focus:ring-green-500',
        danger:
          'border border-red-300 hover:bg-red-50 text-red-700 focus:ring-red-500',
      }[color]
    }
  }

  const sizeClasses = {
    xxs: 'px-0 py-0 text-[6pt]',
    xs: 'px-0 py-0',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  // For icon variant, override padding and font size
  const iconClasses =
    variant === 'icon'
      ? 'p-1 rounded-full text-base leading-none flex items-center justify-center'
      : sizeClasses[size]

  return (
    <a
      href={href}
      target={target}
      className={`${baseClasses} ${getColorClasses(
        variant,
        color
      )} ${iconClasses} inline-flex items-center justify-center no-underline ${className}`}
      {...props}
    >
      {children}
    </a>
  )
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea: React.FC<TextareaProps> = ({
  className = '',
  ...props
}) => {
  return (
    <textarea
      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-vertical ${className}`}
      {...props}
    />
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
  return (
    <input
      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`}
      {...props}
    />
  )
}

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label: React.FC<LabelProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <label
      className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
      {...props}
    >
      {children}
    </label>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

interface SelectOptionProps
  extends React.OptionHTMLAttributes<HTMLOptionElement> {}

const SelectOption: React.FC<SelectOptionProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <option className={className} {...props}>
      {children}
    </option>
  )
}

export const Select: React.FC<SelectProps> & {
  Option: React.FC<SelectOptionProps>
} = ({ className = '', ...props }) => {
  return (
    <select
      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`}
      {...props}
    />
  )
}

Select.Option = SelectOption

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Checkbox: React.FC<CheckboxProps> = ({
  className = '',
  ...props
}) => {
  return (
    <input
      type="checkbox"
      className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${className}`}
      {...props}
    />
  )
}
