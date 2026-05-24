import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import GlassCard from '../UI/GlassCard';

const StatCard = ({ title, value, icon: Icon, trend, isPositiveGood = true }) => {
  const isTrendPositive = trend && trend.startsWith('+');
  const isGood = isPositiveGood ? isTrendPositive : !isTrendPositive;

  return (
    <GlassCard hover className="group transition-transform duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center group-hover:bg-accent-purple/20 transition-colors">
          <Icon className="w-5 h-5 text-accent-purple" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-dark-800 ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
            {isTrendPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white group-hover:text-accent-purple transition-colors duration-300">{value}</p>
      <p className="text-xs text-gray-500 mt-1 font-medium">{title}</p>
    </GlassCard>
  );
};

export default StatCard;
