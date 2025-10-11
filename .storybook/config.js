
// Storybook Configuration for CollisionOS Components
import { configure } from '@storybook/react';
import { addons } from '@storybook/addons';
import { create } from '@storybook/theming';

// Configure theme
const theme = create({
  base: 'light',
  brandTitle: 'CollisionOS Component Library',
  brandUrl: 'https://collisionos.com',
  brandImage: '/logo.png',
  colorPrimary: '#1976d2',
  colorSecondary: '#dc004e',
  fontBase: '"Roboto", "Helvetica", "Arial", sans-serif',
  fontCode: 'monospace',
});

addons.setConfig({
  theme,
});

// Configure stories
configure(require.context('../src/components', true, /.stories.js$/), module);

// Example component story
import React from 'react';
import { action } from '@storybook/addon-actions';
import { StatusChip } from '../shared';

export default {
  title: 'Shared/StatusChip',
  component: StatusChip,
  argTypes: {
    status: {
      control: { type: 'select' },
      options: ['estimate', 'in_progress', 'completed', 'delivered']
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large']
    }
  }
};

const Template = (args) => <StatusChip {...args} />;

export const Default = Template.bind({});
Default.args = {
  status: 'in_progress',
  size: 'small'
};

export const Completed = Template.bind({});
Completed.args = {
  status: 'completed',
  size: 'medium'
};

export const Urgent = Template.bind({});
Urgent.args = {
  status: 'urgent',
  size: 'large'
};
