export default function extractPathAndQueryFromUrl(url?: string): {
    path: string;
    query?: Record<string, string>;
};
