import React from 'react';
import { Button, type ButtonProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { brandButtonStyle } from './ModulePageLayout';

export interface BrandCreateButtonProps extends Omit<ButtonProps, 'type'> {
  label?: React.ReactNode;
}

export const BrandCreateButton: React.FC<BrandCreateButtonProps> = ({
  children,
  label,
  icon = <PlusOutlined />,
  style,
  ...props
}) => {
  return (
    <Button
      type="primary"
      icon={icon}
      style={{
        ...brandButtonStyle,
        ...style,
      }}
      className="vitelab-btn-nuevo"
      {...props}
    >
      {label || children}
    </Button>
  );
};

export default BrandCreateButton;
