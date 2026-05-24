import GlassCard from '../UI/GlassCard';

const ChartCard = ({ title, icon: Icon, subtitle, children, className = '' }) => {
  return (
    <GlassCard className={`flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-accent-purple" />}
          <h3 className="text-base font-semibold text-white">{title}</h3>
        </div>
        {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
      </div>
      <div className="flex-1 w-full h-full min-h-[200px]">
        {children}
      </div>
    </GlassCard>
  );
};

export default ChartCard;
