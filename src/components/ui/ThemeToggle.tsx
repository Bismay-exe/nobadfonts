import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useTheme } from '../../contexts/ThemeContext';

const Switch = () => {

    const { toggleTheme } = useTheme();

    return (
        <>
            <label htmlFor="themeToggle" className="relative block w-4.5 cursor-pointer text-foreground hover:text-foreground duration-300 ease-in-out">
                <input
                    type="checkbox"
                    id="themeToggle"
                    onClick={async () => {
                        await Haptics.impact({
                            style: ImpactStyle.Light,
                        });
                        toggleTheme();
                    }}
                    className="peer aspect-square w-full cursor-pointer opacity-0"
                />

                <svg
                    width={18}
                    height={18}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    stroke="none"
                    className="absolute top-0 left-0 h-full w-full rotate-40 transition-transform duration-400 ease-in-out peer-checked:rotate-90"
                >
                    <mask id="moon-mask">
                        <rect x={0} y={0} width={20} height={20} fill="white" />
                        <circle cx={11} cy={3} r={8} fill="black" />
                    </mask>

                    <circle
                        className="sunMoon"
                        cx={10}
                        cy={10}
                        r={8}
                        mask="url(#moon-mask)"
                    />

                    <g>
                        <circle className="sunRay sunRay1" cx={18} cy={10} r="1.5" />
                        <circle className="sunRay sunRay2" cx={14} cy="16.928" r="1.5" />
                        <circle className="sunRay sunRay3" cx={6} cy="16.928" r="1.5" />
                        <circle className="sunRay sunRay4" cx={2} cy={10} r="1.5" />
                        <circle className="sunRay sunRay5" cx={6} cy="3.1718" r="1.5" />
                        <circle className="sunRay sunRay6" cx={14} cy="3.1718" r="1.5" />
                    </g>
                </svg>
            </label>

            <style>{`
        .sunMoon {
          transform-origin: center center;
          transform: scale(1);
          transition: inherit;
        }

        svg mask > circle {
          transform: translate(0px, 0px);
          transition: transform 0.64s cubic-bezier(0.41, 0.64, 0.32, 1.575);
        }

        .sunRay {
          transform-origin: center center;
          transform: scale(0);
        }

        .sunRay2 {
          animation-delay: 0.05s !important;
        }

        .sunRay3 {
          animation-delay: 0.1s !important;
        }

        .sunRay4 {
          animation-delay: 0.17s !important;
        }

        .sunRay5 {
          animation-delay: 0.29s !important;
        }

        input:checked + svg .sunMoon {
          transform: scale(0.55);
        }

        input:checked + svg mask > circle {
          transform: translate(16px, -3px);
        }

        input:checked + svg .sunRay {
          animation: showRay1832 0.4s ease 0s 1 forwards;
        }

        @keyframes showRay1832 {
          0% {
            transform: scale(0);
          }

          100% {
            transform: scale(1);
          }
        }
      `}</style>
        </>
    );
};

export default Switch;
