
import { useEffect, useRef } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Sparkles, Type, Layers3, ScanText, Command, Heart, MoveUpRight } from 'lucide-react';
import SEO from '@/components/shared/SEO';

const IMAGES = {
    hero: '/banner/banner.webp',
    type: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=85',
    editorial: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1400&q=85',
    design: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&w=1400&q=85',
    workspace: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=85',
    architecture: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1400&q=85',
    details: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=85',
};

const features = [
    {
        title: 'A world of typefaces.',
        description: 'Explore a growing collection of typefaces and discover something that feels just right. From understated classics to expressive display fonts, find the personality your next project needs.',
        image: IMAGES.type,
        icon: Type,
        link: '/fonts',
    },
    {
        title: 'Get to know every detail.',
        description: 'A font is more than its name. Explore its styles, weights, glyphs and visual characteristics. Understand what you are choosing before bringing it into your work.',
        image: IMAGES.details,
        icon: ScanText,
        link: '/fonts',
    },
    {
        title: 'Find your perfect match.',
        description: 'Great typography is often about combinations. Experiment with different typefaces, discover complementary styles and build visual relationships that make your designs feel complete.',
        image: IMAGES.editorial,
        icon: Layers3,
        link: '/pairing',
    },
    {
        title: 'From discovery to development.',
        description: 'Bring typography into your workflow. NoBadFonts CLI helps developers install webfonts directly into React, Next.js and Vite projects with a simpler workflow.',
        image: IMAGES.workspace,
        icon: Command,
        link: '/cli',
    },
];

const audiences = [
    {
        title: 'Designers',
        description: 'For the people who obsess over composition, visual hierarchy, spacing and the personality of a perfectly chosen typeface.',
        image: IMAGES.design,
    },
    {
        title: 'Developers',
        description: 'For the people who turn ideas into experiences and want typography to become a natural part of their development workflow.',
        image: IMAGES.workspace,
    },
    {
        title: 'Creative minds',
        description: 'For anyone who appreciates beautiful lettering, enjoys exploring new ideas and notices the little details others overlook.',
        image: IMAGES.architecture,
    },
];

const principles = [
    {
        title: 'Typography deserves attention.',
        description: 'We believe type is one of the most important parts of visual communication. It deserves the same thought and appreciation as every other design decision.',
    },
    {
        title: 'Less friction, more creativity.',
        description: 'The tools we use should help us move forward. We want to make finding and using typefaces feel natural instead of turning it into another complicated task.',
    },
    {
        title: 'Curiosity makes better work.',
        description: 'Sometimes the best creative decisions come from exploring something unexpected. We want to encourage experimentation and make discovery enjoyable.',
    },
    {
        title: 'Build things with purpose.',
        description: 'Every feature should solve a real problem. We would rather build something genuinely useful than add another feature just because it looks impressive.',
    },
];

export default function About() {
    const featureTrack = useRef<HTMLDivElement>(null);
    const audienceTrack = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const elements = document.querySelectorAll('.about-reveal');

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 }
        );

        elements.forEach(element => observer.observe(element));

        return () => observer.disconnect();
    }, []);

    const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, direction: number) => {
        ref.current?.scrollBy({
            left: direction * ref.current.clientWidth * 0.75,
            behavior: 'smooth',
        });
    };

    return (
        <>
            <SEO
                title="About NoBadFonts — A Better Way to Discover Typography"
                description="Discover the ideas, philosophy and tools behind NoBadFonts. A typography ecosystem built for designers, developers and everyone who cares about good type."
                url="/about"
                keywords={['About NoBadFonts', 'Typography', 'Font Discovery', 'Font Library', 'Font Tools']}
            />

            <style>{`
                .about-page {
                    --about-blue: #0000ff;
                    --about-black: #080808;
                    overflow: hidden;
                }

                .about-page ::selection {
                    background: #0000ff;
                    color: white;
                }

                .about-page img {
                    display: block;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .about-reveal {
                    opacity: 0;
                    transform: translateY(55px);
                    transition: opacity .9s cubic-bezier(.2,.7,.2,1), transform .9s cubic-bezier(.2,.7,.2,1);
                }

                .about-reveal.is-visible {
                    opacity: 1;
                    transform: translateY(0);
                }

                .about-reveal-delay {
                    transition-delay: .15s;
                }

                .about-image {
                    position: relative;
                    overflow: hidden;
                    background: #ededed;
                }

                .about-image img {
                    transition: transform 1.1s cubic-bezier(.2,.7,.2,1);
                }

                .about-image:hover img {
                    transform: scale(1.055);
                }

                .about-blue {
                    color: var(--about-blue);
                }

                .about-outline {
                    color: transparent;
                    -webkit-text-stroke: 1.5px currentColor;
                    -webkit-text-stroke-color: var(--about-black);
                }

                .about-marquee {
                    display: flex;
                    width: max-content;
                    animation: about-marquee 32s linear infinite;
                }

                .about-marquee:hover {
                    animation-play-state: paused;
                }

                @keyframes about-marquee {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }

                .about-float {
                    animation: about-float 5s ease-in-out infinite;
                }

                @keyframes about-float {
                    0%, 100% { transform: translateY(0) rotate(-5deg); }
                    50% { transform: translateY(-16px) rotate(3deg); }
                }

                .about-spin {
                    animation: about-spin 18s linear infinite;
                }

                @keyframes about-spin {
                    to { transform: rotate(360deg); }
                }

                .about-image-overlay {
                    background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,.55));
                }

                .about-carousel {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    scroll-snap-type: x mandatory;
                    scroll-behavior: smooth;
                }

                .about-carousel::-webkit-scrollbar {
                    display: none;
                }

                .about-carousel > * {
                    scroll-snap-align: start;
                }

                .about-feature-card {
                    transition: transform .45s cubic-bezier(.2,.7,.2,1);
                }

                .about-feature-card:hover {
                    transform: translateY(-8px);
                }

                .about-arrow {
                    transition: transform .3s ease, background .3s ease, color .3s ease;
                }

                .about-arrow:hover {
                    transform: scale(1.08);
                    background: #0000ff;
                    color: white;
                }

                .about-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 12px;
                    transition: gap .3s ease;
                }

                .about-link:hover {
                    gap: 21px;
                }

                .about-line {
                    height: 1px;
                    background: currentColor;
                    transform-origin: left;
                    transition: transform .5s ease;
                }

                .about-principle:hover .about-line {
                    transform: scaleX(.3);
                }

                .about-word {
                    display: inline-block;
                    transition: color .3s ease, transform .3s ease;
                }

                .about-word:hover {
                    color: #0000ff;
                    transform: translateY(-5px);
                }

                .about-hero-image {
                    animation: about-hero-enter 1.2s cubic-bezier(.2,.7,.2,1) both;
                }

                @keyframes about-hero-enter {
                    from { opacity: 0; transform: scale(1.05); }
                    to { opacity: 1; transform: scale(1); }
                }

                .about-text-reveal {
                    background: linear-gradient(90deg, #0000ff 50%, currentColor 50%);
                    background-size: 200% 100%;
                    background-position: 100% 0;
                    background-clip: text;
                    -webkit-background-clip: text;
                    color: transparent;
                    transition: background-position 1.2s ease;
                }

                .about-text-reveal.is-visible {
                    background-position: 0 0;
                }

                @media (prefers-reduced-motion: reduce) {
                    .about-page *,
                    .about-page *::before,
                    .about-page *::after {
                        animation-duration: .01ms !important;
                        animation-iteration-count: 1 !important;
                        scroll-behavior: auto !important;
                        transition-duration: .01ms !important;
                    }

                    .about-reveal {
                        opacity: 1;
                        transform: none;
                    }
                }
            `}</style>

            <main className="about-page bg-background text-foreground">

                {/* HERO */}
                <section className="relative px-5 md:px-10 pt-32 md:pt-44 pb-16 md:pb-24">
                    <div className="max-w-[1600px] mx-auto">

                        <div className="relative">
                            <div className="absolute right-[8%] top-[-30px] md:top-0 about-float text-blue-600">
                                <Sparkles size={35} strokeWidth={1} />
                            </div>

                            <h1 className="about-reveal font-medium tracking-[-.09em] leading-[.82] text-[clamp(4.5rem,14vw,14rem)]">
                                Good type
                                <br />
                                <span className="about-blue">changes</span>
                                <br />
                                <span className="about-outline">everything.</span>
                            </h1>

                            <div className="grid md:grid-cols-12 gap-8 mt-16 md:mt-20 items-end">
                                <div className="md:col-span-4 md:col-start-8">
                                    <p className="text-xl md:text-2xl leading-[1.5] tracking-tight about-reveal">
                                        We believe typography deserves more than a place in a dropdown menu. It deserves an experience of its own.
                                    </p>

                                    <p className="text-sm text-muted leading-7 mt-6 about-reveal about-reveal-delay">
                                        NoBadFonts is a space for discovering, exploring and working with typefaces. Built around one simple idea: making good typography easier to find and easier to use.
                                    </p>

                                    <a href="#our-story" className="about-link mt-8 text-sm font-medium about-reveal">
                                        Get to know us <ArrowDown size={17} />
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="about-image about-hero-image mt-16 md:mt-24">
                            <img src={IMAGES.hero} alt="Creative visual exploration" />

                            <div className="absolute inset-0 about-image-overlay" />

                            <div className="absolute bottom-6 left-6 md:bottom-12 md:left-12 text-white">
                                <p className="text-2xl md:text-5xl tracking-[-.06em]">
                                    Every letter has a story.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between mt-7 text-sm text-muted">
                            <span>For the love of typography.</span>
                            <span className="flex items-center gap-2">Keep exploring <ArrowDown size={15} /></span>
                        </div>
                    </div>
                </section>

                {/* MARQUEE */}
                <section className="py-10 md:py-14 bg-[#0000ff] text-white overflow-hidden">
                    <div className="about-marquee">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="flex items-center gap-10 md:gap-16 px-5 md:px-8">
                                {['Typography', 'Creativity', 'Discovery', 'Expression', 'Design', 'Possibilities'].map(word => (
                                    <div key={word} className="flex items-center gap-10 md:gap-16">
                                        <span className="text-5xl md:text-8xl font-medium tracking-[-.07em] whitespace-nowrap">{word}</span>
                                        <Sparkles size={30} strokeWidth={1} className="shrink-0" />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </section>

                {/* STORY */}
                <section id="our-story" className="px-5 md:px-10 py-28 md:py-44">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="grid md:grid-cols-12 gap-12">
                            <div className="md:col-span-4">
                                <p className="text-sm text-muted about-reveal">It all starts with a typeface.</p>
                            </div>

                            <div className="md:col-span-8">
                                <h2 className="about-reveal text-[clamp(2.8rem,7vw,7rem)] tracking-[-.075em] leading-[.98]">
                                    The smallest details often make the <span className="about-blue">biggest difference.</span>
                                </h2>

                                <div className="grid md:grid-cols-2 gap-10 mt-16 md:mt-24">
                                    <p className="text-lg leading-[1.8] about-reveal">
                                        Think about the last website, poster or application that caught your attention. Perhaps it was the colors, the composition or the imagery. But somewhere in that experience, typography was quietly shaping everything.
                                    </p>

                                    <p className="text-sm text-muted leading-8 about-reveal about-reveal-delay">
                                        A typeface can make something feel confident, playful, serious, expressive or timeless. It can create an atmosphere before someone has even read a single sentence. It can turn an ordinary interface into something people remember.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-12 gap-5 mt-20 items-start">
                            <div className="md:col-span-8 about-image aspect-[16/10] about-reveal">
                                <img src={IMAGES.editorial} alt="Editorial creative inspiration" />
                            </div>

                            <div className="md:col-span-4 md:pt-32 about-reveal">
                                <div className="text-[clamp(3rem,6vw,6rem)] tracking-[-.08em] leading-[.9]">
                                    Words are
                                    <br />
                                    <span className="about-blue">visual</span>
                                    <br />
                                    too.
                                </div>
                                <p className="text-sm leading-7 text-muted mt-8">
                                    The way something looks is inseparable from the way it communicates. That's why we think choosing the right typeface should be part of the creative process, not an afterthought.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* WHY WE EXIST */}
                <section className="px-5 md:px-10 py-28 md:py-40 bg-[#080808] text-white">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="grid md:grid-cols-12 gap-12">
                            <div className="md:col-span-8">
                                <h2 className="about-reveal text-[clamp(3.5rem,10vw,10rem)] tracking-[-.09em] leading-[.86]">
                                    Too many fonts.
                                    <br />
                                    Too many tabs.
                                    <br />
                                    <span className="text-blue-500">Not enough clarity.</span>
                                </h2>
                            </div>

                            <div className="md:col-span-4 md:pt-24">
                                <p className="text-xl leading-relaxed about-reveal">
                                    We saw an opportunity to make the experience of finding and using typography better.
                                </p>

                                <p className="text-sm text-neutral-400 leading-8 mt-8 about-reveal">
                                    Discovering a font often means jumping between different platforms, searching through endless collections and figuring out the details yourself. Even after finding the right typeface, getting it into a project can become another task entirely.
                                </p>

                                <p className="text-sm text-neutral-400 leading-8 mt-5 about-reveal">
                                    We wanted to bring these experiences closer together. Less unnecessary friction. More time spent exploring, experimenting and creating.
                                </p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-5 mt-24">
                            <div className="about-image aspect-[5/4] about-reveal">
                                <img src={IMAGES.design} alt="Creative design process" />
                            </div>

                            <div className="bg-[#171717] p-8 md:p-16 flex flex-col justify-between about-reveal">
                                <Sparkles size={35} className="text-blue-500" strokeWidth={1} />

                                <div>
                                    <h3 className="text-[clamp(2.7rem,5vw,5.5rem)] tracking-[-.075em] leading-[.94]">
                                        Make space for better ideas.
                                    </h3>

                                    <p className="text-sm text-neutral-400 leading-8 mt-8 max-w-lg">
                                        NoBadFonts started with a simple thought: what if discovering typography could feel as enjoyable as actually using it? What if everything you needed was easier to find, understand and work with?
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 mt-16 text-blue-500">
                                    <span className="text-sm">That's the experience we're building.</span>
                                    <ArrowUpRight size={18} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* MANIFESTO */}
                <section className="px-5 md:px-10 py-32 md:py-52 bg-[#0000ff] text-white relative overflow-hidden">
                    <div className="absolute right-[-100px] top-[-100px] opacity-10 about-spin">
                        <Sparkles size={450} strokeWidth={.4} />
                    </div>

                    <div className="max-w-[1600px] mx-auto relative z-10">
                        <p className="text-lg md:text-xl mb-16 about-reveal">A little something we believe in.</p>

                        <h2 className="about-reveal text-[clamp(3.5rem,10vw,10rem)] leading-[.9] tracking-[-.085em]">
                            We are not here to collect fonts.
                            <br />
                            <span className="text-blue-300">We are here to make people care about them.</span>
                        </h2>

                        <div className="grid md:grid-cols-12 gap-10 mt-24">
                            <div className="md:col-span-5">
                                <p className="text-xl md:text-2xl leading-relaxed about-reveal">
                                    Because typography is not just something you see. It's something you feel.
                                </p>
                            </div>

                            <div className="md:col-span-4 md:col-start-9">
                                <p className="text-sm leading-8 text-blue-100 about-reveal">
                                    We want to make discovery more exciting, tools more useful and the whole process of working with typography a little more enjoyable. Every detail matters. Every typeface has something to say.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ECOSYSTEM */}
                <section className="px-5 md:px-10 py-28 md:py-44">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="flex flex-col md:flex-row justify-between md:items-end gap-8 mb-20">
                            <div className="max-w-4xl">
                                <p className="text-sm text-muted mb-10 about-reveal">Everything comes together.</p>

                                <h2 className="text-[clamp(3.5rem,9vw,9rem)] tracking-[-.085em] leading-[.88] about-reveal">
                                    More than a
                                    <br />
                                    <span className="about-blue">font library.</span>
                                </h2>
                            </div>

                            <p className="text-sm text-muted leading-7 max-w-sm about-reveal">
                                A collection of experiences designed to bring typography discovery, exploration and development closer together.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 mb-8">
                            <button onClick={() => scrollCarousel(featureTrack, -1)} aria-label="Previous features" className="about-arrow w-12 h-12 rounded-full border border-border flex items-center justify-center">
                                <ArrowLeft size={19} />
                            </button>
                            <button onClick={() => scrollCarousel(featureTrack, 1)} aria-label="Next features" className="about-arrow w-12 h-12 rounded-full border border-border flex items-center justify-center">
                                <ArrowRight size={19} />
                            </button>
                        </div>

                        <div ref={featureTrack} className="about-carousel flex gap-5 overflow-x-auto pb-10">
                            {features.map((item, index) => (
                                <article key={item.title} className="about-feature-card shrink-0 w-[85%] md:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
                                    <a href={item.link} className="block">
                                        <div className="about-image aspect-[4/3]">
                                            <img src={item.image} alt={item.title} />

                                            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />

                                            <div className="absolute top-5 right-5 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center">
                                                <item.icon size={21} strokeWidth={1.5} />
                                            </div>

                                            <div className="absolute bottom-5 left-5 text-white text-sm">
                                                {String(index + 1).padStart(2, '0')}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-start gap-5 mt-7">
                                            <h3 className="text-3xl md:text-4xl tracking-[-.065em] leading-none">
                                                {item.title}
                                            </h3>
                                            <ArrowUpRight size={21} className="shrink-0 transition-transform group-hover:translate-x-1" />
                                        </div>

                                        <p className="text-sm leading-7 text-muted mt-5 max-w-lg">
                                            {item.description}
                                        </p>
                                    </a>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* TYPOGRAPHY IMAGE BREAK */}
                <section className="px-5 md:px-10 pb-28">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="relative about-image aspect-[16/9] md:aspect-[2.5/1] about-reveal">
                            <img src={IMAGES.architecture} alt="Architectural inspiration" />

                            <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center text-white text-center px-5">
                                <p className="text-2xl md:text-4xl tracking-[-.05em]">
                                    A good typeface doesn't need to shout.
                                </p>

                                <p className="text-[clamp(3rem,10vw,10rem)] tracking-[-.09em] leading-none mt-5">
                                    It just speaks.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* AUDIENCE */}
                <section className="px-5 md:px-10 py-28 md:py-40 bg-[#f1f1f1] text-[#080808]">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="grid md:grid-cols-12 gap-10 mb-20">
                            <div className="md:col-span-8">
                                <h2 className="about-reveal text-[clamp(3.5rem,9vw,9rem)] tracking-[-.085em] leading-[.88]">
                                    Made for people who <span className="about-blue">make things.</span>
                                </h2>
                            </div>

                            <div className="md:col-span-3 md:col-start-10 flex items-end">
                                <p className="text-sm leading-7 text-neutral-500 about-reveal">
                                    Different backgrounds. Different workflows. One shared appreciation for thoughtful design and good typography.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mb-8">
                            <button onClick={() => scrollCarousel(audienceTrack, -1)} aria-label="Previous audiences" className="about-arrow w-12 h-12 rounded-full border border-black/20 flex items-center justify-center">
                                <ArrowLeft size={19} />
                            </button>
                            <button onClick={() => scrollCarousel(audienceTrack, 1)} aria-label="Next audiences" className="about-arrow w-12 h-12 rounded-full border border-black/20 flex items-center justify-center">
                                <ArrowRight size={19} />
                            </button>
                        </div>

                        <div ref={audienceTrack} className="about-carousel flex gap-5 overflow-x-auto pb-8">
                            {audiences.map((person) => (
                                <article key={person.title} className="shrink-0 w-[85%] md:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group">
                                    <div className="about-image aspect-[4/5]">
                                        <img src={person.image} alt={person.title} />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                                    </div>

                                    <div className="flex justify-between items-center mt-7">
                                        <h3 className="text-4xl tracking-[-.07em]">{person.title}</h3>
                                        <ArrowUpRight size={22} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                    </div>

                                    <p className="text-sm leading-7 text-neutral-500 mt-5 max-w-md">
                                        {person.description}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* PRINCIPLES */}
                <section className="px-5 md:px-10 py-32 md:py-48">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="grid md:grid-cols-12 gap-12">
                            <div className="md:col-span-5">
                                <h2 className="text-[clamp(3.5rem,7vw,7rem)] leading-[.9] tracking-[-.08em] about-reveal">
                                    It's the little things that make us <span className="about-blue">different.</span>
                                </h2>

                                <p className="text-sm text-muted leading-8 mt-10 max-w-md about-reveal">
                                    These are the ideas we return to whenever we decide what to build, what to improve and what deserves our attention.
                                </p>

                                <div className="about-image aspect-[4/5] mt-16 md:mt-24 about-reveal">
                                    <img src={IMAGES.details} alt="Creative details and typography" />
                                </div>
                            </div>

                            <div className="md:col-span-6 md:col-start-7">
                                {principles.map((item, index) => (
                                    <article key={item.title} className="about-principle py-10 md:py-14 border-t border-border about-reveal">
                                        <div className="flex items-center justify-between mb-9">
                                            <span className="text-2xl text-blue-600">
                                                0{index + 1}
                                            </span>
                                            <MoveUpRight size={20} className="text-muted" />
                                        </div>

                                        <h3 className="text-[clamp(2rem,4vw,4rem)] tracking-[-.065em] leading-[.98]">
                                            {item.title}
                                        </h3>

                                        <p className="text-sm text-muted leading-8 mt-7 max-w-xl">
                                            {item.description}
                                        </p>

                                        <div className="about-line mt-10 w-full" />
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* FUTURE */}
                <section className="px-5 md:px-10 py-32 md:py-48 bg-[#080808] text-white">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="grid md:grid-cols-12 gap-10">
                            <div className="md:col-span-9">
                                <h2 className="about-reveal text-[clamp(3.8rem,11vw,11rem)] tracking-[-.09em] leading-[.86]">
                                    We're just
                                    <br />
                                    getting
                                    <br />
                                    <span className="text-blue-500">started.</span>
                                </h2>
                            </div>

                            <div className="md:col-span-3 md:pt-28">
                                <p className="text-lg leading-8 text-neutral-300 about-reveal">
                                    There is so much more to explore, build and create.
                                </p>

                                <p className="text-sm leading-8 text-neutral-500 mt-7 about-reveal">
                                    We see NoBadFonts growing into a richer typography ecosystem. Better discovery, more useful creative tools, stronger developer workflows and more opportunities to explore the world of type.
                                </p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-5 mt-24">
                            <div className="about-image aspect-[5/4] about-reveal">
                                <img src={IMAGES.workspace} alt="Creative development workspace" />
                            </div>

                            <div className="border border-white/15 p-8 md:p-16 flex flex-col justify-between about-reveal">
                                <div className="w-16 h-16 rounded-full border border-blue-500 flex items-center justify-center text-blue-500 about-float">
                                    <Sparkles size={28} strokeWidth={1} />
                                </div>

                                <div>
                                    <h3 className="text-[clamp(2.8rem,5vw,5.5rem)] tracking-[-.075em] leading-[.94]">
                                        The possibilities are bigger than a font collection.
                                    </h3>

                                    <p className="text-sm leading-8 text-neutral-400 mt-8">
                                        We want to keep experimenting, listening and improving. The goal isn't simply to add more things. It's to make the things we build genuinely worth using.
                                    </p>
                                </div>

                                <p className="text-sm text-neutral-500 mt-16">
                                    And we're excited about what's next.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CLOSING */}
                <section className="px-5 md:px-10 py-36 md:py-56">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="relative">
                            <div className="absolute right-[10%] top-0 about-float text-blue-600">
                                <Heart size={40} strokeWidth={1} />
                            </div>

                            <h2 className="about-reveal text-[clamp(4rem,14vw,14rem)] leading-[.8] tracking-[-.095em] font-medium">
                                Make
                                <br />
                                something
                                <br />
                                <span className="about-blue">beautiful.</span>
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-12 gap-10 mt-24">
                            <div className="md:col-span-4 md:col-start-8">
                                <p className="text-2xl leading-relaxed about-reveal">
                                    Whatever you're creating, give it the typography it deserves.
                                </p>

                                <p className="text-sm text-muted leading-8 mt-7 about-reveal">
                                    Explore new typefaces. Experiment with combinations. Find something unexpected. And most importantly, enjoy the process of making something that feels like you.
                                </p>

                                <a href="/fonts" className="group inline-flex items-center justify-between gap-12 mt-12 px-7 py-5 bg-[#0000ff] text-white hover:bg-[#080808] transition-colors">
                                    <span className="text-sm">Explore NoBadFonts</span>
                                    <ArrowUpRight size={19} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                </a>
                            </div>
                        </div>

                        <div className="border-t border-border mt-36 pt-8 flex flex-col md:flex-row justify-between gap-5 text-sm text-muted">
                            <p>NoBadFonts. Made for the love of type.</p>
                            <p>Good typography. Better possibilities.</p>
                        </div>
                    </div>
                </section>

            </main>
        </>
    );
}
