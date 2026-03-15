export function CopyIcon({ size = 12 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="5" width="9" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2H3.5A1.5 1.5 0 0 0 2 3.5v7A1.5 1.5 0 0 0 3.5 12H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
    );
}