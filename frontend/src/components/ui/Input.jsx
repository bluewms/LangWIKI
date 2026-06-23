import React from 'react';

/**
 * 输入框 / 文本域
 * 透传所有原生 input/textarea 属性
 */
export default function Input({ as = 'input', className = '', ...rest }) {
  const Tag = as;
  return <Tag className={`input ${className}`} {...rest} />;
}
