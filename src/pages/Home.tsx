

import Landing5 from '../components/home/Land5';
import Landing from '../components/home/Land3';
import Hero from '../components/home/Hero/1';

import { useLenis } from '../hooks/useLenis';

export default function Home() {
    useLenis();
    return (
        <div className="flex flex-col">
            <Hero />
            <Landing />
            <Landing5 />
        </div>
    );
}
