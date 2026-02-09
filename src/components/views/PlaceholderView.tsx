import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';

interface PlaceholderViewProps {
  title: string;
  description: string;
}

export const PlaceholderView = ({ title, description }: PlaceholderViewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-[60vh] flex-col items-center justify-center text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card mb-4">
        <Construction className="h-7 w-7 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 rounded-lg border border-dashed border-border px-6 py-3">
        <p className="text-xs font-mono text-muted-foreground">Module under development</p>
      </div>
    </motion.div>
  );
};
