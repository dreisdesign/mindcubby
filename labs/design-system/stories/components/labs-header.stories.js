import '../../components/labs-header.js';


export default {
  title: '2. Components/Template/Header',
  component: 'labs-header',
  argTypes: {
    title: { control: 'text' },
    date: { control: 'text' },
    subtitle: { control: 'text' },
    center: { control: 'boolean' },
    showSubtitle: { control: 'boolean', name: 'Show Subtitle' },
  },
};

const Template = ({ title, date, subtitle, center, showSubtitle }) => `
  <labs-header
    title="${title}"
    date="${date}"
    subtitle="${subtitle}"${center ? ' center' : ''}${showSubtitle ? ' show-subtitle' : ''}
  ></labs-header>
`;

export const Default = Template.bind({});
Default.args = {
  title: 'Today',
  date: 'October 2, 2025',
  subtitle: 'Your daily summary',
  center: true,
  showSubtitle: true,
};

export const SlotDriven = () => `
  <labs-header center show-subtitle>
    <span slot="title">Custom Title via Slot</span>
    <span slot="subtitle">Slot Subtitle</span>
    <span slot="date">2025-10-02</span>
  </labs-header>
`;