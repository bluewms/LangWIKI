import React from 'react';

/**
 * 统一按钮组件
 * @param {object} props
 * @param {'primary'|'secondary'|'outline'|'ghost'|'danger'} variant
 * @param {'sm'|'md'|'icon'} size
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'btn-danger'
  }[variant];

  const sizeClass = {
    sm: 'btn-sm',
    md: 'btn-md',
    icon: 'btn-icon'
  }[size];

  return (
    <button className={`btn ${variantClass} ${sizeClass} ${className}`} {...rest}>
      {children}
    </button>
  );
}
