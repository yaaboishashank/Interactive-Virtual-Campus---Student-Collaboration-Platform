import { useId } from "react";
import styles from "../landing.module.css";

function StudyDesk({ x, y, width = 105 }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect y="5" width={width} height="48" rx="7" fill="#9b765c" />
            <rect width={width} height="43" rx="7" fill="#e8cda6" />
            {[14, width - 39].map((left) => (
                <g key={left} transform={`translate(${left} 12)`}>
                    <rect width="25" height="17" rx="3" fill="#4a6577" />
                    <rect x="3" y="2" width="19" height="11" rx="1" fill="#9dd3d3" />
                </g>
            ))}
        </g>
    );
}

function Plant({ x, y, scale = 1 }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${scale})`}>
            <ellipse cy="14" rx="23" ry="10" fill="#163c42" opacity="0.12" />
            <rect x="-9" width="18" height="24" rx="4" fill="#bd9071" />
            <ellipse cx="-11" cy="-12" rx="14" ry="21" fill="#417d65" />
            <ellipse cx="9" cy="-20" rx="16" ry="24" fill="#68a887" />
        </g>
    );
}

function Student({ x, y, name, shirt }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <ellipse cy="27" rx="15" ry="6" fill="#112739" opacity="0.18" />
            <rect x="-9" y="-5" width="18" height="26" rx="6" fill={shirt} />
            <rect x="-8" y="16" width="6" height="12" rx="2" fill="#34415b" />
            <rect x="2" y="16" width="6" height="12" rx="2" fill="#34415b" />
            <ellipse cy="-14" rx="10" ry="11" fill="#eac2a0" />
            <rect x="-10" y="-25" width="20" height="8" rx="4" fill="#3c3444" />
            <rect x="-34" y="-53" width="68" height="25" rx="6" fill="#23334e" />
            <text y="-36" textAnchor="middle" fill="#ffffff" fontSize="17">{name}</text>
        </g>
    );
}

export default function CoastalPreview() {
    const oceanId = useId();

    return (
        <svg
            className={styles.coastalMap}
            viewBox="0 0 800 640"
            role="img"
            aria-label="Coastal Clubhouse sample: a seaside study house, wooden deck, lounge seating and two student avatars."
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id={oceanId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#bde9e4" />
                    <stop offset="100%" stopColor="#4198ac" />
                </linearGradient>
            </defs>
            <rect width="800" height="640" fill={`url(#${oceanId})`} />
            <g stroke="#e3fffa" strokeWidth="3" opacity="0.28" strokeLinecap="round">
                {Array.from({ length: 14 }, (_, row) =>
                    Array.from({ length: 8 }, (_, column) => (
                        <path
                            key={`${row}-${column}`}
                            d={`M ${12 + column * 100} ${30 + row * 45} h 45`}
                        />
                    ))
                )}
            </g>
            <path d="M235 100 702 140 747 570 145 578 192 360Z" fill="#f3e0b7" />
            <path d="M230 140 672 164 698 532 196 532Z" fill="#d4b187" />
            <g stroke="#bc9873" opacity="0.38">
                {Array.from({ length: 17 }, (_, index) => (
                    <path key={index} d={`M230 ${170 + index * 22} H672`} />
                ))}
            </g>
            <rect x="353" y="188" width="285" height="183" rx="12" fill="#142638" opacity="0.12" />
            <rect x="345" y="170" width="285" height="183" rx="10" fill="#82b6b7" />
            <rect x="357" y="182" width="261" height="159" rx="5" fill="#f4e9d6" />
            <rect x="345" y="170" width="285" height="13" rx="4" fill="#fbf4e8" />
            <StudyDesk x={380} y={209} />
            <StudyDesk x={507} y={209} width={92} />
            <rect x="375" y="296" width="215" height="27" rx="8" fill="#77a5a0" />
            <rect x="192" y="354" width="220" height="85" rx="12" fill="#f3deba" />
            <rect x="208" y="365" width="65" height="46" rx="8" fill="#f8f1dc" />
            <rect x="294" y="365" width="99" height="46" rx="8" fill="#e5aa91" />
            <ellipse cx="489" cy="426" rx="54" ry="30" fill="#b08360" />
            <ellipse cx="489" cy="419" rx="54" ry="30" fill="#e7c69b" />
            <Plant x={654} y={445} scale={1.4} />
            <Plant x={284} y={208} scale={1.3} />
            <rect x="40" y="446" width="220" height="54" rx="3" fill="#c1a27d" />
            <g stroke="#f4dabb" strokeWidth="2">
                {Array.from({ length: 14 }, (_, index) => (
                    <path key={index} d={`M${46 + index * 15} 446 V500`} />
                ))}
            </g>
            <Student x={348} y={469} shirt="#7b8acc" name="You" />
            <Student x={558} y={358} shirt="#d89b89" name="Aanya" />
        </svg>
    );
}
