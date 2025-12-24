'use client';

interface ExportControlsProps {
    onExportCSV: () => void;
    onExportPDF?: () => void;
}

export function ExportControls({ onExportCSV, onExportPDF }: ExportControlsProps) {
    return (
        <div className="flex space-x-2">
            <button
                onClick={onExportCSV}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
                <svg
                    className="-ml-0.5 mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                </svg>
                Export CSV
            </button>
            {onExportPDF && (
                <button
                    onClick={onExportPDF}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                    Export PDF
                </button>
            )}
        </div>
    );
}
