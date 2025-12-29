import { format } from 'date-fns';

interface MainContentHeaderProps {
  userName: string;
  subtitle?: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function MainContentHeader({ userName, subtitle }: MainContentHeaderProps) {
  const today = new Date();
  const formattedDate = format(today, 'dd MMM, yyyy');

  return (
    <header className="mb-8">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {getGreeting()}, {userName}!
          </h1>
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
          <span className="text-lg">📅</span>
          <span className="text-sm font-semibold text-gray-900">{formattedDate}</span>
        </div>
      </div>
    </header>
  );
}
