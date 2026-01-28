
import Trending from '../components/home/Trending';
import Categories from '../components/home/Categories';
import Statistics from '../components/home/Statistics';
import Newsletter from '../components/home/Newsletter';
import Land2 from '../components/home/Land2';


export default function Home() {
    return (
        <div className="flex flex-col">
            <Land2 />
            <Trending />
            <Categories />
            <Statistics />
            <Newsletter />
        </div>
    );
}
