
const ProgressBar = ({ value, max = 100, color = '#8b5cf6', label, showValue = true }) => {
  const percentage = (value / max) * 100;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">{label}</span>
          {showValue && <span className="text-sm font-semibold text-white">{value}%</span>}
        </div>
      )}
      <div className="w-full h-2 bg-dark-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
