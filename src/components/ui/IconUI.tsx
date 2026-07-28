import type { CSSProperties, ReactNode } from "react";

export type IconUIName =
  | "check"
  | "x"
  | "pencil"
  | "trash"
  | "plus"
  | "upload"
  | "download"
  | "calendar"
  | "comment"
  | "eye"
  | "image"
  | "video"
  | "document"
  | "chart"
  | "target"
  | "globe"
  | "clipboard"
  | "archive"
  | "wrench"
  | "mail"
  | "arrow-right"
  | "arrow-left"
  | "chevron-left"
  | "chevron-right"
  | "refresh"
  | "sparkle-off"
  | "user"
  | "users"
  | "funnel"
  | "trophy"
  | "clock"
  | "dot"
  | "search"
  | "navigation"
  | "phone"
  | "book-open"
  | "mouse-pointer"
  | "lightbulb"
  | "menu"
  | "send"
  | "copy"
  | "save"
  | "duplicate"
  | "link"
  | "external-link"
  | "chevron-up"
  | "chevron-down"
  | "location"
  | "key";

interface IconUIProps {
  name: IconUIName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

const paths: Record<IconUIName, ReactNode> = {
  check: <polyline points="20 6 9 17 4 12" />,
  x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  pencil: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4z" /></>,
  trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6m3 0V4h8v2M10 11v5m4-5v5" /></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  upload: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>,
  download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="16" y1="3" x2="16" y2="7" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  comment: <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z" />,
  eye: <><path d="M1.5 12s4-7 10.5-7 10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>,
  video: <><rect x="3" y="5" width="14" height="14" rx="2" /><polygon points="17 10 22 7 22 17 17 14 17 10" /></>,
  document: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></>,
  chart: <><line x1="4" y1="20" x2="4" y2="12" /><line x1="10" y1="20" x2="10" y2="4" /><line x1="16" y1="20" x2="16" y2="9" /><line x1="22" y1="20" x2="2" y2="20" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><line x1="3" y1="12" x2="21" y2="12" /><path d="M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></>,
  clipboard: <><path d="M9 5H6a2 2 0 00-2 2v13a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-3" /><rect x="9" y="2" width="6" height="6" rx="1" /></>,
  archive: <><path d="M21 8v12H3V8" /><path d="M1 4h22v4H1z" /><line x1="9" y1="12" x2="15" y2="12" /></>,
  wrench: <path d="M14.7 6.3a4 4 0 01-5 5L4 17l3 3 5.7-5.7a4 4 0 005-5l-2.4 2.4-3-3z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><polyline points="3 7 12 13 21 7" /></>,
  "arrow-right": <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" /></>,
  "arrow-left": <><line x1="19" y1="12" x2="5" y2="12" /><polyline points="11 6 5 12 11 18" /></>,
  "chevron-left": <polyline points="15 18 9 12 15 6" />,
  "chevron-right": <polyline points="9 18 15 12 9 6" />,
  refresh: <><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.5 9a9 9 0 0114.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0020.5 15" /></>,
  "sparkle-off": <><path d="M12 3l1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2z" /><line x1="5" y1="19" x2="19" y2="5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></>,
  users: <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8" /></>,
  funnel: <path d="M3 4h18l-7 8v6l-4 2v-8z" />,
  trophy: <><path d="M8 4h8v4a4 4 0 01-8 0z" /><path d="M8 6H4v2a4 4 0 004 4m8-6h4v2a4 4 0 01-4 4M12 12v5m-4 4h8m-6-4h4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" /></>,
  dot: <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />,
  search: <><circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16.2" y2="16.2" /></>,
  navigation: <polygon points="3 11 22 2 13 21 11 13 3 11" />,
  phone: <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 2 .7 2.9a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.5c.9.3 1.9.6 2.9.7a2 2 0 011.7 2z" />,
  "book-open": <><path d="M2 4h6a4 4 0 014 4v13a4 4 0 00-4-4H2z" /><path d="M22 4h-6a4 4 0 00-4 4v13a4 4 0 014-4h6z" /></>,
  "mouse-pointer": <><path d="M4 3l7 17 2.5-6.5L20 11z" /><line x1="14" y1="14" x2="19" y2="19" /></>,
  lightbulb: <><path d="M9 18h6M10 22h4" /><path d="M8.5 14.5A7 7 0 1115.5 14.5C14.5 15.3 14 16.2 14 18h-4c0-1.8-.5-2.7-1.5-3.5z" /></>,
  menu: <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>,
  send: <><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 9V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2h3" /></>,
  save: <><path d="M5 3h12l4 4v14H3V3z" /><path d="M7 3v6h10V3M7 21v-8h10v8" /></>,
  duplicate: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" /></>,
  link: <><path d="M10 13a5 5 0 007.1.1l2-2a5 5 0 00-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 00-7.1-.1l-2 2A5 5 0 0012 20l1.1-1.1" /></>,
  "external-link": <><path d="M14 4h6v6M20 4l-9 9" /><path d="M19 13v6a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1h6" /></>,
  "chevron-up": <polyline points="18 15 12 9 6 15" />,
  "chevron-down": <polyline points="6 9 12 15 18 9" />,
  location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1116 0z" /><circle cx="12" cy="10" r="2.5" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9m-3 3 3 3m-6 0 3 3" /></>,
};

export function IconUI({ name, size = 18, className, style }: IconUIProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function Dot({
  color = "currentColor",
  size = 7,
  className,
  style,
}: {
  color?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-full ${className ?? ""}`}
      style={{ width: size, height: size, backgroundColor: color, ...style }}
    />
  );
}
