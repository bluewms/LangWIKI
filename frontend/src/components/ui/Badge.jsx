import React from 'react';

/**
 * 徽章 / 标签
 * @param {'neutral'|'brand'|'success'|'warning'|'danger'} variant
 */
export default function Badge({ variant = 'neutral', className = '', children }) {
  const variantClass = {
    neutral: 'badge-neutral',
    brand: 'badge-brand',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger'
  }[variant];

  return <span className={`badge ${variantClass} ${className}`}>{children}</span>;
}
