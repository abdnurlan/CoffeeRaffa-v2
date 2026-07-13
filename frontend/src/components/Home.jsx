import React from "react";
import Information from "./Information/Information";
import SortCoffee from "./SortCoffees/SortCoffee";
import Superiority from "./Superiority/Superiority";
import Statistics from "./Statistics/Statistics";
import WatchVideo from "./WatchVideo/WatchVideo";
import ProductShop from "./ProductShop/ProductShop";

const Home = () => {
  return (
    <>
      <Information />
      <SortCoffee />
      <Superiority />
      <WatchVideo />
      <Statistics />
      <ProductShop />
    </>
  );
};

export default Home;
