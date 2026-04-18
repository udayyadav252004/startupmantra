import { motion } from 'framer-motion';

import Card from './Card';
import SectionHeader from './SectionHeader';
import { cx } from './ui';

const sectionMotion = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
};

export default function SectionWrapper({
  action = null,
  children,
  className = '',
  contentClassName = '',
  icon = 'SM',
  padding = 'lg',
  subtitle = '',
  title,
  tone = 'default',
}) {
  return (
    <motion.section variants={sectionMotion}>
      <Card
        className={cx('rounded-[20px] border-white/10', className)}
        padding={padding}
        tone={tone}
      >
        <SectionHeader action={action} icon={icon} subtitle={subtitle} title={title} />
        <div className={cx('mt-6 space-y-4', contentClassName)}>{children}</div>
      </Card>
    </motion.section>
  );
}
