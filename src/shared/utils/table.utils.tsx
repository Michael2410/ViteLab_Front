import React from 'react';
import { FilterFilled } from '@ant-design/icons';

export const renderTableFilterIcon = (
  filtered: boolean,
  customIcon?: React.ReactNode
): React.ReactNode => {
  const style: React.CSSProperties = {
    color: filtered ? '#0284c7' : '#94a3b8',
    fontSize: '15px',
  };

  if (!customIcon) {
    return <FilterFilled style={style} />;
  }

  if (React.isValidElement<{ style?: React.CSSProperties }>(customIcon)) {
    return React.cloneElement(customIcon, {
      style: {
        ...style,
        ...(customIcon.props?.style || {}),
      },
    });
  }

  return <span style={style}>{customIcon}</span>;
};
