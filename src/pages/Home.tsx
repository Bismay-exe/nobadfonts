import Hero from '../components/home/Hero';
import Trending from '../components/home/Trending';
import Categories from '../components/home/Categories';
import Statistics from '../components/home/Statistics';
import Newsletter from '../components/home/Newsletter';
import Bento from '../components/home/Bento';
import Land2 from '../components/home/Land2';
import LandingPage from '../components/home/Hero';

export default function Home() {
    return (
        <div className="flex flex-col">
            <Bento/>
            <Land2 />
            <Trending />
            <Categories />
            <Statistics />
            <Newsletter />
        </div>
    );
}
